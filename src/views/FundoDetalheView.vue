<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SaldoBadge from '@/components/shared/SaldoBadge.vue'
import TransacaoTable from '@/components/shared/TransacaoTable.vue'
import { useCurrency } from '@/utils/currency'
import fundoConsumoService from '@/services/fundoConsumoService'

/**
 * FundoDetalheView - Detalhes completos de um fundo
 * 
 * INTEGRADO COM API BACKEND
 * Exibe:
 * - Informações do fundo via buscarFundoPorCliente
 * - Saldo atual via consultarSaldo
 * - Extrato completo via listarTransacoes
 * - Valor mínimo via consultarValorMinimo
 */

const route = useRoute()
const router = useRouter()
const { formatCurrency } = useCurrency()

const fundo = ref(null)
const transacoes = ref([])
const valorMinimo = ref(5000)
const loading = ref(true)
const error = ref(null)

// Carrega dados via API
onMounted(async () => {
  try {
    const fundoId = parseInt(route.params.id)
    
    // Carrega valor mínimo
    const configResp = await fundoConsumoService.consultarValorMinimo()
    valorMinimo.value = configResp.data.valorMinimo
    
    // Busca fundo por ID (usa clienteId temporariamente)
    const fundoResp = await fundoConsumoService.buscarFundoPorCliente(fundoId)
    fundo.value = fundoResp.data
    
    // Carrega transações
    const transacoesResp = await fundoConsumoService.listarTransacoes(fundoId)
    transacoes.value = transacoesResp.data
    
  } catch (err) {
    console.error('Erro ao carregar fundo:', err)
    error.value = err.response?.data?.message || err.message
    if (err.response?.status === 404) {
      router.push('/admin/fundos')
    }
  } finally {
    loading.value = false
  }
})

// Cálculos financeiros
const totalCreditos = computed(() => {
  return transacoes.value
    .filter(t => t.tipo === 'CREDITO')
    .reduce((sum, t) => sum + t.valor, 0)
})

const totalDebitos = computed(() => {
  return transacoes.value
    .filter(t => t.tipo === 'DEBITO')
    .reduce((sum, t) => sum + t.valor, 0)
})

const totalEstornos = computed(() => {
  return transacoes.value
    .filter(t => t.tipo === 'ESTORNO')
    .reduce((sum, t) => sum + t.valor, 0)
})

// Mapas de labels
const tipoLabels = {
  UNIDADE_CONSUMO: 'Unidade de Consumo',
  QR_CONSUMO: 'QR Code',
  EVENTO: 'Evento'
}

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

// Voltar
const voltar = () => {
  window.history.back()
}

// Ações mockadas
const encerrarFundo = () => {
  alert('Funcionalidade de encerramento será implementada com integração backend')
}

const exportarExtrato = () => {
  alert('Funcionalidade de exportação será implementada')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Conteúdo -->
    <template v-else-if="fundo">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button @click="voltar" class="btn-secondary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Voltar
          </button>
          <div>
            <h2 class="text-2xl font-bold text-text-primary">{{ fundo.identificador }}</h2>
            <p class="text-text-secondary mt-1">{{ tipoLabels[fundo.tipo] }} • Fundo #{{ fundo.id }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="exportarExtrato" class="btn-secondary">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Exportar
          </button>
          <button 
            v-if="fundo.status === 'ATIVO'" 
            @click="encerrarFundo" 
            class="btn-primary bg-error hover:bg-error/90"
          >
            Encerrar Fundo
          </button>
        </div>
      </div>

      <!-- Cards de Resumo -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card">
          <p class="text-text-secondary text-sm mb-2">Saldo Atual</p>
          <SaldoBadge 
            :saldo="fundo.saldoAtual" 
            :status="fundo.status" 
            :fundoMinimo="configuracoes?.fundoMinimo || 5000"
            tamanho="lg" 
          />
        </div>

        <div class="card">
          <p class="text-text-secondary text-sm mb-2">Total Créditos</p>
          <p class="text-2xl font-bold text-success">{{ formatCurrency(totalCreditos) }}</p>
          <p class="text-xs text-text-secondary mt-1">
            {{ transacoes.filter(t => t.tipo === 'CREDITO').length }} transações
          </p>
        </div>

        <div class="card">
          <p class="text-text-secondary text-sm mb-2">Total Débitos</p>
          <p class="text-2xl font-bold text-error">{{ formatCurrency(totalDebitos) }}</p>
          <p class="text-xs text-text-secondary mt-1">
            {{ transacoes.filter(t => t.tipo === 'DEBITO').length }} transações
          </p>
        </div>

        <div class="card">
          <p class="text-text-secondary text-sm mb-2">Status</p>
          <span :class="statusConfig[fundo.status].class" class="inline-block">
            {{ statusConfig[fundo.status].label }}
          </span>
          <p class="text-xs text-text-secondary mt-1">
            Criado {{ formatarData(fundo.dataCriacao) }}
          </p>
        </div>
      </div>

      <!-- Informações Detalhadas -->
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Informações do Fundo</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Identificador</p>
            <p class="text-base font-medium text-text-primary">{{ fundo.identificador }}</p>
          </div>
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Tipo</p>
            <p class="text-base font-medium text-text-primary">{{ tipoLabels[fundo.tipo] }}</p>
          </div>
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Data de Criação</p>
            <p class="text-base font-medium text-text-primary">{{ formatarData(fundo.dataCriacao) }}</p>
          </div>
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">ID do Fundo</p>
            <p class="text-base font-medium text-text-primary">#{{ fundo.id }}</p>
          </div>
        </div>
      </div>

      <!-- Extrato de Transações -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Extrato de Transações</h3>
          <span class="text-sm text-text-secondary">
            {{ transacoes.length }} {{ transacoes.length === 1 ? 'transação' : 'transações' }}
          </span>
        </div>
        
        <TransacaoTable :transacoes="transacoes" />
      </div>

      <!-- Aviso sobre Saldo Negativo -->
      <div v-if="!configuracoes?.permitirSaldoNegativo && fundo.saldoAtual < configuracoes?.fundoMinimo" class="card bg-warning/5 border border-warning/20">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <h4 class="font-semibold text-warning mb-1">Saldo Baixo</h4>
            <p class="text-sm text-text-secondary">
              O saldo está abaixo do mínimo recomendado ({{ formatCurrency(configuracoes.fundoMinimo) }}).
              Saldo negativo não é permitido neste sistema.
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- Fundo não encontrado -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <h3 class="text-xl font-semibold text-text-primary mb-2">Fundo não encontrado</h3>
      <p class="text-text-secondary mb-4">O fundo solicitado não existe ou foi removido.</p>
      <button @click="voltar" class="btn-primary">Voltar</button>
    </div>
  </div>
</template>
