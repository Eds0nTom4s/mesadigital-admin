/**
 * @deprecated MODELO ANTIGO — usar mesasService + sessoesConsumoService
 *
 * Serviço de Unidades de Consumo (stub de compatibilidade)
 *
 * Este serviço mantém os métodos do modelo anterior para evitar quebras imediatas
 * durante a migração. Todos os métodos emitem `console.warn` e delegam
 * para os novos serviços.
 *
 * MIGRAÇÃO:
 *  unidadesConsumoService.getMinhas()   → mesasService.getPorUnidadeAtendimento()
 *  unidadesConsumoService.criar()       → mesasService.criar()
 *  unidadesConsumoService.fechar()      → sessoesConsumoService.fechar()
 *  unidadesConsumoService.getById()     → mesasService.getById() + sessoesConsumoService.getSessaoAtivaMesa()
 */

import api from './api'

export const unidadesConsumoService = {
  /**
   * Listar unidades visíveis pelo utilizador autenticado
   *
   * [BACKEND] GET /api/unidades-consumo/minhas NÃO EXISTE.
   * Alternativa:
   *   - ADMIN: GET /api/unidades-consumo (todas)
   *   - GERENTE/ATENDENTE: GET /api/unidades-consumo/unidade-atendimento/{id}
   *     (requer unidadeAtendimentoId do utilizador logado)
   */
  /**
   * @deprecated Usar mesasService.getPorUnidadeAtendimento(id) ou mesasService.getTodas()
   */
  async getMinhas(unidadeAtendimentoId = null) {
    console.warn('[unidadesConsumoService] getMinhas() deprecated. Use mesasService.')
    if (unidadeAtendimentoId) {
      const response = await api.get(`/unidades-consumo/unidade-atendimento/${unidadeAtendimentoId}`)
      return response.data
    }
    // ADMIN ou sem unidadeAtendimentoId — retorna todas
    const response = await api.get('/unidades-consumo')
    return response.data
  },

  /**
   * Listar unidades abertas (status = OCUPADA)
   * GET /api/unidades-consumo/status/OCUPADA
   * 
   * NOTA: Use getMinhas() para filtro automático por role.
   * Este método retorna TODAS as unidades abertas (requer ADMIN).
   */
  /**
   * @deprecated Usar sessoesConsumoService.getAbertas()
   */
  async getAbertas() {
    console.warn('[unidadesConsumoService] getAbertas() deprecated. Use sessoesConsumoService.getAbertas().')
    const response = await api.get('/unidades-consumo/status/OCUPADA')
    return response.data
  },

  /**
   * Listar unidades por status
   * GET /api/unidades-consumo/status/{status}
   * @param {string} status - DISPONIVEL, OCUPADA, AGUARDANDO_PAGAMENTO, FINALIZADA
   */
  /**
   * @deprecated Usar mesasService.getDisponiveis() / mesasService.getOcupadas()
   */
  async getByStatus(status) {
    console.warn('[unidadesConsumoService] getByStatus() deprecated. Use mesasService.')
    const response = await api.get(`/unidades-consumo/status/${status}`)
    return response.data
  },

  /**
   * Buscar unidade por ID (inclui pedidos e cliente)
   * GET /api/unidades-consumo/{id}
   */
  /**
   * @deprecated Usar mesasService.getById(id) + sessoesConsumoService.getSessaoAtivaMesa(id)
   */
  async getById(id) {
    console.warn('[unidadesConsumoService] getById() deprecated. Use mesasService.getById().')
    const response = await api.get(`/unidades-consumo/${id}`)
    return response.data
  },

  /**
   * Criar nova unidade de consumo (abrir mesa/comanda)
   * POST /api/unidades-consumo
   * 
   * Mesas são pré-cadastradas SEM vínculo de cliente.
   * O cliente é associado quando escaneia o QR Code (fluxo do cliente).
   *
   * @param {Object} dados
   * @param {string} dados.referencia - Ex: "Mesa 10" (OBRIGATÓRIO)
   * @param {string} dados.tipo - MESA_FISICA, QUARTO, etc (OBRIGATÓRIO)
   * @param {number} dados.unidadeAtendimentoId - ID da unidade de atendimento (OBRIGATÓRIO)
   * @param {number} dados.numero - Número da mesa (Opcional)
   * @param {number} dados.capacidade - Lotação máxima (Opcional)
   */
  /**
   * @deprecated Usar mesasService.criar(dados) (ADMIN only)
   */
  async criar(dados) {
    console.warn('[unidadesConsumoService] criar() deprecated. Use mesasService.criar().')
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
  /**
   * @deprecated Usar sessoesConsumoService.fechar(sessaoId)
   */
  async fechar(id) {
    console.warn('[unidadesConsumoService] fechar() deprecated. Use sessoesConsumoService.fechar(sessaoId).')
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
