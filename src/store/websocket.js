import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

/**
 * Store Pinia para gerenciar WebSocket globalmente
 * 
 * Mantém uma única conexão WebSocket para toda aplicação
 * Permite múltiplos componentes se inscreverem em diferentes tópicos
 */
export const useWebSocketStore = defineStore('websocket', () => {
  // Estado
  const cliente = ref(null)
  const conectado = ref(false)
  const reconectando = ref(false)
  const inscricoes = ref(new Map()) // Map<topico, Set<callback>>
  const notificacoes = ref([]) // Histórico de notificações

  // Configuração
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/api/ws'

  // Getters
  const statusConexao = computed(() => {
    if (conectado.value) return 'conectado'
    if (reconectando.value) return 'reconectando'
    return 'desconectado'
  })

  const ultimasNotificacoes = computed(() => {
    return notificacoes.value.slice(-10).reverse()
  })

  /**
   * Conectar ao WebSocket
   */
  const conectar = () => {
    if (cliente.value) {
      console.log('[WebSocketStore] Já conectado')
      return
    }

    console.log('[WebSocketStore] Iniciando conexão...', wsUrl)

    try {
      const socket = new SockJS(wsUrl, null, {
        // Desabilitar transports que causam 404 em /info
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
      })

      cliente.value = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: (frame) => {
          console.log('[WebSocketStore] Conectado', frame)
          conectado.value = true
          reconectando.value = false

          // Re-inscrever em todos os tópicos
          reinscreverTodos()
        },

        onDisconnect: () => {
          console.log('[WebSocketStore] Desconectado')
          conectado.value = false
        },

        onStompError: (frame) => {
          console.error('[WebSocketStore] Erro STOMP:', frame)
          conectado.value = false
        },

        onWebSocketClose: () => {
          console.log('[WebSocketStore] Conexão fechada. Reconectando...')
          reconectando.value = true
          conectado.value = false
        }
      })

      cliente.value.activate()
    } catch (error) {
      console.error('[WebSocketStore] Erro ao conectar:', error)
    }
  }

  /**
   * Desconectar do WebSocket
   */
  const desconectar = () => {
    if (cliente.value) {
      console.log('[WebSocketStore] Desconectando...')
      cliente.value.deactivate()
      cliente.value = null
      conectado.value = false
      inscricoes.value.clear()
    }
  }

  /**
   * Inscrever em um tópico
   */
  const inscrever = (topico, callback) => {
    if (!callback) {
      console.warn('[WebSocketStore] Callback não fornecido para:', topico)
      return
    }

    // Adicionar callback ao set de callbacks do tópico
    if (!inscricoes.value.has(topico)) {
      inscricoes.value.set(topico, new Set())
    }
    inscricoes.value.get(topico).add(callback)

    // Se já conectado, inscrever imediatamente
    if (conectado.value && cliente.value) {
      realizarInscricao(topico)
    }

    console.log('[WebSocketStore] Inscrito em:', topico)

    // Retornar função para desinscrever
    return () => desinscrever(topico, callback)
  }

  /**
   * Desinscrever de um tópico
   */
  const desinscrever = (topico, callback) => {
    if (inscricoes.value.has(topico)) {
      inscricoes.value.get(topico).delete(callback)
      
      // Se não há mais callbacks, remover tópico
      if (inscricoes.value.get(topico).size === 0) {
        inscricoes.value.delete(topico)
      }
    }
    console.log('[WebSocketStore] Desinscrito de:', topico)
  }

  /**
   * Realizar inscrição no tópico via STOMP
   */
  const realizarInscricao = (topico) => {
    if (!cliente.value || !conectado.value) return

    cliente.value.subscribe(topico, (message) => {
      try {
        const dados = JSON.parse(message.body)
        
        // Adicionar ao histórico
        notificacoes.value.push({
          topico,
          dados,
          timestamp: new Date().toISOString()
        })

        // Limitar histórico
        if (notificacoes.value.length > 100) {
          notificacoes.value.shift()
        }

        // Chamar todos os callbacks registrados para este tópico
        const callbacks = inscricoes.value.get(topico)
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(dados)
            } catch (error) {
              console.error('[WebSocketStore] Erro ao executar callback:', error)
            }
          })
        }

        console.log('[WebSocketStore] Mensagem recebida:', topico, dados)
      } catch (error) {
        console.error('[WebSocketStore] Erro ao processar mensagem:', error)
      }
    })
  }

  /**
   * Re-inscrever em todos os tópicos após reconexão
   */
  const reinscreverTodos = () => {
    console.log('[WebSocketStore] Re-inscrevendo em', inscricoes.value.size, 'tópicos')
    inscricoes.value.forEach((callbacks, topico) => {
      realizarInscricao(topico)
    })
  }

  /**
   * Limpar histórico de notificações
   */
  const limparNotificacoes = () => {
    notificacoes.value = []
  }

  /**
   * Inscrever em tópico de cozinha
   */
  const inscreverCozinha = (cozinhaId, callback) => {
    return inscrever(`/topic/cozinha/${cozinhaId}`, callback)
  }

  /**
   * Inscrever em tópico de atendente por unidade
   */
  const inscreverAtendente = (unidadeId, callback) => {
    return inscrever(`/topic/atendente/unidade/${unidadeId}`, callback)
  }

  /**
   * Inscrever em tópico de subpedido específico
   */
  const inscreverSubPedido = (subPedidoId, callback) => {
    return inscrever(`/topic/subpedido/${subPedidoId}`, callback)
  }

  /**
   * Inscrever em tópico de pedido
   */
  const inscreverPedido = (pedidoId, callback) => {
    return inscrever(`/topic/pedido/${pedidoId}`, callback)
  }

  return {
    // Estado
    conectado,
    reconectando,
    statusConexao,
    notificacoes,
    ultimasNotificacoes,

    // Métodos gerais
    conectar,
    desconectar,
    inscrever,
    desinscrever,
    limparNotificacoes,

    // Métodos específicos
    inscreverCozinha,
    inscreverAtendente,
    inscreverSubPedido,
    inscreverPedido
  }
})
