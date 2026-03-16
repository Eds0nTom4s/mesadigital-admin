/**
 * Serviço de Mesas
 *
 * Novo modelo (ALINHAMENTO_FRONTEND_MODELO_MESAS_2026_03_02.txt):
 *  - Mesa = recurso físico permanente (pré-cadastrada pelo ADMIN)
 *  - Mesa NÃO tem status persistido; "DISPONIVEL" | "OCUPADA" é DERIVADO em runtime
 *  - Ciclo de vida da sessão gerenciado por sessoesConsumoService
 *
 * Base URL: /api/mesas
 */

import api from './api'

const mesasService = {
  // ── Consultas ─────────────────────────────────────────────────────────────

  /**
   * Listar todas as mesas
   * GET /api/mesas
   */
  async getTodas() {
    const response = await api.get('/mesas')
    return response.data
  },

  /**
   * Listar mesas ativas (ativa = true)
   * GET /api/mesas/ativas
   */
  async getAtivas() {
    const response = await api.get('/mesas/ativas')
    return response.data
  },

  /**
   * Listar mesas DISPONÍVEIS (sem sessão ABERTA)
   * GET /api/mesas/disponiveis
   */
  async getDisponiveis() {
    const response = await api.get('/mesas/disponiveis')
    return response.data
  },

  /**
   * Listar mesas OCUPADAS (com sessão ABERTA)
   * GET /api/mesas/ocupadas
   * Cada item inclui sessaoAtivaId.
   */
  async getOcupadas() {
    const response = await api.get('/mesas/ocupadas')
    return response.data
  },

  /**
   * Listar mesas de uma Unidade de Atendimento
   * GET /api/mesas/unidade-atendimento/{id}
   */
  async getPorUnidadeAtendimento(unidadeAtendimentoId) {
    const response = await api.get(`/mesas/unidade-atendimento/${unidadeAtendimentoId}`)
    return response.data
  },

  /**
   * Detalhe de uma mesa (inclui sessaoAtivaId se OCUPADA)
   * GET /api/mesas/{id}
   */
  async getById(id) {
    const response = await api.get(`/mesas/${id}`)
    return response.data
  },

  /**
   * Buscar mesa pelo valor do QR Code impresso na mesa física
   * GET /api/mesas/qrcode/{qrCode}
   * Retorna: mesaId, status, sessaoAtivaId
   */
  async getPorQrCode(qrCode) {
    const response = await api.get(`/mesas/qrcode/${qrCode}`)
    return response.data
  },

  // ── Gestão (ADMIN) ─────────────────────────────────────────────────────────

  /**
   * Criar nova mesa (ADMIN)
   * POST /api/mesas
   *
   * @param {Object} dados
   * @param {string} dados.referencia        - Ex: "Mesa 7"      (OBRIGATÓRIO)
   * @param {string} dados.tipo              - TipoUnidadeConsumo (OBRIGATÓRIO)
   * @param {number} dados.unidadeAtendimentoId                   (OBRIGATÓRIO)
   * @param {number} [dados.numero]          - Número da mesa
   * @param {string} [dados.qrCode]          - Gerado auto se omitido
   * @param {number} [dados.capacidade]      - Nº de lugares
   */
  async criar(dados) {
    const response = await api.post('/mesas', dados)
    return response.data
  },

  /**
   * Reativar mesa desativada (ADMIN)
   * PUT /api/mesas/{id}/ativar
   */
  async ativar(id) {
    const response = await api.put(`/mesas/${id}/ativar`)
    return response.data
  },

  /**
   * Desativar mesa (ADMIN) — bloqueia se mesa estiver OCUPADA
   * PUT /api/mesas/{id}/desativar
   */
  async desativar(id) {
    const response = await api.put(`/mesas/${id}/desativar`)
    return response.data
  }
}

export default mesasService
