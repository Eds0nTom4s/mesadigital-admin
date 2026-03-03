/**
 * Serviço de Fundo de Consumo
 *
 * Endpoints conforme ALINHAMENTO_FRONTEND_GERAL.txt §8.10
 * Base URL: /api/fundos
 *
 * FundoConsumoResponse:
 *  { id, saldoAtual, ativo, clienteId, tokenPortador, createdAt, updatedAt }
 *
 * Para fluxo identificado: use clienteId nas rotas /fundos/cliente/{clienteId}
 * Para fluxo anónimo:      use tokenPortador nas rotas /fundos/{token}/*
 */

import api from './api'

const fundoConsumoService = {
  /**
   * Criar fundo para cliente identificado
   * POST /api/fundos/cliente/{clienteId}  [GER]
   * Body: { saldoInicial: 0.00 }
   * @returns {Promise<FundoConsumoResponse>}
   */
  async criarFundoParaCliente(clienteId, saldoInicial = 0) {
    const response = await api.post(`/fundos/cliente/${clienteId}`, { saldoInicial })
    return response.data.data
  },

  /**
   * Alias para compatibilidade com FundosView
   * POST /api/fundos/cliente/{clienteId}  [GER]
   */
  async criarFundo({ clienteId, saldoInicial = 0 }) {
    return this.criarFundoParaCliente(clienteId, saldoInicial)
  },

  /**
   * Criar fundo anónimo vinculado ao QR portador de uma SessaoConsumo
   * POST /api/fundos/anonimo/{token}  [ATD]
   * Body: { saldoInicial: 0.00 }
   * @param {string} tokenPortador - QR code da sessão anónima
   * @returns {Promise<FundoConsumoResponse>}
   */
  async criarFundoAnonimo(tokenPortador, saldoInicial = 0) {
    const response = await api.post(`/fundos/anonimo/${tokenPortador}`, { saldoInicial })
    return response.data.data
  },

  /**
   * Consultar fundo pelo token portador
   * GET /api/fundos/{token}  [ATD]
   * @returns {Promise<FundoConsumoResponse>}
   */
  async consultarFundo(token) {
    const response = await api.get(`/fundos/${token}`)
    return response.data.data
  },

  /**
   * Consultar apenas o saldo do fundo
   * GET /api/fundos/{token}/saldo  [ATD]
   * @returns {Promise<number>}
   */
  async consultarSaldo(token) {
    const response = await api.get(`/fundos/${token}/saldo`)
    return response.data.data
  },

  /**
   * Buscar fundo do cliente identificado
   * GET /api/fundos/cliente/{clienteId}  [GER]
   * @returns {Promise<FundoConsumoResponse>}
   */
  async buscarFundoPorCliente(clienteId) {
    const response = await api.get(`/fundos/cliente/${clienteId}`)
    return response.data.data
  },

  /**
   * Recarregar fundo (recarga directa em balcão pelo GERENTE)
   * POST /api/fundos/{token}/recarregar  [GER]
   * Body: { valor: 5000.00, observacoes: "Recarga balcão" }
   *
   * NOTA: para recarga via AppyPay, usar POST /pagamentos/recarregar
   * @param {string} token - tokenPortador do fundo
   * @param {number} valor - Valor em AOA (ex: 5000.00)
   * @param {string} observacoes - Nota descritiva sobre a recarga
   * @returns {Promise<TransacaoFundoResponse>}
   */
  async recarregarFundo(token, valor, observacoes = 'Recarga balcão') {
    const response = await api.post(`/fundos/${token}/recarregar`, { valor, observacoes })
    return response.data.data
  },

  /**
   * Consultar histórico de transações do fundo (paginado)
   * GET /api/fundos/{token}/historico  [GER]
   * @param {string} token - Token portador do fundo
   * @param {Object} params - Parâmetros de paginação (page, size)
   * @returns {Promise<Page<TransacaoFundoResponse>>}
   */
  async buscarHistorico(token, params = {}) {
    const response = await api.get(`/fundos/${token}/historico`, { params })
    return response.data.data
  },

  /**
   * Encerrar fundo
   * DELETE /api/fundos/{token}  [ADM]
   */
  async encerrarFundo(token) {
    const response = await api.delete(`/fundos/${token}`)
    return response.data
  }
}

export default fundoConsumoService
