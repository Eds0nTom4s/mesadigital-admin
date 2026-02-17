<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FundoCard from '@/components/shared/FundoCard.vue'
import { useCurrency } from '@/utils/currency'

/**
 * FundosView - Módulo de gestão de fundos de consumo
 * 
 * Funcionalidades:
 * - Listagem de fundos com filtros
 * - Visualização de saldos
 * - Acesso a detalhes e histórico
 * - Estatísticas em tempo real
 */

const router = useRouter()
const { formatCurrency } = useCurrency()

const fundos = ref([])
const loading = ref(true)

// Filtros
const tipoFiltro = ref('TODOS')
const statusFiltro = ref('TODOS')
const busca = ref('')

// Carrega dados mockados
onMounted(async () => {
  try {
    const response = await fetch('/src/mock/fundos.json')
    fundos.value = await response.json()
  } catch (error) {
    console.error('Erro ao carregar fundos:', error)
  } finally {
    loading.value = false
  }
})

// Fundos filtrados
const fundosFiltrados = computed(() => {
  return fundos.value.filter(fundo => {
    // Filtro de tipo
    if (tipoFiltro.value !== 'TODOS' && fundo.tipo !== tipoFiltro.value) {
      return false
    }
    
    // Filtro de status
    if (statusFiltro.value !== 'TODOS' && fundo.status !== statusFiltro.value) {
      return false
    }
    
    // Busca por identificador
    if (busca.value && !fundo.identificador.toLowerCase().includes(busca.value.toLowerCase())) {
      return false
    }
    
    return true
  })
})

// Estatísticas
const estatisticas = computed(() => {
  const ativos = fundos.value.filter(f => f.status === 'ATIVO')
  const totalAtivos = ativos.reduce((sum, f) => sum + f.saldoAtual, 0)
  const mediaAtivos = ativos.length > 0 ? totalAtivos / ativos.length : 0
  
  const encerradosHoje = fundos.value.filter(f => {
    if (f.status !== 'ENCERRADO') return false
    const hoje = new Date().toDateString()
    const dataFundo = new Date(f.dataCriacao).toDateString()
    return hoje === dataFundo
  })
  
  return {
    totalAtivos,
    qtdAtivos: ativos.length,
    mediaAtivos,
    encerradosHoje: encerradosHoje.length
  }
})

// Navega para detalhes
const verDetalhes = (fundo) => {
  router.push({ name: 'fundo-detalhe', params: { id: fundo.id } })
}

// Mock de criação
const criarFundo = () => {
  alert('Funcionalidade de criação será implementada com integração backend')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Fundos de Consumo</h2>
        <p class="text-text-secondary mt-1">Gestão completa de fundos e transações</p>
      </div>
      <button @click="criarFundo" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Criar Fundo
      </button>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Fundos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.qtdAtivos }}</p>
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
            <p class="text-text-secondary text-sm">Total em Fundos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(estatisticas.totalAtivos) }}</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Média por Fundo</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(estatisticas.mediaAtivos) }}</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Encerrados Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.encerradosHoje }}</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="tipoFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Tipos</option>
            <option value="MESA">Mesas</option>
            <option value="QR_CONSUMO">QR Code</option>
            <option value="EVENTO">Eventos</option>
          </select>
          
          <select v-model="statusFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="ENCERRADO">Encerrados</option>
            <option value="EXPIRADO">Expirados</option>
          </select>
        </div>
        
        <input 
          v-model="busca" 
          type="text" 
          placeholder="Buscar fundo..." 
          class="input-field w-full md:w-64"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Grid de Fundos -->
    <div v-else-if="fundosFiltrados.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FundoCard 
        v-for="fundo in fundosFiltrados" 
        :key="fundo.id"
        :fundo="fundo"
        @verDetalhes="verDetalhes"
      />
    </div>

    <!-- Nenhum resultado -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
      <h3 class="text-xl font-semibold text-text-primary mb-2">Nenhum fundo encontrado</h3>
      <p class="text-text-secondary">Ajuste os filtros ou crie um novo fundo</p>
    </div>
  </div>
</template>
