<script setup>
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * ProdutoCard - Card para exibição de produto com estoque
 * 
 * Exibe informações do produto incluindo:
 * - Nome e categoria
 * - Preço
 * - Status de estoque
 * - Quantidade disponível
 */

const props = defineProps({
  produto: {
    type: Object,
    required: true
  },
  estoque: {
    type: Object,
    default: null
  }
})

// Configuração de status de estoque
const statusConfig = {
  OK: {
    class: 'bg-success/10 text-success',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Disponível'
  },
  BAIXO: {
    class: 'bg-warning/10 text-warning',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    label: 'Estoque Baixo'
  },
  ESGOTADO: {
    class: 'bg-error/10 text-error',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Esgotado'
  }
}

// Ícone da categoria
const getCategoriaIcon = (categoria) => {
  const icons = {
    COMIDAS: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    BEBIDAS: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.172V5L7 4z',
    FAST_FOOD: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
  }
  return icons[categoria] || icons.COMIDAS
}

// Label da categoria
const categoriaLabel = computed(() => {
  const labels = {
    COMIDAS: 'Comidas',
    BEBIDAS: 'Bebidas',
    FAST_FOOD: 'Fast Food'
  }
  return labels[props.produto.categoria] || props.produto.categoria
})

// Status atual do estoque
const statusAtual = computed(() => {
  if (!props.estoque) return null
  return statusConfig[props.estoque.status]
})
</script>

<template>
  <div class="card">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-start space-x-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoriaIcon(produto.categoria)"/>
          </svg>
        </div>
        <div>
          <h3 class="text-base font-semibold text-text-primary">{{ produto.nome }}</h3>
          <p class="text-sm text-text-secondary mt-0.5">{{ categoriaLabel }}</p>
        </div>
      </div>
      <span v-if="produto.ativo" class="badge-success text-xs">Ativo</span>
      <span v-else class="badge-secondary text-xs">Inativo</span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-2.5 bg-background rounded-lg">
        <span class="text-sm text-text-secondary">Preço</span>
        <span class="text-base font-bold text-primary">{{ formatCurrency(produto.preco) }}</span>
      </div>

      <div v-if="estoque" class="flex items-center justify-between p-2.5 bg-background rounded-lg">
        <div class="flex items-center space-x-2">
          <svg class="w-4 h-4" :class="statusAtual.class" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="statusAtual.icon"/>
          </svg>
          <span class="text-sm text-text-secondary">Estoque</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-text-primary">
            {{ estoque.quantidadeAtual }} / {{ estoque.quantidadeMinima }}
          </span>
          <span class="text-xs px-2 py-0.5 rounded" :class="statusAtual.class">
            {{ statusAtual.label }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
