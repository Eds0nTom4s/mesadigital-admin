import api from './api'

/**
 * Serviço de API - QR Code
 * 
 * Gerenciamento de QR Codes para mesas, entregas e pagamentos
 * Conforme documentação: INSTRUCOES_FRONTEND_QR_CODE_GESTAO_MESAS.txt
 * 
 * Base URL: http://localhost:8080/api/qrcode
 * Autenticação: Bearer Token JWT obrigatório
 */

/**
 * Gerar novo QR Code
 * POST /api/qrcode
 * 
 * @param {Object} dados
 * @param {string} dados.tipo - "MESA" | "ENTREGA" | "PAGAMENTO"
 * @param {number} [dados.unidadeDeConsumoId] - Obrigatório para tipo MESA
 * @param {number} [dados.pedidoId] - Obrigatório para ENTREGA/PAGAMENTO
 * @param {number} [dados.validadeMinutos] - Opcional (default: 60)
 * @param {Object} [dados.metadados] - Opcional
 * @returns {Promise<Object>} QR Code gerado (apenas token, NÃO imagem)
 */
export const gerarQrCode = async ({ tipo, unidadeDeConsumoId, pedidoId, validadeMinutos, metadados }) => {
  try {
    const response = await api.post('/qrcode', {
      tipo,
      unidadeDeConsumoId,
      pedidoId,
      validadeMinutos,
      metadados
    })
    
    // Response: { success, message, data: { id, token, tipo, status, ... } }
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message
    
    if (error.response?.status === 400) {
      if (message?.includes('já existe')) {
        throw new Error('QR Code já existe para esta unidade. Use renovação.')
      }
      if (message?.includes('obrigatório')) {
        throw new Error('Parâmetros obrigatórios faltando')
      }
    }
    
    throw new Error(message || 'Erro ao gerar QR Code')
  }
}

/**
 * Buscar QR Codes de uma unidade de consumo
 * GET /api/qrcode/unidade-consumo/{id}
 * 
 * @param {number} unidadeId - ID da unidade de consumo
 * @returns {Promise<Array>} Lista de QR Codes ativos
 */
export const buscarQrCodeUnidade = async (unidadeId) => {
  try {
    const response = await api.get(`/qrcode/unidade-consumo/${unidadeId}`)
    return response.data.data
  } catch (error) {
    if (error.response?.status === 404) {
      return [] // Nenhum QR Code encontrado
    }
    throw new Error(error.response?.data?.message || 'Erro ao buscar QR Code')
  }
}

/**
 * Validar QR Code
 * GET /api/qrcode/validar/{token}
 * 
 * @param {string} token - Token do QR Code
 * @returns {Promise<Object>} Resultado da validação
 */
export const validarQrCode = async (token) => {
  try {
    const response = await api.get(`/qrcode/validar/${token}`)
    return response.data.data
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        valido: false,
        mensagem: 'QR Code não encontrado',
        motivoInvalido: 'NAO_ENCONTRADO'
      }
    }
    throw new Error(error.response?.data?.message || 'Erro ao validar QR Code')
  }
}

/**
 * Renovar QR Code (apenas tipo MESA)
 * POST /api/qrcode/renovar/{token}
 * 
 * Estende validade por mais 60 minutos (ou padrão configurado)
 * 
 * @param {string} token - Token do QR Code
 * @returns {Promise<Object>} QR Code atualizado
 */
export const renovarQrCode = async (token) => {
  try {
    const response = await api.post(`/qrcode/renovar/${token}`)
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message
    
    if (error.response?.status === 400) {
      if (message?.includes('expirado')) {
        throw new Error('QR Code expirado. Gere um novo.')
      }
      if (message?.includes('tipo')) {
        throw new Error('Apenas QR Codes de mesa podem ser renovados')
      }
    }
    
    if (error.response?.status === 404) {
      throw new Error('QR Code não encontrado')
    }
    
    throw new Error(message || 'Erro ao renovar QR Code')
  }
}

/**
 * Cancelar QR Code
 * DELETE /api/qrcode/{token}
 * 
 * Requer role: GERENTE ou ADMIN
 * 
 * @param {string} token - Token do QR Code
 * @returns {Promise<void>}
 */
export const cancelarQrCode = async (token) => {
  try {
    await api.delete(`/qrcode/${token}`)
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Sem permissão para cancelar QR Code')
    }
    if (error.response?.status === 404) {
      throw new Error('QR Code não encontrado')
    }
    throw new Error(error.response?.data?.message || 'Erro ao cancelar QR Code')
  }
}

/**
 * Obter URL da imagem do QR Code
 * 
 * NÃO faz requisição, apenas retorna a URL
 * A imagem é carregada via <img> com lazy loading
 * 
 * @param {string} token - Token do QR Code
 * @param {boolean} [print=false] - Se true, retorna URL para impressão (500x500)
 * @returns {string} URL da imagem
 */
export const getImagemUrl = (token, print = false) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
  return print 
    ? `${baseUrl}/qrcode/imagem/${token}/print`
    : `${baseUrl}/qrcode/imagem/${token}`
}

/**
 * Baixar imagem do QR Code para impressão
 * 
 * @param {string} token - Token do QR Code
 * @param {string} [filename] - Nome do arquivo (default: qrcode-{token}.png)
 */
export const baixarQrCode = (token, filename) => {
  const url = getImagemUrl(token, true)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `qrcode-${token}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default {
  gerarQrCode,
  buscarQrCodeUnidade,
  validarQrCode,
  renovarQrCode,
  cancelarQrCode,
  getImagemUrl,
  baixarQrCode
}
