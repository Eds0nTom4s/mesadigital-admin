/**
 * Serviço de Configuração Financeira
 * Conforme CONTROLE_POS_PAGO.md
 * 
 * Gerencia interruptor global de pós-pago
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
  }
}

export default configuracaoFinanceiraService
