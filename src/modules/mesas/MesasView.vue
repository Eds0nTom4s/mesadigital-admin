<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCurrency } from '@/utils/currency'
import { mesasService } from '@/services/api'

const { formatCurrency } = useCurrency()

const mesas = ref([])
const loading = ref(false)
const filtroStatus = ref('TODAS')

const mesasFiltradas = computed(() => {
  if (filtroStatus.value === 'TODAS') return mesas.value
  return mesas.value.filter(m => m.status === filtroStatus.value)
})

const mesasOcupadas = computed(() => 
  mesas.value.filter(m => m.status === 'OCUPADA').length
)

const mesasTotal = computed(() => mesas.value.length)

const porcentagemOcupacao = computed(() => 
  mesasTotal.value > 0 ? Math.round((mesasOcupadas.value / mesasTotal.value) * 100) : 0
)

const carregarMesas = async () => {
  try {
    loading.value = true
    const response = await mesasService.getAll()
    mesas.value = response.data
  } catch (error) {
    console.error('[MesasView] Erro ao carregar mesas:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregarMesas()
})

const getStatusBadge = (status) => {
  const badges = {
    'DISPONIVEL': 'badge-success',
    'OCUPADA': 'badge-error',
    'RESERVADA': 'badge-warning'
  }
  return badges[status] || 'badge-info'
}

const getStatusBorder = (status) => {
  const borders = {
    'DISPONIVEL': 'border-success bg-success/5',
    'OCUPADA': 'border-error bg-error/5',
    'RESERVADA': 'border-warning bg-warning/5'
  }
  return borders[status] || 'border-info bg-info/5'
}

const getStatusLabel = (status) => {
  const labels = {
    'DISPONIVEL': 'Disponível',
    'OCUPADA': 'Ocupada',
    'RESERVADA': 'Reservada'
  }
  return labels[status] || status
}

/**
 * Mesas View - Módulo de gestão de mesas
 * 
 * Funcionalidades:
 * - Visualização do status das mesas
 * - Filtros por disponibilidade
 * - Valor atual por mesa ocupada
 * - Gestão de reservas
 */
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Mesas</h2>
        <p class="text-text-secondary mt-1">Status e ocupação das mesas</p>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-text-secondary">{{ mesasOcupadas }} de {{ mesasTotal }} ocupadas</span>
        <div class="w-32 bg-border rounded-full h-2">
          <div class="bg-primary h-2 rounded-full" :style="`width: ${porcentagemOcupacao}%`"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex space-x-2 mb-6">
        <button @click="filtroStatus = 'TODAS'" 
                :class="filtroStatus === 'TODAS' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Todas</button>
        <button @click="filtroStatus = 'DISPONIVEL'" 
                :class="filtroStatus === 'DISPONIVEL' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Disponíveis</button>
        <button @click="filtroStatus = 'OCUPADA'" 
                :class="filtroStatus === 'OCUPADA' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Ocupadas</button>
        <button @click="filtroStatus = 'RESERVADA'" 
                :class="filtroStatus === 'RESERVADA' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Reservadas</button>
      </div>

      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="i in 10" :key="i" class="rounded-lg p-6 animate-pulse bg-gray-200 h-32"></div>
      </div>

      <div v-else-if="mesasFiltradas.length === 0" class="text-center py-12 text-text-secondary">
        Nenhuma mesa encontrada
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="mesa in mesasFiltradas" :key="mesa.id" 
             :class="['border-2 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow', getStatusBorder(mesa.status)]">
          <div class="text-3xl font-bold text-text-primary mb-2">{{ mesa.numero }}</div>
          <span :class="getStatusBadge(mesa.status)">{{ getStatusLabel(mesa.status) }}</span>
          <p class="text-xs text-text-secondary mt-2">{{ mesa.capacidade }} lugares</p>
          <p v-if="mesa.status === 'OCUPADA' && mesa.valorAtual" 
             class="text-xs text-text-primary mt-1 font-medium">{{ formatCurrency(mesa.valorAtual) }}</p>
          <p v-if="mesa.status === 'RESERVADA' && mesa.horaReserva" 
             class="text-xs text-text-primary mt-1 font-medium">{{ mesa.horaReserva }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
