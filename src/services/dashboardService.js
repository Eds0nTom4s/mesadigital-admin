/**
 * Dashboard Service
 * Integração com endpoints de estatísticas e métricas do sistema
 * 
 * Todos os endpoints requerem autenticação JWT
 * @see INTEGRACAO_DASHBOARD_FRONTEND.txt
 */

import api from './api'

/**
 * Obtém estatísticas gerais do dashboard
 * @returns {Promise<Object>} Estatísticas do sistema
 */
export const obterEstatisticas = async () => {
  const response = await api.get('/dashboard/stats')
  return response.data.data
}

/**
 * Obtém últimos 10 pedidos (atividades recentes)
 * @returns {Promise<Array>} Lista de pedidos recentes
 */
export const obterAtividadesRecentes = async () => {
  const response = await api.get('/dashboard/activity')
  return response.data.data
}

/**
 * Obtém top 10 produtos mais vendidos do mês
 * @returns {Promise<Array>} Lista de produtos mais vendidos
 */
export const obterProdutosMaisVendidos = async () => {
  const response = await api.get('/dashboard/top-products')
  return response.data.data
}

export default {
  obterEstatisticas,
  obterAtividadesRecentes,
  obterProdutosMaisVendidos
}
