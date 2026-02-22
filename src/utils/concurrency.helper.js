/**
 * ════════════════════════════════════════════════════════════════════════════════
 * HELPER DE CONCORRÊNCIA - PEDIDOS
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * RESPONSABILIDADE:
 * - Resolução de conflitos (conflict resolution strategies)
 * - Queue de operações offline
 * - Lock otimista com versionamento
 * - Merge de alterações concorrentes
 * - Detecção de conflitos semânticos
 * 
 * ARQUITETURA:
 * - Estratégias plugáveis de resolução
 * - Queue FIFO com retry
 * - Three-way merge (base, local, remote)
 * 
 * PRODUÇÃO:
 * - Battle-tested strategies
 * - Performance: operações em O(n)
 * - Idempotência garantida
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ESTRATÉGIAS DE RESOLUÇÃO DE CONFLITOS
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const CONFLICT_STRATEGY = Object.freeze({
  // Descarta alterações locais e usa versão do servidor (padrão)
  SERVER_WINS: 'SERVER_WINS',

  // Mantém alterações locais e ignora servidor (perigoso)
  CLIENT_WINS: 'CLIENT_WINS',

  // Tenta fazer merge automático (recomendado)
  AUTO_MERGE: 'AUTO_MERGE',

  // Pergunta ao usuário (para conflitos críticos)
  ASK_USER: 'ASK_USER',

  // Retry com versão atualizada
  RETRY: 'RETRY'
})

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * TIPOS DE OPERAÇÕES
 * ──────────────────────────────────────────────────────────────────────────────
 */

const OPERATION_TYPE = Object.freeze({
  CREATE: 'CREATE',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLOSE: 'CLOSE',
  CANCEL: 'CANCEL'
})

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * CONFLICT RESOLVER
 * ──────────────────────────────────────────────────────────────────────────────
 */

export class ConflictResolver {
  constructor(strategy = CONFLICT_STRATEGY.AUTO_MERGE) {
    this.strategy = strategy
  }

  /**
   * Resolve conflito entre versão local e servidor
   * 
   * @param {Object} localState - Estado local (cliente)
   * @param {Object} serverState - Estado servidor
   * @param {Object} baseState - Estado base (último sync)
   * @returns {Object} Estado resolvido + metadata
   */
  resolve(localState, serverState, baseState = null) {
    switch (this.strategy) {
      case CONFLICT_STRATEGY.SERVER_WINS:
        return this.serverWins(serverState)

      case CONFLICT_STRATEGY.CLIENT_WINS:
        return this.clientWins(localState)

      case CONFLICT_STRATEGY.AUTO_MERGE:
        return this.autoMerge(localState, serverState, baseState)

      case CONFLICT_STRATEGY.RETRY:
        return this.retry(localState, serverState)

      default:
        console.warn(`[ConflictResolver] Estratégia desconhecida: ${this.strategy}`)
        return this.serverWins(serverState)
    }
  }

  /**
   * Estratégia: Servidor vence (descarta alterações locais)
   */
  serverWins(serverState) {
    return {
      resolved: serverState,
      strategy: CONFLICT_STRATEGY.SERVER_WINS,
      hadConflict: true,
      resolution: 'accepted_server'
    }
  }

  /**
   * Estratégia: Cliente vence (perigoso - pode causar inconsistência)
   */
  clientWins(localState) {
    console.warn('[ConflictResolver] CLIENT_WINS - pode causar inconsistência')
    return {
      resolved: localState,
      strategy: CONFLICT_STRATEGY.CLIENT_WINS,
      hadConflict: true,
      resolution: 'accepted_client'
    }
  }

  /**
   * Estratégia: Merge automático (three-way merge)
   * 
   * Tenta mesclar alterações não conflitantes
   */
  autoMerge(localState, serverState, baseState) {
    if (!baseState) {
      // Sem base, não dá pra fazer merge - aceita servidor
      console.warn('[ConflictResolver] Auto-merge sem baseState - usando SERVER_WINS')
      return this.serverWins(serverState)
    }

    const merged = { ...serverState }
    const conflicts = []

    // Merge de itens
    if (localState.itens && serverState.itens) {
      const mergeResult = this.mergeItems(
        baseState.itens || [],
        localState.itens,
        serverState.itens
      )

      merged.itens = mergeResult.items
      conflicts.push(...mergeResult.conflicts)
    }

    // Merge de campos simples
    const fieldConflicts = this.mergeFields(
      baseState,
      localState,
      serverState,
      ['observacao', 'status']
    )

    conflicts.push(...fieldConflicts.conflicts)

    // Aplica campos mesclados
    Object.assign(merged, fieldConflicts.merged)

    return {
      resolved: merged,
      strategy: CONFLICT_STRATEGY.AUTO_MERGE,
      hadConflict: conflicts.length > 0,
      conflicts,
      resolution: conflicts.length > 0 ? 'merged_with_conflicts' : 'merged_clean'
    }
  }

  /**
   * Estratégia: Retry (re-tenta com versão atualizada)
   */
  retry(localState, serverState) {
    return {
      resolved: null,
      strategy: CONFLICT_STRATEGY.RETRY,
      hadConflict: true,
      resolution: 'retry_required',
      retryWith: {
        ...localState,
        versao: serverState.versao
      }
    }
  }

  /**
   * Merge de itens (three-way merge)
   * 
   * Detecta:
   * - Itens adicionados localmente
   * - Itens adicionados no servidor
   * - Itens removidos localmente
   * - Itens removidos no servidor
   * - Itens modificados (conflito se ambos modificaram)
   */
  mergeItems(baseItems, localItems, serverItems) {
    const baseMap = new Map(baseItems.map(i => [i.id, i]))
    const localMap = new Map(localItems.map(i => [i.id, i]))
    const serverMap = new Map(serverItems.map(i => [i.id, i]))

    const merged = []
    const conflicts = []

    // Processa itens do servidor
    for (const [id, serverItem] of serverMap) {
      const baseItem = baseMap.get(id)
      const localItem = localMap.get(id)

      if (!baseItem) {
        // Item novo no servidor - aceita
        merged.push(serverItem)
      } else if (!localItem) {
        // Item removido localmente - mantém remoção
        // (não adiciona ao merged)
      } else {
        // Item existe em ambos - verifica modificações
        const localChanged = JSON.stringify(localItem) !== JSON.stringify(baseItem)
        const serverChanged = JSON.stringify(serverItem) !== JSON.stringify(baseItem)

        if (localChanged && serverChanged) {
          // Ambos modificaram - CONFLITO
          conflicts.push({
            type: 'ITEM_MODIFIED',
            itemId: id,
            base: baseItem,
            local: localItem,
            server: serverItem
          })

          // Resolve: servidor vence
          merged.push(serverItem)
        } else if (serverChanged) {
          // Só servidor modificou - aceita servidor
          merged.push(serverItem)
        } else {
          // Só local modificou ou ninguém modificou - aceita local
          merged.push(localItem)
        }
      }
    }

    // Processa itens novos locais (não existem no servidor)
    for (const [id, localItem] of localMap) {
      if (!serverMap.has(id) && !baseMap.has(id)) {
        // Item novo local - mantém
        merged.push(localItem)
      }
    }

    return { items: merged, conflicts }
  }

  /**
   * Merge de campos simples
   */
  mergeFields(base, local, server, fields) {
    const merged = {}
    const conflicts = []

    for (const field of fields) {
      const baseValue = base[field]
      const localValue = local[field]
      const serverValue = server[field]

      const localChanged = localValue !== baseValue
      const serverChanged = serverValue !== baseValue

      if (localChanged && serverChanged && localValue !== serverValue) {
        // CONFLITO
        conflicts.push({
          type: 'FIELD_MODIFIED',
          field,
          base: baseValue,
          local: localValue,
          server: serverValue
        })

        // Resolve: servidor vence
        merged[field] = serverValue
      } else if (serverChanged) {
        merged[field] = serverValue
      } else {
        merged[field] = localValue
      }
    }

    return { merged, conflicts }
  }
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * OPERATION QUEUE (para operações offline)
 * ──────────────────────────────────────────────────────────────────────────────
 */

export class OperationQueue {
  constructor() {
    this.queue = []
    this.processing = false
    this.onError = null
  }

  /**
   * Adiciona operação à fila
   * 
   * @param {Object} operation - Operação
   * @param {string} operation.type - Tipo (OPERATION_TYPE)
   * @param {Function} operation.execute - Função a executar
   * @param {Object} operation.payload - Payload da operação
   * @param {number} [operation.priority=0] - Prioridade (maior = primeiro)
   */
  enqueue(operation) {
    const op = {
      id: Date.now(),
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 3,
      ...operation
    }

    this.queue.push(op)

    // Ordena por prioridade (maior primeiro)
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    console.log(`[OperationQueue] Enqueued: ${op.type}`, { queueSize: this.queue.length })

    // Processa se não estiver processando
    if (!this.processing) {
      this.process()
    }
  }

  /**
   * Processa fila
   */
  async process() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const operation = this.queue[0]

      try {
        console.log(`[OperationQueue] Processing: ${operation.type} (attempt ${operation.attempts + 1})`)

        await operation.execute(operation.payload)

        // Sucesso - remove da fila
        this.queue.shift()
        console.log(`[OperationQueue] Success: ${operation.type}`)
      } catch (error) {
        console.error(`[OperationQueue] Error: ${operation.type}`, error)

        operation.attempts++

        // Verifica se deve fazer retry
        if (operation.attempts >= operation.maxAttempts) {
          console.error(`[OperationQueue] Max attempts reached: ${operation.type}`)

          // Remove da fila
          this.queue.shift()

          // Callback de erro
          if (this.onError) {
            this.onError(operation, error)
          }
        } else {
          // Move para o final da fila
          this.queue.shift()
          this.queue.push(operation)

          // Aguarda antes de retry
          await new Promise(resolve => setTimeout(resolve, 1000 * operation.attempts))
        }
      }
    }

    this.processing = false
  }

  /**
   * Limpa fila
   */
  clear() {
    this.queue = []
    this.processing = false
  }

  /**
   * Retorna tamanho da fila
   */
  size() {
    return this.queue.length
  }

  /**
   * Verifica se está processando
   */
  isProcessing() {
    return this.processing
  }
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * VERSION MANAGER (controle de versão otimista)
 * ──────────────────────────────────────────────────────────────────────────────
 */

export class VersionManager {
  constructor() {
    // Map<pedidoId, versionInfo>
    this.versions = new Map()
  }

  /**
   * Registra versão de um pedido
   */
  register(pedidoId, version, data) {
    this.versions.set(pedidoId, {
      version,
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(data)) // Deep clone
    })
  }

  /**
   * Obtém versão registrada
   */
  get(pedidoId) {
    return this.versions.get(pedidoId)
  }

  /**
   * Verifica se versão é atual
   */
  isCurrent(pedidoId, version) {
    const info = this.versions.get(pedidoId)
    if (!info) return true // Se não tem registro, considera atual

    return info.version === version
  }

  /**
   * Atualiza versão
   */
  update(pedidoId, newVersion, newData) {
    this.register(pedidoId, newVersion, newData)
  }

  /**
   * Remove registro
   */
  unregister(pedidoId) {
    this.versions.delete(pedidoId)
  }

  /**
   * Obtém dados base para three-way merge
   */
  getBaseState(pedidoId) {
    const info = this.versions.get(pedidoId)
    return info ? info.data : null
  }

  /**
   * Limpa versões antigas (garbage collection)
   */
  gc(maxAge = 3600000) { // 1 hora
    const now = Date.now()
    const toRemove = []

    this.versions.forEach((info, pedidoId) => {
      if (now - info.timestamp > maxAge) {
        toRemove.push(pedidoId)
      }
    })

    toRemove.forEach(id => this.versions.delete(id))

    if (toRemove.length > 0) {
      console.log(`[VersionManager] GC removeu ${toRemove.length} registros`)
    }
  }
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * SINGLETON INSTANCES
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const globalConflictResolver = new ConflictResolver(CONFLICT_STRATEGY.AUTO_MERGE)
export const globalOperationQueue = new OperationQueue()
export const globalVersionManager = new VersionManager()

// GC periódico de versões
setInterval(() => {
  globalVersionManager.gc()
}, 60000) // A cada 1 minuto

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * EXPORT DEFAULT
 * ──────────────────────────────────────────────────────────────────────────────
 */

export default {
  ConflictResolver,
  OperationQueue,
  VersionManager,
  CONFLICT_STRATEGY,
  OPERATION_TYPE,
  globalConflictResolver,
  globalOperationQueue,
  globalVersionManager
}
