# 🏗️ ARQUITETURA PROFISSIONAL - MÓDULO DE PEDIDOS

## 📋 Visão Geral

Arquitetura em camadas para sistema transacional de alta concorrência, preparada para produção real e escalável.

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTES VUE                          │
│                    (PedidoEditor.vue, etc)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   COMPOSABLE (UI Interface)                      │
│                      usePedido.js                                │
│  • Optimistic UI                                                 │
│  • Loading states                                                │
│  • Error handling                                                │
│  • Rollback automático                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PINIA STORE (State Management)                 │
│                      pedido.store.js                             │
│  • Cache normalizado (Map)                                       │
│  • Versionamento                                                 │
│  • Sincronização WebSocket                                       │
│  • Garbage collection                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                SERVICE (Business Logic)                          │
│                  pedido.service.js                               │
│  • Validações de negócio                                         │
│  • Retry com exponential backoff                                 │
│  • Circuit breaker                                               │
│  • Conflict resolution                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API (HTTP Layer)                             │
│                    pedido.api.js                                 │
│  • Chamadas HTTP puras                                           │
│  • Tratamento 409 (conflito)                                     │
│  • Headers versionamento                                         │
│  • Timeouts configuráveis                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SPRING BOOT BACKEND                            │
│                   (API REST + WebSocket)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Responsabilidades por Camada

### 1️⃣ API Layer (`pedido.api.js`)
**O QUE FAZ:**
- Comunicação HTTP pura com backend
- Configuração de timeouts e headers
- Propagação de erros HTTP

**O QUE NÃO FAZ:**
- ❌ Validações de negócio
- ❌ Transformação de dados
- ❌ Retry logic
- ❌ Gerenciamento de estado

**EXEMPLO:**
```javascript
// ✅ CORRETO
await pedidoApi.criar({ unidadeConsumoId: 5 })

// ❌ ERRADO (validação não é responsabilidade da API)
if (!dados.unidadeConsumoId) throw new Error('...')
await pedidoApi.criar(dados)
```

---

### 2️⃣ Service Layer (`pedido.service.js`)
**O QUE FAZ:**
- Orquestração de operações complexas
- Validações client-side
- Retry automático com exponential backoff
- Circuit breaker para proteger backend
- Resolução de conflitos

**O QUE NÃO FAZ:**
- ❌ Acesso direto à UI (sem refs, sem reactive)
- ❌ Gerenciamento de estado global
- ❌ Chamadas HTTP diretas

**EXEMPLO:**
```javascript
// ✅ CORRETO (service orquestra, API executa)
async function fechar(pedidoId, dados) {
  // Validação
  validators.validateFecharPedido(pedido)
  
  // Delega para API
  return await pedidoApi.fechar(pedidoId, dados)
}
```

---

### 3️⃣ Store Layer (`pedido.store.js`)
**O QUE FAZ:**
- Estado global reativo (Pinia)
- Cache normalizado com TTL
- Sincronização com WebSocket
- Versionamento para concorrência otimista
- Garbage collection automático

**O QUE NÃO FAZ:**
- ❌ Lógica de negócio (delega ao service)
- ❌ Validações
- ❌ Chamadas HTTP diretas

**EXEMPLO:**
```javascript
// ✅ CORRETO (store delega para service)
async function criar(dados) {
  const pedido = await pedidoService.criar(dados)
  setPedido(pedido) // Atualiza estado
  return pedido
}
```

---

### 4️⃣ Composable Layer (`usePedido.js`)
**O QUE FAZ:**
- Interface reativa para componentes
- Optimistic UI com rollback
- Loading states granulares
- Error handling com notificações
- Cleanup automático (onUnmounted)

**O QUE NÃO FAZ:**
- ❌ Lógica de negócio
- ❌ Chamadas diretas ao backend

**EXEMPLO:**
```javascript
// ✅ CORRETO (composable usa store, tem optimistic UI)
async function adicionarItem(item) {
  // Optimistic UI
  createSnapshot()
  pedido.value.itens.push(itemOptimistic)
  
  try {
    // Delega para store
    await pedidoStore.adicionarItem(pedido.value.id, item)
  } catch (error) {
    restoreSnapshot() // Rollback
  }
}
```

---

## 🔄 Fluxos de Operação

### FLUXO 1: Criar Pedido

```
[Componente]
    ↓ criar({ unidadeConsumoId: 5 })
[usePedido]
    ↓ loading = true
    ↓ pedidoStore.criar(dados)
[pedido.store]
    ↓ pedidoService.criar(dados)
[pedido.service]
    ↓ validators.validateCriarPedido(dados) ✅
    ↓ withRetry(() => pedidoApi.criar(dados))
[pedido.api]
    ↓ POST /api/pedidos
[Backend]
    ↓ Cria pedido no banco
    ↓ Retorna { id, numero, versao }
[pedido.api]
    ↓ return response.data
[pedido.service]
    ↓ return pedido
[pedido.store]
    ↓ setPedido(pedido) // Cache
    ↓ setAtivo(pedido)
    ↓ return pedido
[usePedido]
    ↓ pedido.value = pedido
    ↓ loading = false
    ↓ notification.success()
[Componente]
    ✅ Pedido criado!
```

---

### FLUXO 2: Adicionar Item (Optimistic UI)

```
[Componente]
    ↓ Click "Adicionar"
[usePedido]
    ↓ createSnapshot() // Backup
    ↓ pedido.value.itens.push({ ...item, _optimistic: true })
    ↓ UI atualiza IMEDIATAMENTE ⚡
    ↓ pedidoStore.adicionarItem(pedidoId, item)
[pedido.store]
    ↓ Pega versão do cache
    ↓ pedidoService.adicionarItem(pedidoId, item, { versao })
[pedido.service]
    ↓ validators.validateAdicionarItem(item) ✅
    ↓ withRetry(() => pedidoApi.adicionarItem(...))
[pedido.api]
    ↓ POST /api/pedidos/123/itens
    ↓ Headers: If-Match: "versao-5"
[Backend]
    ↓ Valida versão
    ↓ Adiciona item
    ↓ Incrementa versão → 6
    ↓ Retorna pedido completo
[pedido.api]
    ↓ return response.data
[pedido.service]
    ↓ return pedido
[pedido.store]
    ↓ setPedido(pedido) // Atualiza cache
    ↓ return pedido
[usePedido]
    ↓ pedido.value = pedido (substitui optimistic)
    ↓ clearSnapshot()
    ✅ Item confirmado!
```

---

### FLUXO 3: Conflito de Concorrência (409)

**CENÁRIO:** Dois operadores editando o mesmo pedido

```
[Operador A]                          [Operador B]
    ↓ Carrega pedido (versão 5)          ↓ Carrega pedido (versão 5)
    ↓ Adiciona item X                    ↓ Adiciona item Y
    ↓ POST com versão 5                  |
    ↓ ✅ Sucesso → versão 6              |
                                         ↓ POST com versão 5
                                         ↓ ❌ 409 CONFLICT!
                                         
[pedido.api]
    ↓ Captura 409
    ↓ throw PedidoConflictError({
        versaoServidor: 6,
        versaoCliente: 5
      })
[pedido.service]
    ↓ Captura PedidoConflictError
    ↓ Propaga para store
[pedido.store]
    ↓ Captura conflito
    ↓ if (!options.retried) {
        fetchPedido(pedidoId, { forceRefresh: true }) // Refresh
        return adicionarItem(..., { retried: true })  // Retry
      }
    ↓ Retry com versão 6
    ↓ ✅ Sucesso!
[usePedido]
    ↓ notification.info('Pedido atualizado')
    ✅ Operação B confirmada!
```

**ESTRATÉGIA:** Refresh automático + Retry (1 tentativa)

---

### FLUXO 4: Fechar Pedido (Operação Crítica)

```
[Componente]
    ↓ Click "Fechar Pedido"
    ↓ Modal forma de pagamento
    ↓ fechar({ formaPagamento: 'FUNDO_CONSUMO' })
[usePedido]
    ↓ if (!canClose.value) return ❌
    ↓ loading = true
    ↓ pedidoStore.fechar(pedidoId, dados)
[pedido.store]
    ↓ pedidoService.fechar(pedidoId, dados)
[pedido.service]
    ↓ Busca pedido atual
    ↓ validators.validateFecharPedido(pedido) ✅
    ↓ validators.validateFormaPagamento() ✅
    ↓ Se FUNDO_CONSUMO → valida saldo ✅
    ↓ pedidoApi.fechar(pedidoId, payload)
    ↓ ⚠️ SEM RETRY (operação crítica)
[pedido.api]
    ↓ PUT /api/pedidos/123/fechar
    ↓ timeout: 15000ms (crítico)
[Backend]
    ↓ @Transactional
    ↓ Valida saldo
    ↓ Debita fundo
    ↓ Atualiza status → FINALIZADO
    ↓ Gera comprovante
    ↓ Commit
    ↓ Retorna pedido + comprovante
[pedido.api]
    ↓ return response.data
[pedido.service]
    ↓ return pedidoFechado
[pedido.store]
    ↓ setPedido(pedidoFechado)
    ↓ clearAtivo() // Limpa pedido ativo
[usePedido]
    ↓ pedido.value = pedidoFechado
    ↓ loading = false
    ↓ notification.success('Pedido fechado!')
[Componente]
    ✅ Exibe comprovante
```

---

## ⚡ Estratégias de Performance

### 1. Cache Inteligente (Store)
```javascript
// Cache com TTL
CACHE_CONFIG = {
  TTL: 5 * 60 * 1000,        // 5 minutos
  STALE_THRESHOLD: 30 * 1000 // 30 segundos
}

// Se cache está fresh (< 30s), retorna imediatamente
if (cacheAge < STALE_THRESHOLD) {
  return cache // ⚡ Instantâneo
}

// Se cache está stale, busca servidor com ETag
const result = await api.get(id, { etag: cache.etag })
if (result.notModified) {
  return cache // 304 - cache ainda válido
}
```

### 2. Retry com Exponential Backoff
```javascript
// Tentativa 1: 1s
// Tentativa 2: 2s
// Tentativa 3: 4s

delay = min(baseDelay * 2^(attempt-1), maxDelay)
```

### 3. Circuit Breaker
```javascript
// Após 5 falhas consecutivas → OPEN (60s)
if (circuitState === 'OPEN') {
  throw new Error('Serviço indisponível')
}

// Sucesso → reset
circuitState = 'CLOSED'
```

### 4. Optimistic UI
```javascript
// Atualização IMEDIATA na UI
pedido.value.itens.push(novoItem)

// API em background
try {
  await api.adicionarItem()
} catch (error) {
  // Rollback se falhar
  restoreSnapshot()
}
```

---

## 🔒 Concorrência e Consistência

### Versionamento Otimista
```javascript
// Cliente envia versão esperada
Headers: If-Match: "5"

// Servidor valida
if (pedido.versao != 5) {
  return 409 CONFLICT
}

// Sucesso → incrementa versão
pedido.versao = 6
```

### Resolução de Conflitos
```javascript
// Estratégias disponíveis:
1. SERVER_WINS     // Padrão - seguro
2. CLIENT_WINS     // Perigoso
3. AUTO_MERGE      // Three-way merge
4. RETRY           // Refresh + retry
5. ASK_USER        // Decisão manual
```

### Queue de Operações Offline
```javascript
// Enfileira operações quando offline
queue.enqueue({
  type: 'ADD_ITEM',
  execute: () => api.adicionarItem(...),
  priority: 5
})

// Processa quando reconectar
queue.process()
```

---

## 🎨 Exemplo de Uso no Componente

```vue
<script setup>
import { usePedido } from '@/composables/usePedido'

// ✅ USO SIMPLES
const {
  pedido,
  loading,
  isLoading,
  canEdit,
  canClose,
  totais,
  adicionarItem,
  fechar,
  refresh
} = usePedido({
  pedidoId: 123,
  autoLoad: true,      // Carrega automaticamente
  optimisticUI: true   // Ativa optimistic updates
})

// ✅ ADICIONAR ITEM (com optimistic UI)
async function adicionarItemClick() {
  await adicionarItem({
    produtoId: 5,
    quantidade: 2,
    observacao: 'Sem cebola'
  })
  // UI atualiza INSTANTANEAMENTE
  // API processa em background
  // Rollback automático se falhar
}

// ✅ FECHAR PEDIDO
async function fecharClick() {
  if (!canClose.value) return
  
  await fechar({
    formaPagamento: 'FUNDO_CONSUMO'
  })
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading">⏳ Carregando...</div>
    
    <!-- Pedido -->
    <div v-else-if="pedido">
      <h2>{{ pedido.numeroFormatado }}</h2>
      
      <!-- Itens com animação optimistic -->
      <div v-for="item in pedido.itens" :key="item.id"
           :class="{ 'optimistic': item._optimistic }">
        {{ item.produtoNome }} x {{ item.quantidade }}
      </div>
      
      <!-- Total -->
      <div>Total: {{ formatCurrency(totais.subtotal) }}</div>
      
      <!-- Ações -->
      <button v-if="canEdit" @click="adicionarItemClick">
        Adicionar Item
      </button>
      <button v-if="canClose" @click="fecharClick">
        Fechar Pedido
      </button>
    </div>
  </div>
</template>
```

---

## 🚀 Preparação para WebSocket

A arquitetura já está preparada para sincronização em tempo real:

```javascript
// Na store
function handleWebSocketUpdate(payload) {
  const { pedidoId, tipo, data } = payload
  
  switch (tipo) {
    case 'PEDIDO_ATUALIZADO':
      setPedido(data) // Atualiza cache
      break
      
    case 'ITEM_ADICIONADO':
      fetchPedido(pedidoId, { forceRefresh: true })
      break
  }
}

// Registrar handler
websocketStore.on('pedido:update', handleWebSocketUpdate)
```

---

## 📊 Métricas e Monitoramento

```javascript
// Logs estruturados
console.log('[Service] Retry bem-sucedido na tentativa 2', {
  operation: 'adicionar_item',
  pedidoId: 123,
  duration: 1523
})

// Circuit breaker status
pedidoService.getCircuitBreakerStatus()
// → { state: 'CLOSED', failures: 0 }

// Cache hit rate
const hitRate = cacheHits / (cacheHits + cacheMisses)
```

---

## ✅ Checklist de Produção

- [x] Retry automático com backoff
- [x] Circuit breaker
- [x] Versionamento otimista
- [x] Resolução de conflitos
- [x] Cache com TTL
- [x] Garbage collection
- [x] Optimistic UI com rollback
- [x] Loading states granulares
- [x] Error handling robusto
- [x] Validações client-side
- [x] Logs estruturados
- [x] Type safety (JSDoc)
- [x] Preparado para WebSocket
- [x] Queue de operações offline

---

## 🎯 Próximos Passos

1. **WebSocket Real-time**
   - Implementar conexão persistente
   - Sincronização incremental
   - Notificações push

2. **Testes**
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)

3. **Performance**
   - Virtual scrolling para listas grandes
   - Lazy loading de imagens
   - Code splitting

4. **Observabilidade**
   - Sentry para error tracking
   - Analytics de operações
   - Performance monitoring

---

**Arquitetura criada por:** Arquiteto Sênior AI  
**Data:** 22/02/2026  
**Versão:** 1.0.0
