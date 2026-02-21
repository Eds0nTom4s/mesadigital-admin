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
        <div class="text-right">
          <span :class="badgeStatusUnidade" class="px-3 py-1 rounded-full text-sm font-semibold">
            {{ unidade.status }}
          </span>
        </div>
      </div>

      <div v-if="unidade.cliente" class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border">
        <div>
          <p class="text-text-secondary text-sm">Cliente</p>
          <p class="font-semibold text-text-primary">{{ unidade.cliente.nome }}</p>
          <p class="text-text-secondary text-sm">{{ unidade.cliente.telefone }}</p>
        </div>
        
        <!-- Modo de Pagamento -->
        <div>
          <p class="text-text-secondary text-sm">Modo de Pagamento</p>
          <div v-if="unidade.cliente.fundoConsumo" class="flex items-center gap-2">
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

        <!-- Saldo Pré-pago (se existir) -->
        <div v-if="unidade.cliente.fundoConsumo">
          <p class="text-text-secondary text-sm">Saldo Pré-pago</p>
          <p class="text-2xl font-bold" :class="saldoBaixo ? 'text-error' : 'text-success'">
            {{ formatCurrency(unidade.cliente.fundoConsumo.saldoAtual || 0) }}
          </p>
          <p v-if="saldoBaixo" class="text-xs text-error mt-1">⚠️ Saldo baixo</p>
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

    <!-- B) PEDIDO ATIVO -->
    <div v-if="pedidoAtivo" class="card">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="text-lg font-bold text-text-primary">📋 Pedido: {{ pedidoAtivo.numero }}</h4>
        </div>
        <button @click="$emit('fechar')" class="text-text-secondary hover:text-text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p class="text-text-secondary text-sm">Status Operacional</p>
          <p class="font-semibold" :class="corStatusPedido">
            {{ iconStatusPedido }} {{ pedidoAtivo.status }}
          </p>
        </div>
        <div>
          <p class="text-text-secondary text-sm">Status Financeiro</p>
          <p class="font-semibold" :class="corStatusFinanceiro">
            {{ iconStatusFinanceiro }} {{ pedidoAtivo.statusFinanceiro }}
          </p>
        </div>
        <div>
          <p class="text-text-secondary text-sm">Total Pedido</p>
          <p class="text-2xl font-bold text-primary">{{ formatCurrency(pedidoAtivo.total || 0) }}</p>
        </div>
      </div>
    </div>

    <!-- C) SUBPEDIDOS AGRUPADOS POR COZINHA -->
    <div v-if="pedidoAtivo && pedidoAtivo.subPedidos && pedidoAtivo.subPedidos.length > 0" class="space-y-4">
      <h4 class="font-semibold text-text-primary">SubPedidos por Cozinha</h4>
      
      <div v-for="subPedido in pedidoAtivo.subPedidos" 
           :key="subPedido.id"
           class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ iconeCozinha(subPedido.cozinha?.tipo) }}</span>
            <div>
              <h5 class="font-bold text-text-primary">{{ subPedido.cozinha?.nome || 'Cozinha' }}</h5>
              <p class="text-sm text-text-secondary">{{ subPedido.numero }}</p>
            </div>
          </div>
          <span :class="badgeStatusSubPedido(subPedido.status)" 
                class="px-3 py-1 rounded-full text-sm font-semibold">
            {{ subPedido.status }}
          </span>
        </div>

        <!-- Itens do SubPedido -->
        <div class="space-y-2">
          <div v-for="item in subPedido.itens" 
               :key="item.id"
               class="flex justify-between items-center py-2 border-t border-border">
            <div class="flex-1">
              <p class="font-medium text-text-primary">
                {{ item.quantidade }}x {{ item.produto.nome }}
              </p>
              <p v-if="item.observacoes" class="text-sm text-text-secondary">{{ item.observacoes }}</p>
            </div>
            <p class="font-semibold text-text-primary">{{ formatCurrency(item.subtotal) }}</p>
          </div>
        </div>

        <!-- Ações do SubPedido -->
        <div v-if="podeMarcarEntregue(subPedido)" class="mt-4 pt-4 border-t border-border">
          <button @click="marcarEntregue(subPedido.id)"
                  class="btn-primary w-full">
            ✅ Marcar como Entregue
          </button>
        </div>
      </div>
    </div>

    <!-- D) AÇÕES PERMITIDAS -->
    <div v-if="pedidoAtivo" class="card">
      <div class="flex flex-wrap gap-3">
        <button @click="$emit('adicionar-produtos')" 
                class="btn-primary">
          + Adicionar Produtos
        </button>

        <button @click="$emit('ver-historico')" 
                class="btn-secondary">
          📊 Ver Histórico
        </button>

        <button v-if="podeFinalizar"
                @click="finalizarPedido" 
                class="btn-success">
          ✅ Finalizar Pedido
        </button>

        <button @click="cancelarPedido" 
                class="btn-error">
          ❌ Cancelar Pedido
        </button>
      </div>

      <!-- Mensagem de validação -->
      <div v-if="!podeFinalizar && pedidoAtivo.status === 'EM_ANDAMENTO'" 
           class="mt-4 p-3 bg-warning/10 border border-warning rounded-lg">
        <p class="text-sm text-warning">
          ⚠️ "Finalizar Pedido" desabilitado: Existem SubPedidos ainda não entregues
        </p>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-if="!pedidoAtivo" class="card text-center py-12">
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
import { computed } from 'vue'
import { useCurrency } from '@/utils/currency'
import subpedidosService from '@/services/subpedidos'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import { useNotificationStore } from '@/store/notifications'

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const props = defineProps({
  unidade: {
    type: Object,
    required: true
  },
  pedidoAtivo: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['pedido-atualizado', 'fechar', 'adicionar-produtos', 'ver-historico', 'novo-pedido'])

// Saldo baixo - alerta se menor que 50
const saldoBaixo = computed(() => {
  const saldo = props.unidade.cliente?.fundoConsumo?.saldoAtual || 0
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

// Ícones por tipo de cozinha
const iconeCozinha = (tipoCozinha) => {
  const icones = {
    'PRINCIPAL': '🍳',
    'GRILL': '🔥',
    'SUSHI': '🍣',
    'BAR': '🍹',
    'CONFEITARIA': '🍰',
    'PIZZARIA': '🍕'
  }
  return icones[tipoCozinha] || '🍳'
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

// Status do pedido
const iconStatusPedido = computed(() => {
  const icones = {
    'CRIADO': '📝',
    'EM_ANDAMENTO': '🔄',
    'FINALIZADO': '✅',
    'CANCELADO': '❌'
  }
  return icones[props.pedidoAtivo?.status] || '📋'
})

const corStatusPedido = computed(() => {
  const cores = {
    'CRIADO': 'text-info',
    'EM_ANDAMENTO': 'text-warning',
    'FINALIZADO': 'text-success',
    'CANCELADO': 'text-error'
  }
  return cores[props.pedidoAtivo?.status] || 'text-text-primary'
})

// Status financeiro
const iconStatusFinanceiro = computed(() => {
  const icones = {
    'NAO_PAGO': '💳',
    'PAGO': '✅',
    'ESTORNADO': '↩️'
  }
  return icones[props.pedidoAtivo?.statusFinanceiro] || '💰'
})

const corStatusFinanceiro = computed(() => {
  const cores = {
    'NAO_PAGO': 'text-warning',
    'PAGO': 'text-success',
    'ESTORNADO': 'text-error'
  }
  return cores[props.pedidoAtivo?.statusFinanceiro] || 'text-text-primary'
})

// Validações
const podeFinalizar = computed(() => {
  if (!props.pedidoAtivo || props.pedidoAtivo.status !== 'EM_ANDAMENTO') return false
  
  // Todos SubPedidos devem estar ENTREGUE
  const todosEntregues = props.pedidoAtivo.subPedidos?.every(sp => sp.status === 'ENTREGUE')
  return todosEntregues
})

const podeMarcarEntregue = (subPedido) => {
  return subPedido.status === 'PRONTO'
}

// Ações
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

const finalizarPedido = async () => {
  if (!confirm('Finalizar este pedido? Esta ação não pode ser desfeita.')) return
  
  try {
    await pedidosBalcaoService.finalizar(props.pedidoAtivo.id)
    notificationStore.sucesso('Pedido finalizado com sucesso')
    emit('pedido-atualizado')
  } catch (error) {
    console.error('[PainelUnidade] Erro ao finalizar pedido:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao finalizar pedido')
  }
}

const cancelarPedido = async () => {
  const motivo = prompt('Motivo do cancelamento:')
  if (!motivo) return
  
  try {
    await pedidosBalcaoService.cancelar(props.pedidoAtivo.id, motivo)
    notificationStore.sucesso('Pedido cancelado')
    emit('pedido-atualizado')
  } catch (error) {
    console.error('[PainelUnidade] Erro ao cancelar pedido:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao cancelar pedido')
  }
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
</style>