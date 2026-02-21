<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useWebSocketStore } from '@/store/websocket'
import { dashboardService, pedidosService, mesasService } from '@/services/api'

const { formatCurrency } = useCurrency()
const wsStore = useWebSocketStore()

// Estatísticas reativas
const stats = ref({
  pedidosAtivos: 0,
  receitaHoje: 0,
  unidadesOcupadas: 0,
  unidadesTotal: 0,
  fundosAtivos: 0
})

const loading = ref(true)
const pedidosRecentes = ref([])
const produtosDestaque = ref([])

let desinscrever = null

const carregarDados = async () => {
  try {
    loading.value = true
    
    // Buscar estatísticas do dashboard (com fallback para dados mockados)
    try {
      const statsResponse = await dashboardService.getStats()
      stats.value = statsResponse.data
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('[Dashboard] Endpoint /dashboard/stats não implementado, usando dados mockados')
        stats.value = {
          pedidosAtivos: 0,
          receitaHoje: 0,
          unidadesOcupadas: 0,
          unidadesTotal: 0,
          fundosAtivos: 0
        }
      } else {
        throw error
      }
    }
    
    // Buscar atividades recentes (com fallback)
    try {
      const activityResponse = await dashboardService.getRecentActivity()
      pedidosRecentes.value = activityResponse.data.pedidos || []
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('[Dashboard] Endpoint /dashboard/activity não implementado')
        pedidosRecentes.value = []
      } else {
        throw error
      }
    }
    
    // Buscar produtos em destaque (com fallback)
    try {
      const topProductsResponse = await dashboardService.getTopProducts()
      produtosDestaque.value = topProductsResponse.data || []
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn('[Dashboard] Endpoint /dashboard/top-products não implementado')
        produtosDestaque.value = []
      } else {
        throw error
      }
    }
    
  } catch (error) {
    console.error('[Dashboard] Erro ao carregar dados:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Carregar dados iniciais
  await carregarDados()
  
  // Inscrever em múltiplos tópicos para dashboard
  const unidadeId = 5
  desinscrever = wsStore.inscreverAtendente(unidadeId, (notificacao) => {
    // Atualizar estatísticas em tempo real
    console.log('[Dashboard] Notificação recebida:', notificacao)
    // Recarregar estatísticas ao receber notificação
    carregarDados()
  })
})

onUnmounted(() => {
  if (desinscrever) {
    desinscrever()
  }
})

/**
 * Dashboard View - Módulo de visão geral
 * 
 * Exibe métricas principais do sistema:
 * - Pedidos ativos
 * - Receita do dia
 * - Ocupação de unidades de consumo
 * - Fundos de consumo ativos
 * 
 * Atualiza em tempo real via WebSocket
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
        <span>Atualizado há 2 minutos</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="i in 4" :key="i" class="card animate-pulse">
        <div class="h-24 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Pedidos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ stats.pedidosAtivos }}</p>
            <p class="text-success text-sm mt-1">{{ stats.variacaoPedidos || '+12%' }} vs ontem</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Receita Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(stats.receitaHoje) }}</p>
            <p class="text-success text-sm mt-1">{{ stats.variacaoReceita || '+8%' }} vs ontem</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Unidades Ocupadas</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ stats.unidadesOcupadas }}/{{ stats.unidadesTotal }}</p>
            <p class="text-info text-sm mt-1">{{ Math.round((stats.unidadesOcupadas / stats.unidadesTotal) * 100) }}% ocupação</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Fundos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(stats.fundosAtivos) }}</p>
            <p class="text-warning text-sm mt-1">{{ stats.quantidadeFundos || 0 }} fundos abertos</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Pedidos Recentes</h3>
        <div v-if="pedidosRecentes.length === 0" class="text-center py-6 text-text-secondary">
          Nenhum pedido recente
        </div>
        <div v-else class="space-y-3">
          <div v-for="pedido in pedidosRecentes.slice(0, 5)" :key="pedido.id" 
               class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-2 h-2 rounded-full',
                pedido.status === 'CONCLUIDO' ? 'bg-success' : 'bg-warning'
              ]"></div>
              <div>
                <p class="text-sm font-medium text-text-primary">{{ pedido.referencia }} - Pedido #{{ pedido.numero }}</p>
                <p class="text-xs text-text-secondary">{{ pedido.horarioRelativo || pedido.horario }}</p>
              </div>
            </div>
            <span class="text-sm font-medium text-text-primary">{{ formatCurrency(pedido.total) }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Produtos em Destaque</h3>
        <div v-if="produtosDestaque.length === 0" class="text-center py-6 text-text-secondary">
          Nenhum produto vendido hoje
        </div>
        <div v-else class="space-y-3">
          <div v-for="(produto, index) in produtosDestaque.slice(0, 5)" :key="produto.id" 
               class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div>
              <p class="text-sm font-medium text-text-primary">{{ produto.nome }}</p>
              <p class="text-xs text-text-secondary">{{ produto.vendas }} vendas hoje</p>
            </div>
            <span class="badge-success">Top #{{ index + 1 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
