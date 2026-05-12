import api from './api'

const faturaService = {
  async enviarPorSms(sessaoId, telefone) {
    const response = await api.post(`/sessoes-consumo/${sessaoId}/fatura/sms`, { telefone })
    return response.data
  }
}

export default faturaService
