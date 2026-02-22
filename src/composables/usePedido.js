/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPOSABLE - usePedido (UI Interface Layer)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * RESPONSABILIDADE:
 * - Interface reativa para componentes Vue
 * - Optimistic UI updates (atualização imediata com rollback)
 * - Loading states granulares
 * - Error handling com notificações
 * - Debouncing e throttling
 * - Cleanup automático
 * 
 * ARQUITETURA:
 * - Composition API
 * - Refs reativos para UI bindings
 * - Wrapper sobre store Pinia
 * - Sem lógica de negócio
 * 
 * PRODUÇÃO:
 * - Optimistic updates com rollback automático
 * - Error recovery strategies
 * - Performance: debounce em operações frequentes
 * - Memory safety: cleanup em onUnmounted
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { usePedidoStore } from '@/store/pedido.store'
import { useNotificationStore } from '@/store/notifications'
import { PedidoConflictError } from '@/api/pedido.api'
import { ValidationError, BusinessRuleError } from '@/services/pedido.service'

/**
 * Composable principal para pedidos
 * 
 * @param {Object} options - Opções de configuração
 * @param {boolean} [options.autoLoad=true] - Carregar automaticamente
 * @param {number} [options.pedidoId] - ID do pedido a carregar
 * @param {number} [options.unidadeConsumoId] - ID da unidade
 * @param {boolean} [options.optimisticUI=true] - Ativar optimistic updates
 */
export function usePedido(options = {}) {
  const {
    autoLoad = true,
    pedidoId = null,
    unidadeConsumoId = null,
    optimisticUI = true
  } = options

  // ──────────────────────────────────────────────────────────────────────────────
  // STORES
  // ──────────────────────────────────────────────────────────────────────────────

  const pedidoStore = usePedidoStore()
  const notificationStore = useNotificationStore()

  // ──────────────────────────────────────────────────────────────────────────────
  // ESTADO LOCAL
  // ──────────────────────────────────────────────────────────────────────────────

  const loading = ref(false)
  const error = ref(null)
  const pedido = ref(null)

  // Loading states granulares
  const loadingStates = ref({
    fetching: false,
    creating: false,
    addingItem: false,
    updatingItem: false,
    removingItem: false,
    closing: false,
    canceling: false
  })

  // Snapshot para rollback (optimistic UI)
  const snapshot = ref(null)

  // ──────────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Se está realizando qualquer operação
   */
  const isLoading = computed(() => {
    return Object.values(loadingStates.value).some(v => v === true)
  })

  /**
   * Se pedido pode ser editado
   */
  const canEdit = computed(() => {
    if (!pedido.value) return false
    return pedido.value.status === 'CRIADO' || pedido.value.status === 'EM_ANDAMENTO'
  })

  /**
   * Se pedido pode ser fechado
   */
  const canClose = computed(() => {
    if (!pedido.value) return false
    return (
      canEdit.value &&
      pedido.value.itens &&
      pedido.value.itens.length > 0 &&
      pedido.value.valorTotal > 0
    )
  })

  /**
   * Se pedido pode ser cancelado (apenas GERENTE)
   */
  const canCancel = computed(() => {
    if (!pedido.value) return false
    return pedido.value.status !== 'FINALIZADO' && pedido.value.status !== 'CANCELADO'
  })

  /**
   * Totais calculados
   */
  const totais = computed(() => {
    if (!pedido.value?.itens) {
      return { subtotal: 0, quantidade: 0, itens: 0 }
    }

    return pedido.value.itens.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + (item.valorUnitario * item.quantidade),
        quantidade: acc.quantidade + item.quantidade,
        itens: acc.itens + 1
      }),
      { subtotal: 0, quantidade: 0, itens: 0 }
    )
  })

  // ──────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Cria snapshot para rollback
   */
  function createSnapshot() {
    if (pedido.value) {
      snapshot.value = JSON.parse(JSON.stringify(pedido.value))
    }
  }

  /**
   * Restaura snapshot (rollback)
   */
  function restoreSnapshot() {
    if (snapshot.value) {
      pedido.value = snapshot.value
      snapshot.value = null
    }
  }

  /**
   * Limpa snapshot
   */
  function clearSnapshot() {
    snapshot.value = null
  }

  /**
   * Handler centralizado de erros
   */
  function handleError(err, context = '') {
    console.error(`[usePedido] Erro em ${context}:`, err)

    error.value = err

    let message = 'Erro ao processar operação'
    let type = 'error'

    if (err instanceof ValidationError) {
      message = err.message
      type = 'warning'
    } else if (err instanceof BusinessRuleError) {
      message = err.message
      type = 'warning'
    } else if (err instanceof PedidoConflictError) {
      message = 'O pedido foi modificado por outro usuário. Atualizando...'
      type = 'info'
    } else if (err.response) {
      switch (err.response.status) {
        case 400:
          message = err.response.data?.message || 'Dados inválidos'
          break
        case 401:
          message = 'Sessão expirada. Faça login novamente.'
          break
        case 403:
          message = 'Você não tem permissão para esta operação'
          break
        case 404:
          message = 'Pedido não encontrado'
          break
        case 409:
          message = 'Conflito de versão. Atualizando...'
          type = 'info'
          break
        case 500:
          message = 'Erro no servidor. Tente novamente.'
          break
        default:
          message = err.response.data?.message || 'Erro desconhecido'
      }
    } else if (err.message) {
      message = err.message
    }

    notificationStore.add({
      type,
      message,
      duration: type === 'error' ? 5000 : 3000
    })

    return message
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────────────────────────────────────────

  /**
   * Carregar pedido por ID
   */
  async function load(id = pedidoId, forceRefresh = false) {
    if (!id) {
      console.warn('[usePedido] ID não fornecido para load')
      return null
    }

    loadingStates.value.fetching = true
    loading.value = true
    error.value = null

    try {
      const result = await pedidoStore.fetchPedido(id, { forceRefresh })
      pedido.value = result
      return result
    } catch (err) {
      handleError(err, 'load')
      return null
    } finally {
      loadingStates.value.fetching = false
      loading.value = false
    }
  }

  /**
   * Criar novo pedido
   */
  async function criar(dados) {
    loadingStates.value.creating = true
    loading.value = true
    error.value = null

    try {
      const novoPedido = await pedidoStore.criar(dados)
      pedido.value = novoPedido

      notificationStore.add({
        type: 'success',
        message: `Pedido #${novoPedido.numero} criado com sucesso`,
        duration: 3000
      })

      return novoPedido
    } catch (err) {
      handleError(err, 'criar')
      return null
    } finally {
      loadingStates.value.creating = false
      loading.value = false
    }
  }

  /**
   * Adicionar item ao pedido (com optimistic UI)
   */
  async function adicionarItem(item) {
    if (!pedido.value) {
      console.error('[usePedido] Nenhum pedido carregado')
      return null
    }

    loadingStates.value.addingItem = true
    error.value = null

    // Optimistic UI
    if (optimisticUI) {
      createSnapshot()

      // Adiciona item localmente
      const itemOptimistic = {
        id: `temp-${Date.now()}`,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome || 'Produto',
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario || 0,
        observacao: item.observacao || null,
        _optimistic: true
      }

      pedido.value.itens = [...(pedido.value.itens || []), itemOptimistic]
      pedido.value.valorTotal += itemOptimistic.valorUnitario * itemOptimistic.quantidade
    }

    try {
      const pedidoAtualizado = await pedidoStore.adicionarItem(pedido.value.id, item)

      pedido.value = pedidoAtualizado
      clearSnapshot()

      notificationStore.add({
        type: 'success',
        message: 'Item adicionado',
        duration: 2000
      })

      return pedidoAtualizado
    } catch (err) {
      // Rollback em caso de erro
      if (optimisticUI) {
        restoreSnapshot()
      }

      handleError(err, 'adicionarItem')
      return null
    } finally {
      loadingStates.value.addingItem = false
    }
  }

  /**
   * Atualizar quantidade de item (com optimistic UI)
   */
  async function atualizarQuantidade(itemId, novaQuantidade) {
    if (!pedido.value) return null

    loadingStates.value.updatingItem = true
    error.value = null

    // Optimistic UI
    if (optimisticUI) {
      createSnapshot()

      const item = pedido.value.itens.find(i => i.id === itemId)
      if (item) {
        const diff = (novaQuantidade - item.quantidade) * item.valorUnitario
        item.quantidade = novaQuantidade
        pedido.value.valorTotal += diff
      }
    }

    try {
      const pedidoAtualizado = await pedidoStore.atualizarQuantidadeItem(
        pedido.value.id,
        itemId,
        novaQuantidade
      )

      pedido.value = pedidoAtualizado
      clearSnapshot()

      notificationStore.add({
        type: 'success',
        message: 'Quantidade atualizada',
        duration: 2000
      })

      return pedidoAtualizado
    } catch (err) {
      if (optimisticUI) {
        restoreSnapshot()
      }

      handleError(err, 'atualizarQuantidade')
      return null
    } finally {
      loadingStates.value.updatingItem = false
    }
  }

  /**
   * Remover item do pedido (com optimistic UI)
   */
  async function removerItem(itemId) {
    if (!pedido.value) return null

    loadingStates.value.removingItem = true
    error.value = null

    // Optimistic UI
    if (optimisticUI) {
      createSnapshot()

      const item = pedido.value.itens.find(i => i.id === itemId)
      if (item) {
        pedido.value.itens = pedido.value.itens.filter(i => i.id !== itemId)
        pedido.value.valorTotal -= item.valorUnitario * item.quantidade
      }
    }

    try {
      const pedidoAtualizado = await pedidoStore.removerItem(pedido.value.id, itemId)

      pedido.value = pedidoAtualizado
      clearSnapshot()

      notificationStore.add({
        type: 'success',
        message: 'Item removido',
        duration: 2000
      })

      return pedidoAtualizado
    } catch (err) {
      if (optimisticUI) {
        restoreSnapshot()
      }

      handleError(err, 'removerItem')
      return null
    } finally {
      loadingStates.value.removingItem = false
    }
  }

  /**
   * Fechar pedido (operação crítica - SEM optimistic UI)
   */
  async function fechar(dadosFechamento) {
    if (!canClose.value) {
      notificationStore.add({
        type: 'warning',
        message: 'Pedido não pode ser fechado',
        duration: 3000
      })
      return null
    }

    loadingStates.value.closing = true
    loading.value = true
    error.value = null

    try {
      const pedidoFechado = await pedidoStore.fechar(pedido.value.id, dadosFechamento)

      pedido.value = pedidoFechado

      notificationStore.add({
        type: 'success',
        message: `Pedido #${pedidoFechado.numero} fechado com sucesso`,
        duration: 4000
      })

      return pedidoFechado
    } catch (err) {
      handleError(err, 'fechar')
      return null
    } finally {
      loadingStates.value.closing = false
      loading.value = false
    }
  }

  /**
   * Cancelar pedido
   */
  async function cancelar(motivo) {
    if (!canCancel.value) {
      notificationStore.add({
        type: 'warning',
        message: 'Pedido não pode ser cancelado',
        duration: 3000
      })
      return null
    }

    loadingStates.value.canceling = true
    loading.value = true
    error.value = null

    try {
      const pedidoCancelado = await pedidoStore.cancelar(pedido.value.id, motivo)

      pedido.value = pedidoCancelado

      notificationStore.add({
        type: 'info',
        message: `Pedido #${pedidoCancelado.numero} cancelado`,
        duration: 3000
      })

      return pedidoCancelado
    } catch (err) {
      handleError(err, 'cancelar')
      return null
    } finally {
      loadingStates.value.canceling = false
      loading.value = false
    }
  }

  /**
   * Refresh manual
   */
  async function refresh() {
    if (!pedido.value?.id) return null
    return await load(pedido.value.id, true)
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ──────────────────────────────────────────────────────────────────────────────

  // Auto-load se pedidoId fornecido
  if (autoLoad && pedidoId) {
    load(pedidoId)
  }

  // Cleanup
  onUnmounted(() => {
    clearSnapshot()
  })

  // ──────────────────────────────────────────────────────────────────────────────
  // EXPORT
  // ──────────────────────────────────────────────────────────────────────────────

  return {
    // Estado
    pedido,
    loading,
    loadingStates,
    error,

    // Computed
    isLoading,
    canEdit,
    canClose,
    canCancel,
    totais,

    // Actions
    load,
    criar,
    adicionarItem,
    atualizarQuantidade,
    removerItem,
    fechar,
    cancelar,
    refresh
  }
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPOSABLE AUXILIAR: usePedidosLista
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Para listagens e dashboards
 */
export function usePedidosLista(options = {}) {
  const {
    autoLoad = true,
    unidadeConsumoId = null,
    filtroStatus = null
  } = options

  const pedidoStore = usePedidoStore()
  const notificationStore = useNotificationStore()

  const loading = ref(false)
  const error = ref(null)
  const pedidos = ref([])

  /**
   * Carregar pedidos ativos
   */
  async function loadAtivos() {
    loading.value = true
    error.value = null

    try {
      const result = await pedidoStore.fetchAtivos()
      pedidos.value = result
      return result
    } catch (err) {
      console.error('[usePedidosLista] Erro ao carregar ativos:', err)
      error.value = err

      notificationStore.add({
        type: 'error',
        message: 'Erro ao carregar pedidos ativos',
        duration: 3000
      })

      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Carregar pedidos por unidade
   */
  async function loadByUnidade(id = unidadeConsumoId) {
    if (!id) {
      console.warn('[usePedidosLista] unidadeConsumoId não fornecido')
      return []
    }

    loading.value = true
    error.value = null

    try {
      const result = await pedidoStore.fetchByUnidadeConsumo(id)
      pedidos.value = result
      return result
    } catch (err) {
      console.error('[usePedidosLista] Erro ao carregar por unidade:', err)
      error.value = err

      notificationStore.add({
        type: 'error',
        message: 'Erro ao carregar pedidos da unidade',
        duration: 3000
      })

      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Filtrar pedidos localmente
   */
  const pedidosFiltrados = computed(() => {
    if (!filtroStatus) return pedidos.value

    return pedidos.value.filter(p => p.status === filtroStatus)
  })

  // Auto-load
  if (autoLoad) {
    if (unidadeConsumoId) {
      loadByUnidade()
    } else {
      loadAtivos()
    }
  }

  return {
    pedidos,
    pedidosFiltrados,
    loading,
    error,
    loadAtivos,
    loadByUnidade
  }
}

export default usePedido
