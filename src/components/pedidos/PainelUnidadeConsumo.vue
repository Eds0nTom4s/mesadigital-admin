<template>
  <div class="space-y-6">
    <!-- Botão Voltar -->
    <div class="flex items-center">
      <button 
        @click="$emit('fechar')" 
        class="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span class="font-medium">Voltar à Lista de Unidades</span>
      </button>
    </div>

    <!-- A) CONTEXTO DO CONSUMO -->
    <div class="card">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span class="text-2xl">{{ iconeTipoUnidade }}</span>
          </div>
          <div>
            <h3 class="text-xl font-bold text-text-primary">{{ unidade.referencia }}</h3>
            <p class="text-text-secondary text-sm">{{ unidade.tipo }}</p>
          </div>
        </div>
        <div class="flex flex-col items-end gap-2">
          <span :class="badgeStatusUnidade" class="px-3 py-1 rounded-full text-sm font-semibold">
            {{ labelStatusUnidade(unidade.status) }}
          </span>
          <!-- Tipo de Sessão -->
          <span :class="sessaoTipoBadgeClass" class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            {{ sessaoTipoLabel }}
          </span>
        </div>
      </div>

      <!-- Cronómetro da Sessão -->
      <div class="mt-4 pt-4 border-t border-border flex items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xl">⏱️</span>
          <div>
            <p class="text-xs text-text-secondary">Duração da Sessão</p>
            <p class="text-lg font-bold font-mono text-text-primary">{{ cronometro }}</p>
          </div>
        </div>
        <div v-if="unidade.sessaoAtiva?.id">
          <p class="text-xs text-text-secondary">ID Sessão</p>
          <p class="text-sm font-mono text-text-secondary">#{{ unidade.sessaoAtiva.id }}</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
        <!-- Cliente (identificado ou anónimo) -->
        <div>
          <p class="text-text-secondary text-sm">Cliente</p>
          <p class="font-semibold text-text-primary">{{ unidade.cliente?.nome || 'Anónimo' }}</p>
          <p v-if="unidade.cliente?.telefone" class="text-text-secondary text-sm">{{ unidade.cliente.telefone }}</p>
        </div>

        <!-- Modo de Pagamento -->
        <div>
          <p class="text-text-secondary text-sm">Modo de Pagamento</p>
          <div v-if="fundo" class="flex items-center gap-2">
            <span class="text-2xl">💳</span>
            <div>
              <p class="font-bold text-primary">Pré-pago</p>
              <p class="text-xs text-text-secondary">Com Fundo de Consumo</p>
            </div>
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-2xl">💰</span>
            <div>
              <p class="font-bold text-warning">Pós-pago</p>
              <p class="text-xs text-text-secondary">Pagamento no final</p>
            </div>
          </div>
        </div>

        <!-- Saldo Fundo de Consumo -->
        <div v-if="fundo">
          <p class="text-text-secondary text-sm">Saldo Fundo</p>
          <p class="text-2xl font-bold" :class="saldoBaixo ? 'text-error' : 'text-success'">
            {{ formatCurrency(fundo.saldoAtual || 0) }}
          </p>
          <p v-if="saldoBaixo" class="text-xs text-error mt-1">⚠️ Saldo baixo</p>
          <button
            @click="$emit('recarregar-fundo')"
            class="mt-2 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            + Recarregar Fundo
          </button>
        </div>

        <!-- Total Consumido -->
        <div v-if="unidade.totalConsumido > 0">
          <p class="text-text-secondary text-sm">Total Consumido</p>
          <p class="text-xl font-bold text-text-primary">
            {{ formatCurrency(unidade.totalConsumido) }}
          </p>
        </div>
      </div>
    </div>

    <!-- B) LISTA DE PEDIDOS ATIVOS -->
    <div v-if="pedidosAtivos && pedidosAtivos.length > 0" class="space-y-4">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-sm font-bold text-text-secondary uppercase tracking-wider">Pedidos em Curso</h3>
        <button 
          @click="$emit('novo-pedido')" 
          class="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 shadow-sm"
        >
          <span class="text-lg leading-none">+</span> Novo Pedido
        </button>
      </div>
      
      <div v-for="pedido in pedidosAtivos" :key="pedido.id" class="card-pedido-container">
        <!-- Cabeçalho do Pedido (Click para expandir) -->
        <div 
          class="pedido-header-click card cursor-pointer hover:border-primary transition-all duration-200"
          :class="{ 'border-l-4 border-l-primary': pedidoExpandido === pedido.id }"
          @click="alternarPedido(pedido.id)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ iconStatusPedido(pedido) }}</span>
              <div>
                <h4 class="text-lg font-bold text-text-primary">Pedido #{{ pedido.numero }}</h4>
                <p class="text-xs text-text-secondary mt-1">
                  {{ pedido.subPedidos?.length || 0 }} SubPedidos • {{ formatCurrency(pedido.total || 0) }}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <!-- Novo Badge de Status Consolidado -->
              <span :class="['px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm', corStatusPedido(pedido)]">
                {{ labelStatusPedido(pedido) }}
              </span>
              
              <svg 
                class="w-6 h-6 text-gray-400 transition-transform duration-300" 
                :class="{ 'rotate-180': pedidoExpandido === pedido.id }"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Conteúdo do Pedido (Expandido) -->
        <transition name="fade-slide">
          <div v-if="pedidoExpandido === pedido.id" class="pedido-expandido-detalhes mt-2 space-y-4">
            
            <!-- Ações do Pedido no topo do expandido -->
            <div class="flex flex-wrap gap-2 px-1">
              <button 
                v-if="pedido.status !== 'FINALIZADO' && pedido.status !== 'CANCELADO' && !mostrarFormCancelamento"
                @click="idPedidoCancelamento = pedido.id; mostrarFormCancelamento = true"
                class="btn-error py-1 px-4 text-sm"
              >
                ❌ Cancelar Pedido
              </button>
            </div>

            <!-- Listagem de SubPedidos do Pedido Selecionado -->
            <div v-if="pedido.subPedidos && pedido.subPedidos.length > 0" class="subpedidos-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="sub in pedido.subPedidos"
                :key="sub.id"
                class="subpedido-card bg-white border border-gray-100 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ iconeCozinha(sub.cozinhaNome || sub.unidadeProducaoNome) }}</span>
                    <div>
                      <h5 class="font-bold text-sm text-gray-800">{{ sub.cozinhaNome || sub.unidadeProducaoNome || 'Cozinha' }}</h5>
                      <span class="text-[10px] text-gray-400 font-mono">#{{ sub.numero || sub.id }}</span>
                    </div>
                  </div>
                  <span :class="['px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter', badgeStatusSubPedido(sub.status)]">
                    {{ labelStatusSubPedido(sub.status) }}
                  </span>
                </div>

                <div class="itens-list space-y-2 mb-4">
                  <!-- Garantir listagem de itens do subpedido -->
                  <div v-for="item in (sub.itens || sub.itemPedidos || [])" :key="item.id" class="flex justify-between text-xs">
                    <span class="text-gray-600">
                      <strong class="text-gray-900">{{ item.quantidade }}x</strong> {{ item.produtoNome }}
                      <span v-if="item.observacoes" class="block text-[10px] text-gray-400 italic">"{{ item.observacoes }}"</span>
                    </span>
                    <span class="font-semibold text-gray-500">{{ formatCurrency(item.subtotal || item.valorTotal) }}</span>
                  </div>
                </div>

                <div v-if="podeMarcarEntregue(sub)" class="mt-auto pt-3 border-t border-gray-50 flex justify-end">
                  <button @click.stop="marcarEntregue(sub.id)" class="btn-success py-1 px-3 text-xs w-full">
                    ✓ Marcar Entregue
                  </button>
                </div>
              </div>
            </div>

            <!-- Fallback para Itens sem SubPedidos agrupados (ou lista completa) -->
            <div v-else-if="(pedido.itens || pedido.itemPedidos)?.length > 0" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
               <h5 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                 <span>📋</span> Itens do Pedido
               </h5>
               <div class="space-y-2">
                 <div v-for="item in (pedido.itens || pedido.itemPedidos)" :key="item.id" class="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <div class="flex-1">
                      <p class="text-sm">
                        <strong class="font-bold">{{ item.quantidade }}x</strong> {{ item.produtoNome }}
                      </p>
                      <p v-if="item.observacoes" class="text-[10px] text-gray-400 italic mt-0.5">"{{ item.observacoes }}"</p>
                    </div>
                    <span class="font-semibold text-sm text-gray-600 ml-4">{{ formatCurrency(item.subtotal || item.valorTotal) }}</span>
                 </div>
               </div>
            </div>

            <!-- Formulário de cancelamento específico -->
            <div v-if="mostrarFormCancelamento && idPedidoCancelamento === pedido.id" class="p-4 bg-red-50 border border-red-200 rounded-lg shadow-inner">
                <p class="text-sm font-bold text-red-700 mb-2">Motivo do Cancelamento</p>
                <textarea v-model="motivoCancelamento" placeholder="Motivo do cancelamento (obrigatório)..." class="w-full p-2 text-sm border border-red-200 rounded-md mb-2 resize-none" rows="2" maxlength="500"></textarea>
                <div class="flex gap-2">
                  <button 
                    @click="confirmarCancelamento(pedido.id)" 
                    :disabled="!motivoCancelamento.trim()"
                    class="btn-error text-xs flex-1"
                  >
                    Confirmar
                  </button>
                  <button @click="mostrarFormCancelamento = false; motivoCancelamento = ''" class="btn-secondary text-xs flex-1">Voltar</button>
                </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- D) AÇÕES GERAIS DA SESSÃO (se não houver pedidos ativos, ou ações que se aplicam à sessão como um todo) -->
    <div class="card">
      <h4 class="text-sm font-semibold text-text-secondary mb-3">Gestão da Sessão</h4>
      <div class="flex flex-wrap gap-3">
        <!-- Aguardar Pagamento: apenas se sessao ABERTA -->
        <button
          v-if="unidade.sessaoAtiva?.status === 'ABERTA'"
          @click="$emit('solicitar-liquidacao')"
          class="btn-secondary"
          style="border-color:#f57c00; color:#f57c00;"
        >
          💰 Fechar Conta
        </button>

        <!-- Encerrar Sessão -->
        <button
          v-if="unidade.sessaoAtiva?.status !== 'ENCERRADA'"
          @click="confirmarEncerramento"
          class="btn-error"
          style="background:#b71c1c;"
        >
          🔴 Encerrar Sessão
        </button>

        <button @click="$emit('ver-historico')" 
                class="btn-secondary">
          📊 Ver Histórico
        </button>
      </div>
    </div>

    <!-- F) ESTADO VAZIO -->
    <div v-if="(!pedidosAtivos || pedidosAtivos.length === 0)" class="card text-center py-12">
      <div class="text-6xl mb-4">🍽️</div>
      <p class="text-xl font-semibold text-text-primary mb-2">Nenhum pedido ativo</p>
      <p class="text-text-secondary mb-6">Crie um novo pedido para esta unidade</p>
      <button @click="$emit('novo-pedido')" class="btn-primary">
        + Novo Pedido
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCurrency } from '@/utils/currency'
import subpedidosService from '@/api/subpedidos'
import pedidosBalcaoService from '@/api/pedidosBalcaoService'
import { useNotificationStore } from '@/store/notifications'

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const props = defineProps({
  unidade: {
    type: Object,
    required: true
  },
  pedidosAtivos: {
    type: Array,
    default: () => []
  },
  fundo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['pedido-atualizado', 'fechar', 'adicionar-produtos', 'ver-historico', 'novo-pedido', 'recarregar-fundo', 'fechar-sessao', 'solicitar-liquidacao'])

// ── Estado local ──────────────────────────────────────────────────────────────
const pedidoExpandido = ref(null)
const idPedidoCancelamento = ref(null)
const mostrarFormCancelamento = ref(false)
const motivoCancelamento = ref('')

const alternarPedido = (id) => {
  pedidoExpandido.value = (pedidoExpandido.value === id) ? null : id
}

// Auto-expand if only one order
watch(() => props.pedidosAtivos, (newVal) => {
  console.log('[PainelUnidade] Pedidos ativos atualizados:', newVal?.length)
  if (newVal?.length === 1 && !pedidoExpandido.value) {
    pedidoExpandido.value = newVal[0].id
  }
}, { immediate: true })

// ── Cronómetro de sessão ──────────────────────────────────────────────────────
const cronometro = ref('--:--:--')
let timerInterval = null

const calcularCronometro = () => {
  const dataAbertura = props.unidade.sessaoAtiva?.dataAbertura || props.unidade.sessaoAtiva?.createdAt
  if (!dataAbertura) { cronometro.value = '--:--:--'; return }
  const inicio = new Date(dataAbertura)
  const agora = new Date()
  const diff = Math.max(0, Math.floor((agora - inicio) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  cronometro.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onMounted(() => {
  calcularCronometro()
  timerInterval = setInterval(calcularCronometro, 1000)
})

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// Saldo baixo - alerta se menor que 50
const saldoBaixo = computed(() => {
  const saldo = props.fundo?.saldoAtual || 0
  return saldo < 50 && saldo > 0
})

// Ícones por tipo de unidade
const iconeTipoUnidade = computed(() => {
  const icones = {
    'MESA_FISICA': '🪑',
    'QUARTO': '🛏️',
    'AREA_EVENTO': '🎉',
    'ESPACO_LOUNGE': '🛋️',
    'VIRTUAL': '📱'
  }
  return icones[props.unidade.tipo] || '🍽️'
})

// Ícones por nome de cozinha (nomeCozinha é String no SubPedidoResponse, sem cozinha.tipo)
const iconeCozinha = (nome) => {
  if (!nome) return '🍳'
  const upper = nome.toUpperCase()
  if (upper.includes('BAR')) return '🍹'
  if (upper.includes('SUSHI')) return '🍣'
  if (upper.includes('GRILL') || upper.includes('CHURRASQ')) return '🔥'
  if (upper.includes('PIZZA')) return '🍕'
  if (upper.includes('CONFEIT') || upper.includes('DOCE')) return '🍰'
  return '🍳'
}

// Badges de status
const badgeStatusUnidade = computed(() => {
  const classes = {
    'DISPONIVEL': 'bg-info text-white',
    'OCUPADA': 'bg-success text-white',
    'AGUARDANDO_PAGAMENTO': 'bg-warning text-white',
    'FINALIZADA': 'bg-gray-400 text-white'
  }
  return classes[props.unidade.status] || 'bg-gray-400 text-white'
})

const badgeStatusSubPedido = (status) => {
  const classes = {
    'CRIADO': 'bg-gray-400 text-white',
    'PENDENTE': 'bg-info text-white',
    'EM_PREPARACAO': 'bg-warning text-white',
    'PRONTO': 'bg-success text-white',
    'ENTREGUE': 'bg-primary text-white',
    'CANCELADO': 'bg-error text-white'
  }
  return classes[status] || 'bg-gray-400 text-white'
}

// ── Tipo de sessão ────────────────────────────────────────────────────────────
const sessaoTipoLabel = computed(() => {
  const tipo = props.unidade.sessaoAtiva?.tipoPagamento || props.unidade.sessaoAtiva?.tipo
  const labels = {
    PRE_PAGO: '💳 Pré-Pago',
    POS_PAGO: '💰 Pós-Pago',
    IMEDIATO: '⚡ Imediato'
  }
  return labels[tipo] || (tipo ? tipo : '—')
})

const sessaoTipoBadgeClass = computed(() => {
  const tipo = props.unidade.sessaoAtiva?.tipoPagamento || props.unidade.sessaoAtiva?.tipo
  const classes = {
    PRE_PAGO: 'bg-blue-100 text-blue-700',
    POS_PAGO: 'bg-amber-100 text-amber-700',
    IMEDIATO: 'bg-purple-100 text-purple-700'
  }
  return classes[tipo] || 'bg-gray-100 text-gray-600'
})

// ── Label de status de unidade ────────────────────────────────────────────────
const labelStatusUnidade = (status) => {
  const labels = {
    DISPONIVEL: 'Disponível', OCUPADA: 'Ocupada',
    AGUARDANDO_PAGAMENTO: 'Aguard. Pagamento',
    ENCERRADA: 'Encerrada', FINALIZADA: 'Encerrada'
  }
  return labels[status] || status
}

// ── Status do pedido consolidado (Lógica solicitada) ─────────────────────────
const iconStatusPedido = (pedido) => {
  const status = getStatusConsolidado(pedido)
  const icones = {
    'CRIADO': '⏳',
    'EM_ANDAMENTO': '🔄',
    'PRONTO': '🛎️',
    'FINALIZADO': '✅',
    'CANCELADO': '❌'
  }
  return icones[status] || '📋'
}

const labelStatusPedido = (pedido) => {
  const status = getStatusConsolidado(pedido)
  const labels = {
    'CRIADO': 'Criado',
    'EM_ANDAMENTO': 'Em Andamento',
    'PRONTO': 'TUDO PRONTO',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado'
  }
  return labels[status] || status || '—'
}

const corStatusPedido = (pedido) => {
  const status = getStatusConsolidado(pedido)
  const cores = {
    'CRIADO': 'bg-yellow-100 text-yellow-800',
    'EM_ANDAMENTO': 'bg-blue-100 text-blue-800',
    'PRONTO': 'bg-green-500 text-white animate-pulse',
    'FINALIZADO': 'bg-green-100 text-green-800',
    'CANCELADO': 'bg-red-100 text-red-800'
  }
  return cores[status] || 'bg-gray-100 text-gray-600'
}

const getStatusConsolidado = (pedido) => {
  if (!pedido) return '—'
  if (pedido.status === 'CANCELADO' || pedido.status === 'FINALIZADO') return pedido.status

  const sub = pedido.subPedidos || []
  if (sub.length === 0) return pedido.status

  const todosCancelados = sub.every(s => s.status === 'CANCELADO')
  if (todosCancelados) return 'CANCELADO'

  // Logica solicitada: Todos subpedidos pronto? então pedido PRONTO.
  // Consideramos PRONTO se todos os não-cancelados estiverem PRONTO ou ENTREGUE
  const ativos = sub.filter(s => s.status !== 'CANCELADO')
  if (ativos.length === 0) return 'CANCELADO'

  const todosProntosOuEntregues = ativos.every(s => s.status === 'PRONTO' || s.status === 'ENTREGUE')
  const temAoMenosUmPronto = ativos.some(s => s.status === 'PRONTO')

  if (todosProntosOuEntregues) {
    // Se todos entregues, o backend vira FINALIZADO. No front mantemos PRONTO se ainda houver o que entregar.
    return temAoMenosUmPronto ? 'PRONTO' : 'FINALIZADO'
  }

  return 'EM_ANDAMENTO'
}



// ── Label SubPedido status ────────────────────────────────────────────────────
const labelStatusSubPedido = (status) => {
  const labels = {
    CRIADO: 'Criado',
    PENDENTE: 'Pendente',
    EM_PREPARO: 'Em Preparo',
    EM_PREPARACAO: 'Em Preparo',
    PRONTO: 'Pronto',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado'
  }
  return labels[status] || status
}

// ── Validações ────────────────────────────────────────────────────────────────
const podeMarcarEntregue = (subPedido) => {
  return subPedido.status === 'PRONTO'
}

// ── Ações ──────────────────────────────────────────────────────────────────────
const marcarEntregue = async (subPedidoId) => {
  try {
    await subpedidosService.marcarEntregue(subPedidoId)
    notificationStore.sucesso('SubPedido marcado como entregue')
    emit('pedido-atualizado')
  } catch (error) {
    console.error('[PainelUnidade] Erro ao marcar entregue:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao marcar SubPedido como entregue')
  }
}

const confirmarCancelamento = async (pedidoId) => {
  const motivo = motivoCancelamento.value.trim()
  if (!motivo) return
  try {
    await pedidosBalcaoService.cancelar(pedidoId, motivo)
    notificationStore.sucesso('Pedido cancelado')
    mostrarFormCancelamento.value = false
    motivoCancelamento.value = ''
    idPedidoCancelamento.value = null
    emit('pedido-atualizado')
  } catch (error) {
    console.error('[PainelUnidade] Erro ao cancelar pedido:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao cancelar pedido')
  }
}

const confirmarEncerramento = () => {
  if (!confirm('Encerrar a sessão desta mesa? Esta acção não pode ser revertida.')) return
  emit('fechar-sessao')
}
</script>
<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.btn-primary {
  background: #1976d2;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-success {
  background: #4caf50;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-success:hover {
  background: #43a047;
}

.btn-error {
  background: #f44336;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-error:hover {
  background: #d32f2f;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.pedido-header-click {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
}

.subpedido-card {
  display: flex;
  flex-direction: column;
}

.badge-info { background: #03a9f4; color: white; }
.bg-info { background: #03a9f4; }
.bg-error { background: #f44336; }
</style>