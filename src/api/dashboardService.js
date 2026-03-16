/**
 * Dashboard Service
 * Integração com endpoints de estatísticas e métricas do sistema
 *
 * Todos os endpoints requerem autenticação JWT [ATD] conforme ALINHAMENTO_FRONTEND_GERAL.txt §8.13
 * [BACKEND] GET /api/dashboard/stats retorna 4 campos:
 *   totalPedidosHoje, pedidosPendentes, receitaHoje, clientesAtivos
 */

import api from './api'

/**
 * Obtém estatísticas gerais do dashboard
 * GET /api/dashboard/stats  [ATD]
 * Resp: ApiResponse<DashboardStatsResponse>
 *   { totalPedidosHoje, pedidosPendentes, receitaHoje, clientesAtivos }
 * @returns {Promise<Object>} Estatísticas do sistema
 */
export const obterEstatisticas = async () => {
  const response = await api.get('/dashboard/stats')
  return response.data.data || {}
}

/**
 * Obtém atividades recentes (últimos pedidos)
 * GET /api/dashboard/activity  [ATD]
 * Resp: ApiResponse<List<DashboardActivityResponse>>
 * @param {number} [limit=10] - Quantidade de registros
 * @returns {Promise<Array>} Lista de atividades recentes
 */
export const obterAtividadesRecentes = async (limit = 10) => {
  const response = await api.get('/dashboard/activity', { params: { limit } })
  return response.data.data || []
}

/**
 * Obtém top produtos mais vendidos
 * GET /api/dashboard/top-products  [GER]
 * Resp: ApiResponse<List<DashboardTopProductResponse>>
 *   { produtoId, nome, quantidadeVendida, valorTotal, categoria }
 * @param {number} [limit=5] - Quantidade de produtos
 * @returns {Promise<Array>} Lista de produtos mais vendidos
 */
export const obterProdutosMaisVendidos = async (limit = 5) => {
  const response = await api.get('/dashboard/top-products', { params: { limit } })
  return response.data.data || []
}

export default {
  obterEstatisticas,
  obterAtividadesRecentes,
  obterProdutosMaisVendidos
}
