/**
 * ════════════════════════════════════════════════════════════════════════════════
 * CAMADA SERVICE - PEDIDOS (Business Logic Layer)
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * RESPONSABILIDADE:
 * - Orquestração de operações complexas
 * - Validações de regras de negócio (client-side)
 * - Transformação de dados (API ↔ UI)
 * - Estratégias de retry e circuit breaker
 * - Resolução de conflitos de concorrência
 * ════════════════════════════════════════════════════════════════════════════════
 */

import pedidoApi, { PedidoConflictError } from '@/api/pedido.api'

/**
 * Exceções de negócio
 */
export class ValidationError extends Error {
  constructor(message, field, code) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
    this.code = code
  }
}

export class BusinessRuleError extends Error {
  constructor(message, rule, details) {
    super(message)
    this.name = 'BusinessRuleError'
    this.rule = rule
    this.details = details
  }
}

/**
 * Configuração de retry com exponential backoff
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 503, 504]
}

let circuitState = {
  state: 'CLOSED', // CLOSED | OPEN | HALF_OPEN
  failures: 0,
  lastFailure: null,
  nextRetry: null
}

const CIRCUIT_BREAKER_THRESHOLD = 5
const CIRCUIT_BREAKER_RESET_MS  = 60000

async function withRetry(operation, context = {}) {
  const startTime = Date.now()
  let lastError

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (circuitState.state === 'OPEN') {
        if (Date.now() < circuitState.nextRetry) {
          throw new Error('Circuit breaker OPEN — serviço temporariamente indisponível')
        }
        circuitState.state = 'HALF_OPEN'
      }

      const result = await operation()

      if (circuitState.state === 'HALF_OPEN') {
        circuitState.state = 'CLOSED'
        circuitState.failures = 0
      }

      if (import.meta.env.DEV && attempt > 1) {
        console.log(`[Service] Retry bem-sucedido na tentativa ${attempt}`, {
          ...context, duration: Date.now() - startTime
        })
      }

      return result
    } catch (error) {
      lastError = error

      // Não faz retry em erros de validação/conflito/auth
      if (
        error instanceof ValidationError ||
        error instanceof PedidoConflictError ||
        [400, 401, 403, 404, 409].includes(error.response?.status)
      ) {
        throw error
      }

      const isRetryable = RETRY_CONFIG.retryableStatuses.includes(error.response?.status)

      if (!isRetryable || attempt === RETRY_CONFIG.maxAttempts) {
        circuitState.failures++
        if (circuitState.failures >= CIRCUIT_BREAKER_THRESHOLD) {
          circuitState.state = 'OPEN'
          circuitState.lastFailure = Date.now()
          circuitState.nextRetry = Date.now() + CIRCUIT_BREAKER_RESET_MS
          console.error('[Service] Circuit breaker OPEN', circuitState)
        }
        throw error
      }

      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      )
      console.warn(`[Service] Retry ${attempt}/${RETRY_CONFIG.maxAttempts} após ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Validações client-side
 */
const validators = {
  validateCriarPedido(dados) {
    // [BACKEND] CriarPedidoRequest usa sessaoConsumoId (não unidadeConsumoId)
    if (!dados.sessaoConsumoId) {
      throw new ValidationError(
        'ID da sessão de consumo é obrigatório',
        'sessaoConsumoId',
        'REQUIRED'
      )
    }
    if (!dados.tipoPagamento || !['PRE_PAGO', 'POS_PAGO'].includes(dados.tipoPagamento)) {
      throw new ValidationError(
        'Tipo de pagamento deve ser PRE_PAGO ou POS_PAGO',
        'tipoPagamento',
        'INVALID_VALUE'
      )
    }
    if (!dados.itens || dados.itens.length === 0) {
      throw new ValidationError(
        'Pedido deve ter pelo menos um item',
        'itens',
        'REQUIRED'
      )
    }
  },

  validateCancelar(motivo) {
    if (!motivo || motivo.trim().length < 5) {
      throw new ValidationError(
        'Motivo deve ter no mínimo 5 caracteres',
        'motivo',
        'MIN_LENGTH'
      )
    }
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * SERVIÇO PRINCIPAL
 * ════════════════════════════════════════════════════════════════════════════════
 */
export const pedidoService = {

  /**
   * Criar novo pedido
   *
   * @param {Object} dados
   * @param {number} dados.sessaoConsumoId - ID da sessão de consumo ativa (OBRIGATÓRIO)
   * @param {string} dados.tipoPagamento   - 'PRE_PAGO' | 'POS_PAGO'
   * @param {Array}  dados.itens           - [{produtoId, quantidade, observacoes?}]
   * @returns {Promise<Object>} ApiResponse<PedidoResponse>
   */
  async criar(dados) {
    validators.validateCriarPedido(dados)

    const payload = {
      sessaoConsumoId: dados.sessaoConsumoId,
      tipoPagamento:   dados.tipoPagamento,
      itens:           dados.itens
    }

    return await withRetry(
      () => pedidoApi.criar(payload),
      { operation: 'criar_pedido', sessaoConsumoId: dados.sessaoConsumoId }
    )
  },

  /**
   * Buscar pedido por ID
   * @param {number} id
   */
  async getById(id) {
    return await withRetry(
      () => pedidoApi.getById(id),
      { operation: 'get_pedido', pedidoId: id }
    )
  },

  /**
   * Buscar pedido por número
   * @param {string} numero
   */
  async getByNumero(numero) {
    return await withRetry(
      () => pedidoApi.getByNumero(numero),
      { operation: 'get_by_numero', numero }
    )
  },

  /**
   * Listar pedidos de hoje (paginado)
   * @param {{ page?, size? }} params
   */
  async getHoje(params = {}) {
    return await withRetry(
      () => pedidoApi.getHoje(params),
      { operation: 'get_hoje' }
    )
  },

  /**
   * Listar pedidos ativos (paginado)
   * @param {{ page?, size? }} params
   */
  async getAtivos(params = {}) {
    return await withRetry(
      () => pedidoApi.getAtivos(params),
      { operation: 'get_ativos' }
    )
  },

  /**
   * Listar pedidos por status (paginado)
   * @param {string} status
   * @param {{ page?, size? }} params
   */
  async getByStatus(status, params = {}) {
    return await withRetry(
      () => pedidoApi.getByStatus(status, params),
      { operation: 'get_by_status', status }
    )
  },

  /**
   * Listar pedidos de uma sessão de consumo (paginado)
   * Endpoint correcto: GET /pedidos/sessao/{id}
   *
   * @param {number} sessaoConsumoId
   * @param {{ page?, size? }} params
   */
  async getBySessaoConsumo(sessaoConsumoId, params = {}) {
    return await withRetry(
      () => pedidoApi.getBySessaoConsumo(sessaoConsumoId, params),
      { operation: 'get_by_sessao', sessaoConsumoId }
    )
  },

  /**
   * Listar pedidos activos de uma sessão (paginado)
   * @param {number} sessaoConsumoId
   * @param {{ page?, size? }} params
   */
  async getAtivosBySessaoConsumo(sessaoConsumoId, params = {}) {
    return await withRetry(
      () => pedidoApi.getAtivosBySessaoConsumo(sessaoConsumoId, params),
      { operation: 'get_ativos_sessao', sessaoConsumoId }
    )
  },

  /**
   * Listar com filtros avançados (paginado)
   * @param {{ status?, sessaoId?, dataInicio?, dataFim?, page?, size? }} params
   */
  async listarComFiltros(params = {}) {
    return await withRetry(
      () => pedidoApi.listarComFiltros(params),
      { operation: 'listar_filtros' }
    )
  },

  /**
   * Confirmar pedido (CRIADO → EM_ANDAMENTO)
   * Envia os sub-pedidos para as cozinhas.
   * @param {number} pedidoId
   */
  async confirmar(pedidoId) {
    return await withRetry(
      () => pedidoApi.confirmar(pedidoId),
      { operation: 'confirmar_pedido', pedidoId }
    )
  },

  /**
   * Cancelar pedido (requer motivo)
   * @param {number} pedidoId
   * @param {string} motivo
   */
  async cancelar(pedidoId, motivo) {
    validators.validateCancelar(motivo)
    return await withRetry(
      () => pedidoApi.cancelar(pedidoId, motivo),
      { operation: 'cancelar_pedido', pedidoId }
    )
  },

  /**
   * Confirmar pagamento pós-pago
   * @param {number} pedidoId
   */
  async confirmarPagamento(pedidoId) {
    return await withRetry(
      () => pedidoApi.confirmarPagamento(pedidoId),
      { operation: 'confirmar_pagamento', pedidoId }
    )
  },

  /**
   * Fechar conta (operação crítica — sem retry automático)
   * Para PRE_PAGO: o débito já foi efectuado na criação.
   * Para POS_PAGO: confirma pagamento automaticamente.
   * O backend não aceita body — usa PUT /pedidos/{id}/fechar sem parâmetros.
   *
   * @param {number} pedidoId
   */
  async fechar(pedidoId) {
    try {
      return await pedidoApi.fechar(pedidoId)
    } catch (error) {
      console.error('[Service] FALHA CRÍTICA ao fechar pedido', {
        pedidoId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  },

  /**
   * Calcula totais do pedido (client-side, para preview)
   * @param {Array} itens - [{valorUnitario, quantidade}]
   */
  calcularTotais(itens) {
    if (!itens || itens.length === 0) {
      return { subtotal: 0, quantidade: 0, itens: 0 }
    }
    return itens.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + (item.valorUnitario * item.quantidade),
        quantidade: acc.quantidade + item.quantidade,
        itens: acc.itens + 1
      }),
      { subtotal: 0, quantidade: 0, itens: 0 }
    )
  },

  resetCircuitBreaker() {
    circuitState = { state: 'CLOSED', failures: 0, lastFailure: null, nextRetry: null }
    console.log('[Service] Circuit breaker resetado')
  },

  getCircuitBreakerStatus() {
    return { ...circuitState }
  }
}

export default pedidoService
