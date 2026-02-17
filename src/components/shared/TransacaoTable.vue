<script setup>
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * TransacaoTable - Tabela de transações financeiras
 * 
 * Exibe histórico de transações de um fundo
 * com formatação e cores adequadas para cada tipo
 */

const props = defineProps({
  transacoes: {
    type: Array,
    required: true
  },
  exibirFundo: {
    type: Boolean,
    default: false
  }
})

// Configurações de tipo de transação
const tipoConfig = {
  CREDITO: {
    class: 'text-success',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    prefix: '+'
  },
  DEBITO: {
    class: 'text-error',
    icon: 'M20 12H4',
    prefix: '-'
  },
  ESTORNO: {
    class: 'text-warning',
    icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
    prefix: '↺'
  }
}

// Labels de origem
const origemLabels = {
  CASH: 'Dinheiro',
  TPA: 'TPA',
  GPO: 'GPO',
  REF: 'Referência',
  SISTEMA: 'Sistema'
}

// Formata data/hora
const formatarDataHora = (dataISO) => {
  const data = new Date(dataISO)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Ordena transações por data (mais recente primeiro)
const transacoesOrdenadas = computed(() => {
  return [...props.transacoes].sort((a, b) => 
    new Date(b.dataHora) - new Date(a.dataHora)
  )
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="border-b border-border bg-background">
        <tr>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">ID</th>
          <th v-if="exibirFundo" class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Fundo</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Tipo</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Valor</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Origem</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Motivo</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Operador</th>
          <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Data/Hora</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="transacao in transacoesOrdenadas" 
          :key="transacao.id"
          class="border-b border-border hover:bg-background transition-colors"
        >
          <td class="py-3 px-4 text-sm text-text-primary font-medium">#{{ transacao.id }}</td>
          <td v-if="exibirFundo" class="py-3 px-4 text-sm text-text-primary">
            Fundo #{{ transacao.fundoId }}
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-2">
              <svg class="w-4 h-4" :class="tipoConfig[transacao.tipo].class" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tipoConfig[transacao.tipo].icon"/>
              </svg>
              <span class="text-sm font-medium" :class="tipoConfig[transacao.tipo].class">
                {{ transacao.tipo }}
              </span>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="text-sm font-bold" :class="tipoConfig[transacao.tipo].class">
              {{ tipoConfig[transacao.tipo].prefix }} {{ formatCurrency(transacao.valor) }}
            </span>
          </td>
          <td class="py-3 px-4">
            <span class="badge-info text-xs">{{ origemLabels[transacao.origem] }}</span>
          </td>
          <td class="py-3 px-4 text-sm text-text-secondary max-w-xs truncate">
            {{ transacao.motivo || '-' }}
          </td>
          <td class="py-3 px-4 text-sm text-text-primary">{{ transacao.operador }}</td>
          <td class="py-3 px-4 text-sm text-text-secondary">{{ formatarDataHora(transacao.dataHora) }}</td>
        </tr>
        <tr v-if="transacoes.length === 0">
          <td :colspan="exibirFundo ? 8 : 7" class="py-8 px-4 text-center text-text-secondary">
            <div class="flex flex-col items-center space-y-2">
              <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p>Nenhuma transação encontrada</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
