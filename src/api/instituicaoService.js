import api from './api'

export const instituicaoService = {
  getInstituicaoAtiva() {
    return api.get('/instituicoes/ativa')
  },
  atualizarInstituicao(id, payload) {
    return api.put(`/instituicoes/${id}`, payload)
  }
}
