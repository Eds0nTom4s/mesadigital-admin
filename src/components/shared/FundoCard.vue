<script setup>
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'
import SaldoBadge from '@/components/shared/SaldoBadge.vue'

const { formatCurrency } = useCurrency()

/**
 * FundoCard - Card para exibição de fundo de consumo
 * 
 * Componente reutilizável para listar fundos na dashboard
 * Exibe identificador, tipo, saldo e status do fundo
 */

const props = defineProps({
  fundo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['verDetalhes', 'recarregar'])

/**
 * FundoConsumoResponse não tem campo 'tipo'.
 * Derivar: clienteId != null → IDENTIFICADO | clienteId == null → ANONIMO
 */
const tipoDerivado = computed(() => {
  return props.fundo.clienteId != null ? 'IDENTIFICADO' : 'ANONIMO'
})

// Labels de tipo baseados no tipo derivado
const tipoLabels = {
  IDENTIFICADO: 'Cliente Identificado',
  ANONIMO: 'Anônimo (QR Code)'
}

// Ícone baseado no tipo derivado
const getTipoIcon = (tipo) => {
  const icons = {
    IDENTIFICADO: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    ANONIMO: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
  }
  return icons[tipo] || icons.ANONIMO
}

// Retorna configuração do status baseado no campo 'ativo' (API)
const getStatusConfig = (ativo) => {
  return ativo
    ? { class: 'badge-success', label: 'Ativo' }
    : { class: 'badge-secondary', label: 'Encerrado' }
}

// Formata data ISO para formato local
const formatarData = (dataISO) => {
  if (!dataISO) return 'Data indisponível'
  const data = new Date(dataISO)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="card hover:shadow-lg transition-shadow cursor-pointer" @click="emit('verDetalhes', fundo)">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTipoIcon(tipoDerivado)"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-primary">{{ fundo.identificador }}</h3>
          <p class="text-sm text-text-secondary">{{ tipoLabels[tipoDerivado] }} • #{{ fundo.id }}</p>
        </div>
      </div>
      <span :class="getStatusConfig(fundo.ativo).class">
        {{ getStatusConfig(fundo.ativo).label }}
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-background rounded-lg">
        <span class="text-sm text-text-secondary">Saldo Atual</span>
        <SaldoBadge :saldo="fundo.saldoAtual" :ativo="fundo.ativo" tamanho="md" />
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-text-secondary">Data de Criação</span>
        <span class="text-text-primary font-medium">{{ formatarData(fundo.createdAt || fundo.dataCriacao) }}</span>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-border flex gap-2">
      <button class="btn-secondary flex-1" @click.stop="emit('recarregar', fundo)" :disabled="!fundo.ativo">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        Recarregar
      </button>
      <button class="btn-primary flex-1" @click.stop="emit('verDetalhes', fundo)">
        Ver Detalhes
      </button>
    </div>
  </div>
</template>
