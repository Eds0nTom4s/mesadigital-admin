/**
 * ════════════════════════════════════════════════════════════════════════════════
 * CAMADA API - PEDIDOS (HTTP Layer)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * RESPONSABILIDADE:
 * - Comunicação HTTP pura com o backend
 * - Sem lógica de negócio
 * - Sem transformação de dados
 * - Sem gerenciamento de estado
 * - Retorna respostas brutas ou lança exceções
 * 
 * ARQUITETURA:
 * - Todas as chamadas retornam Promise<AxiosResponse>
 * - Erros HTTP são propagados para camadas superiores
 * - Conflitos 409 são tratados como exceções específicas
 * - Headers de versionamento (ETag/If-Match) são suportados
 * 
 * PRODUÇÃO:
 * - Preparado para concorrência otimista (versioning)
 * - Suporta conditional requests (304 Not Modified)
 * - Timeout configurável por operação crítica
 * - Idempotência explícita onde aplicável
 * ════════════════════════════════════════════════════════════════════════════════
 */

import api from '@/services/api'

/**
 * Exceção customizada para conflitos de concorrência (HTTP 409)
 */
export class PedidoConflictError extends Error {
  constructor(message, versaoServidor, versaoCliente, data) {
    super(message)
    this.name = 'PedidoConflictError'
    this.statusCode = 409
    this.versaoServidor = versaoServidor
    this.versaoCliente = versaoCliente
    this.data = data
  }
}

/**
 * Configurações de timeout por operação
 */
const TIMEOUTS = {
  READ: 5000,      // Leitura: rápido
  WRITE: 10000,    // Escrita: médio
  CRITICAL: 15000  // Operações críticas (fechar pedido): longo
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * OPERAÇÕES CRUD
 * ════════════════════════════════════════════════════════════════════════════════
 */

export const pedidoApi = {
  /**
   * [POST] Criar novo pedido
   * 
   * @param {Object} payload - Dados do pedido
   * @param {number} payload.unidadeConsumoId - ID da unidade (mesa/quarto)
   * @param {string} payload.tipoPagamento - 'PRE_PAGO' | 'POS_PAGO'
   * @param {Array} payload.itens - Array de itens [{produtoId, quantidade, observacoes?}]
   * @param {string} [payload.origem] - 'BALCAO' | 'QRCODE' | 'APP'
   * @returns {Promise<Object>} Pedido criado com ID e número
   * 
   * Nota: Backend resolve automaticamente fundoConsumoId via cliente da unidade
   * 
   * @throws {Error} Validação de payload
   * @throws {PedidoConflictError} Já existe pedido ativo para a unidade
   */
  async criar(payload) {
    const response = await api.post('/pedidos', payload, {
      timeout: TIMEOUTS.WRITE
    })
    return response.data
  },

  /**
   * [GET] Buscar pedido por ID
   * 
   * @param {number} id - ID do pedido
   * @param {Object} options - Opções de requisição
   * @param {string} [options.etag] - ETag para validação de cache (304)
   * @returns {Promise<Object>} Pedido completo
   * 
   * @throws {Error} Pedido não encontrado (404)
   */
  async getById(id, options = {}) {
    const headers = {}
    if (options.etag) {
      headers['If-None-Match'] = options.etag
    }

    const response = await api.get(`/pedidos/${id}`, {
      headers,
      timeout: TIMEOUTS.READ
    })
    
    return {
      data: response.data,
      etag: response.headers['etag'],
      versao: response.data.versao
    }
  },

  /**
   * [GET] Buscar pedido por número
   * 
   * @param {string} numero - Número sequencial do pedido (ex: "000123")
   * @returns {Promise<Object>} Pedido completo
   */
  async getByNumero(numero) {
    const response = await api.get(`/pedidos/numero/${numero}`, {
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos por status
   * 
   * @param {string} status - CRIADO | EM_ANDAMENTO | PRONTO | FINALIZADO | CANCELADO
   * @param {Object} params - Parâmetros de query
   * @param {number} [params.page=0] - Página
   * @param {number} [params.size=20] - Itens por página
   * @returns {Promise<Object>} Lista paginada
   */
  async getByStatus(status, params = {}) {
    const response = await api.get(`/pedidos/status/${status}`, {
      params: {
        page: params.page || 0,
        size: params.size || 20
      },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos ativos (CRIADO ou EM_ANDAMENTO)
   * 
   * @returns {Promise<Array>} Lista de pedidos ativos
   */
  async getAtivos() {
    const response = await api.get('/pedidos/ativos', {
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos por unidade de consumo
   * 
   * @param {number} unidadeConsumoId - ID da unidade
   * @returns {Promise<Array>} Lista de pedidos da unidade
   */
  async getByUnidadeConsumo(unidadeConsumoId) {
    const response = await api.get(`/pedidos/unidade/${unidadeConsumoId}`, {
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════════
   * OPERAÇÕES DE ITENS (Subpedidos)
   * ════════════════════════════════════════════════════════════════════════════════
   */

  /**
   * [POST] Adicionar item ao pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {Object} item - Dados do item
   * @param {number} item.produtoId - ID do produto
   * @param {number} item.quantidade - Quantidade
   * @param {string} [item.observacao] - Observações do item
   * @param {Object} options - Opções de concorrência
   * @param {number} [options.versao] - Versão esperada (concorrência otimista)
   * @returns {Promise<Object>} Pedido atualizado
   * 
   * @throws {PedidoConflictError} Versão desatualizada (409)
   */
  async adicionarItem(pedidoId, item, options = {}) {
    const headers = {}
    if (options.versao !== undefined) {
      headers['If-Match'] = `"${options.versao}"`
    }

    try {
      const response = await api.post(`/pedidos/${pedidoId}/itens`, item, {
        headers,
        timeout: TIMEOUTS.WRITE
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito de versão: pedido foi modificado por outro usuário',
          error.response.data?.versaoAtual,
          options.versao,
          error.response.data
        )
      }
      throw error
    }
  },

  /**
   * [PUT] Atualizar quantidade de item
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {number} itemId - ID do item (subpedido)
   * @param {number} quantidade - Nova quantidade
   * @param {Object} options - Opções de concorrência
   * @returns {Promise<Object>} Pedido atualizado
   * 
   * @throws {PedidoConflictError} Conflito de versão
   */
  async atualizarQuantidadeItem(pedidoId, itemId, quantidade, options = {}) {
    const headers = {}
    if (options.versao !== undefined) {
      headers['If-Match'] = `"${options.versao}"`
    }

    try {
      const response = await api.put(
        `/pedidos/${pedidoId}/itens/${itemId}/quantidade`,
        { quantidade },
        { headers, timeout: TIMEOUTS.WRITE }
      )
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito ao atualizar quantidade',
          error.response.data?.versaoAtual,
          options.versao,
          error.response.data
        )
      }
      throw error
    }
  },

  /**
   * [DELETE] Remover item do pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {number} itemId - ID do item
   * @param {Object} options - Opções de concorrência
   * @returns {Promise<Object>} Pedido atualizado
   */
  async removerItem(pedidoId, itemId, options = {}) {
    const headers = {}
    if (options.versao !== undefined) {
      headers['If-Match'] = `"${options.versao}"`
    }

    try {
      const response = await api.delete(`/pedidos/${pedidoId}/itens/${itemId}`, {
        headers,
        timeout: TIMEOUTS.WRITE
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito ao remover item',
          error.response.data?.versaoAtual,
          options.versao,
          error.response.data
        )
      }
      throw error
    }
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════════
   * OPERAÇÕES DE ESTADO
   * ════════════════════════════════════════════════════════════════════════════════
   */

  /**
   * [PUT] Fechar pedido (marcar como FINALIZADO)
   * 
   * CRÍTICO: Operação transacional - envolve:
   * - Validação de saldo (se com fundo)
   * - Debito do fundo
   * - Geração de comprovante
   * - Atualização de status
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {Object} payload - Dados de fechamento
   * @param {string} payload.formaPagamento - 'PRE_PAGO' | 'POS_PAGO' | 'DINHEIRO' | 'CARTAO' | 'PIX'
   * @param {string} [payload.observacao] - Observações
   * @returns {Promise<Object>} Pedido fechado + comprovante
   * 
   * @throws {Error} Saldo insuficiente (400)
   * @throws {PedidoConflictError} Versão desatualizada (409)
   */
  async fechar(pedidoId, payload) {
    try {
      const response = await api.put(`/pedidos/${pedidoId}/fechar`, payload, {
        timeout: TIMEOUTS.CRITICAL
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito ao fechar pedido',
          error.response.data?.versaoAtual,
          null,
          error.response.data
        )
      }
      throw error
    }
  },

  /**
   * [PUT] Cancelar pedido
   * 
   * PERMISSÃO: Apenas GERENTE
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {string} motivo - Motivo obrigatório do cancelamento
   * @returns {Promise<Object>} Pedido cancelado
   */
  async cancelar(pedidoId, motivo) {
    const response = await api.put(
      `/pedidos/${pedidoId}/cancelar`,
      null,
      {
        params: { motivo },
        timeout: TIMEOUTS.WRITE
      }
    )
    return response.data
  },

  /**
   * [PUT] Alterar status do pedido
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {string} novoStatus - Novo status
   * @returns {Promise<Object>} Pedido atualizado
   */
  async alterarStatus(pedidoId, novoStatus) {
    const response = await api.put(`/pedidos/${pedidoId}/status`, {
      status: novoStatus
    }, {
      timeout: TIMEOUTS.WRITE
    })
    return response.data
  },

  /**
   * ════════════════════════════════════════════════════════════════════════════════
   * OPERAÇÕES DE SINCRONIZAÇÃO (preparado para WebSocket)
   * ════════════════════════════════════════════════════════════════════════════════
   */

  /**
   * [GET] Buscar alterações desde uma versão específica
   * 
   * Usado para sincronização incremental após reconexão
   * 
   * @param {number} pedidoId - ID do pedido
   * @param {number} versaoBase - Última versão conhecida
   * @returns {Promise<Object>} Delta de alterações
   */
  async getDelta(pedidoId, versaoBase) {
    const response = await api.get(`/pedidos/${pedidoId}/delta`, {
      params: { versao: versaoBase },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [POST] Ping de keep-alive para operações longas
   * 
   * Evita timeout em operações que mantém lock otimista
   */
  async ping(pedidoId) {
    const response = await api.post(`/pedidos/${pedidoId}/ping`, null, {
      timeout: 2000
    })
    return response.data
  }
}

export default pedidoApi
