/**
 * Serviço de Configuração Financeira
 * 
 * Gerencia configurações financeiras e operacionais do sistema:
 * - Controle de pós-pago
 * - Taxas e impostos
 * - Métodos de pagamento
 * - Limites financeiros
 */

import api from './api'

export const configuracaoFinanceiraService = {
  /**
   * Buscar configuração atual do sistema
   * GET /api/configuracao-financeira
   * 
   * @returns {Object} { posPagoAtivo, atualizadoEm, atualizadoPorNome, atualizadoPorRole }
   */
  async buscarConfiguracao() {
    const response = await api.get('/configuracao-financeira')
    return response
  },

  /**
   * Ativar pós-pago globalmente
   * POST /api/configuracao-financeira/pos-pago/ativar
   * 
   * Apenas ADMIN pode executar
   */
  async ativarPosPago() {
    const response = await api.post('/configuracao-financeira/pos-pago/ativar')
    return response
  },

  /**
   * Desativar pós-pago globalmente
   * POST /api/configuracao-financeira/pos-pago/desativar
   * 
   * Apenas ADMIN pode executar
   * Bloqueia criação de novos pedidos POS_PAGO
   */
  async desativarPosPago() {
    const response = await api.post('/configuracao-financeira/pos-pago/desativar')
    return response
  },

  /**
   * Buscar taxas e impostos configurados
   * GET /api/configuracao-financeira/taxas
   */
  async buscarTaxas() {
    const response = await api.get('/configuracao-financeira/taxas')
    return response.data?.data || response.data
  },

  /**
   * Atualizar taxas e impostos
   * PUT /api/configuracao-financeira/taxas
   * @param {Object} dados - Configurações de taxas
   */
  async atualizarTaxas(dados) {
    const response = await api.put('/configuracao-financeira/taxas', dados)
    return response.data?.data || response.data
  },

  /**
   * Buscar métodos de pagamento habilitados
   * GET /api/configuracao-financeira/metodos-pagamento
   */
  async buscarMetodosPagamento() {
    const response = await api.get('/configuracao-financeira/metodos-pagamento')
    return response.data?.data || response.data
  },

  /**
   * Atualizar métodos de pagamento habilitados
   * PUT /api/configuracao-financeira/metodos-pagamento
   * @param {Object} metodos - { DINHEIRO: true, CARTAO: true, etc }
   */
  async atualizarMetodosPagamento(metodos) {
    const response = await api.put('/configuracao-financeira/metodos-pagamento', metodos)
    return response.data?.data || response.data
  },

  /**
   * Buscar limites financeiros
   * GET /api/configuracao-financeira/limites
   */
  async buscarLimites() {
    const response = await api.get('/configuracao-financeira/limites')
    return response.data?.data || response.data
  },

  /**
   * Atualizar limites financeiros
   * PUT /api/configuracao-financeira/limites
   * @param {Object} limites - { valorMinimoFundo, valorMaximoPedido, etc }
   */
  async atualizarLimites(limites) {
    const response = await api.put('/configuracao-financeira/limites', limites)
    return response.data?.data || response.data
  }
}

export default configuracaoFinanceiraService
