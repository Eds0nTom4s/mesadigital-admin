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
   * NOTA: GET /api/produtos/disponiveis NÃO existe no backend actual.
   * Usa GET /api/produtos e filtra disponivel=true no cliente.
   */
  async getDisponiveis() {
    const response = await api.get('/produtos')
    const dados = response.data?.data ?? response.data ?? []
    const lista = Array.isArray(dados) ? dados : dados.content ?? []
    return lista.filter(p => p.disponivel && p.ativo)
  },

  /**
   * Filtrar produtos por disponibilidade e cozinha ativa
   * Helper para validação de produtos operacionais
   */
  filtrarProdutosOperacionais(produtos) {
    return produtos.filter(p => {
      // Produto deve estar ativo
      if (!p.ativo) return false
      
      // Produto deve estar disponível
      if (!p.disponivel) return false
      
      // Se tem cozinha associada, deve estar ativa
      if (p.cozinha && !p.cozinha.ativa) return false
      
      return true
    })
  },

  /**
   * Verificar se produto está operacional (ativo + cozinha ativa)
   */
  isProdutoOperacional(produto) {
    if (!produto.ativo || !produto.disponivel) return false
    if (produto.cozinha && !produto.cozinha.ativa) return false
    return true
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
   * PATCH /api/produtos/{id}/disponibilidade?disponivel=true
   *
   * [BACKEND] parâmetro é query param 'disponivel' (boolean), NÃO body JSON
   *
   * @param {number} id - ID do produto
   * @param {boolean} disponivel - true para activar, false para desactivar
   */
  async atualizarStatus(id, disponivel) {
    const response = await api.patch(`/produtos/${id}/disponibilidade`, null, {
      params: { disponivel }
    })
    return response.data
  },

  /**
   * Definir URL de imagem do produto
   * PUT /api/produtos/{id}   body: { urlImagem: "https://..." }
   *
   * [BACKEND] NÃO existe endpoint multipart/form-data para upload de imagem.
   * Solução: fazer upload para hosting externo (Cloudinary, S3, Firebase Storage)
   * e passar a URL resultante via campo 'urlImagem' no PUT /api/produtos/{id}.
   *
   * @param {number} id - ID do produto
   * @param {string} url - URL pública da imagem
   * @returns {Promise<Object>} Produto actualizado
   */
  async setUrlImagem(id, url) {
    const response = await api.put(`/produtos/${id}`, { urlImagem: url })
    return response.data
  },

  /**
   * @deprecated Alias legado — use setUrlImagem(id, url)
   * [BACKEND] NÃO existe POST /api/produtos/{id}/imagem (multipart).
   */
  async uploadImagem(id, fileOrUrl) {
    console.warn(
      '[produtosService] uploadImagem() — multipart NÃO suportado.\n' +
      'Faça upload para hosting externo e chame setUrlImagem(id, url).'
    )
    if (typeof fileOrUrl === 'string') {
      return this.setUrlImagem(id, fileOrUrl)
    }
    throw new Error(
      'Upload de ficheiro directo não suportado. ' +
      'Use hosting externo e passe a URL para setUrlImagem(). ' +
      'Ver RESPOSTAS_BACKEND_PERGUNTAS.txt §6.1.'
    )
  },

  /**
   * @deprecated [BACKEND] NÃO existe DELETE /api/produtos/{id}/imagem.
   * Para remover imagem: chamar setUrlImagem(id, null) ou PUT com urlImagem: null.
   */
  async removerImagem(id) {
    console.warn('[produtosService] removerImagem() — sem endpoint. Usando setUrlImagem(id, null).')
    return this.setUrlImagem(id, null)
  }
}

export default produtosService
