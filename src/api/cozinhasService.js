import api from './api'

export const cozinhasService = {
  async listar() {
    const response = await api.get('/cozinhas')
    return response.data?.data || response.data
  },

  async listarAtivas() {
    const response = await api.get('/cozinhas/ativas')
    return response.data?.data || response.data
  },

  async criar(dados) {
    const response = await api.post('/cozinhas', dados)
    return response.data?.data || response.data
  },

  async ativar(id) {
    const response = await api.put(`/cozinhas/${id}/ativar`)
    return response.data?.data || response.data
  },

  async desativar(id) {
    const response = await api.put(`/cozinhas/${id}/desativar`)
    return response.data?.data || response.data
  },

  async atualizarImpressora(id, idImpressora) {
    const response = await api.put(`/cozinhas/${id}/impressora`, null, {
      params: { idImpressora }
    })
    return response.data?.data || response.data
  },

  async vincularUnidade(cozinhaId, unidadeAtendimentoId) {
    const response = await api.post(`/cozinhas/${cozinhaId}/vincular/${unidadeAtendimentoId}`)
    return response.data
  },

  async desvincularUnidade(cozinhaId, unidadeAtendimentoId) {
    const response = await api.delete(`/cozinhas/${cozinhaId}/desvincular/${unidadeAtendimentoId}`)
    return response.data
  }
}

export default cozinhasService
