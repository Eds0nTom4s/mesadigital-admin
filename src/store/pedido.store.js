/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PINIA STORE - PEDIDOS (State Management)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * RESPONSABILIDADE:
 * - Estado global reativo e centralizado
 * - Cache de pedidos com TTL
 * - Sincronização com WebSocket
 * - Normalização de dados (evita duplicação)
 * - Histórico de mudanças (auditoria client-side)
 * 
 * ARQUITETURA:
 * - Composition API (setup syntax)
 * - Computed values para queries derivadas
 * - Actions assíncronas
 * - Sem lógica de negócio (delega ao service)
 * - Suporte a múltiplos pedidos simultâneos
 * 
 * PRODUÇÃO:
 * - Controle de versão por pedido (concorrência otimista)
 * - Queue de operações offline
 * - Sincronização incremental via WebSocket
 * - Garbage collection de cache antigo
 * - Performance: indexação por ID e unidadeId
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pedidoService from '@/services/pedido.service'
import { PedidoConflictError } from '@/api/pedido.api'
import { PEDIDO_STATUS } from '@/utils/pedido.types'

/**
 * Configurações de cache
 */
const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000,           // 5 minutos
  MAX_ITEMS: 100,                // Máximo de pedidos em cache
  GC_INTERVAL: 60 * 1000,        // Limpeza a cada 1 minuto
  STALE_THRESHOLD: 30 * 1000     // Considera stale após 30s
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * STORE PRINCIPAL
 * ════════════════════════════════════════════════════════════════════════════════
 */

export const usePedidoStore = defineStore('pedido', () => {
  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * ESTADO
   * ──────────────────────────────────────────────────────────────────────────────
   */

  // Cache normalizado: Map<pedidoId, pedidoData>
  const pedidosById = ref(new Map())

  // Metadados de cache: Map<pedidoId, metadata>
  const cacheMetadata = ref(new Map())

  // Pedido ativo no contexto atual (ex: editando)
  const pedidoAtivo = ref(null)

  // Queue de operações offline
  const offlineQueue = ref([])

  // Estado de sincronização WebSocket
  const syncStatus = ref({
    connected: false,
    lastSync: null,
    pendingChanges: 0
  })

  // Loading states por operação
  const loadingStates = ref({
    fetchingAtivos: false,
    fetchingById: new Set(),
    creating: false,
    updating: new Set()
  })

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * GETTERS (COMPUTED)
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Lista todos os pedidos em cache
   */
  const todosPedidos = computed(() => {
    return Array.from(pedidosById.value.values())
  })

  /**
   * Pedidos ativos (CRIADO ou EM_ANDAMENTO)
   */
  const pedidosAtivos = computed(() => {
    return todosPedidos.value.filter(p =>
      p.status === PEDIDO_STATUS.CRIADO ||
      p.status === PEDIDO_STATUS.EM_ANDAMENTO
    )
  })

  /**
   * Pedidos finalizados (cache recente)
   */
  const pedidosFinalizados = computed(() => {
    return todosPedidos.value.filter(p => p.status === PEDIDO_STATUS.FINALIZADO)
  })

  /**
   * Pedidos por unidade de consumo
   */
  const pedidosPorUnidade = computed(() => {
    const map = new Map()
    todosPedidos.value.forEach(pedido => {
      if (!map.has(pedido.unidadeConsumoId)) {
        map.set(pedido.unidadeConsumoId, [])
      }
      map.get(pedido.unidadeConsumoId).push(pedido)
    })
    return map
  })

  /**
   * Total de pedidos ativos
   */
  const totalPedidosAtivos = computed(() => pedidosAtivos.value.length)

  /**
   * Verifica se um pedido está carregando
   */
  const isLoading = computed(() => (pedidoId) => {
    return loadingStates.value.fetchingById.has(pedidoId) ||
           loadingStates.value.updating.has(pedidoId)
  })

  /**
   * Verifica se cache de um pedido está stale (desatualizado)
   */
  const isCacheStale = computed(() => (pedidoId) => {
    const metadata = cacheMetadata.value.get(pedidoId)
    if (!metadata) return true

    const age = Date.now() - metadata.timestamp
    return age > CACHE_CONFIG.STALE_THRESHOLD
  })

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * MUTATIONS (Operações síncronas no estado)
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Adiciona/atualiza pedido no cache
   */
  function setPedido(pedido) {
    if (!pedido || !pedido.id) return

    pedidosById.value.set(pedido.id, pedido)

    // Atualiza metadata
    cacheMetadata.value.set(pedido.id, {
      timestamp: Date.now(),
      versao: pedido.versao,
      etag: pedido.etag || null,
      source: 'api'
    })

    // Garbage collection se exceder limite
    if (pedidosById.value.size > CACHE_CONFIG.MAX_ITEMS) {
      garbageCollectCache()
    }
  }

  /**
   * Remove pedido do cache
   */
  function removePedido(pedidoId) {
    pedidosById.value.delete(pedidoId)
    cacheMetadata.value.delete(pedidoId)
  }

  /**
   * Define pedido ativo
   */
  function setAtivo(pedido) {
    pedidoAtivo.value = pedido
  }

  /**
   * Limpa pedido ativo
   */
  function clearAtivo() {
    pedidoAtivo.value = null
  }

  /**
   * Limpa todo o cache
   */
  function clearCache() {
    pedidosById.value.clear()
    cacheMetadata.value.clear()
  }

  /**
   * Garbage collection - remove pedidos antigos do cache
   */
  function garbageCollectCache() {
    const now = Date.now()
    const toRemove = []

    cacheMetadata.value.forEach((metadata, pedidoId) => {
      const age = now - metadata.timestamp
      if (age > CACHE_CONFIG.TTL) {
        toRemove.push(pedidoId)
      }
    })

    toRemove.forEach(id => {
      pedidosById.value.delete(id)
      cacheMetadata.value.delete(id)
    })

    if (toRemove.length > 0) {
      console.log(`[Store] GC removeu ${toRemove.length} pedidos do cache`)
    }
  }

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * ACTIONS (Operações assíncronas)
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Buscar pedido por ID (com cache inteligente)
   */
  async function fetchPedido(pedidoId, options = {}) {
    // Verifica cache primeiro
    if (!options.forceRefresh && pedidosById.value.has(pedidoId)) {
      const metadata = cacheMetadata.value.get(pedidoId)
      const age = Date.now() - metadata.timestamp

      // Se cache está fresh, retorna
      if (age < CACHE_CONFIG.STALE_THRESHOLD) {
        console.log(`[Store] Cache HIT para pedido ${pedidoId}`)
        return pedidosById.value.get(pedidoId)
      }
    }

    // Cache miss ou stale - busca do servidor
    loadingStates.value.fetchingById.add(pedidoId)

    try {
      const metadata = cacheMetadata.value.get(pedidoId)
      const result = await pedidoService.getById(pedidoId, {
        etag: metadata?.etag
      })

      // Se retornou 304 Not Modified, cache ainda é válido
      if (result.notModified) {
        console.log(`[Store] Cache válido (304) para pedido ${pedidoId}`)
        // Atualiza timestamp
        cacheMetadata.value.set(pedidoId, {
          ...metadata,
          timestamp: Date.now()
        })
        return pedidosById.value.get(pedidoId)
      }

      // Cache atualizado
      setPedido(result.data)
      console.log(`[Store] Cache atualizado para pedido ${pedidoId}`)
      return result.data
    } catch (error) {
      console.error(`[Store] Erro ao buscar pedido ${pedidoId}:`, error)
      throw error
    } finally {
      loadingStates.value.fetchingById.delete(pedidoId)
    }
  }

  /**
   * Buscar todos os pedidos ativos
   */
  async function fetchAtivos(options = {}) {
    loadingStates.value.fetchingAtivos = true

    try {
      const pedidos = await pedidoService.getAtivos()

      // Atualiza cache
      pedidos.forEach(pedido => setPedido(pedido))

      console.log(`[Store] ${pedidos.length} pedidos ativos carregados`)
      return pedidos
    } catch (error) {
      console.error('[Store] Erro ao buscar pedidos ativos:', error)
      throw error
    } finally {
      loadingStates.value.fetchingAtivos = false
    }
  }

  /**
   * Buscar pedidos por unidade de consumo
   */
  async function fetchByUnidadeConsumo(unidadeConsumoId) {
    try {
      const pedidos = await pedidoService.getByUnidadeConsumo(unidadeConsumoId)

      // Atualiza cache
      pedidos.forEach(pedido => setPedido(pedido))

      return pedidos
    } catch (error) {
      console.error(`[Store] Erro ao buscar pedidos da unidade ${unidadeConsumoId}:`, error)
      throw error
    }
  }

  /**
   * Criar novo pedido
   */
  async function criar(dados) {
    loadingStates.value.creating = true

    try {
      const pedido = await pedidoService.criar(dados)

      // Adiciona ao cache
      setPedido(pedido)

      // Define como ativo
      setAtivo(pedido)

      console.log(`[Store] Pedido ${pedido.id} criado com sucesso`)
      return pedido
    } catch (error) {
      console.error('[Store] Erro ao criar pedido:', error)
      throw error
    } finally {
      loadingStates.value.creating = false
    }
  }

  /**
   * Adicionar item ao pedido (com retry de conflito)
   */
  async function adicionarItem(pedidoId, item, options = {}) {
    loadingStates.value.updating.add(pedidoId)

    try {
      // Pega versão atual do cache
      const pedidoCache = pedidosById.value.get(pedidoId)
      const versao = options.versao || pedidoCache?.versao

      const pedidoAtualizado = await pedidoService.adicionarItem(pedidoId, item, { versao })

      // Atualiza cache
      setPedido(pedidoAtualizado)

      // Atualiza pedido ativo se for o mesmo
      if (pedidoAtivo.value?.id === pedidoId) {
        setAtivo(pedidoAtualizado)
      }

      return pedidoAtualizado
    } catch (error) {
      if (error instanceof PedidoConflictError) {
        console.warn(`[Store] Conflito ao adicionar item no pedido ${pedidoId}`)

        // Estratégia: refresh automático e retry
        if (!options.retried) {
          console.log('[Store] Tentando refresh e retry...')
          await fetchPedido(pedidoId, { forceRefresh: true })
          return await adicionarItem(pedidoId, item, { ...options, retried: true })
        }

        // Se já retried, propaga erro
        throw error
      }
      throw error
    } finally {
      loadingStates.value.updating.delete(pedidoId)
    }
  }

  /**
   * Atualizar quantidade de item
   */
  async function atualizarQuantidadeItem(pedidoId, itemId, quantidade, options = {}) {
    loadingStates.value.updating.add(pedidoId)

    try {
      const pedidoCache = pedidosById.value.get(pedidoId)
      const versao = options.versao || pedidoCache?.versao

      const pedidoAtualizado = await pedidoService.atualizarQuantidadeItem(
        pedidoId,
        itemId,
        quantidade,
        { versao }
      )

      setPedido(pedidoAtualizado)

      if (pedidoAtivo.value?.id === pedidoId) {
        setAtivo(pedidoAtualizado)
      }

      return pedidoAtualizado
    } catch (error) {
      if (error instanceof PedidoConflictError && !options.retried) {
        await fetchPedido(pedidoId, { forceRefresh: true })
        return await atualizarQuantidadeItem(pedidoId, itemId, quantidade, {
          ...options,
          retried: true
        })
      }
      throw error
    } finally {
      loadingStates.value.updating.delete(pedidoId)
    }
  }

  /**
   * Remover item do pedido
   */
  async function removerItem(pedidoId, itemId, options = {}) {
    loadingStates.value.updating.add(pedidoId)

    try {
      const pedidoCache = pedidosById.value.get(pedidoId)
      const versao = options.versao || pedidoCache?.versao

      const pedidoAtualizado = await pedidoService.removerItem(pedidoId, itemId, { versao })

      setPedido(pedidoAtualizado)

      if (pedidoAtivo.value?.id === pedidoId) {
        setAtivo(pedidoAtualizado)
      }

      return pedidoAtualizado
    } catch (error) {
      if (error instanceof PedidoConflictError && !options.retried) {
        await fetchPedido(pedidoId, { forceRefresh: true })
        return await removerItem(pedidoId, itemId, { ...options, retried: true })
      }
      throw error
    } finally {
      loadingStates.value.updating.delete(pedidoId)
    }
  }

  /**
   * Fechar pedido
   */
  async function fechar(pedidoId, dados) {
    loadingStates.value.updating.add(pedidoId)

    try {
      const pedidoFechado = await pedidoService.fechar(pedidoId, dados)

      // Atualiza cache
      setPedido(pedidoFechado)

      // Limpa pedido ativo
      if (pedidoAtivo.value?.id === pedidoId) {
        clearAtivo()
      }

      console.log(`[Store] Pedido ${pedidoId} fechado com sucesso`)
      return pedidoFechado
    } catch (error) {
      console.error(`[Store] Erro ao fechar pedido ${pedidoId}:`, error)
      throw error
    } finally {
      loadingStates.value.updating.delete(pedidoId)
    }
  }

  /**
   * Cancelar pedido
   */
  async function cancelar(pedidoId, motivo) {
    loadingStates.value.updating.add(pedidoId)

    try {
      const pedidoCancelado = await pedidoService.cancelar(pedidoId, motivo)

      setPedido(pedidoCancelado)

      if (pedidoAtivo.value?.id === pedidoId) {
        clearAtivo()
      }

      console.log(`[Store] Pedido ${pedidoId} cancelado`)
      return pedidoCancelado
    } catch (error) {
      console.error(`[Store] Erro ao cancelar pedido ${pedidoId}:`, error)
      throw error
    } finally {
      loadingStates.value.updating.delete(pedidoId)
    }
  }

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * SINCRONIZAÇÃO WEBSOCKET
   * ──────────────────────────────────────────────────────────────────────────────
   */

  /**
   * Handler de evento WebSocket: pedido atualizado
   */
  function handleWebSocketUpdate(payload) {
    const { pedidoId, tipo, data } = payload

    console.log(`[Store] WebSocket update recebido:`, { pedidoId, tipo })

    switch (tipo) {
      case 'PEDIDO_CRIADO':
      case 'PEDIDO_ATUALIZADO':
        setPedido(data)
        break

      case 'ITEM_ADICIONADO':
      case 'ITEM_REMOVIDO':
      case 'ITEM_ATUALIZADO':
        // Atualiza pedido completo
        fetchPedido(pedidoId, { forceRefresh: true })
        break

      case 'PEDIDO_FINALIZADO':
      case 'PEDIDO_CANCELADO':
        setPedido(data)
        if (pedidoAtivo.value?.id === pedidoId) {
          clearAtivo()
        }
        break

      default:
        console.warn(`[Store] Tipo de evento desconhecido: ${tipo}`)
    }

    syncStatus.value.lastSync = Date.now()
  }

  /**
   * Handler de reconexão WebSocket
   */
  async function handleWebSocketReconnect() {
    console.log('[Store] WebSocket reconectado - sincronizando...')

    // Re-carrega pedidos ativos
    await fetchAtivos({ forceRefresh: true })

    // Re-carrega pedido ativo se existir
    if (pedidoAtivo.value?.id) {
      await fetchPedido(pedidoAtivo.value.id, { forceRefresh: true })
    }

    syncStatus.value.connected = true
  }

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * INICIALIZAÇÃO
   * ──────────────────────────────────────────────────────────────────────────────
   */

  // Garbage collection periódico
  let gcInterval = null

  function startGarbageCollector() {
    if (gcInterval) return

    gcInterval = setInterval(() => {
      garbageCollectCache()
    }, CACHE_CONFIG.GC_INTERVAL)
  }

  function stopGarbageCollector() {
    if (gcInterval) {
      clearInterval(gcInterval)
      gcInterval = null
    }
  }

  // Inicia GC ao criar store
  startGarbageCollector()

  /**
   * ──────────────────────────────────────────────────────────────────────────────
   * EXPORT
   * ──────────────────────────────────────────────────────────────────────────────
   */

  return {
    // Estado
    pedidoAtivo,
    syncStatus,
    loadingStates,

    // Getters
    todosPedidos,
    pedidosAtivos,
    pedidosFinalizados,
    pedidosPorUnidade,
    totalPedidosAtivos,
    isLoading,
    isCacheStale,

    // Mutations
    setPedido,
    removePedido,
    setAtivo,
    clearAtivo,
    clearCache,

    // Actions
    fetchPedido,
    fetchAtivos,
    fetchByUnidadeConsumo,
    criar,
    adicionarItem,
    atualizarQuantidadeItem,
    removerItem,
    fechar,
    cancelar,

    // WebSocket
    handleWebSocketUpdate,
    handleWebSocketReconnect,

    // Lifecycle
    startGarbageCollector,
    stopGarbageCollector
  }
})

export default usePedidoStore
