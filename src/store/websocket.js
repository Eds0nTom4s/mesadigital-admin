import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

/**
 * Store Pinia — WebSocket global (conexão única)
 *
 * Correcções aplicadas (06/03/2026):
 *  1. webSocketFactory reinstancia SockJS em cada tentativa de conexão
 *     para que reconexões automáticas funcionem após queda.
 *  2. _realizarInscricaoStomp rastreia o objeto Subscription e garante
 *     no máximo 1 sub STOMP activa por tópico por sessão.
 *  3. desinscrever remove o callback correcto; cancela a sub STOMP quando
 *     não restam callbacks para o tópico.
 *  4. reinscreverTodos limpa stompSubs antes de reinscrever, eliminando
 *     duplicações após reconexão.
 *  5. Flag _ativo impede múltiplos activate() simultâneos.
 */
export const useWebSocketStore = defineStore('websocket', () => {
  // ── Estado ────────────────────────────────────────────────────────────────
  const cliente      = ref(null)
  const conectado    = ref(false)
  const reconectando = ref(false)
  const notificacoes = ref([])

  /**
   * Map<topico, Set<callback>>
   * Persiste entre reconexões para que reinscreverTodos() os recupere.
   */
  const inscricoes = ref(new Map())

  /**
   * Map<topico, StompSubscription>
   * Rastreia a subscrição STOMP activa — limpo em onWebSocketClose.
   */
  const stompSubs = new Map()

  let _ativo = false

  // ── Configuração ──────────────────────────────────────────────────────────
  const wsUrl = import.meta.env.VITE_WS_URL || '/api/ws'

  // ── Getters ───────────────────────────────────────────────────────────────
  const statusConexao = computed(() => {
    if (conectado.value)    return 'conectado'
    if (reconectando.value) return 'reconectando'
    return 'desconectado'
  })

  const ultimasNotificacoes = computed(() =>
    notificacoes.value.slice(-10).reverse()
  )

  // ── Conexão ───────────────────────────────────────────────────────────────
  const conectar = () => {
    if (_ativo) {
      console.log('[WebSocketStore] já activo, ignorando conectar()')
      return
    }
    console.log('[WebSocketStore] Iniciando conexão...', wsUrl)
    _ativo = true

    try {
      // Ler token no momento da conexão (C1 — JWT enviado no CONNECT)
      const token = localStorage.getItem('token')

      cliente.value = new Client({
        // Factory reinstanciada a cada tentativa → reconexões reais funcionam
        webSocketFactory: () => new SockJS(wsUrl, null, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling']
        }),
        // JWT enviado no frame STOMP CONNECT
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay:    5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          console.log('[WebSocketStore] Conectado', frame.headers?.['user-name'] ?? '')
          conectado.value    = true
          reconectando.value = false
          reinscreverTodos()
        },

        onDisconnect: () => {
          console.log('[WebSocketStore] Desconectado')
          conectado.value = false
        },

        onStompError: (frame) => {
          console.error('[WebSocketStore] Erro STOMP:', frame.headers?.message, frame.body)
          conectado.value = false
        },

        onWebSocketClose: () => {
          console.log('[WebSocketStore] WebSocket fechado — a reconectar...')
          reconectando.value = true
          conectado.value    = false
          stompSubs.clear()  // invalidadas — serão recriadas em onConnect
        }
      })

      cliente.value.activate()
    } catch (err) {
      console.error('[WebSocketStore] Erro ao criar cliente STOMP:', err)
      _ativo = false
    }
  }

  const desconectar = () => {
    if (cliente.value) {
      console.log('[WebSocketStore] Desconectando...')
      cliente.value.deactivate()
      cliente.value = null
    }
    conectado.value    = false
    reconectando.value = false
    _ativo = false
    stompSubs.clear()
    inscricoes.value.clear()
  }

  // ── Subscrições ───────────────────────────────────────────────────────────
  const inscrever = (topico, callback) => {
    if (!callback) {
      console.warn('[WebSocketStore] callback em falta para:', topico)
      return () => {}
    }

    if (!inscricoes.value.has(topico)) {
      inscricoes.value.set(topico, new Set())
    }
    inscricoes.value.get(topico).add(callback)

    // Se já conectado e sem sub STOMP para este tópico, criar agora
    if (conectado.value && cliente.value && !stompSubs.has(topico)) {
      _realizarInscricaoStomp(topico)
    }

    console.log('[WebSocketStore] Inscrito em:', topico)
    return () => desinscrever(topico, callback)
  }

  const desinscrever = (topico, callback) => {
    if (!inscricoes.value.has(topico)) return

    if (callback) {
      inscricoes.value.get(topico).delete(callback)
    } else {
      inscricoes.value.get(topico).clear()
    }

    if (inscricoes.value.get(topico).size === 0) {
      inscricoes.value.delete(topico)
      const sub = stompSubs.get(topico)
      if (sub) { try { sub.unsubscribe() } catch (_) {} }
      stompSubs.delete(topico)
      console.log('[WebSocketStore] Tópico removido:', topico)
    } else {
      console.log('[WebSocketStore] Callback removido de:', topico)
    }
  }

  /** Cria uma sub STOMP (no máximo 1 por tópico por sessão). */
  const _realizarInscricaoStomp = (topico) => {
    if (!cliente.value || !conectado.value) return
    if (stompSubs.has(topico)) return  // já existe

    const sub = cliente.value.subscribe(topico, (message) => {
      let dados
      try { dados = JSON.parse(message.body) } catch {
        console.warn('[WebSocketStore] mensagem não-JSON em', topico)
        return
      }

      notificacoes.value.push({ topico, dados, timestamp: new Date().toISOString() })
      if (notificacoes.value.length > 100) notificacoes.value.shift()

      const cbs = inscricoes.value.get(topico)
      if (cbs) {
        cbs.forEach(cb => { try { cb(dados) } catch (err) {
          console.error('[WebSocketStore] Erro no callback de', topico, err)
        }})
      }
      console.log('[WebSocketStore] ←', topico, dados)
    })

    stompSubs.set(topico, sub)
    console.log('[WebSocketStore] Sub STOMP criada:', topico)
  }

  /** Recria todas as subs após reconexão (stompSubs já está vazio). */
  const reinscreverTodos = () => {
    console.log('[WebSocketStore] Re-inscrevendo', inscricoes.value.size, 'tópicos')
    inscricoes.value.forEach((_, topico) => _realizarInscricaoStomp(topico))
  }

  const limparNotificacoes = () => { notificacoes.value = [] }

  // ── Helpers de domínio ────────────────────────────────────────────────────
  // Tópicos conforme documentation §4 (integration-docs/admin_panel_integration.md)
  const inscreverCozinha   = (id, cb) => inscrever(`/topic/subpedidos/cozinha/${id}`, cb)
  const inscreverAtendente = (id, cb) => inscrever(`/topic/atendente/unidade/${id}`, cb)
  const inscreverSubPedido = (id, cb) => inscrever(`/topic/subpedido/${id}`, cb)
  const inscreverPedido    = (_id, cb) => inscrever('/topic/pedidos', cb)

  // ── Exposição ─────────────────────────────────────────────────────────────
  return {
    // Estado reactivo
    conectado,
    reconectando,
    statusConexao,
    notificacoes,
    ultimasNotificacoes,

    // Ciclo de vida
    conectar,
    desconectar,

    // Subscrições
    inscrever,
    desinscrever,
    limparNotificacoes,

    // Helpers de domínio
    inscreverCozinha,
    inscreverAtendente,
    inscreverSubPedido,
    inscreverPedido
  }
})
