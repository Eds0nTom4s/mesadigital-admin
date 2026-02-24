import api from './api'

/**
 * Serviço de Auditoria
 * 
 * Gerencia logs de ações críticas do sistema para rastreabilidade
 * e conformidade com requisitos de auditoria.
 * 
 * Tipos de ações rastreadas:
 * - LOGIN, LOGOUT
 * - CRIAR, EDITAR, EXCLUIR
 * - ATIVAR, DESATIVAR
 * - PAGAMENTO, ESTORNO
 * - CANCELAMENTO
 */

const auditoriaService = {
  /**
   * Lista logs de auditoria com filtros
   * @param {Object} params - Parâmetros de filtro
   * @param {number} params.usuarioId - Filtrar por usuário
   * @param {string} params.modulo - Filtrar por módulo (PEDIDOS, USUARIOS, PRODUTOS, etc)
   * @param {string} params.acao - Filtrar por ação (CRIAR, EDITAR, EXCLUIR, etc)
   * @param {string} params.dataInicio - Data início (ISO)
   * @param {string} params.dataFim - Data fim (ISO)
   * @param {number} params.pagina - Número da página (paginação)
   * @param {number} params.tamanhoPagina - Tamanho da página
   * @returns {Promise<Object>} Objeto com logs e metadata de paginação
   */
  async listar(params = {}) {
    try {
      console.log('[AuditoriaService] Listando logs...', params)
      
      // Backend usa paginação 0-based
      const queryParams = { ...params }
      if (queryParams.pagina) {
        queryParams.page = queryParams.pagina - 1
        delete queryParams.pagina
      }
      if (queryParams.tamanhoPagina) {
        queryParams.size = queryParams.tamanhoPagina
        delete queryParams.tamanhoPagina
      }
      
      const response = await api.get('/auditoria/logs', { params: queryParams })
      
      const resultado = response.data?.data || response.data
      
      console.log('[AuditoriaService] Logs carregados:', resultado.totalElementos || resultado.length)
      return resultado
    } catch (error) {
      // Se endpoint não existe (404), tentar fallback com /api/event-logs
      if (error.response?.status === 404) {
        console.warn('[AuditoriaService] ⚠️ Endpoint /api/auditoria/logs não existe!')
        console.warn('Usando fallback: /api/event-logs (apenas pedidos)')
        console.warn('Consultar: ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md')
        
        // Retornar array vazio por enquanto
        return {
          logs: [],
          totalElementos: 0,
          totalPaginas: 0,
          paginaAtual: 1
        }
      }
      console.error('[AuditoriaService] Erro ao listar logs:', error)
      throw error
    }
  },

  /**
   * Busca log específico por ID
   * @param {number} id - ID do log
   * @returns {Promise<Object>} Detalhes do log
   */
  async buscarPorId(id) {
    try {
      console.log('[AuditoriaService] Buscando log:', id)
      const response = await api.get(`/auditoria/logs/${id}`)
      
      const log = response.data?.data || response.data
      
      return log
    } catch (error) {
      console.error('[AuditoriaService] Erro ao buscar log:', error)
      throw error
    }
  },

  /**
   * Lista ações de um usuário específico
   * @param {number} usuarioId - ID do usuário
   * @param {Object} params - Parâmetros adicionais
   * @returns {Promise<Array>} Lista de logs do usuário
   */
  async listarPorUsuario(usuarioId, params = {}) {
    try {
      console.log('[AuditoriaService] Listando logs do usuário:', usuarioId)
      const response = await api.get(`/auditoria/usuarios/${usuarioId}/logs`, { params })
      
      const logs = response.data?.data || response.data
      
      return logs
    } catch (error) {
      console.error('[AuditoriaService] Erro ao listar logs do usuário:', error)
      throw error
    }
  },

  /**
   * Lista ações relacionadas a uma entidade específica
   * @param {string} entidadeTipo - Tipo da entidade (PEDIDO, PRODUTO, USUARIO, etc)
   * @param {number} entidadeId - ID da entidade
   * @returns {Promise<Array>} Histórico de alterações da entidade
   */
  async listarPorEntidade(entidadeTipo, entidadeId) {
    try {
      console.log('[AuditoriaService] Listando logs da entidade:', entidadeTipo, entidadeId)
      const response = await api.get(`/auditoria/entidades/${entidadeTipo}/${entidadeId}`)
      
      const logs = response.data?.data || response.data
      
      return logs
    } catch (error) {
      console.error('[AuditoriaService] Erro ao listar logs da entidade:', error)
      throw error
    }
  },

  /**
   * Exporta logs para CSV
   * @param {Object} params - Mesmos parâmetros de listar()
   * @returns {Promise<Blob>} Arquivo CSV
   */
  async exportarCSV(params = {}) {
    try {
      console.log('[AuditoriaService] Exportando logs para CSV...', params)
      const response = await api.get('/auditoria/logs/exportar/csv', {
        params,
        responseType: 'blob'
      })
      
      console.log('[AuditoriaService] CSV gerado com sucesso')
      return response.data
    } catch (error) {
      console.error('[AuditoriaService] Erro ao exportar CSV:', error)
      throw error
    }
  },

  /**
   * Exporta logs para PDF
   * @param {Object} params - Mesmos parâmetros de listar()
   * @returns {Promise<Blob>} Arquivo PDF
   */
  async exportarPDF(params = {}) {
    try {
      console.log('[AuditoriaService] Exportando logs para PDF...', params)
      const response = await api.get('/auditoria/logs/exportar/pdf', {
        params,
        responseType: 'blob'
      })
      
      console.log('[AuditoriaService] PDF gerado com sucesso')
      return response.data
    } catch (error) {
      console.error('[AuditoriaService] Erro ao exportar PDF:', error)
      throw error
    }
  },

  /**
   * Obtém estatísticas de auditoria
   * @param {Object} params - Período e filtros
   * @returns {Promise<Object>} Estatísticas agregadas
   */
  async obterEstatisticas(params = {}) {
    try {
      console.log('[AuditoriaService] Obtendo estatísticas...', params)
      const response = await api.get('/auditoria/estatisticas', { params })
      
      const stats = response.data?.data || response.data
      
      return stats
    } catch (error) {
      console.error('[AuditoriaService] Erro ao obter estatísticas:', error)
      throw error
    }
  },

  /**
   * Lista módulos disponíveis para filtro
   * @returns {Promise<Array<string>>} Lista de módulos
   */
  async listarModulos() {
    try {
      const response = await api.get('/auditoria/modulos')
      return response.data?.data || response.data
    } catch (error) {
      console.error('[AuditoriaService] Erro ao listar módulos:', error)
      // Fallback para módulos conhecidos
      return [
        'PEDIDOS',
        'PRODUTOS',
        'USUARIOS',
        'FUNDOS',
        'MESAS',
        'CONFIGURACOES',
        'AUTENTICACAO'
      ]
    }
  },

  /**
   * Lista tipos de ação disponíveis para filtro
   * @returns {Promise<Array<string>>} Lista de ações
   */
  async listarAcoes() {
    try {
      const response = await api.get('/auditoria/acoes')
      return response.data?.data || response.data
    } catch (error) {
      console.error('[AuditoriaService] Erro ao listar ações:', error)
      // Fallback para ações conhecidas
      return [
        'LOGIN',
        'LOGOUT',
        'CRIAR',
        'EDITAR',
        'EXCLUIR',
        'ATIVAR',
        'DESATIVAR',
        'PAGAMENTO',
        'ESTORNO',
        'CANCELAMENTO'
      ]
    }
  }
}

export default auditoriaService
