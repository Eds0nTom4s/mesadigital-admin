import api from './api'

/**
 * Serviço de API - Fundo de Consumo
 * 
 * Integração completa com backend conforme documentação oficial
 * Base URL: http://localhost:8080/api/fundos
 * 
 * Autenticação: Bearer Token JWT obrigatório
 */

/**
 * FASE 2: CONFIGURAÇÃO INICIAL
 * Consulta valor mínimo obrigatório para criação de fundo
 * 
 * GET /api/fundos/config/valor-minimo
 * 
 * @returns {Promise<number>} Valor mínimo em AOA (ex: 5000.00)
 */
export const consultarValorMinimo = async () => {
  try {
    const response = await api.get('/fundos/config/valor-minimo')
    return response.data // Retorna o objeto completo com data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Erro ao consultar valor mínimo'
    )
  }
}

/**
 * FASE 3: CRIAÇÃO DE FUNDO
 * Cria fundo para cliente com saldo inicial OBRIGATÓRIO
 * 
 * POST /api/fundos
 * 
 * @param {Object} dados - Dados do fundo
 * @param {number} dados.clienteId - ID do cliente
 * @param {number} dados.saldoInicial - Saldo inicial (>= valorMinimo)
 * @param {string} [dados.observacoes] - Observações opcionais
 * @returns {Promise<Object>} Fundo criado
 */
export const criarFundo = async ({ clienteId, saldoInicial, observacoes }) => {
  try {
    const response = await api.post('/fundos', {
      clienteId,
      saldoInicial,
      observacoes: observacoes || 'Carga inicial'
    })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message
    if (error.response?.status === 400) {
      if (message?.includes('Saldo inicial')) {
        throw new Error(message)
      }
      if (message?.includes('já possui fundo ativo')) {
        throw new Error('Cliente já possui um fundo ativo')
      }
    }
    if (error.response?.status === 404) {
      throw new Error('Cliente não encontrado')
    }
    throw new Error(message || 'Erro ao criar fundo')
  }
}

/**
 * FASE 4: BUSCA DE FUNDO
 * Busca fundo ativo de um cliente
 * 
 * GET /api/fundos/cliente/{clienteId}
 * 
 * @param {number} clienteId - ID do cliente
 * @returns {Promise<Object|null>} Fundo encontrado ou null
 */
export const buscarFundoPorCliente = async (clienteId) => {
  try {
    const response = await api.get(`/fundos/cliente/${clienteId}`)
    return response.data.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null // Cliente não tem fundo
    }
    throw new Error(
      error.response?.data?.message || 'Erro ao buscar fundo'
    )
  }
}

/**
 * Consulta saldo atual de um fundo
 * 
 * GET /api/fundos/{fundoId}/saldo
 * 
 * @param {number} fundoId - ID do fundo
 * @returns {Promise<number>} Saldo em AOA
 */
export const consultarSaldo = async (fundoId) => {
  try {
    const response = await api.get(`/fundos/${fundoId}/saldo`)
    return response.data.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Erro ao consultar saldo'
    )
  }
}

/**
 * FASE 5: RECARGA DE FUNDO
 * Cria recarga via gateway AppyPay (GPO ou REF)
 * 
 * POST /api/fundos/{fundoId}/recarregar
 * 
 * @param {number} fundoId - ID do fundo
 * @param {Object} dados - Dados da recarga
 * @param {number} dados.valor - Valor em AOA (> 0)
 * @param {string} dados.metodoPagamento - "GPO" ou "REF"
 * @param {string} [dados.descricao] - Descrição opcional
 * @returns {Promise<Object>} Pagamento criado (PENDENTE)
 */
export const recarregarFundo = async (fundoId, { valor, metodoPagamento, descricao }) => {
  try {
    const response = await api.post(`/fundos/${fundoId}/recarregar`, {
      valor,
      metodoPagamento,
      descricao: descricao || `Recarga via ${metodoPagamento}`
    })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message
    if (error.response?.status === 400) {
      if (message?.includes('Valor inválido')) {
        throw new Error('Valor deve ser maior que zero')
      }
      if (message?.includes('Método de pagamento')) {
        throw new Error('Método de pagamento inválido. Use GPO ou REF')
      }
      if (message?.includes('Fundo encerrado')) {
        throw new Error('Fundo está encerrado. Crie um novo fundo')
      }
    }
    if (error.response?.status === 404) {
      throw new Error('Fundo não encontrado')
    }
    if (error.response?.status === 500) {
      throw new Error('Gateway AppyPay indisponível. Tente novamente mais tarde')
    }
    throw new Error(message || 'Erro ao criar recarga')
  }
}

/**
 * FASE 6: HISTÓRICO DE TRANSAÇÕES
 * Lista todas as transações de um fundo
 * 
 * GET /api/fundos/{fundoId}/transacoes
 * 
 * @param {number} fundoId - ID do fundo
 * @returns {Promise<Array>} Lista de transações (mais recente primeiro)
 */
export const listarTransacoes = async (fundoId) => {
  try {
    const response = await api.get(`/fundos/${fundoId}/transacoes`)
    return response.data.data
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Erro ao listar transações'
    )
  }
}

/**
 * POLLING: Aguarda confirmação de pagamento
 * Consulta saldo periodicamente até detectar aumento
 * 
 * @param {number} clienteId - ID do cliente
 * @param {number} saldoEsperado - Saldo esperado após pagamento
 * @param {number} [maxTentativas=60] - Máximo de tentativas (5 min)
 * @param {number} [intervalo=5000] - Intervalo entre tentativas (ms)
 * @returns {Promise<Object>} Fundo com saldo atualizado
 */
export const aguardarConfirmacaoPagamento = async (
  clienteId,
  saldoEsperado,
  maxTentativas = 60,
  intervalo = 5000
) => {
  for (let i = 0; i < maxTentativas; i++) {
    const fundo = await buscarFundoPorCliente(clienteId)
    
    if (fundo && fundo.saldoAtual >= saldoEsperado) {
      return fundo
    }
    
    // Aguarda próxima tentativa
    await new Promise(resolve => setTimeout(resolve, intervalo))
  }
  
  throw new Error('Timeout: Pagamento não confirmado após 5 minutos')
}

export default {
  consultarValorMinimo,
  criarFundo,
  buscarFundoPorCliente,
  consultarSaldo,
  recarregarFundo,
  listarTransacoes,
  aguardarConfirmacaoPagamento
}
