<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import dashboardService from '@/services/dashboardService'

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

// Estatísticas reativas baseadas na documentação do backend
const stats = ref({
  totalPedidosHoje: 0,
  pedidosEmAndamento: 0,
  pedidosConcluidos: 0,
  pedidosCancelados: 0,
  receitaHoje: 0,
  receitaMes: 0,
  mesasOcupadas: 0,
  mesasDisponiveis: 0,
  clientesAtivos: 0,
  produtosDisponiveis: 0
})

const loading = ref(true)
const atividadesRecentes = ref([])
const produtosMaisVendidos = ref([])
const ultimaAtualizacao = ref(new Date())

// Computed properties
const totalMesas = computed(() => stats.value.mesasOcupadas + stats.value.mesasDisponiveis)
const taxaOcupacao = computed(() => {
  if (totalMesas.value === 0) return 0
  return Math.round((stats.value.mesasOcupadas / totalMesas.value) * 100)
})

const tempoUltimaAtualizacao = computed(() => {
  const agora = new Date()
  const diff = Math.floor((agora - ultimaAtualizacao.value) / 1000)
  
  if (diff < 60) return `${diff} segundos`
  if (diff < 3600) return `${Math.floor(diff / 60)} minutos`
  return `${Math.floor(diff / 3600)} horas`
})

// Carregar dados do dashboard
const carregarDados = async () => {
  try {
    loading.value = true
    
    // Buscar estatísticas, atividades e produtos em paralelo
    const [statsData, atividadesData, produtosData] = await Promise.all([
      dashboardService.obterEstatisticas(),
      dashboardService.obterAtividadesRecentes(),
      dashboardService.obterProdutosMaisVendidos()
    ])
    
    stats.value = statsData
    atividadesRecentes.value = atividadesData
    produtosMaisVendidos.value = produtosData
    ultimaAtualizacao.value = new Date()
    
  } catch (error) {
    console.error('[Dashboard] Erro ao carregar dados:', error)
    
    if (error.response?.status === 401) {
      notificationStore.erro('Sessão expirada. Por favor, faça login novamente.')
      // Redirecionar para login (implementar conforme seu router)
    } else if (error.response?.status === 403) {
      notificationStore.erro('Acesso negado. Você não tem permissão para visualizar o dashboard.')
    } else {
      notificationStore.erro('Erro ao carregar dados do dashboard. Tentando novamente...')
      // Retry após 5 segundos
      setTimeout(carregarDados, 5000)
    }
  } finally {
    loading.value = false
  }
}

// Formatar data/hora para exibição (ISO -> formato local)
const formatarDataHora = (isoString) => {
  const data = new Date(isoString)
  return data.toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obter cor do badge de status
const getStatusColor = (status) => {
  const cores = {
    'CRIADO': 'bg-blue-500',
    'EM_ANDAMENTO': 'bg-yellow-500',
    'FINALIZADO': 'bg-green-500',
    'CANCELADO': 'bg-red-500'
  }
  return cores[status] || 'bg-gray-500'
}

// Obter label do status
const getStatusLabel = (status) => {
  const labels = {
    'CRIADO': 'Criado',
    'EM_ANDAMENTO': 'Em Andamento',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado'
  }
  return labels[status] || status
}

// Timers para atualização automática
let timerStats = null
let timerAtividades = null
let timerProdutos = null

onMounted(async () => {
  // Carregar dados iniciais
  await carregarDados()
  
  // Configurar atualização automática conforme documentação
  // Stats: a cada 30 segundos
  timerStats = setInterval(async () => {
    try {
      const statsData = await dashboardService.obterEstatisticas()
      stats.value = statsData
      ultimaAtualizacao.value = new Date()
    } catch (error) {
      console.error('[Dashboard] Erro ao atualizar estatísticas:', error)
    }
  }, 30000)
  
  // Atividades: a cada 20 segundos
  timerAtividades = setInterval(async () => {
    try {
      const atividadesData = await dashboardService.obterAtividadesRecentes()
      atividadesRecentes.value = atividadesData
    } catch (error) {
      console.error('[Dashboard] Erro ao atualizar atividades:', error)
    }
  }, 20000)
  
  // Produtos: a cada 5 minutos
  timerProdutos = setInterval(async () => {
    try {
      const produtosData = await dashboardService.obterProdutosMaisVendidos()
      produtosMaisVendidos.value = produtosData
    } catch (error) {
      console.error('[Dashboard] Erro ao atualizar produtos:', error)
    }
  }, 300000)
})

onUnmounted(() => {
  // Limpar timers ao desmontar componente
  if (timerStats) clearInterval(timerStats)
  if (timerAtividades) clearInterval(timerAtividades)
  if (timerProdutos) clearInterval(timerProdutos)
})

/**
 * Dashboard View - Módulo de visão geral
 * 
 * Integrado com endpoints do backend conforme INTEGRACAO_DASHBOARD_FRONTEND.txt
 * 
 * Endpoints:
 * - GET /api/dashboard/stats - Estatísticas gerais (atualiza a cada 30s)
 * - GET /api/dashboard/activity - Últimos 10 pedidos (atualiza a cada 20s)
 * - GET /api/dashboard/top-products - Top 10 produtos do mês (atualiza a cada 5min)
 * 
 * Permissões: ADMIN, GERENTE (stats e top-products), ATENDENTE (activity)
 */
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p class="text-text-secondary mt-1">Visão geral do sistema</p>
      </div>
      <div class="flex items-center space-x-2 text-sm text-text-secondary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Atualizado há {{ tempoUltimaAtualizacao }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="card animate-pulse">
        <div class="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- Stats Cards (conforme documentação do backend) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Card 1: Pedidos Hoje -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Pedidos Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ stats.totalPedidosHoje }}</p>
            <div class="flex items-center space-x-2 mt-1 text-xs">
              <span class="text-yellow-600">{{ stats.pedidosEmAndamento }} em andamento</span>
            </div>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Card 2: Receita Hoje -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Receita Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(stats.receitaHoje) }}</p>
            <p class="text-success text-sm mt-1">Mês: {{ formatCurrency(stats.receitaMes) }}</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Card 3: Mesas Ocupadas -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Mesas Ocupadas</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ stats.mesasOcupadas }}/{{ totalMesas }}</p>
            <p class="text-info text-sm mt-1">{{ taxaOcupacao }}% ocupação</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Card 4: Produtos Disponíveis -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Produtos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ stats.produtosDisponiveis }}</p>
            <p class="text-warning text-sm mt-1">{{ stats.clientesAtivos }} clientes ativos</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de Status dos Pedidos -->
    <div class="card">
      <h3 class="text-lg font-semibold text-text-primary mb-4">Status dos Pedidos Hoje</h3>
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <p class="text-3xl font-bold text-green-600">{{ stats.pedidosConcluidos }}</p>
          <p class="text-sm text-green-700 mt-1">Concluídos</p>
        </div>
        <div class="text-center p-4 bg-yellow-50 rounded-lg">
          <p class="text-3xl font-bold text-yellow-600">{{ stats.pedidosEmAndamento }}</p>
          <p class="text-sm text-yellow-700 mt-1">Em Andamento</p>
        </div>
        <div class="text-center p-4 bg-red-50 rounded-lg">
          <p class="text-3xl font-bold text-red-600">{{ stats.pedidosCancelados }}</p>
          <p class="text-sm text-red-700 mt-1">Cancelados</p>
        </div>
      </div>
    </div>

    <!-- Atividades Recentes e Produtos Mais Vendidos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Atividades Recentes (últimos 10 pedidos) -->
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Atividades Recentes</h3>
        <div v-if="atividadesRecentes.length === 0" class="text-center py-8 text-text-secondary">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p>Nenhum pedido realizado ainda</p>
        </div>
        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="pedido in atividadesRecentes" :key="pedido.pedidoId" 
               class="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-gray-50 transition-colors">
            <div class="flex items-center space-x-3 flex-1">
              <div :class="['w-2 h-2 rounded-full', getStatusColor(pedido.status)]"></div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <p class="text-sm font-medium text-text-primary">{{ pedido.numeroPedido }}</p>
                  <span :class="[
                    'px-2 py-0.5 rounded text-xs font-medium text-white',
                    getStatusColor(pedido.status)
                  ]">
                    {{ getStatusLabel(pedido.status) }}
                  </span>
                </div>
                <p class="text-xs text-text-secondary mt-0.5">
                  {{ pedido.clienteNome }} • {{ pedido.unidadeConsumoReferencia }}
                </p>
                <p class="text-xs text-text-secondary">
                  {{ formatarDataHora(pedido.criadoEm) }} • {{ pedido.quantidadeItens }} itens
                </p>
              </div>
            </div>
            <span class="text-sm font-semibold text-text-primary ml-3">
              {{ formatCurrency(pedido.total) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Top 10 Produtos Mais Vendidos -->
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Produtos Mais Vendidos (Mês)</h3>
        <div v-if="produtosMaisVendidos.length === 0" class="text-center py-8 text-text-secondary">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
          <p>Nenhum produto vendido este mês</p>
        </div>
        <div v-else class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="(produto, index) in produtosMaisVendidos" :key="produto.produtoId" 
               class="flex items-center justify-between p-3 bg-background rounded-lg hover:bg-gray-50 transition-colors">
            <div class="flex items-center space-x-3 flex-1">
              <!-- Posição no Ranking -->
              <div :class="[
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                index === 0 ? 'bg-yellow-400 text-white' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-orange-400 text-white' :
                'bg-gray-100 text-gray-600'
              ]">
                {{ index + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-text-primary truncate">{{ produto.nome }}</p>
                <div class="flex items-center space-x-2 mt-0.5">
                  <span class="text-xs text-text-secondary">{{ produto.codigo }}</span>
                  <span class="text-xs text-text-secondary">•</span>
                  <span class="text-xs text-text-secondary">{{ produto.quantidadeVendida }} vendas</span>
                </div>
                <p class="text-xs font-medium text-success mt-0.5">
                  Receita: {{ formatCurrency(produto.receitaTotal) }}
                </p>
              </div>
            </div>
            <div class="text-right ml-3">
              <p class="text-sm font-semibold text-text-primary">
                {{ formatCurrency(produto.precoUnitario) }}
              </p>
              <p class="text-xs text-text-secondary">por unidade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
