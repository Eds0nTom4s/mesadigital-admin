<template>
  <div class="pedido-editor">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Carregando pedido...</p>
    </div>

    <!-- Error State -->
    <div v-if="error && !pedido" class="error-state">
      <p>❌ {{ error.message }}</p>
      <button @click="refresh" class="btn btn-primary">Tentar Novamente</button>
    </div>

    <!-- Pedido -->
    <div v-if="pedido" class="pedido-content">
      <!-- Header -->
      <div class="pedido-header">
        <div>
          <h2>{{ pedido.numeroFormatado || `#${pedido.numero}` }}</h2>
          <p class="text-muted">{{ pedido.unidadeConsumoReferencia }}</p>
        </div>

        <div class="status-badge" :class="pedido.statusClass">
          {{ pedido.statusIcon }} {{ pedido.statusLabel }}
        </div>
      </div>

      <!-- Lista de Itens -->
      <div class="itens-lista">
        <h3>Itens do Pedido</h3>

        <div v-if="pedido.itens && pedido.itens.length > 0">
          <div
            v-for="item in pedido.itens"
            :key="item.id"
            class="item-card"
            :class="{ 'optimistic': item._optimistic }"
          >
            <div class="item-info">
              <span class="item-nome">{{ item.produtoNome }}</span>
              <span class="item-observacao" v-if="item.observacao">
                📝 {{ item.observacao }}
              </span>
            </div>

            <div class="item-quantidade">
              <button
                @click="decrementarQuantidade(item)"
                :disabled="!canEdit || loadingStates.updatingItem"
                class="btn btn-sm"
              >
                -
              </button>
              <span>{{ item.quantidade }}</span>
              <button
                @click="incrementarQuantidade(item)"
                :disabled="!canEdit || loadingStates.updatingItem"
                class="btn btn-sm"
              >
                +
              </button>
            </div>

            <div class="item-valor">
              {{ formatCurrency(item.valorTotal) }}
            </div>

            <button
              v-if="canEdit"
              @click="removerItemComConfirmacao(item)"
              :disabled="loadingStates.removingItem"
              class="btn btn-sm btn-danger"
            >
              🗑️
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>📭 Nenhum item adicionado</p>
        </div>
      </div>

      <!-- Adicionar Item -->
      <div v-if="canEdit" class="adicionar-item">
        <h3>Adicionar Item</h3>

        <div class="form-group">
          <select v-model="novoItem.produtoId" class="form-control">
            <option :value="null">Selecione um produto</option>
            <option
              v-for="produto in produtosDisponiveis"
              :key="produto.id"
              :value="produto.id"
            >
              {{ produto.nome }} - {{ formatCurrency(produto.preco) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <input
            v-model.number="novoItem.quantidade"
            type="number"
            min="1"
            max="999"
            placeholder="Quantidade"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <textarea
            v-model="novoItem.observacao"
            placeholder="Observações (opcional)"
            class="form-control"
            maxlength="500"
          ></textarea>
        </div>

        <button
          @click="adicionarItemClick"
          :disabled="!podAdicionarItem || loadingStates.addingItem"
          class="btn btn-primary"
        >
          <span v-if="loadingStates.addingItem">⏳ Adicionando...</span>
          <span v-else>➕ Adicionar Item</span>
        </button>
      </div>

      <!-- Totais -->
      <div class="totais">
        <div class="total-row">
          <span>Itens:</span>
          <span>{{ totais.itens }}</span>
        </div>
        <div class="total-row">
          <span>Quantidade:</span>
          <span>{{ totais.quantidade }}</span>
        </div>
        <div class="total-row total-destaque">
          <span>Total:</span>
          <span>{{ formatCurrency(pedido.valorTotal) }}</span>
        </div>
      </div>

      <!-- Ações -->
      <div class="acoes">
        <button
          v-if="canClose"
          @click="fecharPedidoClick"
          :disabled="loadingStates.closing"
          class="btn btn-success"
        >
          <span v-if="loadingStates.closing">⏳ Fechando...</span>
          <span v-else>✅ Fechar Pedido</span>
        </button>

        <button
          v-if="canCancel"
          @click="cancelarPedidoClick"
          :disabled="loadingStates.canceling"
          class="btn btn-danger"
        >
          <span v-if="loadingStates.canceling">⏳ Cancelando...</span>
          <span v-else>❌ Cancelar Pedido</span>
        </button>

        <button @click="refresh" class="btn btn-secondary">
          🔄 Atualizar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePedido } from '@/composables/usePedido'
import { formatCurrency } from '@/utils/currency'
import { PEDIDO_STATUS } from '@/utils/pedido.types'

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * EXEMPLO PRÁTICO: COMPONENTE USANDO A ARQUITETURA
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Este componente demonstra:
 * ✅ Uso do composable usePedido
 * ✅ Optimistic UI (atualização instantânea)
 * ✅ Error handling
 * ✅ Loading states granulares
 * ✅ Integração com store Pinia (via composable)
 */

// Props
const props = defineProps({
  pedidoId: {
    type: Number,
    required: true
  }
})

// Composable - toda a lógica de pedido
const {
  pedido,
  loading,
  loadingStates,
  error,
  isLoading,
  canEdit,
  canClose,
  canCancel,
  totais,
  load,
  adicionarItem,
  atualizarQuantidade,
  removerItem,
  fechar,
  cancelar,
  refresh
} = usePedido({
  pedidoId: props.pedidoId,
  autoLoad: true,
  optimisticUI: true // Ativa optimistic updates
})

// Mock de produtos disponíveis (em produção vem de outra store)
const produtosDisponiveis = ref([
  { id: 1, nome: 'Cerveja Heineken', preco: 1200 },
  { id: 2, nome: 'Refrigerante Coca-Cola', preco: 800 },
  { id: 3, nome: 'Hambúrguer Artesanal', preco: 3500 },
  { id: 4, nome: 'Batata Frita', preco: 1500 }
])

// Estado local para novo item
const novoItem = ref({
  produtoId: null,
  quantidade: 1,
  observacao: ''
})

// Computed
const podAdicionarItem = computed(() => {
  return novoItem.value.produtoId && novoItem.value.quantidade > 0
})

// ──────────────────────────────────────────────────────────────────────────────
// AÇÕES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Adiciona item ao pedido
 */
async function adicionarItemClick() {
  if (!podAdicionarItem.value) return

  // Busca dados do produto
  const produto = produtosDisponiveis.value.find(p => p.id === novoItem.value.produtoId)

  const resultado = await adicionarItem({
    produtoId: novoItem.value.produtoId,
    produtoNome: produto.nome, // Para optimistic UI
    valorUnitario: produto.preco, // Para optimistic UI
    quantidade: novoItem.value.quantidade,
    observacao: novoItem.value.observacao || null
  })

  if (resultado) {
    // Limpa form
    novoItem.value = {
      produtoId: null,
      quantidade: 1,
      observacao: ''
    }
  }
}

/**
 * Incrementa quantidade de item
 */
async function incrementarQuantidade(item) {
  await atualizarQuantidade(item.id, item.quantidade + 1)
}

/**
 * Decrementa quantidade de item
 */
async function decrementarQuantidade(item) {
  if (item.quantidade <= 1) {
    // Se quantidade é 1, remove o item
    await removerItemComConfirmacao(item)
  } else {
    await atualizarQuantidade(item.id, item.quantidade - 1)
  }
}

/**
 * Remove item com confirmação
 */
async function removerItemComConfirmacao(item) {
  if (confirm(`Remover "${item.produtoNome}" do pedido?`)) {
    await removerItem(item.id)
  }
}

/**
 * Fecha pedido
 */
async function fecharPedidoClick() {
  // Modal de forma de pagamento (simplificado)
  const formaPagamento = prompt(
    'Forma de pagamento:\n1 - Fundo de Consumo\n2 - Dinheiro\n3 - Cartão\n4 - PIX'
  )

  const formas = {
    '1': 'PRE_PAGO',
    '2': 'POS_PAGO',
    '3': 'DINHEIRO',
    '4': 'CARTAO_CREDITO',
    '5': 'PIX'
  }

  if (!formas[formaPagamento]) {
    alert('Forma de pagamento inválida')
    return
  }

  const resultado = await fechar({
    formaPagamento: formas[formaPagamento]
  })

  if (resultado) {
    // Redireciona ou fecha modal
    console.log('Pedido fechado com sucesso:', resultado)
  }
}

/**
 * Cancela pedido
 */
async function cancelarPedidoClick() {
  const motivo = prompt('Motivo do cancelamento (mínimo 5 caracteres):')

  if (!motivo || motivo.length < 5) {
    alert('Motivo inválido')
    return
  }

  if (confirm('Tem certeza que deseja cancelar este pedido?')) {
    await cancelar(motivo)
  }
}

// Watch para recarregar quando pedidoId mudar
watch(() => props.pedidoId, (newId) => {
  if (newId) {
    load(newId)
  }
})
</script>

<style scoped>
.pedido-editor {
  position: relative;
  padding: 20px;
}

.loading-overlay {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 10px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 40px;
  color: #e74c3c;
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
}

.itens-lista {
  margin-bottom: 30px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.item-card.optimistic {
  opacity: 0.6;
  border-style: dashed;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-nome {
  font-weight: bold;
}

.item-observacao {
  font-size: 0.9em;
  color: #666;
}

.item-quantidade {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-valor {
  font-weight: bold;
  color: #27ae60;
  min-width: 100px;
  text-align: right;
}

.adicionar-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.totais {
  background: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.total-destaque {
  font-size: 1.2em;
  font-weight: bold;
  border-top: 2px solid #bdc3c7;
  margin-top: 10px;
  padding-top: 15px;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
}
</style>
