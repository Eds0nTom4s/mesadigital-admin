import api from './api'

/**
 * Serviço de Auditoria
 *
 * Endpoints conforme ALINHAMENTO_FRONTEND_GERAL.txt §8.14
 * Todos os endpoints requerem GERENTE ou ADMIN.
 *
 * GET /auditoria/acoes        — listagem paginada de eventos
 * GET /auditoria/estatisticas — agregações
 * GET /auditoria/modulos      — módulos disponíveis para filtro
 *
 * NOTA: Exportação CSV/PDF e busca por entidade NÃO possuem
 *       endpoint no backend actual. Lançam erro descritivo.
 */

const auditoriaService = {
  /**
   * Lista eventos de auditoria com filtros
   * GET /api/auditoria/acoes  [GER]
   * Params: page (0-based), size, dataInicio, dataFim, usuario, modulo
   * Resp: ApiResponse<List<ConfiguracaoFinanceiraEventLog>>
   *
   * @param {Object} params
   * @param {number} [params.pagina]        — 1-based (convertido para 0-based internamente)
   * @param {number} [params.tamanhoPagina]
   * @param {string} [params.dataInicio]    — ISO date string
   * @param {string} [params.dataFim]       — ISO date string
   * @param {string} [params.usuario]       — nome/login do usuário
   * @param {string} [params.modulo]        — módulo a filtrar
   * @returns {Promise<Array>} Lista de logs
   */
  async listar(params = {}) {
    const queryParams = { ...params }

    // Converter paginação 1-based → 0-based
    if (queryParams.pagina) {
      queryParams.page = queryParams.pagina - 1
      delete queryParams.pagina
    }
    if (queryParams.tamanhoPagina) {
      queryParams.size = queryParams.tamanhoPagina
      delete queryParams.tamanhoPagina
    }

    const response = await api.get('/auditoria/acoes', { params: queryParams })
    return response.data?.data || []
  },

  /**
   * Obter estatísticas de auditoria
   * GET /api/auditoria/estatisticas  [GER]
   * Resp: ApiResponse<Map<String,Object>>
   * @returns {Promise<Object>}
   */
  async obterEstatisticas() {
    const response = await api.get('/auditoria/estatisticas')
    return response.data?.data || {}
  },

  /**
   * Listar módulos disponíveis para filtro
   * GET /api/auditoria/modulos  [GER]
   * @returns {Promise<Object>}
   */
  async listarModulos() {
    const response = await api.get('/auditoria/modulos')
    return response.data?.data || {}
  },

  /**
   * Listar tipos de acção disponíveis para filtro
   * NOTA: Sem endpoint dedicado no backend — retorna constantes conhecidas do sistema.
   * @returns {string[]}
   */
  listarAcoes() {
    return [
      'LOGIN', 'LOGOUT',
      'CRIAR', 'EDITAR', 'EXCLUIR',
      'ATIVAR', 'DESATIVAR',
      'PAGAMENTO', 'ESTORNO', 'CANCELAMENTO'
    ]
  },

  /**
   * Exportar logs para CSV
   * NOTA: Endpoint não disponível no backend actual.
   */
  async exportarCSV(_params = {}) {
    throw new Error('Exportação CSV não disponível. O backend não implementa este endpoint.')
  },

  /**
   * Exportar logs para PDF
   * NOTA: Endpoint não disponível no backend actual.
   */
  async exportarPDF(_params = {}) {
    throw new Error('Exportação PDF não disponível. O backend não implementa este endpoint.')
  }
}

export default auditoriaService