/**
 * Serviço de Sessões de Consumo
 *
 * Novo modelo (ALINHAMENTO_FRONTEND_MODELO_MESAS_2026_03_02.txt):
 *  - SessaoConsumo = evento temporal que "ocupa" uma Mesa
 *  - Status:  ABERTA | AGUARDANDO_PAGAMENTO | ENCERRADA
 *  - Quando ENCERRADA, a mesa volta automaticamente para DISPONIVEL
 *
 * Base URL: /api/sessoes-consumo
 */

import api from './api'

const sessoesConsumoService = {
  // ── Consultas ─────────────────────────────────────────────────────────────

  /**
   * Listar todas as sessões abertas
   * GET /api/sessoes-consumo/abertas
   */
  async getAbertas() {
    const response = await api.get('/sessoes-consumo/abertas')
    return response.data
  },

  /**
   * Detalhe de uma sessão
   * GET /api/sessoes-consumo/{id}
   */
  async getById(id) {
    const response = await api.get(`/sessoes-consumo/${id}`)
    return response.data
  },

  /**
   * Buscar sessão ATIVA de uma mesa
   * GET /api/sessoes-consumo/mesa/{mesaId}/ativa
   *
   * Retorna 404 se a mesa estiver DISPONÍVEL — trate como "sem sessão", não como erro.
   *
   * @param {number} mesaId
   * @returns {Promise<Object|null>} sessão ativa ou null
   */
  async getSessaoAtivaMesa(mesaId) {
    try {
      const response = await api.get(`/sessoes-consumo/mesa/${mesaId}/ativa`)
      return response.data
    } catch (err) {
      if (err.response?.status === 404) {
        return null  // mesa disponível — comportamento esperado
      }
      throw err
    }
  },

  /**
   * Histórico de sessões de uma mesa
   * GET /api/sessoes-consumo/mesa/{mesaId}/historico
   */
  async getHistoricoMesa(mesaId) {
    const response = await api.get(`/sessoes-consumo/mesa/${mesaId}/historico`)
    return response.data
  },

  // ── Ciclo de Vida ─────────────────────────────────────────────────────────

  /**
   * Abrir nova sessão de consumo para uma mesa
   * POST /api/sessoes-consumo
   *
   * Erros possíveis:
   *  - 409: mesa já possui sessão ABERTA
   *  - 409: cliente já possui sessão aberta em outra mesa
   *  - 422: mesa está inativa (ativa = false)
   *
   * @param {Object} dados
   * @param {number}  dados.mesaId                   (OBRIGATÓRIO)
   * @param {string}  [dados.telefoneCliente]         — vincula a um cliente cadastrado
   * @param {boolean} [dados.modoAnonimo=false]       — sessão sem cliente
   * @param {number}  [dados.atendenteId]             — atendente que abriu a sessão
   */
  async abrir(dados) {
    const payload = {
      modoAnonimo: false,
      ...dados
    }
    const response = await api.post('/sessoes-consumo', payload)
    return response.data
  },

  /**
   * Encerrar sessão (mesa volta a DISPONIVEL automaticamente)
   * PUT /api/sessoes-consumo/{id}/fechar
   */
  async fechar(id) {
    const response = await api.put(`/sessoes-consumo/${id}/fechar`)
    return response.data
  },

  /**
   * Mover sessão para AGUARDANDO_PAGAMENTO
   * PUT /api/sessoes-consumo/{id}/aguardar-pagamento
   */
  async aguardarPagamento(id) {
    const response = await api.put(`/sessoes-consumo/${id}/aguardar-pagamento`)
    return response.data
  }
}

export default sessoesConsumoService
