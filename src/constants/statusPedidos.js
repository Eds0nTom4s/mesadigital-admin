/**
 * Constantes de Status de Pedidos e SubPedidos
 * Conforme IMPLEMENTACAO_CONFIRMACAO_AUTOMATICA_PEDIDOS.md
 * 
 * Data: 24/02/2026
 */

/**
 * Status do Pedido Principal
 * [BACKEND — 01/03/2026] Valores reais: CRIADO, EM_ANDAMENTO, FINALIZADO, CANCELADO
 * PRONTO e ENTREGUE são estados de SUBPEDIDO, não de Pedido.
 */
export const STATUS_PEDIDO = {
  CRIADO:       'CRIADO',        // Pedido registado, aguarda processamento
  EM_ANDAMENTO: 'EM_ANDAMENTO',  // Pelo menos um SubPedido em produção
  FINALIZADO:   'FINALIZADO',    // Todos SubPedidos entregues (transição automática)
  CANCELADO:    'CANCELADO'      // Cancelado por GERENTE/ADMIN
}

/**
 * Status do SubPedido (produção na cozinha)
 * 
 * FLUXO CORRETO (após 24/02/2026):
 * 1. CRIADO → SubPedido registrado, aguarda confirmação automática do backend
 * 2. PENDENTE → Confirmado automaticamente (dentro do limite), cozinha recebe
 * 3. EM_PREPARO → Cozinha iniciou produção
 * 4. PRONTO → Produto pronto para retirada
 * 5. ENTREGUE → Cliente retirou
 * 6. CANCELADO → Cancelado antes da entrega
 */
export const STATUS_SUBPEDIDO = {
  CRIADO: 'CRIADO',           // ⏳ Aguardando validação automática do backend
  PENDENTE: 'PENDENTE',       // ✅ Confirmado, aguarda produção na cozinha
  EM_PREPARO: 'EM_PREPARO',   // 🔥 Em produção
  PRONTO: 'PRONTO',           // ✅ Pronto para retirada
  ENTREGUE: 'ENTREGUE',       // 🎉 Entregue ao cliente
  CANCELADO: 'CANCELADO'      // ❌ Cancelado
}

/**
 * Status Financeiro do Pedido
 */
export const STATUS_FINANCEIRO_PEDIDO = {
  NAO_PAGO: 'NAO_PAGO',
  PAGO: 'PAGO',
  ESTORNADO: 'ESTORNADO'
}

/**
 * Tipo de Pagamento
 */
export const TIPO_PAGAMENTO = {
  PRE_PAGO: 'PRE_PAGO',   // Pago antes (fundo de consumo)
  POS_PAGO: 'POS_PAGO'    // Pagar depois (crédito)
}

/**
 * Eventos WebSocket
 */
export const EVENTOS_WEBSOCKET = {
  // Confirmação automática (novo fluxo 24/02/2026)
  PEDIDO_LIBERADO_AUTOMATICAMENTE: 'PEDIDO_LIBERADO_AUTOMATICAMENTE',
  PEDIDO_BLOQUEADO_POR_LIMITE: 'PEDIDO_BLOQUEADO_POR_LIMITE',
  
  // Eventos de atualização de status
  PEDIDO_ATUALIZADO: 'PEDIDO_ATUALIZADO',
  SUBPEDIDO_ATUALIZADO: 'SUBPEDIDO_ATUALIZADO',
  SUBPEDIDO_PRONTO: 'SUBPEDIDO_PRONTO',
  
  // Eventos de cliente
  PEDIDO_AGUARDANDO_CONFIRMACAO: 'PEDIDO_AGUARDANDO_CONFIRMACAO'
}

/**
 * Mapeamento de cores para badges de status
 */
export const CORES_STATUS_PEDIDO = {
  [STATUS_PEDIDO.CRIADO]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  [STATUS_PEDIDO.EM_ANDAMENTO]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300'
  },
  [STATUS_PEDIDO.FINALIZADO]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  [STATUS_PEDIDO.CANCELADO]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300'
  }
}

export const CORES_STATUS_SUBPEDIDO = {
  [STATUS_SUBPEDIDO.CRIADO]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    icon: '⏳'
  },
  [STATUS_SUBPEDIDO.PENDENTE]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    icon: '🔔'
  },
  [STATUS_SUBPEDIDO.EM_PREPARO]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    icon: '🔥'
  },
  [STATUS_SUBPEDIDO.PRONTO]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    icon: '✅'
  },
  [STATUS_SUBPEDIDO.ENTREGUE]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    icon: '🎉'
  },
  [STATUS_SUBPEDIDO.CANCELADO]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    icon: '❌'
  }
}

/**
 * Labels amigáveis para cada status
 */
export const LABELS_STATUS_PEDIDO = {
  [STATUS_PEDIDO.CRIADO]:       'Em espera',
  [STATUS_PEDIDO.EM_ANDAMENTO]: 'Em Andamento',
  [STATUS_PEDIDO.FINALIZADO]:   'Finalizado',
  [STATUS_PEDIDO.CANCELADO]:    'Cancelado'
}

export const LABELS_STATUS_SUBPEDIDO = {
  [STATUS_SUBPEDIDO.CRIADO]: 'Aguardando Validação',
  [STATUS_SUBPEDIDO.PENDENTE]: 'Aguardando Produção',
  [STATUS_SUBPEDIDO.EM_PREPARO]: 'Em Preparo',
  [STATUS_SUBPEDIDO.PRONTO]: 'Pronto para Retirada',
  [STATUS_SUBPEDIDO.ENTREGUE]: 'Entregue',
  [STATUS_SUBPEDIDO.CANCELADO]: 'Cancelado'
}

/**
 * Helper: Verifica se status permite edição
 */
export function podeEditarPedido(status) {
  return status === STATUS_PEDIDO.CRIADO
}

/**
 * Helper: Verifica se status permite cancelamento
 */
export function podeCancelarPedido(status) {
  return [STATUS_PEDIDO.CRIADO, STATUS_PEDIDO.EM_ANDAMENTO].includes(status)
}

/**
 * Helper: Verifica se SubPedido está em produção
 */
export function subPedidoEmProducao(status) {
  return [STATUS_SUBPEDIDO.PENDENTE, STATUS_SUBPEDIDO.EM_PREPARO].includes(status)
}

/**
 * Helper: Verifica se pedido está bloqueado aguardando confirmação
 */
export function pedidoBloqueado(pedido) {
  return pedido.status === STATUS_PEDIDO.CRIADO && 
         pedido.subPedidos?.every(sp => sp.status === STATUS_SUBPEDIDO.CRIADO)
}
