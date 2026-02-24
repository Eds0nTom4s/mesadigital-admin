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
   * Atualizar status ativo/inativo
   * PATCH /api/produtos/{id}/disponibilidade
   * 
   * NOTA: Endpoint mantém nome "disponibilidade" mas agora altera campo "ativo"
   * conforme RELATORIO_MUDANCAS_API_PRODUTOS.md
   */
  async atualizarStatus(id, ativo) {
    const response = await api.patch(`/produtos/${id}/disponibilidade`, { ativo })
    return response.data
  },

  /**
   * Upload de imagem do produto
   * POST /api/produtos/{id}/imagem
   * 
   * @param {number} id - ID do produto
   * @param {File} file - Arquivo de imagem (JPG, PNG, WebP - máx 5MB)
   * @returns {Promise<string>} URL da imagem no MinIO/S3
   */
  async uploadImagem(id, file) {
    const formData = new FormData()
    formData.append('imagem', file)

    const response = await api.post(`/produtos/${id}/imagem`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    // Response.data contém a URL direta da imagem
    return response.data.data || response.data
  },

  /**
   * Remover imagem do produto
   * DELETE /api/produtos/{id}/imagem
   * 
   * @param {number} id - ID do produto
   */
  async removerImagem(id) {
    const response = await api.delete(`/produtos/${id}/imagem`)
    return response.data
  }
}

export default produtosService
