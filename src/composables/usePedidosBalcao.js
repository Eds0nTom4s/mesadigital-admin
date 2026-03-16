/**
 * Composable usePedidosBalcao
 * Encapsula toda a lógica de estado e operações do painel de pedidos (balcão).
 * Extraído de PedidosBalcaoView para separação de responsabilidades.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import mesasService from '@/api/mesasService'
import sessoesConsumoService from '@/api/sessoesConsumoService'
import fundoConsumoService from '@/api/fundoConsumoService'
import produtosService from '@/api/produtosService'
import pedidosBalcaoService from '@/api/pedidosBalcaoService'
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
  const mostrarModalAbrirSessao = ref(false)
  const mesaParaAbrirSessao = ref(null)

  const clienteSelecionadoFundo = ref(null)
  const fundoSelecionado = ref(null)

  // ── Estado principal ──────────────────────────────────────────────────────
  const unidadeSelecionada = ref(null)
  const pedidoAtivo = ref(null)
  const fundoAtivo = ref(null)
  const loadingFundo = ref(false)
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
    const ocupadas = unidadesConsumo.value.filter(u => u.sessaoAtiva !== null).length
    const total = unidadesConsumo.value.length
    return {
      titulo: 'Gestão de Pedidos - Balcão',
      subtitulo: `${ocupadas} ocupada(s) · ${total - ocupadas} disponível(is)`
    }
  })

  const unidadesFiltradas = computed(() => {
    // Mostra TODAS as mesas — ocupadas primeiro, depois disponíveis
    let lista = busca.value
      ? unidadesConsumo.value.filter(u =>
          u.referencia?.toLowerCase().includes(busca.value.toLowerCase())
        )
      : [...unidadesConsumo.value]
    return lista.sort((a, b) => {
      if (a.sessaoAtiva && !b.sessaoAtiva) return -1
      if (!a.sessaoAtiva && b.sessaoAtiva) return 1
      return 0
    })
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
      console.log('[usePedidosBalcao] Mesas carregadas:', rawMesas.length, rawMesas.map(m => ({ id: m.id, ref: m.referencia, status: m.status })))

      let sessoesMap = new Map()
      try {
        const sessoes = await sessoesConsumoService.getAbertas()
        const rawSessoes = Array.isArray(sessoes) ? sessoes : sessoes.data || []
        rawSessoes.forEach(s => sessoesMap.set(s.mesaId, s))
        console.log('[usePedidosBalcao] Sessões abertas:', rawSessoes.length, rawSessoes.map(s => ({ id: s.id, mesaId: s.mesaId, status: s.status })))
      } catch (err) {
        console.error('[usePedidosBalcao] ERRO ao carregar sessões:', err.response?.status, err.message)
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
      console.log('[usePedidosBalcao] Com sessão ativa:', unidadesConsumo.value.filter(u => u.sessaoAtiva).length)
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
      // response.data é a Page object (se for ApiResponse<Page>)
      // ou response pode ser a Page object directamente dependendo de como o service retorna
      const inner = response.data ?? response
      const lista = Array.isArray(inner.content) ? inner.content : (Array.isArray(inner) ? inner : [])
      
      produtosDisponiveis.value = lista.filter(p => p.ativo === true)
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
    try {
      const response = await pedidosBalcaoService.getPedidoAtivoSessao(sessaoConsumoId)
      pedidoAtivo.value = response?.data ?? response ?? null
    } catch (error) {
      // 404 = sem pedido ativo — comportamento normal
      if (error.response?.status === 404) {
        pedidoAtivo.value = null
      } else {
        console.error('[usePedidosBalcao] Erro ao carregar pedido ativo:', error)
        pedidoAtivo.value = null
      }
    }
  }

  const carregarFundoSessao = async (sessaoId, clienteId = null) => {
    if (!sessaoId) { fundoAtivo.value = null; return }
    loadingFundo.value = true
    try {
      // Usar endpoint administrativo verificado: GET /api/fundos/sessao/{sessaoId}
      const fundo = await fundoConsumoService.buscarPorSessao(sessaoId)
      fundoAtivo.value = fundo || null
    } catch (err) {
      console.warn('[usePedidosBalcao] Fundo não encontrado para a sessão:', err.message)
      fundoAtivo.value = null
    } finally {
      loadingFundo.value = false
    }
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
        await carregarFundoSessao(unidadeSelecionada.value.sessaoConsumoId, unidadeSelecionada.value.cliente?.id)
      }
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao recarregar pedido:', error)
    }
  }

  // ── Navegação ─────────────────────────────────────────────────────────────
  const selecionarUnidade = async (unidade) => {
    // Mesa sem sessão → abrir modal para criar sessão
    if (!unidade.sessaoAtiva) {
      mesaParaAbrirSessao.value = unidade
      mostrarModalAbrirSessao.value = true
      return
    }
    unidadeSelecionada.value = unidade
    fundoAtivo.value = null
    await carregarPedidoAtivo(unidade.sessaoConsumoId)
    await carregarFundoSessao(unidade.sessaoConsumoId, unidade.cliente?.id)
    cleanupUnidadeWS = inscreverUnidade(unidade.id)
    if (produtosDisponiveis.value.length === 0) {
      await carregarProdutos()
    }
  }

  const voltarListaUnidades = () => {
    if (cleanupUnidadeWS) { cleanupUnidadeWS(); cleanupUnidadeWS = null }
    unidadeSelecionada.value = null
    pedidoAtivo.value = null
    fundoAtivo.value = null
    carregarUnidades()
  }

  // ── Handlers de modais ────────────────────────────────────────────────────
  const abrirModalNovoPedido = () => { mostrarModalNovoPedido.value = true }
  const fecharModalNovoPedido = () => { mostrarModalNovoPedido.value = false }

  // Handler: Abrir/fechar modal de criação de sessão
  const abrirModalAbrirSessao = (unidade) => {
    mesaParaAbrirSessao.value = unidade
    mostrarModalAbrirSessao.value = true
  }

  const fecharModalAbrirSessao = () => {
    mostrarModalAbrirSessao.value = false
    mesaParaAbrirSessao.value = null
  }

  const handleSessaoAberta = async (sessaoData) => {
    fecharModalAbrirSessao()
    await carregarUnidades()
    const sessaoId = sessaoData?.data?.id ?? sessaoData?.id
    const mesa = unidadesConsumo.value.find(u => u.sessaoConsumoId === sessaoId)
    if (mesa) {
      await selecionarUnidade(mesa)
    } else {
      notificationStore.sucesso('Sessão aberta! Selecione a mesa para gerir.')
    }
  }

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
    fundoSelecionado.value = fundo ?? fundoAtivo.value
    mostrarModalRecarregar.value = true
  }

  const fecharModalRecarregar = () => {
    mostrarModalRecarregar.value = false
    fundoSelecionado.value = null
  }

  const handleRecargaCriada = async () => {
    if (unidadeSelecionada.value) {
      setTimeout(async () => {
        await carregarFundoSessao(
          unidadeSelecionada.value.sessaoConsumoId,
          unidadeSelecionada.value.cliente?.id
        )
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

  // ── Ações de Sessão ───────────────────────────────────────────────────────
  const fecharSessao = async () => {
    const sessaoId = unidadeSelecionada.value?.sessaoConsumoId
    if (!sessaoId) { notificationStore.erro('Sessão não identificada'); return }
    try {
      await sessoesConsumoService.fechar(sessaoId)
      notificationStore.sucesso('Sessão encerrada com sucesso!')
      voltarListaUnidades()
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao encerrar sessão:', error)
      notificationStore.erro('Erro ao encerrar sessão: ' + (error.response?.data?.message || error.message))
    }
  }

  const aguardarPagamento = async () => {
    const sessaoId = unidadeSelecionada.value?.sessaoConsumoId
    if (!sessaoId) { notificationStore.erro('Sessão não identificada'); return }
    try {
      await sessoesConsumoService.aguardarPagamento(sessaoId)
      notificationStore.sucesso('Mesa a aguardar pagamento.')
      await recarregarPedido()
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao marcar aguardar pagamento:', error)
      notificationStore.erro('Erro: ' + (error.response?.data?.message || error.message))
    }
  }

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
    fundoAtivo,
    loadingFundo,
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
    mostrarModalAbrirSessao,
    mesaParaAbrirSessao,
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
    abrirModalAbrirSessao,
    fecharModalAbrirSessao,
    handleSessaoAberta,
    fecharSessao,
    aguardarPagamento,
    iconeTipoUnidade,
    labelStatusUnidade
  }
}
