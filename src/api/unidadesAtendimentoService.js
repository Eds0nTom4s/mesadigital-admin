import api from './api'

export const unidadesAtendimentoService = {
  async listar() {
    const response = await api.get('/unidades-atendimento')
    return response.data?.data || response.data
  },
  
  async buscarPorId(id) {
    const response = await api.get(`/unidades-atendimento/${id}`)
    return response.data?.data || response.data
  }
}

export default unidadesAtendimentoService
