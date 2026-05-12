import api from './api'

export const unidadesAtendimentoService = {
  async listar() {
    const response = await api.get('/unidades-atendimento')
    return response.data?.data || response.data
  },

  async listarAtivas() {
    const response = await api.get('/unidades-atendimento/ativas')
    return response.data?.data || response.data
  },
  
  async buscarPorId(id) {
    const response = await api.get(`/unidades-atendimento/${id}`)
    return response.data?.data || response.data
  },

  async criar(dados) {
    const response = await api.post('/unidades-atendimento', dados)
    return response.data?.data || response.data
  },

  async ativar(id) {
    const response = await api.put(`/unidades-atendimento/${id}/ativar`)
    return response.data?.data || response.data
  },

  async desativar(id) {
    const response = await api.put(`/unidades-atendimento/${id}/desativar`)
    return response.data?.data || response.data
  }
}

export default unidadesAtendimentoService
