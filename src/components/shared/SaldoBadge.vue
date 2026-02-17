<script setup>
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * SaldoBadge - Badge visual para exibição de saldo
 * 
 * Exibe o saldo com cores e estilos diferentes baseado no valor
 * - Verde: Saldo positivo e adequado
 * - Amarelo: Saldo baixo (alerta)
 * - Vermelho: Saldo zerado ou negativo
 * - Cinza: Status encerrado/expirado
 */

const props = defineProps({
  saldo: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'ATIVO',
    validator: (value) => ['ATIVO', 'ENCERRADO', 'EXPIRADO'].includes(value)
  },
  fundoMinimo: {
    type: Number,
    default: 5000
  },
  tamanho: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

// Determina a classe CSS baseada no status e valor do saldo
const badgeClass = computed(() => {
  const baseClasses = 'font-semibold rounded-lg inline-flex items-center justify-center'
  
  // Classes de tamanho
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  // Status inativo
  if (props.status !== 'ATIVO') {
    return `${baseClasses} ${sizeClasses[props.tamanho]} bg-gray-200 text-gray-600`
  }
  
  // Status ativo - verifica valor
  if (props.saldo <= 0) {
    return `${baseClasses} ${sizeClasses[props.tamanho]} bg-error/10 text-error`
  }
  
  if (props.saldo < props.fundoMinimo) {
    return `${baseClasses} ${sizeClasses[props.tamanho]} bg-warning/10 text-warning`
  }
  
  return `${baseClasses} ${sizeClasses[props.tamanho]} bg-success/10 text-success`
})

// Ícone baseado no status
const icon = computed(() => {
  if (props.status !== 'ATIVO') {
    return 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
  }
  
  if (props.saldo <= 0) {
    return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  }
  
  if (props.saldo < props.fundoMinimo) {
    return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  }
  
  return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
})
</script>

<template>
  <div :class="badgeClass">
    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon"/>
    </svg>
    <span>{{ formatCurrency(saldo) }}</span>
  </div>
</template>
