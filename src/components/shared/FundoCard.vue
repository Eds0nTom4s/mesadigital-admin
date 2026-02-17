<script setup>
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

const emit = defineEmits(['verDetalhes'])

// Mapeia tipos de fundo para labels
const tipoLabels = {
  MESA: 'Mesa',
  QR_CONSUMO: 'QR Code',
  EVENTO: 'Evento'
}

// Mapeia status para badges
const statusConfig = {
  ATIVO: { class: 'badge-success', label: 'Ativo' },
  ENCERRADO: { class: 'badge-secondary', label: 'Encerrado' },
  EXPIRADO: { class: 'badge-error', label: 'Expirado' }
}

// Formata data
const formatarData = (dataISO) => {
  const data = new Date(dataISO)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Ícone baseado no tipo
const getTipoIcon = (tipo) => {
  const icons = {
    MESA: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    QR_CONSUMO: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
    EVENTO: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  }
  return icons[tipo] || icons.MESA
}
</script>

<template>
  <div class="card hover:shadow-lg transition-shadow cursor-pointer" @click="emit('verDetalhes', fundo)">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getTipoIcon(fundo.tipo)"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-text-primary">{{ fundo.identificador }}</h3>
          <p class="text-sm text-text-secondary">{{ tipoLabels[fundo.tipo] }} • #{{ fundo.id }}</p>
        </div>
      </div>
      <span :class="statusConfig[fundo.status].class">
        {{ statusConfig[fundo.status].label }}
      </span>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-background rounded-lg">
        <span class="text-sm text-text-secondary">Saldo Atual</span>
        <SaldoBadge :saldo="fundo.saldoAtual" :status="fundo.status" tamanho="md" />
      </div>

      <div class="flex items-center justify-between text-sm">
        <span class="text-text-secondary">Data de Criação</span>
        <span class="text-text-primary font-medium">{{ formatarData(fundo.dataCriacao) }}</span>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-border">
      <button class="btn-primary w-full" @click.stop="emit('verDetalhes', fundo)">
        Ver Detalhes
      </button>
    </div>
  </div>
</template>
