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
 * ENDPOINTS REAIS (PedidoController.java):
 * ─────────────────────────────────────────
 * POST   /pedidos                           → criar pedido (sessaoConsumoId + itens no body)
 * GET    /pedidos/{id}                      → buscar por ID
 * GET    /pedidos/numero/{numero}           → buscar por número
 * GET    /pedidos/hoje                      → pedidos de hoje (paginado) [ADM/ATD]
 * GET    /pedidos/ativos                    → pedidos activos paginados  [ADM/ATD]
 * GET    /pedidos/status/{status}           → filtrar por status paginado [ADM/ATD]
 * GET    /pedidos/sessao/{id}               → por sessão paginado         [ADM/ATD]
 * GET    /pedidos/sessao/{id}/ativos        → activos de uma sessão       [ADM/ATD]
 * GET    /pedidos                           → com filtros e paginação     [ADM/ATD]
 * PUT    /pedidos/{id}/confirmar            → CRIADO → EM_ANDAMENTO       [ATD/GER/ADM]
 * PUT    /pedidos/{id}/cancelar?motivo=     → cancelar                   [GER/ADM]
 * PUT    /pedidos/{id}/confirmar-pagamento  → confirmar pagamento POS_PAGO [GER/ADM]
 * PUT    /pedidos/{id}/fechar               → fechar conta                [ATD/GER/ADM]
 *
 * NOTA: Não existem endpoints granulares de itens (/pedidos/{id}/itens).
 *       Os itens são enviados em bloco na criação do pedido.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import api from './api'

/**
 * Exceção customizada para conflitos de concorrência (HTTP 409)
 */
export class PedidoConflictError extends Error {
  constructor(message, data) {
    super(message)
    this.name = 'PedidoConflictError'
    this.statusCode = 409
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

export const pedidoApi = {
  /**
   * [POST] Criar novo pedido
   *
   * @param {Object} payload
   * @param {number} payload.sessaoConsumoId  - ID da sessão de consumo ativa da mesa (OBRIGATÓRIO)
   * @param {string} payload.tipoPagamento    - 'PRE_PAGO' | 'POS_PAGO'
   * @param {Array}  payload.itens            - [{produtoId, quantidade, observacoes?}]
   * @returns {Promise<Object>} Pedido criado com ID e número
   */
  async criar(payload) {
    try {
      const response = await api.post('/pedidos', payload, { timeout: TIMEOUTS.WRITE })
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito ao criar pedido — sessão já possui pedido activo',
          error.response.data
        )
      }
      throw error
    }
  },

  /**
   * [GET] Buscar pedido por ID
   * @param {number} id
   * @returns {Promise<Object>} ApiResponse<PedidoResponse>
   */
  async getById(id) {
    const response = await api.get(`/pedidos/${id}`, { timeout: TIMEOUTS.READ })
    return response.data
  },

  /**
   * [GET] Buscar pedido por número
   * @param {string} numero - Ex: "000123"
   * @returns {Promise<Object>}
   */
  async getByNumero(numero) {
    const response = await api.get(`/pedidos/numero/${numero}`, { timeout: TIMEOUTS.READ })
    return response.data
  },

  /**
   * [GET] Listar pedidos de hoje (paginado)
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<Object>} ApiResponse<Page<PedidoResponse>>
   */
  async getHoje(params = {}) {
    const response = await api.get('/pedidos/hoje', {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos ativos (CRIADO ou EM_ANDAMENTO) paginado
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<Object>} ApiResponse<Page<PedidoResponse>>
   */
  async getAtivos(params = {}) {
    const response = await api.get('/pedidos/ativos', {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos por status
   * @param {string} status - CRIADO | EM_ANDAMENTO | FINALIZADO | CANCELADO
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<Object>} ApiResponse<Page<PedidoResponse>>
   */
  async getByStatus(status, params = {}) {
    const response = await api.get(`/pedidos/status/${status}`, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos de uma sessão de consumo (paginado)
   * Endpoint: GET /pedidos/sessao/{id}
   *
   * @param {number} sessaoConsumoId - ID da SessaoConsumo
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<Object>} ApiResponse<Page<PedidoResponse>>
   */
  async getBySessaoConsumo(sessaoConsumoId, params = {}) {
    const response = await api.get(`/pedidos/sessao/${sessaoConsumoId}`, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos activos de uma sessão (paginado)
   * Endpoint: GET /pedidos/sessao/{id}/ativos
   *
   * @param {number} sessaoConsumoId
   * @param {{ page?: number, size?: number }} params
   * @returns {Promise<Object>}
   */
  async getAtivosBySessaoConsumo(sessaoConsumoId, params = {}) {
    const response = await api.get(`/pedidos/sessao/${sessaoConsumoId}/ativos`, {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [GET] Listar pedidos com filtros e paginação
   * Endpoint: GET /pedidos?status=&sessaoId=&dataInicio=&dataFim=&page=&size=
   *
   * @param {{ status?, sessaoId?, dataInicio?, dataFim?, page?, size? }} params
   * @returns {Promise<Object>} ApiResponse<Page<PedidoResponse>>
   */
  async listarComFiltros(params = {}) {
    const response = await api.get('/pedidos', {
      params: {
        ...(params.status && { status: params.status }),
        ...(params.sessaoId && { sessaoId: params.sessaoId }),
        ...(params.dataInicio && { dataInicio: params.dataInicio }),
        ...(params.dataFim && { dataFim: params.dataFim }),
        page: params.page ?? 0,
        size: params.size ?? 20
      },
      timeout: TIMEOUTS.READ
    })
    return response.data
  },

  /**
   * [PUT] Confirmar pedido (CRIADO → EM_ANDAMENTO)
   * Envia o pedido para a cozinha.
   * PERMISSÃO: ATENDENTE, GERENTE, ADMIN
   *
   * @param {number} pedidoId
   * @returns {Promise<Object>}
   */
  async confirmar(pedidoId) {
    const response = await api.put(`/pedidos/${pedidoId}/confirmar`, null, {
      timeout: TIMEOUTS.WRITE
    })
    return response.data
  },

  /**
   * [PUT] Cancelar pedido
   * PERMISSÃO: GERENTE, ADMIN
   *
   * @param {number} pedidoId
   * @param {string} motivo - Motivo obrigatório
   * @returns {Promise<Object>}
   */
  async cancelar(pedidoId, motivo) {
    const response = await api.put(`/pedidos/${pedidoId}/cancelar`, null, {
      params: { motivo },
      timeout: TIMEOUTS.WRITE
    })
    return response.data
  },

  /**
   * [PUT] Confirmar pagamento pós-pago
   * Marca pedido POS_PAGO como PAGO. Usar quando cliente paga em dinheiro ou outro meio.
   * PERMISSÃO: GERENTE, ADMIN
   *
   * @param {number} pedidoId
   * @returns {Promise<Object>}
   */
  async confirmarPagamento(pedidoId) {
    const response = await api.put(`/pedidos/${pedidoId}/confirmar-pagamento`, null, {
      timeout: TIMEOUTS.WRITE
    })
    return response.data
  },

  /**
   * [PUT] Fechar conta (checkout)
   * Para POS_PAGO não pago: confirma o pagamento automaticamente.
   * Para PRE_PAGO: o débito já foi efectuado na criação.
   * Sem body — o backend não aceita parâmetros neste endpoint.
   * PERMISSÃO: ATENDENTE, GERENTE, ADMIN
   *
   * @param {number} pedidoId
   * @returns {Promise<Object>}
   */
  async fechar(pedidoId) {
    try {
      const response = await api.put(`/pedidos/${pedidoId}/fechar`, null, {
        timeout: TIMEOUTS.CRITICAL
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 409) {
        throw new PedidoConflictError(
          'Conflito ao fechar pedido',
          error.response.data
        )
      }
      throw error
    }
  }
}

export default pedidoApi
