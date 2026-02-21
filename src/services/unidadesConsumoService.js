/**
 * Serviço de Unidades de Consumo (Mesas/Comandas)
 * Gerencia unidades de consumo abertas no sistema
 * 
 * NOMENCLATURA BACKEND:
 * - Entidade: UnidadeDeConsumo (não "Conta")
 * - Estados: StatusUnidadeConsumo (DISPONIVEL, OCUPADA, AGUARDANDO_PAGAMENTO, FINALIZADA)
 */

import api from './api'

export const unidadesConsumoService = {
  /**
   * Listar MINHAS unidades (filtro automático por UnidadeAtendimento)
   * GET /api/unidades-consumo/minhas
   * 
   * Comportamento:
   * - ADMIN: retorna TODAS as unidades (visão global)
   * - GERENTE/ATENDENTE: retorna apenas unidades da sua UnidadeAtendimento
   * 
   * NOVO ENDPOINT (conforme REFATORACAO_HIERARQUIA_UNIDADES.txt)
   */
  async getMinhas() {
    const response = await api.get('/unidades-consumo/minhas')
    return response.data
  },

  /**
   * Listar unidades abertas (status = OCUPADA)
   * GET /api/unidades-consumo/status/OCUPADA
   * 
   * NOTA: Use getMinhas() para filtro automático por role.
   * Este método retorna TODAS as unidades abertas (requer ADMIN).
   */
  async getAbertas() {
    const response = await api.get('/unidades-consumo/status/OCUPADA')
    return response.data
  },

  /**
   * Listar unidades por status
   * GET /api/unidades-consumo/status/{status}
   * @param {string} status - DISPONIVEL, OCUPADA, AGUARDANDO_PAGAMENTO, FINALIZADA
   */
  async getByStatus(status) {
    const response = await api.get(`/unidades-consumo/status/${status}`)
    return response.data
  },

  /**
   * Buscar unidade por ID (inclui pedidos e cliente)
   * GET /api/unidades-consumo/{id}
   */
  async getById(id) {
    const response = await api.get(`/unidades-consumo/${id}`)
    return response.data
  },

  /**
   * Criar nova unidade de consumo (abrir mesa/comanda)
   * POST /api/unidades-consumo
   * 
   * @param {Object} dados
   * @param {string} dados.referencia - Ex: "Mesa 10" (OBRIGATÓRIO)
   * @param {string} dados.telefoneCliente - Ex: "+244923456789" (OBRIGATÓRIO)
   * @param {number} dados.unidadeAtendimentoId - ID da unidade de atendimento (OBRIGATÓRIO)
   * @param {string} dados.tipo - MESA_FISICA, QUARTO, etc (Opcional, default: MESA_FISICA)
   * @param {number} dados.numero - Número da mesa (Opcional)
   * @param {string} dados.qrCode - Código QR (Opcional)
   * @param {number} dados.capacidade - Lotação máxima (Opcional)
   * @param {number} dados.atendenteId - ID do atendente (Opcional)
   */
  async criar(dados) {
    const response = await api.post('/unidades-consumo', dados)
    return response.data
  },

  /**
   * Alias de criar() para compatibilidade
   */
  async abrir(dados) {
    return this.criar(dados)
  },

  /**
   * Listar todas as unidades (admin)
   */
  async getAll() {
    const response = await api.get('/unidades-consumo')
    return response.data
  },

  /**
   * Fechar unidade de consumo
   * PUT /api/unidades-consumo/{id}/fechar
   * 
   * VALIDAÇÕES BACKEND:
   * - Não permite se status já = FINALIZADA
   * - NÃO valida pendências financeiras (frontend deve avisar)
   */
  async fechar(id) {
    const response = await api.put(`/unidades-consumo/${id}/fechar`)
    return response.data
  },

  /**
   * Calcular resumo financeiro de uma unidade
   * IMPORTANTE: Backend NÃO retorna estes campos
   * Frontend deve calcular a partir da lista de pedidos
   * 
   * @param {Object} unidadeConsumo - Objeto retornado pelo backend
   * @returns {Object} { totalConsumido, totalPago, totalPendente, statusFinanceiro }
   */
  calcularResumo(unidadeConsumo) {
    if (!unidadeConsumo?.pedidos) {
      return {
        totalConsumido: 0,
        totalPago: 0,
        totalPendente: 0,
        statusFinanceiro: 'PAGO'
      }
    }

    const totalConsumido = unidadeConsumo.pedidos
      .reduce((sum, p) => sum + (p.total || 0), 0)
    
    const totalPago = unidadeConsumo.pedidos
      .filter(p => p.statusFinanceiro === 'PAGO')
      .reduce((sum, p) => sum + (p.total || 0), 0)
    
    const totalPendente = unidadeConsumo.pedidos
      .filter(p => p.statusFinanceiro === 'NAO_PAGO')
      .reduce((sum, p) => sum + (p.total || 0), 0)
    
    let statusFinanceiro
    if (totalPendente === 0) {
      statusFinanceiro = 'PAGO'
    } else if (totalPago === 0) {
      statusFinanceiro = 'EM_DEBITO'
    } else {
      statusFinanceiro = 'PARCIAL'
    }
    
    return {
      totalConsumido,
      totalPago,
      totalPendente,
      statusFinanceiro
    }
  }
}

export default unidadesConsumoService
