/**
 * Composable para WebSocket de Pedidos
 * Conforme PROMPT_ALINHAMENTO_FRONTEND_CORRIGIDO.txt
 * 
 * Gerencia inscrições em tópicos STOMP para atualizações em tempo real
 */

import { onMounted, onUnmounted } from 'vue'
import { useWebSocketStore } from '@/store/websocket'

export function usePedidoWebSocket(callbacks = {}) {
  const wsStore = useWebSocketStore()

  /**
   * Inscrever em tópico de Pedido específico
   * /topic/pedido/{pedidoId}
   * 
   * Recebe atualizações do Pedido:
   * - StatusPedido
   * - StatusFinanceiroPedido
   * - Total atualizado
   */
  const inscreverPedido = (pedidoId, callback) => {
    if (!pedidoId) return

    const topico = `/topic/pedido/${pedidoId}`
    console.log('[usePedidoWebSocket] Inscrevendo em:', topico)

    wsStore.inscrever(topico, (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação recebida:', notificacao)
      if (callback) callback(notificacao)
      if (callbacks.onPedidoAtualizado) callbacks.onPedidoAtualizado(notificacao)
    })

    return () => wsStore.desinscrever(topico)
  }

  /**
   * Inscrever em tópico de SubPedido específico
   * /topic/subpedido/{subPedidoId}
   * 
   * Recebe atualizações do SubPedido:
   * - StatusSubPedido
   * - Timestamps
   */
  const inscreverSubPedido = (subPedidoId, callback) => {
    if (!subPedidoId) return

    const topico = `/topic/subpedido/${subPedidoId}`
    console.log('[usePedidoWebSocket] Inscrevendo em:', topico)

    wsStore.inscrever(topico, (notificacao) => {
      console.log('[usePedidoWebSocket] SubPedido atualizado:', notificacao)
      if (callback) callback(notificacao)
      if (callbacks.onSubPedidoAtualizado) callbacks.onSubPedidoAtualizado(notificacao)
    })

    return () => wsStore.desinscrever(topico)
  }

  /**
   * Inscrever em tópico de Atendente/Unidade
   * /topic/atendente/unidade/{unidadeId}
   * 
   * Recebe notificações quando:
   * - SubPedido fica PRONTO (alert visual/sonoro)
   * - Novos pedidos criados
   */
  const inscreverUnidade = (unidadeId, callback) => {
    if (!unidadeId) return

    const topico = `/topic/atendente/unidade/${unidadeId}`
    console.log('[usePedidoWebSocket] Inscrevendo em:', topico)

    wsStore.inscrever(topico, (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação da unidade:', notificacao)
      
      // Se SubPedido ficou PRONTO, mostrar alerta
      if (notificacao.statusSubPedido === 'PRONTO' || notificacao.tipo === 'SUBPEDIDO_PRONTO') {
        if (callbacks.onSubPedidoPronto) {
          callbacks.onSubPedidoPronto(notificacao)
        }
        
        // Alert visual/sonoro
        mostrarAlertaSubPedidoPronto(notificacao)
      }
      
      if (callback) callback(notificacao)
    })

    return () => wsStore.desinscrever(topico)
  }

  /**
   * Inscrever em tópico de Cozinha (para tela de cozinha)
   * /topic/cozinha/{cozinhaId}
   * 
   * Recebe:
   * - Novos SubPedidos chegando (PEDIDO_LIBERADO_AUTOMATICAMENTE)
   * - Cancelamentos
   */
  const inscreverCozinha = (cozinhaId, callback) => {
    if (!cozinhaId) return

    const topico = `/topic/cozinha/${cozinhaId}`
    console.log('[usePedidoWebSocket] Inscrevendo em:', topico)

    wsStore.inscrever(topico, (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação da cozinha:', notificacao)
      
      // Pedido liberado automaticamente (confirmação automática pelo backend)
      if (notificacao.tipo === 'PEDIDO_LIBERADO_AUTOMATICAMENTE') {
        console.log('✅ [CONFIRMAÇÃO AUTOMÁTICA] SubPedido liberado:', notificacao.subPedidoNumero)
        if (callbacks.onPedidoLiberado) callbacks.onPedidoLiberado(notificacao)
        mostrarNotificacaoPedidoLiberado(notificacao)
      }
      
      if (callback) callback(notificacao)
      if (callbacks.onNovoSubPedido) callbacks.onNovoSubPedido(notificacao)
    })

    return () => wsStore.desinscrever(topico)
  }

  /**
   * Inscrever em tópico de Gerente (alertas e notificações)
   * /topic/gerente/pedidos
   * /topic/gerente/alertas
   * 
   * Recebe:
   * - PEDIDO_LIBERADO_AUTOMATICAMENTE (informativo)
   * - PEDIDO_BLOQUEADO_POR_LIMITE (alerta crítico)
   */
  const inscreverGerente = (callback) => {
    const topicoPedidos = '/topic/gerente/pedidos'
    const topicoAlertas = '/topic/gerente/alertas'
    
    console.log('[usePedidoWebSocket] Inscrevendo gerente em pedidos e alertas')

    // Notificações de pedidos liberados
    wsStore.inscrever(topicoPedidos, (notificacao) => {
      console.log('[usePedidoWebSocket] Notificação gerente (pedidos):', notificacao)
      
      if (notificacao.tipo === 'PEDIDO_LIBERADO_AUTOMATICAMENTE') {
        if (callbacks.onPedidoLiberado) callbacks.onPedidoLiberado(notificacao)
      }
      
      if (callback) callback(notificacao)
    })

    // Alertas críticos (limite excedido)
    wsStore.inscrever(topicoAlertas, (notificacao) => {
      console.log('[usePedidoWebSocket] Alerta gerente:', notificacao)
      
      if (notificacao.tipo === 'PEDIDO_BLOQUEADO_POR_LIMITE') {
        console.warn('⚠️ [LIMITE EXCEDIDO] Pedido bloqueado:', notificacao.pedidoNumero)
        if (callbacks.onPedidoBloqueado) callbacks.onPedidoBloqueado(notificacao)
        mostrarAlertaLimiteExcedido(notificacao)
      }
      
      if (callback) callback(notificacao)
    })

    return () => {
      wsStore.desinscrever(topicoPedidos)
      wsStore.desinscrever(topicoAlertas)
    }
  }

  /**
   * Mostrar alerta quando SubPedido fica pronto
   */
  const mostrarAlertaSubPedidoPronto = (notificacao) => {
    // Notificação visual
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍽️ SubPedido Pronto!', {
        body: `${notificacao.subPedidoNumero || 'SubPedido'} pronto para retirada na ${notificacao.cozinhaNome || 'cozinha'}`,
        icon: '/favicon.ico',
        tag: `subpedido-${notificacao.subPedidoId}`
      })
    }

    // Som de alerta (opcional)
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(() => {})
    } catch (error) {
      // Ignorar erros de som
    }

    console.log('🔔 [ALERTA] SubPedido pronto:', notificacao)
  }

  /**
   * Notificação: Pedido liberado automaticamente
   * Sistema confirmou pedido dentro do limite de risco
   */
  const mostrarNotificacaoPedidoLiberado = (notificacao) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('✅ Pedido Confirmado Automaticamente', {
        body: `${notificacao.pedidoNumero} liberado para produção`,
        icon: '/favicon.ico',
        tag: `pedido-liberado-${notificacao.pedidoId}`
      })
    }

    console.log('✅ [CONFIRMAÇÃO] Pedido liberado:', notificacao)
  }

  /**
   * Alerta: Pedido bloqueado por limite excedido
   * Requer ação do gerente para confirmar pagamento
   */
  const mostrarAlertaLimiteExcedido = (notificacao) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚠️ Pedido Bloqueado - Limite Excedido', {
        body: `${notificacao.pedidoNumero} - Total: ${notificacao.total}. Aguarda confirmação de pagamento.`,
        icon: '/favicon.ico',
        tag: `pedido-bloqueado-${notificacao.pedidoId}`,
        requireInteraction: true  // Não desaparece automaticamente
      })
    }

    // Som de alerta mais alto (crítico)
    try {
      const audio = new Audio('/sounds/alert.mp3')
      audio.play().catch(() => {})
    } catch (error) {
      // Ignorar
    }

    console.warn('⚠️ [LIMITE EXCEDIDO] Pedido bloqueado:', notificacao)
  }

  /**
   * Solicitar permissão de notificações
   */
  const solicitarPermissaoNotificacoes = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // Solicitar permissão ao montar
  onMounted(() => {
    solicitarPermissaoNotificacoes()
  })

  return {
    inscreverPedido,
    inscreverSubPedido,
    inscreverUnidade,
    inscreverCozinha,
    inscreverGerente,
    solicitarPermissaoNotificacoes,
    conectado: wsStore.conectado,
    statusConexao: wsStore.statusConexao
  }
}
