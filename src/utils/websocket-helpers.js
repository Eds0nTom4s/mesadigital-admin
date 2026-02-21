/**
 * Tipos de notificação WebSocket
 */
export const TipoAcao = {
  CRIACAO: 'CRIACAO',
  MUDANCA_STATUS: 'MUDANCA_STATUS',
  CANCELAMENTO: 'CANCELAMENTO',
  OBSERVACAO_ADICIONADA: 'OBSERVACAO_ADICIONADA'
}

/**
 * Status de SubPedido
 */
export const StatusSubPedido = {
  CRIADO: 'CRIADO',
  PENDENTE: 'PENDENTE',
  EM_PREPARACAO: 'EM_PREPARACAO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
}

/**
 * Handlers de notificação por contexto
 */
export const NotificationHandlers = {
  /**
   * Handler para contexto de cozinha
   */
  cozinha: (notificacao, callbacks = {}) => {
    const { tipoAcao, statusNovo, numero } = notificacao

    if (tipoAcao === TipoAcao.CRIACAO && statusNovo === StatusSubPedido.PENDENTE) {
      // Novo pedido para cozinha
      callbacks.novoPedido?.(notificacao)
      return {
        tipo: 'info',
        mensagem: `Novo pedido: ${numero}`,
        som: 'novoPedido'
      }
    }

    if (tipoAcao === TipoAcao.MUDANCA_STATUS && statusNovo === StatusSubPedido.EM_PREPARACAO) {
      // Pedido assumido
      callbacks.pedidoAssumido?.(notificacao)
      return {
        tipo: 'info',
        mensagem: `Pedido ${numero} em preparação`
      }
    }

    return null
  },

  /**
   * Handler para contexto de atendente
   */
  atendente: (notificacao, callbacks = {}) => {
    const { tipoAcao, statusNovo, numero } = notificacao

    if (statusNovo === StatusSubPedido.PRONTO) {
      // Pedido pronto - prioridade alta
      callbacks.pedidoPronto?.(notificacao)
      return {
        tipo: 'success',
        mensagem: `Pedido ${numero} PRONTO! 🔔`,
        duracao: 10000,
        som: 'pedidoPronto',
        prioridade: 'alta'
      }
    }

    if (statusNovo === StatusSubPedido.ENTREGUE) {
      callbacks.pedidoEntregue?.(notificacao)
      return {
        tipo: 'success',
        mensagem: `Pedido ${numero} entregue`,
        som: 'sucesso'
      }
    }

    if (tipoAcao === TipoAcao.CANCELAMENTO) {
      callbacks.pedidoCancelado?.(notificacao)
      return {
        tipo: 'warning',
        mensagem: `Pedido ${numero} cancelado`
      }
    }

    return null
  },

  /**
   * Handler para contexto de cliente
   */
  cliente: (notificacao, callbacks = {}) => {
    const { statusNovo, numero } = notificacao

    const mensagens = {
      [StatusSubPedido.PENDENTE]: `Pedido ${numero} confirmado`,
      [StatusSubPedido.EM_PREPARACAO]: `Seu pedido está sendo preparado`,
      [StatusSubPedido.PRONTO]: `Seu pedido está pronto!`,
      [StatusSubPedido.ENTREGUE]: `Pedido entregue. Bom apetite!`
    }

    const mensagem = mensagens[statusNovo]
    if (mensagem) {
      callbacks.atualizarStatus?.(notificacao)
      return {
        tipo: statusNovo === StatusSubPedido.PRONTO ? 'success' : 'info',
        mensagem,
        som: statusNovo === StatusSubPedido.PRONTO ? 'pedidoPronto' : null
      }
    }

    return null
  }
}

/**
 * Mapear status para badge CSS
 */
export const statusParaBadge = (status) => {
  const mapa = {
    [StatusSubPedido.CRIADO]: 'badge-info',
    [StatusSubPedido.PENDENTE]: 'badge-warning',
    [StatusSubPedido.EM_PREPARACAO]: 'badge-info',
    [StatusSubPedido.PRONTO]: 'badge-success',
    [StatusSubPedido.ENTREGUE]: 'badge-success',
    [StatusSubPedido.CANCELADO]: 'badge-error'
  }
  return mapa[status] || 'badge-info'
}

/**
 * Mapear status para texto legível
 */
export const statusParaTexto = (status) => {
  const mapa = {
    [StatusSubPedido.CRIADO]: 'Criado',
    [StatusSubPedido.PENDENTE]: 'Pendente',
    [StatusSubPedido.EM_PREPARACAO]: 'Em Preparação',
    [StatusSubPedido.PRONTO]: 'Pronto',
    [StatusSubPedido.ENTREGUE]: 'Entregue',
    [StatusSubPedido.CANCELADO]: 'Cancelado'
  }
  return mapa[status] || status
}
