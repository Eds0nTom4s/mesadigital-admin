/**
 * Composable: useConfiguracaoFinanceira
 *
 * Gerencia estado reativo das configurações financeiras do sistema.
 * Traduz as respostas da API para estado de UI sem conter lógica de apresentação.
 *
 * Regras refletidas (ALINHAMENTO_FRONTEND.txt — 01/03/2026):
 *  - Todos os valores financeiros são carregados do backend (nenhum valor hardcoded)
 *  - valorMinimoOperacao é a fonte de verdade para validações de recarga/débito/estorno
 *  - limitePosPago mínimo: 100 AOA
 *  - posPagoStatus é consultado separadamente para formulários de pedido
 */

import { ref, readonly } from 'vue'
import { configuracaoFinanceiraService } from '@/services/configuracaoFinanceiraService'

export function useConfiguracaoFinanceira() {
  // ─── Estado de domínio ────────────────────────────────────────────────────
  const configuracao = ref(null)          // ConfiguracaoFinanceiraSistema completo
  const posPagoStatus = ref(false)        // Status rápido do pós-pago (boolean)

  // ─── Estado de UI ─────────────────────────────────────────────────────────
  const carregando = ref(false)
  const carregandoStatus = ref(false)
  const erro = ref(null)

  // ─── Ações ────────────────────────────────────────────────────────────────

  /**
   * Carrega a configuração completa.
   * Usar no painel Admin ao inicializar a aba de Parâmetros Financeiros.
   */
  async function carregarConfiguracao() {
    carregando.value = true
    erro.value = null
    try {
      const data = await configuracaoFinanceiraService.buscarConfiguracao()
      // Envelope: { success, message, data } ou objeto direto
      configuracao.value = data?.data ?? data
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  /**
   * Carrega apenas o status do pós-pago (endpoint leve).
   * Usar antes de montar o seletor de tipo de pagamento no formulário de pedido.
   */
  async function carregarStatusPosPago() {
    carregandoStatus.value = true
    try {
      posPagoStatus.value = await configuracaoFinanceiraService.buscarStatusPosPago()
    } catch (e) {
      // Em caso de erro, tratar como desativado (opção mais segura)
      posPagoStatus.value = false
      console.error('[useConfiguracaoFinanceira] Erro ao buscar status pós-pago:', _extrairMensagem(e))
    } finally {
      carregandoStatus.value = false
    }
  }

  /**
   * Ativa o pós-pago globalmente.
   * @param {string} motivo - Razão da ativação (fortemente recomendado)
   */
  async function ativarPosPago(motivo) {
    carregando.value = true
    erro.value = null
    try {
      await configuracaoFinanceiraService.ativarPosPago(motivo)
      await carregarConfiguracao()
      posPagoStatus.value = true
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  /**
   * Desativa o pós-pago globalmente.
   * @param {string} motivo - Razão da desativação (fortemente recomendado)
   */
  async function desativarPosPago(motivo) {
    carregando.value = true
    erro.value = null
    try {
      await configuracaoFinanceiraService.desativarPosPago(motivo)
      await carregarConfiguracao()
      posPagoStatus.value = false
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  /**
   * Altera o limite de pós-pago por unidade.
   * Mínimo aceite: 100,00 AOA.
   *
   * @param {number} novoLimite - Valor em AOA
   * @param {string} motivo     - Razão da alteração
   */
  async function alterarLimitePosPago(novoLimite, motivo) {
    carregando.value = true
    erro.value = null
    try {
      await configuracaoFinanceiraService.alterarLimitePosPago(novoLimite, motivo)
      await carregarConfiguracao()
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  /**
   * Altera o valor mínimo de operação.
   *
   * @param {number} novoValor - Valor em AOA
   * @param {string} motivo    - Razão da alteração
   */
  async function alterarValorMinimo(novoValor, motivo) {
    carregando.value = true
    erro.value = null
    try {
      await configuracaoFinanceiraService.alterarValorMinimo(novoValor, motivo)
      await carregarConfiguracao()
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  // ─── Utilitário interno ───────────────────────────────────────────────────

  function _extrairMensagem(e) {
    // Extrair mensagem do envelope padrão { success, message, data }
    return e?.response?.data?.message || e?.message || 'Erro desconhecido'
  }

  // ─── Expose ───────────────────────────────────────────────────────────────
  return {
    // Estado (readonly para garantir mutação apenas via ações)
    configuracao: readonly(configuracao),
    posPagoStatus: readonly(posPagoStatus),
    carregando: readonly(carregando),
    carregandoStatus: readonly(carregandoStatus),
    erro: readonly(erro),

    // Ações
    carregarConfiguracao,
    carregarStatusPosPago,
    ativarPosPago,
    desativarPosPago,
    alterarLimitePosPago,
    alterarValorMinimo
  }
}
