/**
 * Serviço de Pedidos - Conforme PROMPT_ALINHAMENTO_FRONTEND_CORRIGIDO.txt
 * Gestão completa de Pedidos e SubPedidos
 */

import api from './api'

export const pedidosBalcaoService = {
  /**
   * Criar pedido para uma unidade de consumo existente
   * POST /api/pedidos
   * 
   * Backend automaticamente:
   * - Cria Pedido
   * - Agrupa itens por TipoPreparo do produto
   * - Cria SubPedidos (um por Cozinha)
   * - Cria ItemPedidos associados aos SubPedidos
   * - Calcula totais
   * - Processa pagamento (se FUNDO_CONSUMO)
   * 
   * @param {Object} dados
   * @param {number} dados.unidadeConsumoId - ID da unidade de consumo
   * @param {Array} dados.itens - Array [{produtoId, quantidade, observacoes?}]
   * @param {string} dados.tipoPagamento - FUNDO_CONSUMO (default) ou POS_PAGO
   * @param {string} dados.observacoes - Observações opcionais
   */
  async criar(dados) {
    const response = await api.post('/pedidos', dados)
    return response.data
  },

  /**
   * Buscar pedido ATIVO de uma unidade de consumo
   * GET /api/pedidos/unidade-consumo/{unidadeConsumoId}/ativo
   * 
   * Retorna o pedido ativo (status != FINALIZADO && status != CANCELADO)
   * com todos os SubPedidos, ItemPedidos e dados de Cozinha
   */
  async getPedidoAtivoUnidade(unidadeConsumoId) {
    const response = await api.get(`/pedidos/unidade-consumo/${unidadeConsumoId}/ativo`)
    return response.data
  },

  /**
   * Buscar detalhes completos do pedido
   * GET /api/pedidos/{id}
   * 
   * Inclui SubPedidos com ItemPedidos e dados de Cozinha
   */
  async getById(id) {
    const response = await api.get(`/pedidos/${id}`)
    return response.data
  },

  /**
   * Finalizar pedido
   * POST /api/pedidos/{id}/finalizar
   * 
   * Backend valida:
   * - Todos SubPedidos estão ENTREGUE
   * - Pedido ainda não está FINALIZADO
   * - Atualiza StatusPedido para FINALIZADO
   */
  async finalizar(id) {
    const response = await api.post(`/pedidos/${id}/finalizar`)
    return response.data
  },

  /**
   * Cancelar pedido
   * POST /api/pedidos/{id}/cancelar
   * 
   * @param {number} id - ID do pedido
   * @param {string} motivo - Motivo do cancelamento
   */
  async cancelar(id, motivo) {
    const response = await api.post(`/pedidos/${id}/cancelar`, { motivo })
    return response.data
  },

  /**
   * Processar pagamento de pedido
   * POST /api/pagamentos
   * 
   * @param {Object} dados
   * @param {number} dados.pedidoId - ID do pedido (OBRIGATÓRIO)
   * @param {string} dados.metodoPagamento - DINHEIRO, CARTAO, etc
   * @param {number} dados.valorPago - Valor pago
   */
  async processarPagamento(dados) {
    const response = await api.post('/pagamentos', dados)
    return response.data
  }
}

export default pedidosBalcaoService
