/**
 * Serviço de Pedidos - Conforme PROMPT_ALINHAMENTO_FRONTEND_CORRIGIDO.txt
 * Gestão completa de Pedidos e SubPedidos
 */

import api from './api'

export const pedidosBalcaoService = {
  /**
   * Criar pedido para uma sessão de consumo ativa
   * POST /api/pedidos
   * 
   * Backend automaticamente:
   * - Cria Pedido
   * - Agrupa itens por TipoPreparo do produto
   * - Cria SubPedidos (um por Cozinha)
   * - Cria ItemPedidos associados aos SubPedidos
   * - Calcula totais
   * - Processa pagamento (se PRE_PAGO - débito imediato do fundo)
   * 
   * @param {Object} dados
   * @param {number} dados.sessaoConsumoId - ID da sessão de consumo ativa
   * @param {Array} dados.itens - Array [{produtoId, quantidade, observacoes?}]
   * @param {string} dados.tipoPagamento - PRE_PAGO (débito do fundo) ou POS_PAGO (pagar depois)
   * @param {string} dados.observacoes - Observações opcionais
   */
  async criar(dados) {
    const response = await api.post('/pedidos', dados)
    return response.data
  },

  /**
   * Buscar pedido ATIVO de uma sessão de consumo
   * GET /api/pedidos/sessao-consumo/{sessaoConsumoId}/ativo
   * 
   * Retorna o pedido ativo (status != FINALIZADO && status != CANCELADO)
   * com todos os SubPedidos, ItemPedidos e dados de Cozinha
   */
  async getPedidoAtivoSessao(sessaoConsumoId) {
    const response = await api.get(`/pedidos/sessao-consumo/${sessaoConsumoId}/ativo`)
    return response.data
  },

  /**
   * @deprecated Use getPedidoAtivoSessao(sessaoConsumoId)
   */
  async getPedidoAtivoUnidade(sessaoConsumoId) {
    console.warn('[pedidosBalcaoService] getPedidoAtivoUnidade() deprecated. Use getPedidoAtivoSessao().')
    return this.getPedidoAtivoSessao(sessaoConsumoId)
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
   * [BACKEND] NÃO existe POST /api/pedidos/{id}/finalizar.
   * O status FINALIZADO é atribuído AUTOMATICAMENTE pelo backend
   * quando o último SubPedido do pedido é marcado como ENTREGUE.
   *
   * Fluxo correto:
   *   PUT /api/subpedidos/{id}/assumir       → EM_PREPARACAO
   *   PUT /api/subpedidos/{id}/marcar-pronto → PRONTO
   *   PUT /api/subpedidos/{id}/marcar-entregue → ENTREGUE
   *   (último ENTREGUE → Pedido vira FINALIZADO automaticamente)
   *
   * Este método é mantido apenas para não quebrar chamadores existentes.
   * @deprecated Usar subpedidosService.marcarEntregue() para o último SubPedido
   */
  async finalizar(_id) {
    console.warn(
      '[pedidosBalcaoService] finalizar() não tem endpoint no backend.\n' +
      'O pedido será finalizado automaticamente quando todos os SubPedidos forem marcados como ENTREGUE.'
    )
    return { success: true, message: 'O pedido será finalizado automaticamente pelo backend.' }
  },

  /**
   * Cancelar pedido
   * PUT /api/pedidos/{id}/cancelar?motivo=TEXTO   (roles: GERENTE, ADMIN)
   *
   * [BACKEND] Método HTTP: PUT (não POST)
   * [BACKEND] motivo é query parameter, NÃO body
   * [BACKEND] motivo é OBRIGATÓRIO — se omitido retorna 400
   *
   * @param {number} id - ID do pedido
   * @param {string} motivo - Motivo do cancelamento (obrigatório)
   */
  async cancelar(id, motivo) {
    const response = await api.put(`/pedidos/${id}/cancelar`, null, {
      params: { motivo }
    })
    return response.data
  },

  /**
   * [BACKEND] NÃO existe POST /api/pagamentos.
   * O pagamento via AppyPay é 100% interno (webhook /api/pagamentos/callback).
   * Para pagamento pós-pago, usar endpoints de ConfiguracaoFinanceira.
   * @deprecated Remover chamadas a este método
   */
  async processarPagamento(_dados) {
    console.warn(
      '[pedidosBalcaoService] processarPagamento() não tem endpoint no backend.\n' +
      'O processamento de pagamento é gerido internamente pelo backend.'
    )
    throw new Error('Endpoint /api/pagamentos não disponível. Ver RESPOSTAS_BACKEND_PERGUNTAS.txt §3.4.')
  }
}

export default pedidosBalcaoService
