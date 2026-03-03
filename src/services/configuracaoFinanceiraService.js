/**
 * Serviço de Configuração Financeira
 *
 * Contratos baseados em ALINHAMENTO_FRONTEND.txt (01/03/2026).
 * Fonte única da verdade: documento de alinhamento oficial.
 *
 * Endpoints base: /api/configuracoes-financeiras
 * Autenticação: Bearer JWT
 */

import api from './api'

export const configuracaoFinanceiraService = {
  /**
   * Buscar configuração completa do sistema
   * GET /api/configuracoes-financeiras
   * Roles: ADMIN
   *
   * Resposta inclui os novos campos:
   *   - valorMinimoOperacao
   *   - motivoUltimaAlteracao
   *   - atualizadoPorNome / atualizadoPorRole / updatedAt
   */
  async buscarConfiguracao() {
    const response = await api.get('/configuracoes-financeiras')
    return response.data
  },

  /**
   * Buscar status rápido do pós-pago (sem carregar configuração completa)
   * GET /api/configuracoes-financeiras/pos-pago/status
   * Roles: ATENDENTE, GERENTE, ADMIN
   *
   * Usar este endpoint no formulário de criação de pedido.
   * Retorna: { success: true, data: true|false }
   */
  async buscarStatusPosPago() {
    const response = await api.get('/configuracoes-financeiras/pos-pago/status')
    // data.data é boolean true|false
    return response.data?.data ?? false
  },

  /**
   * Ativar pós-pago globalmente
   * PUT /api/configuracoes-financeiras/pos-pago/ativar
   * Roles: ADMIN
   *
   * @param {string} [motivo] - Razão da ativação (recomendado, aceito pelo backend)
   */
  async ativarPosPago(motivo = null) {
    const params = {}
    if (motivo?.trim()) params.motivo = motivo.trim()
    const response = await api.put('/configuracoes-financeiras/pos-pago/ativar', null, { params })
    return response.data
  },

  /**
   * Desativar pós-pago globalmente
   * PUT /api/configuracoes-financeiras/pos-pago/desativar
   * Roles: ADMIN
   *
   * @param {string} [motivo] - Razão da desativação (recomendado, aceito pelo backend)
   */
  async desativarPosPago(motivo = null) {
    const params = {}
    if (motivo?.trim()) params.motivo = motivo.trim()
    const response = await api.put('/configuracoes-financeiras/pos-pago/desativar', null, { params })
    return response.data
  },

  /**
   * Alterar limite de pós-pago por unidade
   * PUT /api/configuracoes-financeiras/pos-pago/limite
   * Roles: ADMIN
   *
   * Mínimo aceito pelo backend: 100,00 AOA
   *
   * @param {number} novoLimite - Novo limite em AOA (mínimo 100)
   * @param {string} [motivo]   - Razão da alteração (recomendado)
   */
  async alterarLimitePosPago(novoLimite, motivo = null) {
    const params = { novoLimite }
    if (motivo?.trim()) params.motivo = motivo.trim()
    const response = await api.put('/configuracoes-financeiras/pos-pago/limite', null, { params })
    return response.data
  },

  /**
   * Alterar valor mínimo de operação (recarga, débito, estorno)
   * PUT /api/configuracoes-financeiras/valor-minimo
   * Roles: ADMIN
   *
   * @param {number} novoValor - Novo valor mínimo em AOA
   * @param {string} [motivo]  - Razão da alteração (recomendado)
   */
  async alterarValorMinimo(novoValor, motivo = null) {
    const params = { novoValor }
    if (motivo?.trim()) params.motivo = motivo.trim()
    const response = await api.put('/configuracoes-financeiras/valor-minimo', null, { params })
    return response.data
  }
}

export default configuracaoFinanceiraService
