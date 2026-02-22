/**
 * ════════════════════════════════════════════════════════════════════════════════
 * TIPOS E CONTRATOS - PEDIDOS
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Definições de tipos, enums e contratos de dados do domínio de Pedidos
 * 
 * Sincronizado com o backend Spring Boot
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ENUMS
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * Status do pedido (ciclo de vida)
 */
export const PEDIDO_STATUS = Object.freeze({
  CRIADO: 'CRIADO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  PRONTO: 'PRONTO',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO'
})

/**
 * Labels humanizados dos status
 */
export const PEDIDO_STATUS_LABEL = Object.freeze({
  [PEDIDO_STATUS.CRIADO]: 'Criado',
  [PEDIDO_STATUS.EM_ANDAMENTO]: 'Em Andamento',
  [PEDIDO_STATUS.PRONTO]: 'Pronto',
  [PEDIDO_STATUS.FINALIZADO]: 'Finalizado',
  [PEDIDO_STATUS.CANCELADO]: 'Cancelado'
})

/**
 * Cores dos status (Tailwind)
 */
export const PEDIDO_STATUS_COLOR = Object.freeze({
  [PEDIDO_STATUS.CRIADO]: 'blue',
  [PEDIDO_STATUS.EM_ANDAMENTO]: 'yellow',
  [PEDIDO_STATUS.PRONTO]: 'green',
  [PEDIDO_STATUS.FINALIZADO]: 'gray',
  [PEDIDO_STATUS.CANCELADO]: 'red'
})

/**
 * Origem do pedido
 */
export const PEDIDO_ORIGEM = Object.freeze({
  BALCAO: 'BALCAO',
  QRCODE: 'QRCODE',
  APP: 'APP',
  SISTEMA: 'SISTEMA'
})

/**
 * Formas de pagamento
 * 
 * PRE_PAGO: Débito automático do fundo de consumo
 * POS_PAGO: Pagamento posterior (apenas GERENTE/ADMIN)
 */
export const FORMA_PAGAMENTO = Object.freeze({
  PRE_PAGO: 'PRE_PAGO',
  POS_PAGO: 'POS_PAGO',
  DINHEIRO: 'DINHEIRO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  PIX: 'PIX',
  CORTESIA: 'CORTESIA'
})

/**
 * Labels das formas de pagamento
 */
export const FORMA_PAGAMENTO_LABEL = Object.freeze({
  [FORMA_PAGAMENTO.PRE_PAGO]: 'Pré-Pago (Fundo)',
  [FORMA_PAGAMENTO.POS_PAGO]: 'Pós-Pago',
  [FORMA_PAGAMENTO.DINHEIRO]: 'Dinheiro',
  [FORMA_PAGAMENTO.CARTAO_DEBITO]: 'Cartão de Débito',
  [FORMA_PAGAMENTO.CARTAO_CREDITO]: 'Cartão de Crédito',
  [FORMA_PAGAMENTO.PIX]: 'PIX',
  [FORMA_PAGAMENTO.CORTESIA]: 'Cortesia'
})

/**
 * Status do item (subpedido)
 */
export const ITEM_STATUS = Object.freeze({
  PENDENTE: 'PENDENTE',
  EM_PREPARO: 'EM_PREPARO',
  PRONTO: 'PRONTO',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO'
})

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * VALIDAÇÕES
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * Regras de validação
 */
export const VALIDATION_RULES = Object.freeze({
  QUANTIDADE_MIN: 1,
  QUANTIDADE_MAX: 999,
  OBSERVACAO_MAX_LENGTH: 500,
  MOTIVO_CANCELAMENTO_MIN_LENGTH: 5,
  MOTIVO_CANCELAMENTO_MAX_LENGTH: 500
})

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * INTERFACES (JSDoc para type hints)
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * @typedef {Object} Pedido
 * @property {number} id - ID do pedido
 * @property {string} numero - Número sequencial (ex: "000123")
 * @property {number} unidadeConsumoId - ID da unidade de consumo
 * @property {string} unidadeConsumoReferencia - Referência da unidade (ex: "Mesa 5")
 * @property {number|null} fundoConsumoId - ID do fundo (retornado pelo backend se PRE_PAGO)
 * @property {number|null} clienteId - ID do cliente (se vinculado a fundo)
 * @property {string} status - Status do pedido (PEDIDO_STATUS)
 * @property {string} origem - Origem do pedido (PEDIDO_ORIGEM)
 * @property {number} valorTotal - Valor total em centavos
 * @property {Array<ItemPedido>} itens - Lista de itens do pedido
 * @property {string|null} observacao - Observações gerais
 * @property {string|null} formaPagamento - Forma de pagamento (se finalizado)
 * @property {string} criadoEm - ISO timestamp
 * @property {string|null} finalizadoEm - ISO timestamp
 * @property {string|null} canceladoEm - ISO timestamp
 * @property {string|null} motivoCancelamento - Motivo do cancelamento
 * @property {number} versao - Versão para concorrência otimista
 * @property {string|null} etag - ETag para cache
 */

/**
 * @typedef {Object} ItemPedido
 * @property {number} id - ID do item (subpedido)
 * @property {number} pedidoId - ID do pedido pai
 * @property {number} produtoId - ID do produto
 * @property {string} produtoNome - Nome do produto
 * @property {number} quantidade - Quantidade
 * @property {number} valorUnitario - Valor unitário em centavos
 * @property {number} valorTotal - Valor total em centavos (quantidade * unitário)
 * @property {string|null} observacao - Observações do item
 * @property {string} status - Status do item (ITEM_STATUS)
 * @property {string} criadoEm - ISO timestamp
 * @property {string|null} iniciadoPreparoEm - ISO timestamp
 * @property {string|null} prontoEm - ISO timestamp
 * @property {string|null} entregueEm - ISO timestamp
 */

/**
 * @typedef {Object} CriarPedidoDTO
 * @property {number} unidadeConsumoId - ID da unidade (obrigatório)
 * @property {string} tipoPagamento - 'PRE_PAGO' | 'POS_PAGO' (obrigatório)
 * @property {Array} itens - Array de itens [{produtoId, quantidade, observacoes?}]
 * @property {string} [origem='BALCAO'] - Origem
 * @property {string} [observacao] - Observações gerais
 * 
 * Nota: Backend resolve fundoConsumoId automaticamente via cliente vinculadoà unidade
 */

/**
 * @typedef {Object} AdicionarItemDTO
 * @property {number} produtoId - ID do produto (obrigatório)
 * @property {number} quantidade - Quantidade (obrigatório)
 * @property {string} [observacao] - Observações
 */

/**
 * @typedef {Object} FecharPedidoDTO
 * @property {string} formaPagamento - Forma de pagamento (obrigatório)
 * @property {string} [observacao] - Observações
 */

/**
 * @typedef {Object} PedidoTotais
 * @property {number} subtotal - Subtotal em centavos
 * @property {number} quantidade - Quantidade total de itens
 * @property {number} itens - Número de linhas de itens
 */

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * UTILIDADES
 * ──────────────────────────────────────────────────────────────────────────────
 */

/**
 * Verifica se pedido pode receber novos itens
 * 
 * @param {Pedido} pedido - Pedido a verificar
 * @returns {boolean} Se pode adicionar itens
 */
export function canAddItems(pedido) {
  if (!pedido) return false
  return (
    pedido.status === PEDIDO_STATUS.CRIADO ||
    pedido.status === PEDIDO_STATUS.EM_ANDAMENTO
  )
}

/**
 * Verifica se pedido pode ser fechado
 * 
 * @param {Pedido} pedido - Pedido a verificar
 * @returns {boolean} Se pode fechar
 */
export function canClose(pedido) {
  if (!pedido) return false
  return (
    canAddItems(pedido) &&
    pedido.itens &&
    pedido.itens.length > 0 &&
    pedido.valorTotal > 0
  )
}

/**
 * Verifica se pedido pode ser cancelado
 * 
 * @param {Pedido} pedido - Pedido a verificar
 * @returns {boolean} Se pode cancelar
 */
export function canCancel(pedido) {
  if (!pedido) return false
  return (
    pedido.status !== PEDIDO_STATUS.FINALIZADO &&
    pedido.status !== PEDIDO_STATUS.CANCELADO
  )
}

/**
 * Verifica se pedido está ativo
 * 
 * @param {Pedido} pedido - Pedido a verificar
 * @returns {boolean} Se está ativo
 */
export function isActive(pedido) {
  if (!pedido) return false
  return (
    pedido.status === PEDIDO_STATUS.CRIADO ||
    pedido.status === PEDIDO_STATUS.EM_ANDAMENTO ||
    pedido.status === PEDIDO_STATUS.PRONTO
  )
}

/**
 * Formata número do pedido
 * 
 * @param {string|number} numero - Número do pedido
 * @returns {string} Número formatado (ex: "#000123")
 */
export function formatNumero(numero) {
  if (!numero) return ''
  return `#${String(numero).padStart(6, '0')}`
}

/**
 * Calcula totais de um pedido
 * 
 * @param {Pedido} pedido - Pedido
 * @returns {PedidoTotais} Totais calculados
 */
export function calcularTotais(pedido) {
  if (!pedido?.itens || pedido.itens.length === 0) {
    return {
      subtotal: 0,
      quantidade: 0,
      itens: 0
    }
  }

  return pedido.itens.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.valorTotal,
      quantidade: acc.quantidade + item.quantidade,
      itens: acc.itens + 1
    }),
    { subtotal: 0, quantidade: 0, itens: 0 }
  )
}

/**
 * Retorna classe CSS do status
 * 
 * @param {string} status - Status do pedido
 * @returns {string} Classe CSS
 */
export function getStatusClass(status) {
  const color = PEDIDO_STATUS_COLOR[status] || 'gray'
  return `badge-${color}`
}

/**
 * Retorna ícone do status
 * 
 * @param {string} status - Status do pedido
 * @returns {string} Emoji/ícone
 */
export function getStatusIcon(status) {
  const icons = {
    [PEDIDO_STATUS.CRIADO]: '📝',
    [PEDIDO_STATUS.EM_ANDAMENTO]: '🔄',
    [PEDIDO_STATUS.PRONTO]: '✅',
    [PEDIDO_STATUS.FINALIZADO]: '🏁',
    [PEDIDO_STATUS.CANCELADO]: '❌'
  }
  return icons[status] || '❓'
}

/**
 * Retorna ícone da forma de pagamento
 * 
 * @param {string} formaPagamento - Forma de pagamento
 * @returns {string} Emoji/ícone
 */
export function getFormaPagamentoIcon(formaPagamento) {
  const icons = {
    [FORMA_PAGAMENTO.PRE_PAGO]: '💳',
    [FORMA_PAGAMENTO.POS_PAGO]: '📋',
    [FORMA_PAGAMENTO.DINHEIRO]: '💵',
    [FORMA_PAGAMENTO.CARTAO_DEBITO]: '💳',
    [FORMA_PAGAMENTO.CARTAO_CREDITO]: '💳',
    [FORMA_PAGAMENTO.PIX]: '📱',
    [FORMA_PAGAMENTO.CORTESIA]: '🎁'
  }
  return icons[formaPagamento] || '💰'
}

/**
 * Transforma pedido do backend para frontend
 * 
 * @param {Object} pedidoApi - Pedido vindo da API
 * @returns {Pedido} Pedido normalizado
 */
export function normalizePedido(pedidoApi) {
  return {
    ...pedidoApi,
    // Adiciona campos calculados
    numeroFormatado: formatNumero(pedidoApi.numero),
    statusLabel: PEDIDO_STATUS_LABEL[pedidoApi.status],
    statusIcon: getStatusIcon(pedidoApi.status),
    statusClass: getStatusClass(pedidoApi.status),
    formaPagamentoLabel: pedidoApi.formaPagamento
      ? FORMA_PAGAMENTO_LABEL[pedidoApi.formaPagamento]
      : null,
    formaPagamentoIcon: pedidoApi.formaPagamento
      ? getFormaPagamentoIcon(pedidoApi.formaPagamento)
      : null,
    // Flags de estado
    isAtivo: isActive(pedidoApi),
    canEdit: canAddItems(pedidoApi),
    canClose: canClose(pedidoApi),
    canCancel: canCancel(pedidoApi)
  }
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * CONSTANTES DE CONFIGURAÇÃO
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const PEDIDO_CONFIG = Object.freeze({
  // Polling interval (se não usar WebSocket)
  POLLING_INTERVAL: 30000, // 30s

  // Auto-refresh de pedidos ativos
  AUTO_REFRESH_ATIVOS: true,
  AUTO_REFRESH_INTERVAL: 60000, // 1min

  // Notificações sonoras
  SOUND_NOVO_PEDIDO: true,
  SOUND_STATUS_CHANGE: true,

  // Cache
  CACHE_TTL: 300000, // 5min
  CACHE_MAX_SIZE: 100,

  // UI
  ITEMS_PER_PAGE: 20,
  DEBOUNCE_SEARCH: 300, // ms
  TOAST_DURATION: 3000  // ms
})
