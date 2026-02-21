/**
 * Serviço de Produtos
 * Gerencia catálogo de produtos disponíveis
 */

import api from './api'

export const produtosService = {
  /**
   * Listar todos os produtos
   * GET /api/produtos
   */
  async getAll(params = {}) {
    const response = await api.get('/produtos', { params })
    return response.data
  },

  /**
   * Listar apenas produtos disponíveis
   * GET /api/produtos/disponiveis
   */
  async getDisponiveis() {
    const response = await api.get('/produtos/disponiveis')
    return response.data
  },

  /**
   * Buscar produto por ID
   * GET /api/produtos/{id}
   */
  async getById(id) {
    const response = await api.get(`/produtos/${id}`)
    return response.data
  },

  /**
   * Buscar produto por código
   * GET /api/produtos/codigo/{codigo}
   */
  async getByCodigo(codigo) {
    const response = await api.get(`/produtos/codigo/${codigo}`)
    return response.data
  },

  /**
   * Criar produto
   * POST /api/produtos
   */
  async criar(dados) {
    const response = await api.post('/produtos', dados)
    return response.data
  },

  /**
   * Atualizar produto
   * PUT /api/produtos/{id}
   */
  async atualizar(id, dados) {
    const response = await api.put(`/produtos/${id}`, dados)
    return response.data
  },

  /**
   * Atualizar disponibilidade
   * PATCH /api/produtos/{id}/disponibilidade
   */
  async atualizarDisponibilidade(id, disponivel) {
    const response = await api.patch(`/produtos/${id}/disponibilidade`, { disponivel })
    return response.data
  }
}

export default produtosService
