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
                <p class="text-sm text-primary font-semibold mt-2">
                  Código de referência: {{ codigoReferenciaMesa }}
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
                v-if="podeNovoPedido"
                @click="abrirModalNovoPedido" 
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
            <!-- Identificação da Mesa -->
            <div class="card border border-primary/20 bg-primary/5">
              <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                Identificação da Mesa
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-text-secondary">Código de referência</p>
                  <div class="flex items-center gap-2 mt-1">
                    <p class="font-mono text-lg font-bold text-text-primary">{{ codigoReferenciaMesa }}</p>
                    <button
                      type="button"
                      class="text-xs px-2 py-1 rounded border border-border hover:bg-white"
                      @click="copiarTexto(codigoReferenciaMesa, 'Código de referência copiado')"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div>
                  <p class="text-sm text-text-secondary">Número / ID interno</p>
                  <p class="font-medium text-text-primary mt-1">
                    {{ mesa.numero || 'Sem número' }} <span class="text-text-secondary">• ID {{ mesa.id || '-' }}</span>
                  </p>
                </div>

                <div>
                  <p class="text-sm text-text-secondary">Token QR físico</p>
                  <div class="flex items-center gap-2 mt-1">
                    <p class="font-mono text-sm font-semibold text-text-primary break-all">{{ tokenQrFisico }}</p>
                    <button
                      v-if="tokenQrFisico !== 'Não gerado'"
                      type="button"
                      class="text-xs px-2 py-1 rounded border border-border hover:bg-white"
                      @click="copiarTexto(tokenQrFisico, 'Token QR físico copiado')"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div>
                  <p class="text-sm text-text-secondary">Token da sessão ativa</p>
                  <p class="font-mono text-sm font-semibold text-text-primary mt-1 break-all">
                    {{ sessao?.qrCodeSessao || 'Sem sessão ativa' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- CONFIGURAÇÃO DA MESA (Apenas se não tem sessão ativa) -->
            <div v-if="!sessao" class="card bg-gray-50 border border-gray-200">
               <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                 <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37..."/>
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 Configuração da Mesa
               </h3>
               
               <div class="space-y-4">
                 <!-- Renomear -->
                 <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                   <label class="block text-sm font-medium text-gray-700 mb-2">Renomear Mesa / Referência</label>
                   <div class="flex gap-2">
                     <input v-model="editReferencia" type="text" class="input-field flex-1" placeholder="Ex: Mesa 12" />
                     <button @click="salvarRenomeacao" :disabled="loadingConfig" class="btn-primary">Salvar</button>
                   </div>
                 </div>

                 <!-- Ações Rápidas -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <button 
                     @click="alterarStatus" 
                     :disabled="loadingConfig"
                     :class="['font-semibold py-2 px-4 rounded-lg transition-colors border-2', mesa.ativa ? 'border-warning text-warning hover:bg-warning/10' : 'border-success text-success hover:bg-success/10']"
                   >
                     {{ mesa.ativa ? '⛔ Marcar como Indisponível' : '✅ Reativar Mesa' }}
                   </button>

                   <button 
                     @click="removerMesa" 
                     :disabled="loadingConfig"
                     class="font-semibold py-2 px-4 rounded-lg transition-colors border-2 border-error text-error hover:bg-error/10"
                   >
                     🗑️ Remover Mesa
                   </button>
                 </div>
               </div>
            </div>

            <!-- Informações do Cliente -->
            <div v-if="sessao" class="card">
              <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Cliente
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-text-secondary">Nome:</p>
                  <p class="font-medium text-text-primary">{{ sessao?.nomeCliente || mesa.cliente?.nome || 'Anónimo' }}</p>
                </div>
                <div v-if="sessao?.telefoneCliente || mesa.cliente?.telefone">
                  <p class="text-sm text-text-secondary">Telefone:</p>
                  <p class="font-medium text-text-primary">{{ sessao?.telefoneCliente || mesa.cliente?.telefone }}</p>
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
            <div v-if="sessao" class="card">
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
            <div v-if="sessao" class="card">
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
                      <p class="text-xs text-text-secondary">{{ formatarData(pedido.createdAt) }}</p>
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
              @click="$emit('gerarFatura', mesa)" 
              class="btn-secondary"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Gerar Fatura
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

    <!-- Modal: Liquidação de Conta -->
    <div v-if="modalLiquidarAberto" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 class="text-xl font-bold mb-4">Liquidar Conta Pendente</h3>
        <p class="mb-4 text-text-secondary">Existe um valor pendente de <strong>{{ formatCurrency(totais.totalPendente) }}</strong> para ser liquidado.</p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Método de Pagamento</label>
          <select v-model="formLiquidar.metodo" class="input-field w-full">
            <option value="CASH">Dinheiro (CASH)</option>
            <option value="TPA">Multicaixa (TPA)</option>
            <option value="DIGITAL">Digital (AppyPay/Express)</option>
            <option value="FUNDO_CONSUMO">Fundo de Consumo (QR/Token)</option>
          </select>
        </div>

        <div v-if="formLiquidar.metodo === 'FUNDO_CONSUMO'" class="mb-4">
          <label class="block text-sm font-medium mb-1">Token/QR do Fundo</label>
          <input v-model="formLiquidar.qrCode" type="text" placeholder="Insira o Token..." class="input-field w-full">
          <p class="text-xs text-text-secondary mt-1 text-info">Não é necessário preencher caso se use o Fundo da própria sessão e esta tenha saldo transferido previamente, embora este fluxo sirva mais para Fundos externos.</p>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="modalLiquidarAberto = false" class="btn-secondary">Cancelar</button>
          <button @click="confirmarLiquidar" class="btn-primary">Confirmar e Encerrar</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import qrcodeService from '@/api/qrcodeService'
import mesasService from '@/api/mesasService'
import QrCodeDisplay from '@/components/shared/QrCodeDisplay.vue'

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
  /**
   * Dados da sessão ativa (SessaoConsumoResponse).
   * Null quando mesa está DISPONÍVEL.
   */
  sessao: {
    type: Object,
    default: null
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
  'liquidarConta',
  'novoPedido',
  'gerarFatura',
  'recarregar',
  'atualizarQrCode',
  'atualizouMesa'
])

const filtroPedidoAtivo = ref('TODOS')
const loadingQrCode = ref(false)
const loadingConfig = ref(false)
const editReferencia = ref('')

watch(() => props.mesa, (n) => {
  if (n) {
    editReferencia.value = n.referencia
  }
}, { immediate: true })

const salvarRenomeacao = async () => {
  if (!editReferencia.value.trim() || editReferencia.value === props.mesa.referencia) return
  try {
    loadingConfig.value = true
    await mesasService.renomear(props.mesa.id, editReferencia.value)
    notificationStore.sucesso('Mesa renomeada com sucesso')
    emit('atualizouMesa')
  } catch (error) {
    notificationStore.erro(error.message || 'Erro ao renomear mesa')
  } finally {
    loadingConfig.value = false
  }
}

const alterarStatus = async () => {
  try {
    loadingConfig.value = true
    if (props.mesa.ativa) {
      if (!confirm('Tornar a mesa indisponível para novos clientes?')) return
      await mesasService.desativar(props.mesa.id)
      notificationStore.sucesso('Mesa marcada como indisponível')
    } else {
      await mesasService.ativar(props.mesa.id)
      notificationStore.sucesso('Mesa reativada')
    }
    emit('atualizouMesa')
  } catch (error) {
    notificationStore.erro(error.message || 'Erro ao alterar status')
  } finally {
    loadingConfig.value = false
  }
}

const removerMesa = async () => {
  if (!confirm('ATENÇÃO: Deseja mesmo remover permanentemente esta mesa e todos os seus históricos?\nEsta acção não pode ser desfeita!')) return
  try {
    loadingConfig.value = true
    await mesasService.remover(props.mesa.id)
    notificationStore.sucesso('Mesa removida com sucesso')
    emit('atualizouMesa')
    emit('close')
  } catch (error) {
    notificationStore.erro(error.response?.data?.message || error.message || 'Erro ao remover mesa')
  } finally {
    loadingConfig.value = false
  }
}

// Função para abrir modal de novo pedido com validação
const abrirModalNovoPedido = () => {
  if (!props.mesa || !props.mesa.id) {
    notificationStore.erro('Mesa não identificada. Feche e reabra o modal.')
    return
  }
  
  if (!props.isOpen) {
    console.warn('[ModalDetalhesMesa] Tentativa de abrir novo pedido com modal fechado')
    return
  }
  
  console.log('[ModalDetalhesMesa] Fechando modal de detalhes e abrindo novo pedido para mesa:', props.mesa.id)
  
  // Primeiro fechar este modal
  emit('close')
  
  // Aguardar um ciclo para garantir que o modal fechou
  nextTick(() => {
    // Então emitir evento para abrir modal de novo pedido
    emit('novoPedido', props.mesa)
  })
}

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
  // Prefer session status over mesa derived status
  const status = props.sessao?.status || props.mesa.status
  const labels = {
    'DISPONIVEL': 'Disponível',
    'OCUPADA': 'Ocupada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'ABERTA': 'Sessão Aberta',
    'ENCERRADA': 'Encerrada',
    'FINALIZADA': 'Encerrada'  // legacy
  }
  return labels[status] || status
})

const codigoReferenciaMesa = computed(() => {
  return props.mesa?.referencia || props.sessao?.referenciaMesa || `MESA-${props.mesa?.id || '-'}`
})

const tokenQrFisico = computed(() => {
  return props.qrCode?.token || props.mesa?.qrCode || 'Não gerado'
})

// Pedidos filtrados — prefer dados da sessão ativa
const pedidosFiltrados = computed(() => {
  const pedidos = props.sessao?.pedidos || props.mesa.pedidos || []
  
  if (filtroPedidoAtivo.value === 'TODOS') {
    return pedidos
  }
  
  return pedidos.filter(p => p.status === filtroPedidoAtivo.value)
})

// Totais — prefer dados da sessão ativa
const totais = computed(() => {
  if (props.sessao?.totalConsumo != null) {
    return {
      totalConsumido: props.sessao.totalConsumo,
      totalPago: 0,
      totalPendente: props.sessao.totalConsumo
    }
  }
  const pedidos = props.sessao?.pedidos || props.mesa.pedidos || []
  
  const totalConsumido = pedidos.reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPago = pedidos
    .filter(p => p.statusFinanceiro === 'PAGO')
    .reduce((sum, p) => sum + (p.total || 0), 0)
  const totalPendente = pedidos
    .filter(p => p.statusFinanceiro === 'NAO_PAGO')
    .reduce((sum, p) => sum + (p.total || 0), 0)
  
  return { totalConsumido, totalPago, totalPendente }
})

// Formatar data de abertura da sessão
const formatarDataAbertura = computed(() => {
  const abertaEm = props.sessao?.abertaEm || props.mesa.abertaEm
  if (!abertaEm) return 'Não especificado'
  
  const data = new Date(abertaEm)
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
  const abertaEm = props.sessao?.abertaEm || props.mesa.abertaEm
  if (!abertaEm) return ''
  
  const inicio = new Date(abertaEm)
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
const podeNovoPedido = computed(() => props.sessao?.status === 'ABERTA')

const podeFecharMesa = computed(() => {
  const temPermissao = authStore.isAdmin || authStore.isGerente
  const sessaoEncerrável = props.sessao?.status === 'ABERTA' || props.sessao?.status === 'AGUARDANDO_PAGAMENTO'
  return temPermissao && sessaoEncerrável
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

const copiarTexto = async (valor, mensagem = 'Copiado') => {
  if (!valor || valor === 'Não gerado') return
  try {
    await navigator.clipboard.writeText(String(valor))
    notificationStore.sucesso(mensagem)
  } catch {
    notificationStore.aviso('Não foi possível copiar automaticamente')
  }
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
      mesaId: props.mesa.id,
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

// Liquidação e Fecho
const modalLiquidarAberto = ref(false)
const formLiquidar = ref({
  metodo: 'CASH',
  qrCode: ''
})

const confirmarFecharMesa = () => {
  if (totais.value.totalPendente > 0) {
    modalLiquidarAberto.value = true
    return
  }
  emit('fecharMesa', props.mesa)
}

const confirmarLiquidar = () => {
  if (formLiquidar.value.metodo === 'FUNDO_CONSUMO' && !formLiquidar.value.qrCode) {
    // Opção para permitir usar o fundo da sessão é passar undefined/vazio para qrCodeFundoExterno
    // No backend, se receber vazio, tenta usar sessao.getFundoConsumo()
  }
  emit('liquidarConta', {
    mesa: props.mesa,
    metodo: formLiquidar.value.metodo,
    qrCodeFundoExterno: formLiquidar.value.qrCode
  })
  modalLiquidarAberto.value = false
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
