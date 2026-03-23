import api from './api'

const pagamentoService = {
  /**
   * Inicia um pagamento AppyPay para recarga de fundo
   * POST /api/pagamentos/recarregar
   * @param {{ fundoId: number, valor: number, metodo: string, telefone?: string }} dados
   * @returns {Promise<PagamentoGatewayResponse>}
   */
  async recarregarFundo(dados) {
    const response = await api.post('/pagamentos/recarregar', dados)
    return response.data.data || response.data
  },

  /**
   * Consulta status de um pagamento pelo ID
   * GET /api/pagamentos/{id}
   */
  async buscarPorId(id) {
    const response = await api.get(`/pagamentos/${id}`)
    return response.data.data || response.data
  },

  /**
   * Histórico de pagamentos de um fundo
   * GET /api/pagamentos/fundo/{fundoId}
   */
  async listarPorFundo(fundoId) {
    const response = await api.get(`/pagamentos/fundo/${fundoId}`)
    return response.data.data || response.data
  }
}

export default pagamentoService
