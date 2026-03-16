/**
 * Composable para WebSocket de Pedidos
 *
 * Camada de semântica de domínio sobre useWebSocketStore.
 * Cada inscrição retorna um cleanup que remove APENAS o callback registado,
 * sem afectar outros consumidores do mesmo tópico.
 */

import { computed, onMounted } from 'vue'
import { useWebSocketStore } from '@/store/websocket'

export function usePedidoWebSocket(callbacks = {}) {
  const wsStore = useWebSocketStore()

  // ── Helpers de notificação ────────────────────────────────────────────────
  const _notificarBrowser = (titulo, body, tag) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, { body, icon: '/favicon.ico', tag })
    }
  }

  const _tocarSom = (src) => {
    try { new Audio(src).play().catch(() => {}) } catch (_) {}
  }

  // ── Inscrições ────────────────────────────────────────────────────────────

  /**
   * /topic/pedido/{pedidoId}
   * Retorna função de cleanup que remove apenas este callback.
   */
  const inscreverPedido = (pedidoId, callback) => {
    if (!pedidoId) return () => {}
    const topico = `/topic/pedido/${pedidoId}`
    const handler = (notificacao) => {
      console.log('[usePedidoWebSocket] Pedido atualizado:', notificacao)
      callback?.(notificacao)
      callbacks.onPedidoAtualizado?.(notificacao)
    }
    return wsStore.inscrever(topico, handler)
  }

  /**
   * /topic/subpedido/{subPedidoId}
   */
  const inscreverSubPedido = (subPedidoId, callback) => {
    if (!subPedidoId) return () => {}
    const topico = `/topic/subpedido/${subPedidoId}`
    const handler = (notificacao) => {
      console.log('[usePedidoWebSocket] SubPedido atualizado:', notificacao)
      callback?.(notificacao)
      callbacks.onSubPedidoAtualizado?.(notificacao)
    }
    return wsStore.inscrever(topico, handler)
  }

  /**
   * /topic/atendente/unidade/{unidadeId}
   * Notifica quando SubPedido fica PRONTO.
   */
  const inscreverUnidade = (unidadeId, callback) => {
    if (!unidadeId) return () => {}
    const topico = `/topic/atendente/unidade/${unidadeId}`
    const handler = (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação da unidade:', notificacao)

      if (notificacao.statusSubPedido === 'PRONTO' || notificacao.tipo === 'SUBPEDIDO_PRONTO') {
        callbacks.onSubPedidoPronto?.(notificacao)
        _notificarBrowser(
          '🍽️ SubPedido Pronto!',
          `${notificacao.subPedidoNumero || 'SubPedido'} pronto para retirada`,
          `subpedido-${notificacao.subPedidoId}`
        )
        _tocarSom('/sounds/notification.mp3')
      }
      callback?.(notificacao)
    }
    return wsStore.inscrever(topico, handler)
  }

  /**
   * /topic/cozinha/{cozinhaId}
   */
  const inscreverCozinha = (cozinhaId, callback) => {
    if (!cozinhaId) return () => {}
    const topico = `/topic/cozinha/${cozinhaId}`
    const handler = (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação da cozinha:', notificacao)

      if (notificacao.tipo === 'PEDIDO_LIBERADO_AUTOMATICAMENTE') {
        callbacks.onPedidoLiberado?.(notificacao)
        _notificarBrowser(
          '✅ Pedido Confirmado Automaticamente',
          `${notificacao.pedidoNumero} liberado para produção`,
          `pedido-liberado-${notificacao.pedidoId}`
        )
      }
      callback?.(notificacao)
      callbacks.onNovoSubPedido?.(notificacao)
    }
    return wsStore.inscrever(topico, handler)
  }

  /**
   * /topic/gerente/pedidos  +  /topic/gerente/alertas
   * Retorna cleanup que remove ambas as subscrições.
   */
  const inscreverGerente = (callback) => {
    const handlerPedidos = (notificacao) => {
      if (notificacao.tipo === 'PEDIDO_LIBERADO_AUTOMATICAMENTE') {
        callbacks.onPedidoLiberado?.(notificacao)
      }
      callback?.(notificacao)
    }
    const handlerAlertas = (notificacao) => {
      if (notificacao.tipo === 'PEDIDO_BLOQUEADO_POR_LIMITE') {
        console.warn('⚠️ [LIMITE EXCEDIDO]', notificacao.pedidoNumero)
        callbacks.onPedidoBloqueado?.(notificacao)
        _notificarBrowser(
          '⚠️ Pedido Bloqueado — Limite Excedido',
          `${notificacao.pedidoNumero} — aguarda confirmação`,
          `pedido-bloqueado-${notificacao.pedidoId}`
        )
        _tocarSom('/sounds/alert.mp3')
      }
      callback?.(notificacao)
    }

    const cleanupP = wsStore.inscrever('/topic/gerente/pedidos', handlerPedidos)
    const cleanupA = wsStore.inscrever('/topic/gerente/alertas',  handlerAlertas)
    return () => { cleanupP(); cleanupA() }
  }

  // ── Permissão de notificações do browser ──────────────────────────────────
  const solicitarPermissaoNotificacoes = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  onMounted(() => solicitarPermissaoNotificacoes())

  // ── Exposição ──────────────────────────────────────────────────────────────
  return {
    inscreverPedido,
    inscreverSubPedido,
    inscreverUnidade,
    inscreverCozinha,
    inscreverGerente,
    solicitarPermissaoNotificacoes,

    // computed reactivo — não perde reatividade ao desestruturar
    statusConexao: computed(() => wsStore.statusConexao),
    conectado:     computed(() => wsStore.conectado)
  }
}
