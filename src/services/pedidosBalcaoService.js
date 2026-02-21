/**
 * Serviço de Pedidos - Visão Balcão
 * Integração específica para gestão de pedidos no balcão
 */

import api from './api'

export const pedidosBalcaoService = {
  /**
   * Criar pedido para uma unidade de consumo existente
   * POST /api/pedidos
   * 
   * DÉBITO AUTOMÁTICO (tipoPagamento = PRE_PAGO):
   * - Backend valida saldo suficiente no Fundo do Cliente
   * - Debita automaticamente do fundo
   * - Retorna pedido com statusFinanceiro = PAGO
   * 
   * PÓS-PAGO (tipoPagamento = POS_PAGO):
   * - Requer role GERENTE ou ADMIN
   * - Valida se pós-pago está ativo globalmente
   * - Cria pedido com statusFinanceiro = NAO_PAGO
   * - Validar limite pós-pago do cliente
   * 
   * @param {Object} dados
   * @param {number} dados.unidadeConsumoId - ID da unidade de consumo
   * @param {Array} dados.itens - Array [{produtoId, quantidade, observacoes?}]
   * @param {string} dados.tipoPagamento - PRE_PAGO (default) ou POS_PAGO
   * @param {string} dados.observacoes - Observações opcionais
   */
  async criar(dados) {
    const response = await api.post('/pedidos', dados)
    return response.data
  },

  /**
   * Listar pedidos de uma unidade de consumo
   * ALTERNATIVA: Usar dados que vêm em GET /api/unidades-consumo/{id}
   * OU filtrar no frontend após obter todos os pedidos
   * 
   * Backend não possui endpoint específico GET /api/pedidos/conta/{id}
   */
  async getByUnidadeConsumoId(unidadeConsumoId) {
    // Opção 1: Buscar unidade completa (inclui pedidos)
    const response = await api.get(`/unidades-consumo/${unidadeConsumoId}`)
    return { data: response.data.data?.pedidos || [] }
  },

  /**
   * Confirmar pagamento de pedido pós-pago
   * PUT /api/pedidos/{id}/confirmar-pagamento
   * 
   * IMPORTANTE:
   * - Apenas para pedidos com tipoPagamento = POS_PAGO
   * - Requer role GERENTE ou ADMIN
   * - Marca statusFinanceiro = PAGO
   * - Sem body no request
   * 
   * @param {number} id - ID do pedido
   */
  async confirmarPagamento(id) {
    const response = await api.put(`/pedidos/${id}/confirmar-pagamento`)
    return response.data
  },

  /**
   * Cancelar pedido (com motivo)
   * PUT /api/pedidos/{id}/cancelar
   */
  async cancelar(id, motivo) {
    const response = await api.put(`/pedidos/${id}/cancelar`, null, {
      params: { motivo }
    })
    return response.data
  },

  /**
   * Obter detalhes completos do pedido
   * GET /api/pedidos/{id}
   */
  async getById(id) {
    const response = await api.get(`/pedidos/${id}`)
    return response.data
  }
}

export default pedidosBalcaoService
