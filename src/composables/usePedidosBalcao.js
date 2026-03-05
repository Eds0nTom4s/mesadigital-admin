/**
 * Composable usePedidosBalcao
 * Encapsula toda a lógica de estado e operações do painel de pedidos (balcão).
 * Extraído de PedidosBalcaoView para separação de responsabilidades.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import mesasService from '@/services/mesasService'
import sessoesConsumoService from '@/services/sessoesConsumoService'
import produtosService from '@/services/produtosService'
import { usePedidoWebSocket } from '@/composables/usePedidoWebSocket'

export function usePedidosBalcao() {
  const { formatCurrency } = useCurrency()
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const { inscreverUnidade, statusConexao } = usePedidoWebSocket({
    onPedidoAtualizado: () => { recarregarPedido() },
    onSubPedidoPronto: (notificacao) => {
      notificationStore.sucesso(`🍽️ SubPedido pronto! ${notificacao.cozinhaNome || 'Cozinha'}`)
      recarregarPedido()
    }
  })

  // ── Estado dos modais ─────────────────────────────────────────────────────
  const mostrarModalCriarFundo = ref(false)
  const mostrarModalRecarregar = ref(false)
  const mostrarModalNovoPedido = ref(false)
  const mostrarModalAdicionarProdutos = ref(false)
  const mostrarModalHistorico = ref(false)

  const clienteSelecionadoFundo = ref(null)
  const fundoSelecionado = ref(null)

  // ── Estado principal ──────────────────────────────────────────────────────
  const unidadeSelecionada = ref(null)
  const pedidoAtivo = ref(null)
  const busca = ref('')
  const loading = ref(false)
  const loadingProdutos = ref(false)

  const unidadesConsumo = ref([])
  const produtosDisponiveis = ref([])

  // WebSocket cleanup
  let cleanupUnidadeWS = null

  // ── Computed ──────────────────────────────────────────────────────────────
  const tituloContexto = computed(() => {
    if (authStore.isAdmin) {
      return {
        titulo: 'Gestão de Pedidos - Visão Global',
        subtitulo: 'Todas as unidades de atendimento'
      }
    }
    return {
      titulo: 'Gestão de Pedidos - Balcão',
      subtitulo: `${unidadesFiltradas.value.length} unidades abertas`
    }
  })

  const unidadesFiltradas = computed(() => {
    const comSessao = unidadesConsumo.value.filter(u => u.sessaoAtiva !== null)
    if (!busca.value) return comSessao
    return comSessao.filter(u =>
      u.referencia?.toLowerCase().includes(busca.value.toLowerCase())
    )
  })

  // ── Carregamento ──────────────────────────────────────────────────────────
  const carregarUnidades = async () => {
    loading.value = true
    try {
      const unidadeId = authStore.user?.unidadeAtendimentoId ?? null
      let rawMesas = unidadeId
        ? await mesasService.getPorUnidadeAtendimento(unidadeId)
        : await mesasService.getTodas()
      rawMesas = Array.isArray(rawMesas) ? rawMesas : rawMesas.data || []

      let sessoesMap = new Map()
      try {
        const sessoes = await sessoesConsumoService.getAbertas()
        const rawSessoes = Array.isArray(sessoes) ? sessoes : sessoes.data || []
        rawSessoes.forEach(s => sessoesMap.set(s.mesaId, s))
      } catch (err) {
        console.warn('[usePedidosBalcao] Aviso ao carregar sessões:', err)
      }

      unidadesConsumo.value = rawMesas.map(mesa => ({
        ...mesa,
        sessaoAtiva: sessoesMap.get(mesa.id) || null,
        sessaoConsumoId: sessoesMap.get(mesa.id)?.id || null,
        cliente: sessoesMap.get(mesa.id) ? {
          id: sessoesMap.get(mesa.id).clienteId,
          nome: sessoesMap.get(mesa.id).nomeCliente,
          telefone: sessoesMap.get(mesa.id).telefoneCliente
        } : null,
        totalConsumido: sessoesMap.get(mesa.id)?.totalConsumo || 0
      }))
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao carregar mesas:', error)
      notificationStore.erro('Erro ao carregar mesas')
      unidadesConsumo.value = []
    } finally {
      loading.value = false
    }
  }

  const carregarProdutos = async () => {
    loadingProdutos.value = true
    try {
      const response = await produtosService.getAll()
      const produtos = response.data || []
      produtosDisponiveis.value = produtos.filter(p => p.ativo === true)
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao carregar produtos:', error)
      notificationStore.erro('Erro ao carregar produtos')
      produtosDisponiveis.value = []
    } finally {
      loadingProdutos.value = false
    }
  }

  const carregarPedidoAtivo = async (sessaoConsumoId) => {
    if (!sessaoConsumoId) { pedidoAtivo.value = null; return }
    // TODO: Descomentar quando backend implementar GET /pedidos/sessao-consumo/{id}/ativo
    pedidoAtivo.value = null
  }

  const recarregarPedido = async () => {
    if (!unidadeSelecionada.value?.id) return
    try {
      await carregarPedidoAtivo(unidadeSelecionada.value.sessaoConsumoId)
      if (unidadeSelecionada.value.sessaoConsumoId) {
        const sessao = await sessoesConsumoService.getById(unidadeSelecionada.value.sessaoConsumoId)
        const sessaoData = sessao.data || sessao
        unidadeSelecionada.value = {
          ...unidadeSelecionada.value,
          sessaoAtiva: sessaoData,
          totalConsumido: sessaoData.totalConsumo || 0,
          cliente: sessaoData.clienteId ? {
            id: sessaoData.clienteId,
            nome: sessaoData.nomeCliente,
            telefone: sessaoData.telefoneCliente
          } : null
        }
      }
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao recarregar pedido:', error)
    }
  }

  // ── Navegação ─────────────────────────────────────────────────────────────
  const selecionarUnidade = async (unidade) => {
    unidadeSelecionada.value = unidade
    await carregarPedidoAtivo(unidade.sessaoConsumoId)
    cleanupUnidadeWS = inscreverUnidade(unidade.id)
    if (produtosDisponiveis.value.length === 0) {
      await carregarProdutos()
    }
  }

  const voltarListaUnidades = () => {
    if (cleanupUnidadeWS) { cleanupUnidadeWS(); cleanupUnidadeWS = null }
    unidadeSelecionada.value = null
    pedidoAtivo.value = null
    carregarUnidades()
  }

  // ── Handlers de modais ────────────────────────────────────────────────────
  const abrirModalNovoPedido = () => { mostrarModalNovoPedido.value = true }
  const fecharModalNovoPedido = () => { mostrarModalNovoPedido.value = false }

  const handlePedidoCriado = (pedidoCriado) => {
    notificationStore.sucesso(`Pedido ${pedidoCriado.numero || pedidoCriado.id} criado com sucesso`)
    fecharModalNovoPedido()
    recarregarPedido()
  }

  const handleCriarFundo = (cliente) => {
    clienteSelecionadoFundo.value = cliente
    mostrarModalCriarFundo.value = true
  }

  const fecharModalCriarFundo = () => {
    mostrarModalCriarFundo.value = false
    clienteSelecionadoFundo.value = null
  }

  const handleFundoCriado = async (fundo) => {
    notificationStore.sucesso('Fundo criado com sucesso!')
    fecharModalCriarFundo()
    if (unidadeSelecionada.value) await selecionarUnidade(unidadeSelecionada.value)
  }

  const handleRecarregarFundo = (fundo) => {
    fundoSelecionado.value = fundo
    mostrarModalRecarregar.value = true
  }

  const fecharModalRecarregar = () => {
    mostrarModalRecarregar.value = false
    fundoSelecionado.value = null
  }

  const handleRecargaCriada = async () => {
    if (unidadeSelecionada.value) {
      setTimeout(async () => {
        await selecionarUnidade(unidadeSelecionada.value)
      }, 2000)
    }
  }

  const abrirModalAdicionarProdutos = () => { mostrarModalAdicionarProdutos.value = true }
  const fecharModalAdicionarProdutos = () => { mostrarModalAdicionarProdutos.value = false }
  const handleProdutosAdicionados = () => {
    notificationStore.sucesso('Produtos adicionados ao pedido')
    fecharModalAdicionarProdutos()
    recarregarPedido()
  }

  const abrirModalHistorico = () => { mostrarModalHistorico.value = true }
  const fecharModalHistorico = () => { mostrarModalHistorico.value = false }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const iconeTipoUnidade = (tipo) => {
    const icones = {
      MESA_FISICA: '🪑', QUARTO: '🛏️', CAMARIM: '🎭',
      BARRACA_EVENTO: '🎪', STAND_FEIRA: '🏢', ESPACO_COWORKING: '💼'
    }
    return icones[tipo] || '📍'
  }

  const labelStatusUnidade = (status) => {
    const labels = {
      DISPONIVEL: 'Disponível', OCUPADA: 'Ocupada',
      AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
      ENCERRADA: 'Encerrada', FINALIZADA: 'Encerrada'
    }
    return labels[status] || status
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(() => carregarUnidades())
  onUnmounted(() => { if (cleanupUnidadeWS) cleanupUnidadeWS() })

  return {
    // State
    formatCurrency,
    statusConexao,
    unidadeSelecionada,
    pedidoAtivo,
    busca,
    loading,
    loadingProdutos,
    unidadesConsumo,
    produtosDisponiveis,
    mostrarModalCriarFundo,
    mostrarModalRecarregar,
    mostrarModalNovoPedido,
    mostrarModalAdicionarProdutos,
    mostrarModalHistorico,
    clienteSelecionadoFundo,
    fundoSelecionado,
    // Computed
    tituloContexto,
    unidadesFiltradas,
    // Actions
    selecionarUnidade,
    voltarListaUnidades,
    recarregarPedido,
    abrirModalNovoPedido,
    fecharModalNovoPedido,
    handlePedidoCriado,
    handleCriarFundo,
    fecharModalCriarFundo,
    handleFundoCriado,
    handleRecarregarFundo,
    fecharModalRecarregar,
    handleRecargaCriada,
    abrirModalAdicionarProdutos,
    fecharModalAdicionarProdutos,
    handleProdutosAdicionados,
    abrirModalHistorico,
    fecharModalHistorico,
    iconeTipoUnidade,
    labelStatusUnidade
  }
}
