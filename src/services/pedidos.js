/**
 * Serviço de Pedidos
 * Gerencia operações de pedidos conforme INSTRUCOES_FRONTEND_PAGINA_PEDIDOS.txt
 */

import api from './api'

export const pedidosService = {
  /**
   * Criar novo pedido
   * POST /api/pedidos
   */
  async criar(dados) {
    const response = await api.post('/pedidos', dados)
    return response.data
  },

  /**
   * Buscar pedido por ID
   * GET /api/pedidos/{id}
   */
  async getById(id) {
    const response = await api.get(`/pedidos/${id}`)
    return response.data
  },

  /**
   * Buscar pedido por número
   * GET /api/pedidos/numero/{numero}
   */
  async getByNumero(numero) {
    const response = await api.get(`/pedidos/numero/${numero}`)
    return response.data
  },

  /**
   * Listar pedidos por status
   * GET /api/pedidos/status/{status}
   */
  async getByStatus(status) {
    const response = await api.get(`/pedidos/status/${status}`)
    return response.data
  },

  /**
   * Listar pedidos ativos (CRIADO ou EM_ANDAMENTO)
   * GET /api/pedidos/ativos
   */
  async getAtivos() {
    const response = await api.get('/pedidos/ativos')
    return response.data
  },

  /**
   * Cancelar pedido (somente GERENTE)
   * PUT /api/pedidos/{id}/cancelar?motivo={motivo}
   */
  async cancelar(id, motivo) {
    const response = await api.put(`/pedidos/${id}/cancelar`, null, {
      params: { motivo }
    })
    return response.data
  }
}

export default pedidosService
