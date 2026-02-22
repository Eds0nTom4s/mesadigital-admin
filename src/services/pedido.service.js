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
 * - Coordenação entre múltiplas APIs
 * 
 * ARQUITETURA:
 * - Sem acesso direto à UI (sem refs, no reactive)
 * - Retorna DTOs padronizados
 * - Lança exceções de negócio customizadas
 * - Stateless - não mantém estado interno
 * 
 * PRODUÇÃO:
 * - Retry automático com exponential backoff
 * - Circuit breaker para operações críticas
 * - Validações defensivas
 * - Logging estruturado
 * - Métricas de performance
 * ════════════════════════════════════════════════════════════════════════════════
 */

import pedidoApi, { PedidoConflictError } from '@/api/pedido.api'
import { PEDIDO_STATUS, FORMA_PAGAMENTO } from '@/utils/pedido.types'

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * EXCEÇÕES DE NEGÓCIO
 * ════════════════════════════════════════════════════════════════════════════════
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
 * ════════════════════════════════════════════════════════════════════════════════
 * CONFIGURAÇÕES DE RETRY E CIRCUIT BREAKER
 * ════════════════════════════════════════════════════════════════════════════════
 */

const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,      // 1s, 2s, 4s (exponential backoff)
  maxDelay: 10000,      // Máximo 10s
  retryableStatuses: [408, 429, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND']
}

const CIRCUIT_BREAKER = {
  failureThreshold: 5,   // Abre após 5 falhas consecutivas
  resetTimeout: 60000,   // Fecha após 60s
  halfOpenRequests: 1    // Tenta 1 requisição antes de fechar
}

let circuitState = {
  state: 'CLOSED', // CLOSED | OPEN | HALF_OPEN
  failures: 0,
  lastFailure: null,
  nextRetry: null
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * UTILIDADES DE RETRY
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * Executa operação com retry automático
 */
async function withRetry(operation, context = {}) {
  const startTime = Date.now()
  let lastError

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      // Verifica circuit breaker
      if (circuitState.state === 'OPEN') {
        if (Date.now() < circuitState.nextRetry) {
          throw new Error('Circuit breaker OPEN - serviço temporariamente indisponível')
        }
        circuitState.state = 'HALF_OPEN'
      }

      const result = await operation()

      // Sucesso - reset circuit breaker
      if (circuitState.state === 'HALF_OPEN') {
        circuitState.state = 'CLOSED'
        circuitState.failures = 0
      }

      // Log de sucesso
      if (import.meta.env.DEV && attempt > 1) {
        console.log(`[Service] Retry bem-sucedido na tentativa ${attempt}`, {
          ...context,
          duration: Date.now() - startTime
        })
      }

      return result
    } catch (error) {
      lastError = error

      // Não faz retry em erros de validação ou conflito
      if (
        error instanceof ValidationError ||
        error instanceof PedidoConflictError ||
        error.response?.status === 400 ||
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        error.response?.status === 404 ||
        error.response?.status === 409
      ) {
        throw error
      }

      // Verifica se é retryable
      const isRetryable =
        RETRY_CONFIG.retryableStatuses.includes(error.response?.status) ||
        RETRY_CONFIG.retryableErrors.includes(error.code)

      if (!isRetryable || attempt === RETRY_CONFIG.maxAttempts) {
        // Atualiza circuit breaker
        circuitState.failures++
        if (circuitState.failures >= CIRCUIT_BREAKER.failureThreshold) {
          circuitState.state = 'OPEN'
          circuitState.lastFailure = Date.now()
          circuitState.nextRetry = Date.now() + CIRCUIT_BREAKER.resetTimeout
          console.error('[Service] Circuit breaker OPEN', circuitState)
        }
        throw error
      }

      // Calcula delay com exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
        RETRY_CONFIG.maxDelay
      )

      console.warn(`[Service] Retry ${attempt}/${RETRY_CONFIG.maxAttempts} após ${delay}ms`, {
        ...context,
        error: error.message
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * VALIDAÇÕES
 * ════════════════════════════════════════════════════════════════════════════════
 */

const validators = {
  /**
   * Valida payload de criação de pedido
   */
  validateCriarPedido(dados) {
    if (!dados.unidadeConsumoId) {
      throw new ValidationError(
        'Unidade de consumo é obrigatória',
        'unidadeConsumoId',
        'REQUIRED'
      )
    }

    if (dados.origem && !['BALCAO', 'QRCODE', 'APP'].includes(dados.origem)) {
      throw new ValidationError(
        'Origem inválida',
        'origem',
        'INVALID_VALUE'
      )
    }
  },

  /**
   * Valida item antes de adicionar
   */
  validateAdicionarItem(item) {
    if (!item.produtoId) {
      throw new ValidationError(
        'Produto é obrigatório',
        'produtoId',
        'REQUIRED'
      )
    }

    if (!item.quantidade || item.quantidade <= 0) {
      throw new ValidationError(
        'Quantidade deve ser maior que zero',
        'quantidade',
        'INVALID_VALUE'
      )
    }

    if (item.quantidade > 999) {
      throw new ValidationError(
        'Quantidade máxima excedida',
        'quantidade',
        'MAX_EXCEEDED'
      )
    }
  },

  /**
   * Valida se pedido pode ser fechado
   */
  validateFecharPedido(pedido) {
    if (!pedido) {
      throw new BusinessRuleError(
        'Pedido não encontrado',
        'PEDIDO_NAO_ENCONTRADO'
      )
    }

    if (pedido.status === PEDIDO_STATUS.FINALIZADO) {
      throw new BusinessRuleError(
        'Pedido já foi finalizado',
        'PEDIDO_JA_FINALIZADO'
      )
    }

    if (pedido.status === PEDIDO_STATUS.CANCELADO) {
      throw new BusinessRuleError(
        'Pedido foi cancelado',
        'PEDIDO_CANCELADO'
      )
    }

    if (!pedido.itens || pedido.itens.length === 0) {
      throw new BusinessRuleError(
        'Pedido sem itens não pode ser finalizado',
        'PEDIDO_VAZIO'
      )
    }

    if (pedido.valorTotal <= 0) {
      throw new BusinessRuleError(
        'Valor total inválido',
        'VALOR_INVALIDO'
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
   * ──────────────────────────────────────────────────────────────────────────────
   * OPERAÇÕES CRUD
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Criar novo pedido
   * 
   * @param {Object} dados - Dados do pedido
   * @param {number} dados.unidadeConsumoId - ID da unidade
   * @param {string} dados.tipoPagamento - 'PRE_PAGO' | 'POS_PAGO'
   * @param {Array} dados.itens - Array de itens
   * @returns {Promise<Object>} Pedido criado
   * 
   * Nota: Backend resolve fundoConsumoId automaticamente via cliente da unidade
   */
  async criar(dados) {
    // Validação
    validators.validateCriarPedido(dados)

    // Normalização - Backend não precisa de fundoConsumoId (resolve automaticamente)
    const payload = {
      unidadeConsumoId: dados.unidadeConsumoId,
      tipoPagamento: dados.tipoPagamento,
      itens: dados.itens,
      origem: dados.origem || 'BALCAO',
      observacao: dados.observacao || null
    }

    // Execução com retry
    return await withRetry(
      () => pedidoApi.criar(payload),
      { operation: 'criar_pedido', unidadeConsumoId: dados.unidadeConsumoId }
    )
  },

  /**
   * Buscar pedido por ID com cache inteligente
   * 
   * @param {number} id - ID do pedido
   * @param {Object} options - Opções
   * @param {string} [options.etag] - ETag para validação de cache
   * @returns {Promise<Object>} Pedido
   */
  async getById(id, options = {}) {
    return await withRetry(
      () => pedidoApi.getById(id, options),
      { operation: 'get_pedido', pedidoId: id }
    )
  },

  /**
   * Listar pedidos ativos
   * 
   * @returns {Promise<Array>} Lista de pedidos
   */
  async getAtivos() {
    return await withRetry(
      () => pedidoApi.getAtivos(),
      { operation: 'get_ativos' }
    )
  },

  /**
   * Listar pedidos por unidade
   * 
   * @param {number} unidadeConsumoId - ID da unidade
   * @returns {Promise<Array>} Pedidos da unidade
   */
  async getByUnidadeConsumo(unidadeConsumoId) {
    return await withRetry(
      () => pedidoApi.getByUnidadeConsumo(unidadeConsumoId),
      { operation: 'get_by_unidade', unidadeConsumoId }
    )
  },

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * OPERAÇÕES DE ITENS (com retry e conflict resolution)
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Adicionar item ao pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {Object} item - Item a adicionar
   * @param {Object} options - Opções de concorrência
   * @returns {Promise<Object>} Pedido atualizado
   * 
   * @throws {PedidoConflictError} Se houver conflito de versão
   */
  async adicionarItem(pedidoId, item, options = {}) {
    // Validação
    validators.validateAdicionarItem(item)

    // Normalização
    const payload = {
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      observacao: item.observacao || null
    }

    try {
      return await withRetry(
        () => pedidoApi.adicionarItem(pedidoId, payload, options),
        { operation: 'adicionar_item', pedidoId, produtoId: item.produtoId }
      )
    } catch (error) {
      // Se for conflito, propaga para camada superior decidir (refresh ou merge)
      if (error instanceof PedidoConflictError) {
        console.warn('[Service] Conflito ao adicionar item', {
          pedidoId,
          versaoCliente: options.versao,
          versaoServidor: error.versaoServidor
        })
        throw error
      }
      throw error
    }
  },

  /**
   * Atualizar quantidade de item
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {number} itemId - ID do item
   * @param {number} quantidade - Nova quantidade
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Pedido atualizado
   */
  async atualizarQuantidadeItem(pedidoId, itemId, quantidade, options = {}) {
    if (quantidade <= 0) {
      throw new ValidationError(
        'Quantidade deve ser maior que zero',
        'quantidade',
        'INVALID_VALUE'
      )
    }

    try {
      return await withRetry(
        () => pedidoApi.atualizarQuantidadeItem(pedidoId, itemId, quantidade, options),
        { operation: 'atualizar_quantidade', pedidoId, itemId }
      )
    } catch (error) {
      if (error instanceof PedidoConflictError) {
        console.warn('[Service] Conflito ao atualizar quantidade', {
          pedidoId,
          itemId,
          versaoCliente: options.versao,
          versaoServidor: error.versaoServidor
        })
        throw error
      }
      throw error
    }
  },

  /**
   * Remover item do pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {number} itemId - ID do item
   * @param {Object} options - Opções
   * @returns {Promise<Object>} Pedido atualizado
   */
  async removerItem(pedidoId, itemId, options = {}) {
    try {
      return await withRetry(
        () => pedidoApi.removerItem(pedidoId, itemId, options),
        { operation: 'remover_item', pedidoId, itemId }
      )
    } catch (error) {
      if (error instanceof PedidoConflictError) {
        console.warn('[Service] Conflito ao remover item', {
          pedidoId,
          itemId
        })
        throw error
      }
      throw error
    }
  },

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * OPERAÇÕES DE ESTADO
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Fechar pedido (operação crítica)
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {Object} dados - Dados de fechamento
   * @param {string} dados.formaPagamento - Forma de pagamento
   * @param {string} [dados.observacao] - Observações
   * @returns {Promise<Object>} Pedido fechado
   */
  async fechar(pedidoId, dados) {
    // Busca pedido atual para validação
    const pedido = await this.getById(pedidoId)

    // Validações de negócio
    validators.validateFecharPedido(pedido.data)

    // Validação de forma de pagamento
    if (!dados.formaPagamento || !Object.values(FORMA_PAGAMENTO).includes(dados.formaPagamento)) {
      throw new ValidationError(
        'Forma de pagamento inválida',
        'formaPagamento',
        'INVALID_VALUE'
      )
    }

    // Nota: Para PRE_PAGO, débito do fundo já foi feito na CRIAÇÃO do pedido
    // Este endpoint é usado principalmente para POS_PAGO (confirmar pagamento ao fechar)
    if (dados.formaPagamento === FORMA_PAGAMENTO.PRE_PAGO) {
      if (!pedido.data.fundoConsumoId) {
        throw new BusinessRuleError(
          'Pedido não possui fundo de consumo associado',
          'FUNDO_NAO_ASSOCIADO'
        )
      }
    }

    const payload = {
      formaPagamento: dados.formaPagamento,
      observacao: dados.observacao || null
    }

    // Executa fechamento (SEM retry - operação crítica)
    try {
      return await pedidoApi.fechar(pedidoId, payload)
    } catch (error) {
      // Log específico para falhas em operações críticas
      console.error('[Service] FALHA CRÍTICA ao fechar pedido', {
        pedidoId,
        formaPagamento: dados.formaPagamento,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  },

  /**
   * Cancelar pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {string} motivo - Motivo obrigatório
   * @returns {Promise<Object>} Pedido cancelado
   */
  async cancelar(pedidoId, motivo) {
    if (!motivo || motivo.trim().length < 5) {
      throw new ValidationError(
        'Motivo deve ter no mínimo 5 caracteres',
        'motivo',
        'MIN_LENGTH'
      )
    }

    return await withRetry(
      () => pedidoApi.cancelar(pedidoId, motivo),
      { operation: 'cancelar_pedido', pedidoId }
    )
  },

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * UTILITÁRIOS
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Calcula totais do pedido (client-side)
   * 
   * Útil para preview antes de enviar ao servidor
   */
  calcularTotais(itens) {
    if (!itens || itens.length === 0) {
      return {
        subtotal: 0,
        quantidade: 0,
        itens: 0
      }
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

  /**
   * Reseta circuit breaker manualmente (para troubleshooting)
   */
  resetCircuitBreaker() {
    circuitState = {
      state: 'CLOSED',
      failures: 0,
      lastFailure: null,
      nextRetry: null
    }
    console.log('[Service] Circuit breaker resetado')
  },

  /**
   * Retorna status do circuit breaker
   */
  getCircuitBreakerStatus() {
    return { ...circuitState }
  }
}

export default pedidoService
