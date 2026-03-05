<script setup>
import { ref, computed, onMounted } from 'vue'
import produtosService from '@/services/produtosService'
import { useNotificationStore } from '@/store/notifications'
import { useCurrency } from '@/utils/currency'

/**
 * EstoqueView — Visualização de estoque de produtos
 *
 * Conectado ao backend via GET /api/produtos.
 * Níveis de estoque (OK/BAIXO/ESGOTADO) são derivados de produto.ativo;
 * o módulo de gestão de estoque completo será implementado quando o
 * backend disponibilizar GET /api/estoque.
 */

const notificationStore = useNotificationStore()
const { formatCurrency } = useCurrency()

const produtos = ref([])
const loading = ref(false)

// Filtros
const categoriaFiltro = ref('TODAS')
const statusFiltro = ref('TODOS')
const busca = ref('')

onMounted(async () => {
  await carregarProdutos()
})

const carregarProdutos = async () => {
  try {
    loading.value = true
    const response = await produtosService.getAll()
    produtos.value = response.data || response || []
  } catch (error) {
    console.error('[EstoqueView] Erro ao carregar produtos:', error)
    notificationStore.erro('Erro ao carregar produtos')
  } finally {
    loading.value = false
  }
}

// Derive stock status from product availability
const getStatusEstoque = (produto) => {
  if (!produto.ativo) return 'ESGOTADO'
  if (produto.disponivel === false) return 'BAIXO'
  return 'OK'
}

// Produtos filtrados
const produtosFiltrados = computed(() => {
  return produtos.value.filter(produto => {
    if (categoriaFiltro.value !== 'TODAS' && produto.categoria !== categoriaFiltro.value) return false
    const status = getStatusEstoque(produto)
    if (statusFiltro.value !== 'TODOS' && status !== statusFiltro.value) return false
    if (busca.value && !produto.nome.toLowerCase().includes(busca.value.toLowerCase())) return false
    return true
  })
})

// Categorias disponíveis
const categorias = computed(() => {
  const cats = new Set(produtos.value.map(p => p.categoria).filter(Boolean))
  return ['TODAS', ...Array.from(cats)]
})

// Estatísticas
const estatisticas = computed(() => {
  return {
    total: produtos.value.length,
    ok: produtos.value.filter(p => getStatusEstoque(p) === 'OK').length,
    baixo: produtos.value.filter(p => getStatusEstoque(p) === 'BAIXO').length,
    esgotado: produtos.value.filter(p => getStatusEstoque(p) === 'ESGOTADO').length
  }
})

// Labels
const categoriaLabels = {
  TODAS: 'Todas as Categorias',
  ENTRADA: 'Entrada',
  PRATO_PRINCIPAL: 'Prato Principal',
  ACOMPANHAMENTO: 'Acompanhamento',
  SOBREMESA: 'Sobremesa',
  BEBIDA_ALCOOLICA: 'Bebida Alcoólica',
  BEBIDA_NAO_ALCOOLICA: 'Bebida Não Alcoólica',
  LANCHE: 'Lanche',
  PIZZA: 'Pizza',
  OUTROS: 'Outros'
}

const statusLabels = {
  TODOS: 'Todos os Status',
  OK: 'Disponível',
  BAIXO: 'Indisponível',
  ESGOTADO: 'Inativo'
}

const statusColors = {
  OK: 'text-success',
  BAIXO: 'text-warning',
  ESGOTADO: 'text-error'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Estoque</h2>
        <p class="text-text-secondary mt-1">Visualização de produtos e disponibilidade</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-text-secondary">Atualização automática</p>
        <p class="text-xs text-text-secondary mt-0.5">Última atualização: agora</p>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Total de Produtos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.total }}</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Disponível</p>
            <p class="text-3xl font-bold text-success mt-2">{{ estatisticas.ok }}</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Estoque Baixo</p>
            <p class="text-3xl font-bold text-warning mt-2">{{ estatisticas.baixo }}</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Esgotado</p>
            <p class="text-3xl font-bold text-error mt-2">{{ estatisticas.esgotado }}</p>
          </div>
          <div class="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros e Busca -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="categoriaFiltro" class="input-field w-48">
            <option v-for="cat in categorias" :key="cat" :value="cat">
              {{ categoriaLabels[cat] }}
            </option>
          </select>
          
          <select v-model="statusFiltro" class="input-field w-48">
            <option value="TODOS">{{ statusLabels.TODOS }}</option>
            <option value="OK">{{ statusLabels.OK }}</option>
            <option value="BAIXO">{{ statusLabels.BAIXO }}</option>
            <option value="ESGOTADO">{{ statusLabels.ESGOTADO }}</option>
          </select>
        </div>
        
        <input 
          v-model="busca" 
          type="text" 
          placeholder="Buscar produtos..." 
          class="input-field w-full md:w-64"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Grid de Produtos -->
    <div v-else-if="produtosFiltrados.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="produto in produtosFiltrados" :key="produto.id" class="card">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-base font-semibold text-text-primary">{{ produto.nome }}</h3>
            <p class="text-sm text-text-secondary mt-0.5">{{ categoriaLabels[produto.categoria] || produto.categoria }}</p>
          </div>
          <span v-if="produto.ativo" class="badge-success text-xs">Ativo</span>
          <span v-else class="badge-secondary text-xs">Inativo</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between p-2.5 bg-background rounded-lg">
            <span class="text-sm text-text-secondary">Preço</span>
            <span class="text-base font-bold text-primary">{{ formatCurrency(produto.preco) }}</span>
          </div>
          <div class="flex items-center justify-between p-2.5 bg-background rounded-lg">
            <span class="text-sm text-text-secondary">Status</span>
            <span class="text-sm font-medium" :class="statusColors[getStatusEstoque(produto)]">
              {{ statusLabels[getStatusEstoque(produto)] }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Nenhum resultado -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
      <h3 class="text-xl font-semibold text-text-primary mb-2">Nenhum produto encontrado</h3>
      <p class="text-text-secondary">Ajuste os filtros ou tente uma busca diferente</p>
    </div>

    <!-- Nota informativa -->
    <div class="card bg-info/5 border border-info/20">
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div>
          <h4 class="font-semibold text-info mb-1">Disponibilidade Derivada</h4>
          <p class="text-sm text-text-secondary">
            Os status de estoque são derivados dos campos <strong>ativo</strong> e <strong>disponível</strong> do cadastro de produtos.
            Um módulo de controle de estoque com quantidades e mínimos será adicionado futuramente.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
