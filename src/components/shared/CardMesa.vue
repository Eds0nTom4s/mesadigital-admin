<template>
  <div 
    @click="$emit('click')"
    :class="[
      'border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all',
      borderClass,
      'relative overflow-hidden'
    ]"
  >
    <!-- Badge de Status -->
    <div class="flex justify-between items-start mb-3">
      <div>
        <div class="text-2xl font-bold text-text-primary">
          {{ mesa.numero || '—' }}
        </div>
        <p class="text-xs text-text-secondary">{{ tipoLabel }}</p>
      </div>
      <span :class="['text-xs px-2 py-1 rounded-full font-medium', statusBadge]">
        {{ statusLabel }}
      </span>
    </div>

    <!-- Referência -->
    <p class="text-sm font-medium text-text-primary mb-2 truncate">
      {{ mesa.referencia }}
    </p>

    <!-- Cliente (se ocupada) -->
    <div v-if="mesa.status === 'OCUPADA' || mesa.status === 'AGUARDANDO_PAGAMENTO'" class="space-y-2">
      <div v-if="mesa.cliente" class="text-xs text-text-secondary truncate">
        <div class="flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          {{ mesa.cliente.nome }}
        </div>
        <div v-if="mesa.cliente.telefone" class="flex items-center mt-1">
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
          </svg>
          {{ mesa.cliente.telefone }}
        </div>
      </div>

      <!-- Total Consumido -->
      <div class="mt-3 pt-3 border-t border-border">
        <p class="text-xs text-text-secondary">Valor consumido:</p>
        <p class="text-sm font-bold text-error">{{ formatCurrency(total) }}</p>
        
        <p v-if="mesa.pedidos && mesa.pedidos.length > 0" class="text-xs text-text-secondary mt-1">
          {{ mesa.pedidos.length }} pedido(s)
        </p>
      </div>

      <!-- Modo de Pagamento -->
      <div v-if="modoPagamento" class="flex items-center text-xs mt-2">
        <span class="mr-1">{{ modoPagamento.icon }}</span>
        <span :class="['font-medium', modoPagamento.color]">
          {{ modoPagamento.label }}
        </span>
      </div>
    </div>

    <!-- Mesa Disponível -->
    <div v-else class="text-xs text-text-secondary mt-2">
      <div class="flex items-center">
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        {{ mesa.capacidade || 4 }} lugares
      </div>
    </div>

    <!-- Tempo Aberto (se ocupada) -->
    <div v-if="mesa.abertaEm && (mesa.status === 'OCUPADA' || mesa.status === 'AGUARDANDO_PAGAMENTO')" 
         class="text-xs text-text-secondary mt-2 flex items-center">
      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ tempoDecorrido }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

const props = defineProps({
  mesa: {
    type: Object,
    required: true
  }
})

defineEmits(['click'])

// Classes de borda baseadas no status
const borderClass = computed(() => {
  const classes = {
    'DISPONIVEL': 'border-info bg-info/5',
    'OCUPADA': 'border-success bg-success/5',
    'AGUARDANDO_PAGAMENTO': 'border-warning bg-warning/5',
    'FINALIZADA': 'border-border bg-background'
  }
  return classes[props.mesa.status] || 'border-border bg-background'
})

// Badge de status
const statusBadge = computed(() => {
  const badges = {
    'DISPONIVEL': 'bg-info text-white',
    'OCUPADA': 'bg-success text-white',
    'AGUARDANDO_PAGAMENTO': 'bg-warning text-white',
    'FINALIZADA': 'bg-gray-500 text-white'
  }
  return badges[props.mesa.status] || 'bg-gray-500 text-white'
})

// Label do status
const statusLabel = computed(() => {
  const labels = {
    'DISPONIVEL': 'Disponível',
    'OCUPADA': 'Ocupada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando',
    'FINALIZADA': 'Finalizada'
  }
  return labels[props.mesa.status] || props.mesa.status
})

// Label do tipo
const tipoLabel = computed(() => {
  const labels = {
    'MESA_FISICA': 'Mesa',
    'QUARTO': 'Quarto',
    'AREA_EVENTO': 'Evento',
    'ESPACO_LOUNGE': 'Lounge',
    'VIRTUAL': 'Virtual'
  }
  return labels[props.mesa.tipo] || 'Mesa'
})

// Total consumido
const total = computed(() => {
  if (!props.mesa.pedidos || props.mesa.pedidos.length === 0) return 0
  return props.mesa.pedidos.reduce((sum, p) => sum + (p.total || 0), 0)
})

// Modo de pagamento
const modoPagamento = computed(() => {
  if (!props.mesa.pedidos || props.mesa.pedidos.length === 0) return null
  
  const primeiroPedido = props.mesa.pedidos[0]
  if (!primeiroPedido) return null
  
  // Detecta se é pré-pago ou pós-pago
  if (primeiroPedido.tipoPagamento === 'PRE_PAGO') {
    return {
      icon: '💰',
      label: 'Pré-pago',
      color: 'text-success'
    }
  }
  
  return {
    icon: '💳',
    label: 'Pós-pago',
    color: 'text-warning'
  }
})

// Tempo decorrido desde abertura
const tempoDecorrido = computed(() => {
  if (!props.mesa.abertaEm) return ''
  
  const inicio = new Date(props.mesa.abertaEm)
  const agora = new Date()
  const diff = agora - inicio
  
  const horas = Math.floor(diff / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (horas > 0) {
    return `${horas}h ${minutos}min`
  }
  return `${minutos}min`
})
</script>
