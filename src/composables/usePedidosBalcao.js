/**
 * Composable usePedidosBalcao
 * Encapsula toda a lógica de estado e operações do painel de pedidos (balcão).
 * Extraído de PedidosBalcaoView para separação de responsabilidades.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import mesasService from '@/api/mesasService'
import sessoesConsumoService from '@/api/sessoesConsumoService'
import fundoConsumoService from '@/api/fundoConsumoService'
import produtosService from '@/api/produtosService'
import pedidosBalcaoService from '@/api/pedidosBalcaoService'
import subpedidosService from '@/api/subpedidos'
import { usePedidoWebSocket } from '@/composables/usePedidoWebSocket'

export function usePedidosBalcao() {
  const { formatCurrency } = useCurrency()
  const notificationStore = useNotificationStore()
  const authStore = useAuthStore()

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const { inscreverUnidade, statusConexao } = usePedidoWebSocket({
    onPedidoAtualizado: (notificacao) => {
      console.log('[usePedidosBalcao] WS: Pedido atualizado via tópico específico:', notificacao)
      recarregarPedido()
    },
    onSubPedidoPronto: (notificacao) => {
      notificationStore.sucesso(`🍽️ SubPedido pronto! ${notificacao.cozinhaNome || 'Cozinha'}`)
      recarregarPedido()
    }
  })

  // ── Estado dos modais ─────────────────────────────────────────────────────
  const mostrarModalCriarFundo = ref(false)
  const mostrarModalRecarregar = ref(false)
  const fundoSelecionado = ref(null)
  const mostrarModalNovoPedido = ref(false)
  const mostrarModalAdicionarProdutos = ref(false)
  const mostrarModalHistorico = ref(false)
  const mostrarModalAbrirSessao = ref(false)
  const mesaParaAbrirSessao = ref(null)

  const clienteSelecionadoFundo = ref(null)
  const sessaoSelecionadaFundo = ref(null)

  // ── Estado principal ──────────────────────────────────────────────────────
  const unidadeSelecionada = ref(null)
  const pedidosAtivos = ref([]) // Lista de pedidos ativos na sessão
  const fundoAtivo = ref(null)
  const loadingFundo = ref(false)
  const busca = ref('')
  const loading = ref(false)
  const loadingProdutos = ref(false)

  const unidadesConsumo = ref([])
  const produtosDisponiveis = ref([])

  // WebSocket cleanup
  let cleanupUnidadeWS = null
  const cleanupsPedidosWS = ref(new Map()) // Map<pedidoId, cleanupFn>

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

        unidadesConsumo.value = rawMesas.map(mesa => {
          const sessao = sessoesMap.get(mesa.id) || null
          return {
            ...mesa,
            sessaoAtiva: sessao,
            sessaoConsumoId: sessao?.id || null,
            qrCodeSessao: sessao?.qrCodeSessao || null,
            modoAnonimo: sessao?.modoAnonimo || false,
            cliente: sessao ? {
              id: sessao.clienteId,
              nome: sessao.nomeCliente,
              telefone: sessao.telefoneCliente,
              fundoId: sessao.fundoId,
              saldoFundo: sessao.saldoFundo || 0
            } : null,
            totalConsumido: sessao?.totalConsumo || 0
          }
        })
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
      console.log('[usePedidosBalcao] Resposta bruta getAll produtos:', response)
      
      // Lidar com ApiResponse<Page<Produto>> ou Page<Produto> ou Array
      const inner = response.data ?? response
      let lista = []
      
      if (Array.isArray(inner.content)) {
        lista = inner.content
      } else if (Array.isArray(inner.data?.content)) {
        lista = inner.data.content
      } else if (Array.isArray(inner)) {
        lista = inner
      } else if (inner.data && Array.isArray(inner.data)) {
        lista = inner.data
      }
      
      console.log('[usePedidosBalcao] Lista processada de produtos:', lista.length)
      produtosDisponiveis.value = lista.filter(p => p.ativo === true)
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao carregar produtos:', error)
      notificationStore.erro('Falha ao carregar catálogo de produtos')
    } finally {
      loadingProdutos.value = false
    }
  }

  const carregarPedidoAtivo = async (sessaoConsumoId) => {
    if (!sessaoConsumoId) { pedidosAtivos.value = []; return }
    try {
      const content = await pedidosBalcaoService.getPedidoAtivoSessao(sessaoConsumoId)
      const pedidosBasicos = Array.isArray(content) ? content : (content ? [content] : [])
      
      // Carregar detalhes completos (com subpedidos) para cada pedido ativo
      const pedidosCompletos = await Promise.all(
        pedidosBasicos.map(async (p) => {
          try {
            const detalheReq = await pedidosBalcaoService.getById(p.id)
            const detalhe = detalheReq?.data || detalheReq || p
            
            // Buscar explicitly os SubPedidos para este Pedido, porque o Backend não os envia em PedidoResponse
            const subpedidosReq = await subpedidosService.getByPedido(p.id)
            detalhe.subPedidos = subpedidosReq?.data || subpedidosReq || []
            
            return detalhe
          } catch (e) {
            console.error('[usePedidosBalcao] Erro ao carregar detalhes ou subpedidos:', e)
            return p
          }
        })
      )
      
      pedidosAtivos.value = pedidosCompletos
    } catch (error) {
      if (error.response?.status === 404) {
        pedidosAtivos.value = []
      } else {
        console.error('[usePedidosBalcao] Erro ao carregar pedidos ativos:', error)
        pedidosAtivos.value = []
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
          qrCodeSessao: sessaoData.qrCodeSessao || null,
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
    await carregarPedidoAtivo(unidade.sessaoAtivaId)
    await carregarFundoSessao(unidade.sessaoAtivaId, unidade.cliente?.id)
    cleanupUnidadeWS = inscreverUnidade(unidade.id, () => {
      console.log('[usePedidosBalcao] WS: Notificação na unidade, recarregando dados...')
      recarregarPedido()
    })
    if (produtosDisponiveis.value.length === 0) {
      await carregarProdutos()
    }
  }

  const voltarListaUnidades = () => {
    if (cleanupUnidadeWS) { cleanupUnidadeWS(); cleanupUnidadeWS = null }
    unidadeSelecionada.value = null
    pedidosAtivos.value = []
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
    const mesa = unidadesConsumo.value.find(u => u.sessaoAtivaId === sessaoId)
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

  const handleCriarFundo = (cliente, sessao = null) => {
    clienteSelecionadoFundo.value = cliente
    sessaoSelecionadaFundo.value = sessao
    mostrarModalCriarFundo.value = true
  }

  const fecharModalCriarFundo = () => {
    mostrarModalCriarFundo.value = false
    clienteSelecionadoFundo.value = null
    sessaoSelecionadaFundo.value = null
  }

  const handleFundoCriado = async (fundo) => {
    notificationStore.sucesso('Fundo criado com sucesso!')
    fecharModalCriarFundo()
    if (unidadeSelecionada.value) await selecionarUnidade(unidadeSelecionada.value)
  }

  const handleRecarregarFundo = (fundo) => {
    fundoSelecionado.value = fundo || fundoAtivo.value
    mostrarModalRecarregar.value = true
  }

  const fecharModalRecarregar = () => {
    mostrarModalRecarregar.value = false
    fundoSelecionado.value = null
  }

  const handleRecargaCriada = async (resp) => {
    // Para recargas imediatas (CASH/TPA), fechamos o modal e voltamos para a lista
    // Para métodos que geram pagamento (GPO/REF), o usuário pode querer ver os dados no modal,
    // mas se o usuário pediu para "desaparecer e redirecionar", vamos uniformizar se for sucesso.
    
    // Se a resposta contém o saldo atualizado ou é um sucesso imediato
    fecharModalRecarregar()
    
    if (unidadeSelecionada.value) {
      await carregarUnidades() // Refresh all
      await recarregarPedido() // Atualizar dados do pedido ativo s/ fechar contexto
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

  const liquidarConta = async ({ metodo, qrCodeFundoExterno, telefone }) => {
    const sessaoId = unidadeSelecionada.value?.sessaoConsumoId
    if (!sessaoId) { notificationStore.erro('Sessão não identificada'); return }
    try {
      await sessoesConsumoService.liquidar(sessaoId, metodo, qrCodeFundoExterno, telefone)
      notificationStore.sucesso('Conta liquidada com sucesso!')
      await recarregarPedido()
      voltarListaUnidades()
    } catch (error) {
      console.error('[usePedidosBalcao] Erro ao liquidar conta:', error)
      notificationStore.erro('Erro ao liquidar conta: ' + (error.response?.data?.message || error.message))
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
  const { inscreverPedido, inscreverSubPedido } = usePedidoWebSocket() // Nova instância ou reuso

  // Gerir subscrições de pedidos individuais e subpedidos para reatividade total
  watch(pedidosAtivos, (novosPedidos) => {
    // 1. Determinar todos os IDs que devem estar ativos
    const novosIds = new Set()
    novosPedidos.forEach(p => {
      novosIds.add(`pedido-${p.id}`)
      p.subPedidos?.forEach(s => novosIds.add(`sub-${s.id}`))
    })

    // 2. Limpar inscrições que não são mais necessárias
    cleanupsPedidosWS.value.forEach((cleanup, idChave) => {
      if (!novosIds.has(idChave)) {
        cleanup()
        cleanupsPedidosWS.value.delete(idChave)
        console.log(`[usePedidosBalcao] WS: Desinscrito de ${idChave}`)
      }
    })

    // 3. Inscrever nos novos
    novosPedidos.forEach(pedido => {
      const pedidoKey = `pedido-${pedido.id}`
      if (!cleanupsPedidosWS.value.has(pedidoKey)) {
        const cleanup = inscreverPedido(pedido.id, () => {
          console.log(`[usePedidosBalcao] WS: Atualização no pedido ${pedido.id}`)
          recarregarPedido()
        })
        cleanupsPedidosWS.value.set(pedidoKey, cleanup)
      }

      pedido.subPedidos?.forEach(sub => {
        const subKey = `sub-${sub.id}`
        if (!cleanupsPedidosWS.value.has(subKey)) {
          const cleanupSub = inscreverSubPedido(sub.id, () => {
            console.log(`[usePedidosBalcao] WS: Atualização no subpedido ${sub.id}`)
            recarregarPedido()
          })
          cleanupsPedidosWS.value.set(subKey, cleanupSub)
        }
      })
    })
  }, { deep: true })
  // ── Persistência contra Refresh (F5) ───────────────────────────────────────
  watch(unidadeSelecionada, (unidade) => {
    if (unidade && unidade.id) {
      sessionStorage.setItem('admin_painel_unidade_id', String(unidade.id))
    } else {
      sessionStorage.removeItem('admin_painel_unidade_id')
    }
  })

  onMounted(async () => {
    await carregarUnidades()
    
    // Restaurar seleção caso haja refrescamento da página (F5)
    const ultimaUnidadeId = sessionStorage.getItem('admin_painel_unidade_id')
    if (ultimaUnidadeId && !unidadeSelecionada.value) {
      const unidadeSalva = unidadesConsumo.value.find(u => String(u.id) === ultimaUnidadeId)
      if (unidadeSalva) {
        selecionarUnidade(unidadeSalva)
      }
    }
  })

  onUnmounted(() => { 
    if (cleanupUnidadeWS) cleanupUnidadeWS() 
    cleanupsPedidosWS.value.forEach(cleanup => cleanup())
    cleanupsPedidosWS.value.clear()
  })

  return {
    // State
    formatCurrency,
    statusConexao,
    unidadeSelecionada,
    pedidosAtivos,
    pedidoAtivo: computed(() => pedidosAtivos.value[0] || null), // Retro-compatibilidade for simple cases
    fundoAtivo,
    loadingFundo,
    busca,
    loading,
    loadingProdutos,
    unidadesConsumo,
    produtosDisponiveis,
    mostrarModalCriarFundo,
    mostrarModalNovoPedido,
    mostrarModalAdicionarProdutos,
    mostrarModalHistorico,
    mostrarModalAbrirSessao,
    mesaParaAbrirSessao,
    clienteSelecionadoFundo,
    sessaoSelecionadaFundo,
    mostrarModalRecarregar,
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
    liquidarConta,
    iconeTipoUnidade,
    labelStatusUnidade
  }
}
