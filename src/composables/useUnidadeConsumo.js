/**
 * Composable: useUnidadeConsumo
 *
 * Gerencia estado reativo das Mesas e Sessões de Consumo.
 *
 * Novo modelo (ALINHAMENTO_FRONTEND_MODELO_MESAS_2026_03_02.txt):
 *  - Mesa = recurso físico permanente (pré-cadastrada pelo ADMIN)
 *  - SessaoConsumo = evento temporal que "ocupa" a mesa
 *  - criarUnidade() → mesasService.criar() (ADMIN apenas)
 *  - fecharUnidade()  → sessoesConsumoService.fechar(sessaoId)
 */

import { ref, computed, readonly } from 'vue'
import mesasService from '@/services/mesasService'
import sessoesConsumoService from '@/services/sessoesConsumoService'
import { useAuthStore } from '@/store/auth'

export function useUnidadeConsumo() {
  const authStore = useAuthStore()

  // ─── Estado de domínio ────────────────────────────────────────────────────
  const unidades = ref([])
  const unidadeSelecionada = ref(null)

  // ─── Estado do formulário de criação ─────────────────────────────────────
  const _formInicial = () => ({
    referencia: '',
    tipo: 'MESA_FISICA',
    numero: null,
    capacidade: 4,
    unidadeAtendimentoId: authStore.user?.unidadeAtendimentoId || null
  })

  const form = ref(_formInicial())

  // ─── Estado de UI ─────────────────────────────────────────────────────────
  const carregando = ref(false)
  const enviando = ref(false)
  const erro = ref(null)
  const filtroStatus = ref('TODAS')

  // ─── Computed ─────────────────────────────────────────────────────────────

  /** Unidades filtradas pelo status selecionado */
  const unidadesFiltradas = computed(() => {
    if (filtroStatus.value === 'TODAS') return unidades.value
    return unidades.value.filter(u => u.status === filtroStatus.value)
  })

  /** Total de unidades ocupadas */
  const totalOcupadas = computed(() =>
    unidades.value.filter(u => u.status === 'OCUPADA').length
  )

  /** Percentagem de ocupação */
  const percentagemOcupacao = computed(() =>
    unidades.value.length > 0
      ? Math.round((totalOcupadas.value / unidades.value.length) * 100)
      : 0
  )



  // ─── Ações ────────────────────────────────────────────────────────────────

  /** Carrega as mesas do utilizador autenticado */
  async function carregarUnidades() {
    carregando.value = true
    erro.value = null
    try {
      const unidadeAtendimentoId = authStore.user?.unidadeAtendimentoId ?? null
      let data
      if (unidadeAtendimentoId) {
        data = await mesasService.getPorUnidadeAtendimento(unidadeAtendimentoId)
      } else {
        data = await mesasService.getTodas()
      }
      unidades.value = Array.isArray(data) ? data : data?.data ?? []
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  /** Reinicia o formulário de criação */
  function resetarForm() {
    form.value = _formInicial()
  }

  /**
   * Cria uma nova unidade de consumo (mesa pré-cadastrada).
   *
   * Payload correto (RESPOSTAS_BACKEND_PERGUNTAS.txt §8.2):
   *   { referencia, tipo, capacidade, unidadeAtendimentoId }
   * O vínculo com cliente acontece posteriormente (scan do QR Code).
   */
  async function criarUnidade() {
    erro.value = null

    // ── Validações de formulário ──
    if (!form.value.referencia?.trim()) {
      throw new Error('Referência é obrigatória')
    }

    if (!form.value.unidadeAtendimentoId && !authStore.isAdmin) {
      throw new Error('Unidade de atendimento é obrigatória')
    }

    // ── Construir payload (apenas campos aceites pelo backend) ──
    const payload = {
      referencia: form.value.referencia.trim(),
      tipo: form.value.tipo || 'MESA_FISICA',
      numero: form.value.numero || null,
      capacidade: form.value.capacidade || null,
      unidadeAtendimentoId: form.value.unidadeAtendimentoId
    }

    enviando.value = true
    try {
      const response = await mesasService.criar(payload)
      const novaMesa = response?.data ?? response
      await carregarUnidades()
      return novaMesa
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      enviando.value = false
    }
  }

  /**
   * Encerra a sessão ativa de uma mesa.
   * @param {number} sessaoId - ID da SessaoConsumo (não o ID da mesa)
   */
  async function fecharUnidade(sessaoId) {
    carregando.value = true
    erro.value = null
    try {
      await sessoesConsumoService.fechar(sessaoId)
      await carregarUnidades()
    } catch (e) {
      erro.value = _extrairMensagem(e)
      throw e
    } finally {
      carregando.value = false
    }
  }

  // ─── Utilitário interno ───────────────────────────────────────────────────

  function _extrairMensagem(e) {
    return e?.response?.data?.message || e?.message || 'Erro desconhecido'
  }

  // ─── Expose ───────────────────────────────────────────────────────────────
  return {
    // Estado
    unidades: readonly(unidades),
    unidadeSelecionada,
    form,
    filtroStatus,
    carregando: readonly(carregando),
    enviando: readonly(enviando),
    erro: readonly(erro),

    // Computed
    unidadesFiltradas,
    totalOcupadas,
    percentagemOcupacao,

    // Ações
    carregarUnidades,
    resetarForm,
    criarUnidade,
    fecharUnidade
  }
}
