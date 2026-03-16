/**
 * Serviço de Fundo de Consumo
 *
 * Base URL: /api/fundos
 *
 * O Fundo de Consumo é identificado pelo qrCodeSessao (UUID gerado na SessaoConsumo).
 * O token abaixo referido é sempre o qrCodeSessao da sessão, NÃO um clienteId.
 *
 * FundoConsumoResponse:
 *  { id, saldoAtual, ativo, sessaoId, qrCodeSessao, createdAt, updatedAt }
 */

import api from './api'

const fundoConsumoService = {
  /**
   * Listar todos os fundos (Admin/Gerente) — paginado
   * GET /api/fundos?page=0&size=20  [GER/ADM]
   * @param {number} [page=0]
   * @param {number} [size=20]
   * @returns {Promise<Page<FundoConsumoResponse>>}
   */
  async listarTodos(page = 0, size = 20) {
    const response = await api.get('/fundos', { params: { page, size } })
    return response.data.data || response.data
  },

  /**
   * Consultar fundo pelo qrCodeSessao (token do QR Code da sessão)
   * GET /api/fundos/{token}  [ATD/GER/ADM]
   * @param {string} token - qrCodeSessao da SessaoConsumo
   * @returns {Promise<FundoConsumoResponse>}
   */
  async consultarFundo(token) {
    const response = await api.get(`/fundos/${token}`)
    return response.data.data || response.data
  },

  /**
   * Consultar apenas o saldo disponível (resposta rápida)
   * GET /api/fundos/{token}/saldo  [ATD/GER/ADM]
   * @param {string} token - qrCodeSessao
   * @returns {Promise<number>} Saldo em AOA
   */
  async consultarSaldo(token) {
    const response = await api.get(`/fundos/${token}/saldo`)
    return response.data.data ?? response.data
  },

  /**
   * Recarregar fundo (crédito directo em balcão)
   * POST /api/fundos/{token}/recarregar  [GER/ADM]
   * Body: { valor: 5000.00, observacoes: "Recarga balcão" }
   * @param {string} token - qrCodeSessao do fundo
   * @param {number} valor - Valor em AOA
   * @param {string} [observacoes] - Nota descritiva
   * @returns {Promise<TransacaoFundoResponse>}
   */
  async recarregarFundo(token, valor, observacoes = 'Recarga balcão') {
    const response = await api.post(`/fundos/${token}/recarregar`, { valor, observacoes })
    return response.data.data || response.data
  },

  /**
   * Histórico de transações do fundo (paginado, mais recente primeiro)
   * GET /api/fundos/{token}/historico?page=0&size=20  [GER/ADM]
   * @param {string} token - qrCodeSessao do fundo
   * @param {{ page?: number, size?: number }} [params] - Parâmetros de paginação
   * @returns {Promise<Page<TransacaoFundoResponse>>}
   */
  async buscarHistorico(token, params = {}) {
    const response = await api.get(`/fundos/${token}/historico`, { params })
    return response.data.data || response.data
  },

  /**
   * Buscar fundo associado a uma sessão de consumo (lookup administrativo)
   * GET /api/fundos/sessao/{sessaoId}  [GER/ADM]
   * Retorna o qrCodeSessao que identifica o fundo operacionalmente.
   * @param {number} sessaoId - ID da SessaoConsumo
   * @returns {Promise<FundoConsumoResponse>}
   */
  async buscarPorSessao(sessaoId) {
    const response = await api.get(`/fundos/sessao/${sessaoId}`)
    return response.data.data || response.data
  },

  /**
   * Encerrar fundo permanentemente (desactiva; não aceita mais débitos/recargas)
   * DELETE /api/fundos/{token}  [ADM]
   * @param {string} token - qrCodeSessao do fundo
   */
  async encerrarFundo(token) {
    const response = await api.delete(`/fundos/${token}`)
    return response.data
  }
}

export default fundoConsumoService
