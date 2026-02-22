<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto"
        @click.self="$emit('close')"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-border p-6 z-10">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-2xl font-bold text-text-primary">
                  {{ mesa.referencia }}
                </h2>
                <p class="text-sm text-text-secondary mt-1">
                  {{ tipoLabel }} • {{ statusLabel }}
                </p>
              </div>
              <button
                @click="$emit('close')"
                class="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <!-- Botões de ação principais -->
            <div class="flex gap-2">
              <button 
                @click="$emit('novoPedido', mesa)" 
                class="btn-primary flex-1 font-semibold shadow-lg hover:shadow-xl"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Novo Pedido
              </button>
              
              <button 
                v-if="fundo"
                @click="$emit('recarregar', fundo)" 
                class="btn-success flex-1 font-semibold shadow-lg hover:shadow-xl"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Recarregar Fundo
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6">
            <!-- Informações do Cliente -->
            <div v-if="mesa.cliente" class="card">
              <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Cliente
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-text-secondary">Nome:</p>
                  <p class="font-medium text-text-primary">{{ mesa.cliente.nome }}</p>
                </div>
                <div>
                  <p class="text-sm text-text-secondary">Telefone:</p>
                  <p class="font-medium text-text-primary">{{ mesa.cliente.telefone }}</p>
                </div>
                <div v-if="mesa.cliente.email">
                  <p class="text-sm text-text-secondary">Email:</p>
                  <p class="font-medium text-text-primary">{{ mesa.cliente.email }}</p>
                </div>
              </div>
            </div>

            <!-- Fundo de Consumo -->
            <div v-if="fundo" class="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <h3 class="text-lg font-semibold text-text-primary flex items-center mb-4">
                <svg class="w-5 h-5 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                💰 Fundo PRÉ-PAGO
              </h3>
              <div class="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <p class="text-sm text-text-secondary mb-1">Saldo Disponível</p>
                <p class="text-3xl font-bold text-success">{{ formatCurrency(fundo.saldo || fundo.saldoAtual || 0) }}</p>
                <p class="text-xs text-success mt-1">✓ Débito automático ativado</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-text-secondary">Total Recarregado</p>
                  <p class="text-lg font-semibold text-text-primary">{{ formatCurrency(fundo.totalRecarregado || 0) }}</p>
                </div>
                <div>
                  <p class="text-sm text-text-secondary">Total Consumido</p>
                  <p class="text-lg font-semibold text-text-primary">{{ formatCurrency(fundo.totalConsumido || 0) }}</p>
                </div>
              </div>
            </div>

            <!-- Conta da Mesa -->
            <div class="card">
              <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Conta da Mesa
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-text-secondary">Total Consumido:</p>
                  <p class="text-2xl font-bold text-error">{{ formatCurrency(totais.totalConsumido) }}</p>
                </div>
                <div>
                  <p class="text-sm text-text-secondary">Total Pago:</p>
                  <p class="text-xl font-bold text-success">{{ formatCurrency(totais.totalPago) }}</p>
                </div>
                <div>
                  <p class="text-sm text-text-secondary">Total Pendente:</p>
                  <p class="text-xl font-bold text-warning">{{ formatCurrency(totais.totalPendente) }}</p>
                </div>
                <div>
                  <p class="text-sm text-text-secondary">Aberta desde:</p>
                  <p class="font-medium text-text-primary">
                    {{ formatarDataAbertura }} ({{ tempoDecorrido }})
                  </p>
                </div>
              </div>
            </div>

            <!-- Histórico de Pedidos -->
            <div class="card">
              <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                Histórico de Pedidos
              </h3>

              <!-- Filtros de pedidos -->
              <div class="flex space-x-2 mb-4">
                <button
                  v-for="filtro in filtrosPedidos"
                  :key="filtro.value"
                  @click="filtroPedidoAtivo = filtro.value"
                  :class="[
                    'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                    filtroPedidoAtivo === filtro.value
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-gray-200'
                  ]"
                >
                  {{ filtro.label }}
                </button>
              </div>

              <!-- Lista de pedidos -->
              <div v-if="pedidosFiltrados.length > 0" class="space-y-3">
                <div
                  v-for="pedido in pedidosFiltrados"
                  :key="pedido.id"
                  class="border border-border rounded-lg p-4 hover:bg-background transition-colors"
                >
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <p class="font-semibold text-text-primary">Pedido #{{ pedido.id }}</p>
                      <p class="text-xs text-text-secondary">{{ formatarData(pedido.criadoEm) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-text-primary">{{ formatCurrency(pedido.total) }}</p>
                      <span :class="['text-xs px-2 py-1 rounded-full', getStatusPedidoBadge(pedido.status)]">
                        {{ getStatusPedidoLabel(pedido.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Status Financeiro -->
                  <div class="flex items-center text-xs mt-2">
                    <span class="mr-2 text-text-secondary">Status Financeiro:</span>
                    <span :class="['font-medium', getStatusFinanceiroCor(pedido.statusFinanceiro)]">
                      {{ getStatusFinanceiroLabel(pedido.statusFinanceiro) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-8 text-text-secondary">
                <p>Nenhum pedido encontrado</p>
              </div>
            </div>

            <!-- QR Code da Mesa -->
            <QrCodeDisplay
              :qr-code="qrCode"
              :loading="loadingQrCode"
              @renovar="renovarQrCode"
              @cancelar="cancelarQrCode"
              @gerar="gerarQrCode"
            />
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-white border-t border-border p-6 flex items-center justify-between">
            <button 
              @click="$emit('imprimirConta', mesa)" 
              class="btn-secondary"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Imprimir Conta
            </button>
            <div class="flex gap-3">
              <button @click="$emit('close')" class="btn-secondary">
                Fechar
              </button>
              <button
                v-if="podeFecharMesa"
                @click="confirmarFecharMesa"
                class="px-6 py-2 bg-error text-white rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-lg"
              >
                Fechar Mesa
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import QrCodeDisplay from '@/components/shared/QrCodeDisplay.vue'
import qrcodeService from '@/services/qrcodeService'

const { formatCurrency } = useCurrency()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  mesa: {
    type: Object,
    required: true
  },
  fundo: {
    type: Object,
    default: null
  },
  qrCode: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'close',
  'fecharMesa',
  'novoPedido',
  'imprimirConta',
  'recarregar',
  'atualizarQrCode'
])

const filtroPedidoAtivo = ref('TODOS')
const loadingQrCode = ref(false)

const filtrosPedidos = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Abertos', value: 'EM_ANDAMENTO' },
  { label: 'Finalizados', value: 'FINALIZADO' },
  { label: 'Cancelados', value: 'CANCELADO' }
]

// Labels
const tipoLabel = computed(() => {
  const labels = {
    'MESA_FISICA': 'Mesa Física',
    'QUARTO': 'Quarto',
    'AREA_EVENTO': 'Área de Evento',
    'ESPACO_LOUNGE': 'Espaço Lounge',
    'VIRTUAL': 'Virtual/Delivery'
  }
  return labels[props.mesa.tipo] || props.mesa.tipo
})

const statusLabel = computed(() => {
  const labels = {
    'DISPONIVEL': 'Disponível',
    'OCUPADA': 'Ocupada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'FINALIZADA': 'Finalizada'
  }
  return labels[props.mesa.status] || props.mesa.status
})

// Pedidos filtrados
const pedidosFiltrados = computed(() => {
  if (!props.mesa.pedidos) return []
  
  if (filtroPedidoAtivo.value === 'TODOS') {
    return props.mesa.pedidos
  }
  
  return props.mesa.pedidos.filter(p => p.status === filtroPedidoAtivo.value)
})

// Totais
const totais = computed(() => {
  const pedidos = props.mesa.pedidos || []
  
  const totalConsumido = pedidos.reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPago = pedidos
    .filter(p => p.statusFinanceiro === 'PAGO')
    .reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPendente = pedidos
    .filter(p => p.statusFinanceiro === 'NAO_PAGO')
    .reduce((sum, p) => sum + (p.total || 0), 0)
  
  return { totalConsumido, totalPago, totalPendente }
})

// Formatar data de abertura
const formatarDataAbertura = computed(() => {
  if (!props.mesa.abertaEm) return 'Não especificado'
  
  const data = new Date(props.mesa.abertaEm)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Tempo decorrido
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

// Permissões
const podeFecharMesa = computed(() => {
  return authStore.isAdmin || authStore.isGerente
})

// Formatar data genérica
const formatarData = (dataISO) => {
  if (!dataISO) return ''
  const data = new Date(dataISO)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Status de pedido
const getStatusPedidoBadge = (status) => {
  const badges = {
    'EM_ANDAMENTO': 'bg-info text-white',
    'FINALIZADO': 'bg-success text-white',
    'CANCELADO': 'bg-error text-white'
  }
  return badges[status] || 'bg-gray-500 text-white'
}

const getStatusPedidoLabel = (status) => {
  const labels = {
    'EM_ANDAMENTO': 'Em Andamento',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado'
  }
  return labels[status] || status
}

// Status financeiro
const getStatusFinanceiroCor = (status) => {
  const cores = {
    'PAGO': 'text-success',
    'NAO_PAGO': 'text-error',
    'PARCIAL': 'text-warning'
  }
  return cores[status] || 'text-text-secondary'
}

const getStatusFinanceiroLabel = (status) => {
  const labels = {
    'PAGO': 'PAGO',
    'NAO_PAGO': 'NÃO PAGO',
    'PARCIAL': 'PARCIAL'
  }
  return labels[status] || status
}

// Ações QR Code
const gerarQrCode = async () => {
  try {
    if (!props.mesa?.id) {
      notificationStore.erro('Mesa não identificada')
      return
    }
    
    loadingQrCode.value = true
    
    const novoQrCode = await qrcodeService.gerarQrCode({
      tipo: 'MESA',
      unidadeDeConsumoId: props.mesa.id,
      validadeMinutos: 525600 // 1 ano
    })
    
    notificationStore.sucesso('QR Code gerado com sucesso!')
    emit('atualizarQrCode', novoQrCode)
  } catch (error) {
    notificationStore.erro(error.message || 'Erro ao gerar QR Code')
  } finally {
    loadingQrCode.value = false
  }
}

const renovarQrCode = async () => {
  if (!props.qrCode) return
  
  try {
    loadingQrCode.value = true
    
    const qrCodeAtualizado = await qrcodeService.renovarQrCode(props.qrCode.token)
    
    notificationStore.sucesso('QR Code renovado com sucesso!')
    emit('atualizarQrCode', qrCodeAtualizado)
  } catch (error) {
    notificationStore.erro(error.message || 'Erro ao renovar QR Code')
  } finally {
    loadingQrCode.value = false
  }
}

const cancelarQrCode = async () => {
  if (!props.qrCode) return
  
  try {
    loadingQrCode.value = true
    
    await qrcodeService.cancelarQrCode(props.qrCode.token)
    
    notificationStore.sucesso('QR Code cancelado com sucesso!')
    emit('atualizarQrCode', null)
  } catch (error) {
    notificationStore.erro(error.message || 'Erro ao cancelar QR Code')
  } finally {
    loadingQrCode.value = false
  }
}

// Confirmar fechar mesa
const confirmarFecharMesa = () => {
  if (totais.value.totalPendente > 0) {
    const confirmar = confirm(
      `Existe valor pendente de ${formatCurrency(totais.value.totalPendente)}. Confirma fechamento?`
    )
    if (!confirmar) return
  }
  
  emit('fecharMesa', props.mesa)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
