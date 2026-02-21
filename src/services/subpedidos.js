/**
 * Serviço de SubPedidos
 * Gerencia operações de subpedidos conforme INSTRUCOES_FRONTEND_PAGINA_PEDIDOS.txt
 */

import api from './api'

export const subpedidosService = {
  /**
   * Buscar subpedido por ID
   * GET /api/subpedidos/{id}
   */
  async getById(id) {
    const response = await api.get(`/subpedidos/${id}`)
    return response.data
  },

  /**
   * Buscar subpedidos de um pedido
   * GET /api/subpedidos/pedido/{pedidoId}
   */
  async getByPedido(pedidoId) {
    const response = await api.get(`/subpedidos/pedido/${pedidoId}`)
    return response.data
  },

  /**
   * Buscar subpedidos ativos de uma cozinha
   * GET /api/subpedidos/cozinha/{cozinhaId}/ativos
   */
  async getAtivosByCozinha(cozinhaId) {
    const response = await api.get(`/subpedidos/cozinha/${cozinhaId}/ativos`)
    return response.data
  },

  /**
   * Cozinha assume subpedido (PENDENTE → EM_PREPARACAO)
   * PUT /api/subpedidos/{id}/assumir
   */
  async assumir(id) {
    const response = await api.put(`/subpedidos/${id}/assumir`)
    return response.data
  },

  /**
   * Cozinha marca como pronto (EM_PREPARACAO → PRONTO)
   * PUT /api/subpedidos/{id}/marcar-pronto
   */
  async marcarPronto(id) {
    const response = await api.put(`/subpedidos/${id}/marcar-pronto`)
    return response.data
  },

  /**
   * Atendente marca como entregue (PRONTO → ENTREGUE)
   * PUT /api/subpedidos/{id}/marcar-entregue
   */
  async marcarEntregue(id) {
    const response = await api.put(`/subpedidos/${id}/marcar-entregue`)
    return response.data
  },

  /**
   * Cancelar subpedido (somente GERENTE)
   * PUT /api/subpedidos/{id}/cancelar?motivo={motivo}
   */
  async cancelar(id, motivo) {
    const response = await api.put(`/subpedidos/${id}/cancelar`, null, {
      params: { motivo }
    })
    return response.data
  },

  /**
   * Buscar subpedidos com atraso
   * GET /api/subpedidos/atrasados?minutosAtraso={minutos}
   */
  async getAtrasados(minutosAtraso = 30) {
    const response = await api.get('/subpedidos/atrasados', {
      params: { minutosAtraso }
    })
    return response.data
  }
}

export default subpedidosService
