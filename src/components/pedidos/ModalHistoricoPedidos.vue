<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Histórico de Pedidos</h3>
        <button @click="$emit('fechar')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Filtros -->
        <div class="filtros">
          <select v-model="filtroStatus" class="form-control">
            <option value="">Todos os Status</option>
            <option value="CRIADO">Criado</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select v-model="filtroFinanceiro" class="form-control">
            <option value="">Status Financeiro</option>
            <option value="NAO_PAGO">Não Pago</option>
            <option value="PAGO">Pago</option>
            <option value="ESTORNADO">Estornado</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Carregando histórico...</p>
        </div>

        <!-- Lista de Pedidos -->
        <div v-else-if="pedidosFiltrados.length > 0" class="pedidos-lista">
          <div
            v-for="pedido in pedidosFiltrados"
            :key="pedido.id"
            class="pedido-item"
            @click="selecionarPedido(pedido)"
          >
            <div class="pedido-header">
              <div>
                <h4>Pedido #{{ pedido.numero || pedido.id }}</h4>
                <p class="data">{{ formatData(pedido.criadoEm) }}</p>
              </div>
              <div class="badges">
                <span :class="['badge', 'badge-status', getBadgeStatusClasse(pedido.status)]">
                  {{ pedido.status }}
                </span>
                <span :class="['badge', 'badge-financeiro', getBadgeFinanceiroClasse(pedido.statusFinanceiro)]">
                  {{ pedido.statusFinanceiro }}
                </span>
              </div>
            </div>

            <div class="pedido-body">
              <div class="info-item">
                <span class="label">Total:</span>
                <span class="value">{{ formatCurrency(pedido.total) }}</span>
              </div>
              <div class="info-item">
                <span class="label">SubPedidos:</span>
                <span class="value">{{ pedido.subPedidos?.length || 0 }}</span>
              </div>
            </div>

            <!-- Detalhes expandidos -->
            <div v-if="pedidoExpandido === pedido.id" class="pedido-detalhes">
              <h5>SubPedidos:</h5>
              <div class="subpedidos-lista">
                <div
                  v-for="subPedido in pedido.subPedidos"
                  :key="subPedido.id"
                  class="subpedido-item"
                >
                  <div class="subpedido-header">
                    <span>{{ iconeCozinha(subPedido.cozinha?.tipo) }} {{ subPedido.cozinha?.nome }}</span>
                    <span :class="['badge-subpedido', getBadgeSubPedidoClasse(subPedido.status)]">
                      {{ subPedido.status }}
                    </span>
                  </div>
                  <div class="itens-lista">
                    <div
                      v-for="item in subPedido.itens"
                      :key="item.id"
                      class="item"
                    >
                      <span>{{ item.quantidade }}x {{ item.produtoNome }}</span>
                      <span>{{ formatCurrency(item.subtotal) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-else class="empty-state">
          <p>📭 Nenhum pedido encontrado</p>
          <small>Ajuste os filtros ou tente novamente</small>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('fechar')" class="btn btn-secondary">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import { useNotificationStore } from '@/store/notifications'

const props = defineProps({
  unidadeId: [String, Number]
})

const emit = defineEmits(['fechar'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const pedidos = ref([])
const loading = ref(false)
const filtroStatus = ref('')
const filtroFinanceiro = ref('')
const pedidoExpandido = ref(null)

const pedidosFiltrados = computed(() => {
  let filtrados = pedidos.value

  if (filtroStatus.value) {
    filtrados = filtrados.filter(p => p.status === filtroStatus.value)
  }

  if (filtroFinanceiro.value) {
    filtrados = filtrados.filter(p => p.statusFinanceiro === filtroFinanceiro.value)
  }

  return filtrados
})

const carregarHistorico = async () => {
  loading.value = true
  try {
    // Endpoint fictício - adaptar quando backend implementar
    const response = await pedidosBalcaoService.getHistorico(props.unidadeId)
    pedidos.value = response.data || []
  } catch (error) {
    console.error('[ModalHistorico] Erro:', error)
    notificationStore.erro('Erro ao carregar histórico de pedidos')
    pedidos.value = []
  } finally {
    loading.value = false
  }
}

const selecionarPedido = (pedido) => {
  if (pedidoExpandido.value === pedido.id) {
    pedidoExpandido.value = null
  } else {
    pedidoExpandido.value = pedido.id
  }
}

const formatData = (isoDate) => {
  if (!isoDate) return '-'
  const data = new Date(isoDate)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getBadgeStatusClasse = (status) => {
  const classes = {
    CRIADO: 'criado',
    EM_ANDAMENTO: 'em-andamento',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado'
  }
  return classes[status] || 'default'
}

const getBadgeFinanceiroClasse = (status) => {
  const classes = {
    NAO_PAGO: 'nao-pago',
    PAGO: 'pago',
    ESTORNADO: 'estornado'
  }
  return classes[status] || 'default'
}

const getBadgeSubPedidoClasse = (status) => {
  const classes = {
    CRIADO: 'criado',
    PENDENTE: 'pendente',
    EM_PREPARACAO: 'em-preparacao',
    PRONTO: 'pronto',
    ENTREGUE: 'entregue',
    CANCELADO: 'cancelado'
  }
  return classes[status] || 'default'
}

const iconeCozinha = (tipo) => {
  const icones = {
    PRINCIPAL: '🍳',
    GRILL: '🔥',
    SUSHI: '🍣',
    BAR: '🍹',
    CONFEITARIA: '🍰',
    PIZZARIA: '🍕'
  }
  return icones[tipo] || '👨‍🍳'
}

onMounted(() => {
  carregarHistorico()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.filtros {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.filtros select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.pedidos-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pedido-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.pedido-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.pedido-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.pedido-header .data {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.badges {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-status.criado { background: #e3f2fd; color: #1565c0; }
.badge-status.em-andamento { background: #fff3e0; color: #ef6c00; }
.badge-status.finalizado { background: #e8f5e9; color: #2e7d32; }
.badge-status.cancelado { background: #ffebee; color: #c62828; }

.badge-financeiro.nao-pago { background: #fff3e0; color: #ef6c00; }
.badge-financeiro.pago { background: #e8f5e9; color: #2e7d32; }
.badge-financeiro.estornado { background: #f3f3f3; color: #757575; }

.pedido-body {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #333;
  font-weight: 600;
}

.pedido-detalhes {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
  margin-top: 12px;
}

.pedido-detalhes h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.subpedidos-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subpedido-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #1976d2;
}

.subpedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.badge-subpedido {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-subpedido.criado { background: #e3f2fd; color: #1565c0; }
.badge-subpedido.pendente { background: #fff3e0; color: #ef6c00; }
.badge-subpedido.em-preparacao { background: #fff3e0; color: #f57c00; }
.badge-subpedido.pronto { background: #e8f5e9; color: #2e7d32; }
.badge-subpedido.entregue { background: #f3f3f3; color: #757575; }
.badge-subpedido.cancelado { background: #ffebee; color: #c62828; }

.itens-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.itens-lista .item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-state small {
  font-size: 14px;
  color: #999;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
