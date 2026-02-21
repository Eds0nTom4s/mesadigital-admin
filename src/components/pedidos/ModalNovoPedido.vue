<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Novo Pedido - {{ unidade?.referencia }}</h3>
        <button @click="$emit('fechar')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Informações da Unidade -->
        <div class="info-unidade">
          <div class="info-item">
            <span class="label">Cliente:</span>
            <span class="value">{{ unidade?.cliente?.nome || 'Não associado' }}</span>
          </div>
          <div class="info-item" v-if="fundoConsumo">
            <span class="label">Saldo Fundo:</span>
            <span class="value" :class="{'text-danger': fundoConsumo.saldoAtual < 1000, 'text-warning': fundoConsumo.saldoAtual < 5000}">
              {{ formatCurrency(fundoConsumo.saldoAtual) }}
            </span>
          </div>
        </div>

        <!-- Alerta: Cliente sem fundo -->
        <div v-if="unidade?.cliente && !fundoConsumo && !carregandoFundo" class="alert alert-info">
          <div class="alert-content">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <p class="alert-title">Cliente não possui Fundo de Consumo</p>
              <p class="alert-message">É necessário criar um fundo para usar pagamento pré-pago.</p>
            </div>
          </div>
          <button @click="abrirModalCriarFundo" class="btn btn-sm btn-primary">
            Criar Fundo
          </button>
        </div>

        <!-- Alerta: Saldo insuficiente -->
        <div v-if="fundoConsumo && totalCarrinho > fundoConsumo.saldoAtual && tipoPagamento === 'FUNDO_CONSUMO'" class="alert alert-warning">
          <div class="alert-content">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="alert-title">Saldo Insuficiente</p>
              <p class="alert-message">
                Total do pedido: {{ formatCurrency(totalCarrinho) }} | 
                Saldo disponível: {{ formatCurrency(fundoConsumo.saldoAtual) }}
              </p>
            </div>
          </div>
          <button @click="abrirModalRecarregar" class="btn btn-sm btn-primary">
            Recarregar
          </button>
        </div>

        <!-- Tipo de Pagamento -->
        <div class="form-group">
          <label class="form-label">Tipo de Pagamento</label>
          <div class="payment-options">
            <label 
              class="payment-option" 
              :class="{ 
                'selected': tipoPagamento === 'FUNDO_CONSUMO',
                'disabled': !fundoConsumo
              }"
            >
              <input 
                type="radio" 
                v-model="tipoPagamento" 
                value="FUNDO_CONSUMO"
                :disabled="!fundoConsumo"
              />
              <div class="option-content">
                <div class="option-icon">💰</div>
                <div class="option-details">
                  <span class="option-title">Fundo de Consumo</span>
                  <span class="option-desc">Pagamento pré-pago</span>
                </div>
              </div>
            </label>
            
            <label 
              class="payment-option" 
              :class="{ 'selected': tipoPagamento === 'POS_PAGO' }"
            >
              <input type="radio" v-model="tipoPagamento" value="POS_PAGO" />
              <div class="option-content">
                <div class="option-icon">📋</div>
                <div class="option-details">
                  <span class="option-title">Pós-Pago</span>
                  <span class="option-desc">Pagar ao finalizar</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Busca de Produtos -->
        <div class="search-produtos">
          <input
            v-model="buscaProduto"
            type="text"
            placeholder="🔍 Buscar produtos..."
            class="form-control"
          />
        </div>

        <!-- Lista de Produtos -->
        <div class="produtos-lista">
          <div
            v-for="produto in produtosFiltrados"
            :key="produto.id"
            class="produto-item"
            @click="adicionarProduto(produto)"
          >
            <div class="produto-info">
              <h4>{{ produto.nome }}</h4>
              <p class="descricao">{{ produto.descricao }}</p>
              <div class="badges">
                <span :class="['badge', 'badge-tipo-preparo', getTipoPreparoClasse(produto.tipoPreparo)]">
                  {{ produto.tipoPreparo }}
                </span>
              </div>
            </div>
            <div class="produto-preco">
              <span class="preco">{{ formatCurrency(produto.preco) }}</span>
              <button class="btn btn-sm btn-add">+</button>
            </div>
          </div>

          <div v-if="produtosFiltrados.length === 0" class="empty-state">
            <p>Nenhum produto encontrado</p>
          </div>
        </div>

        <!-- Carrinho -->
        <div v-if="carrinho.length > 0" class="carrinho">
          <h4>Itens do Pedido ({{ carrinho.length }})</h4>
          <div class="carrinho-lista">
            <div v-for="(item, index) in carrinho" :key="index" class="carrinho-item">
              <div class="item-info">
                <span class="nome">{{ item.nome }}</span>
                <span class="subtotal">{{ formatCurrency(item.preco * item.quantidade) }}</span>
              </div>
              <div class="item-controles">
                <button @click="diminuirQuantidade(index)" class="btn btn-sm">−</button>
                <span class="quantidade">{{ item.quantidade }}</span>
                <button @click="aumentarQuantidade(index)" class="btn btn-sm">+</button>
                <button @click="removerItem(index)" class="btn btn-sm btn-danger">🗑️</button>
              </div>
            </div>
          </div>

          <div class="carrinho-total">
            <span>Total:</span>
            <span class="valor-total">{{ formatCurrency(totalCarrinho) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('fechar')" class="btn btn-secondary">Cancelar</button>
        <button 
          @click="criarPedido" 
          class="btn btn-primary"
          :disabled="!podeCriarPedido"
        >
          {{ loading ? 'Criando...' : 'Criar Pedido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import fundoConsumoService from '@/services/fundoConsumoService'
import { useNotificationStore } from '@/store/notifications'

const props = defineProps({
  unidade: Object,
  produtos: Array
})

const emit = defineEmits(['fechar', 'pedido-criado', 'criar-fundo', 'recarregar-fundo'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const buscaProduto = ref('')
const carrinho = ref([])
const loading = ref(false)
const tipoPagamento = ref('FUNDO_CONSUMO')
const fundoConsumo = ref(null)
const carregandoFundo = ref(false)

// Buscar fundo do cliente ao montar
onMounted(async () => {
  if (props.unidade?.cliente?.id) {
    await buscarFundoCliente()
  }
})

const buscarFundoCliente = async () => {
  try {
    carregandoFundo.value = true
    fundoConsumo.value = await fundoConsumoService.buscarFundoPorCliente(props.unidade.cliente.id)
    
    // Se tem fundo, usa FUNDO_CONSUMO por padrão, senão usa POS_PAGO
    if (fundoConsumo.value) {
      tipoPagamento.value = 'FUNDO_CONSUMO'
    } else {
      tipoPagamento.value = 'POS_PAGO'
    }
  } catch (error) {
    console.log('Cliente não possui fundo de consumo')
    tipoPagamento.value = 'POS_PAGO'
  } finally {
    carregandoFundo.value = false
  }
}

const produtosFiltrados = computed(() => {
  if (!props.produtos) return []
  if (!buscaProduto.value) return props.produtos
  
  const termo = buscaProduto.value.toLowerCase()
  return props.produtos.filter(p => 
    p.nome.toLowerCase().includes(termo) ||
    p.descricao?.toLowerCase().includes(termo)
  )
})

const totalCarrinho = computed(() => {
  return carrinho.value.reduce((acc, item) => acc + (item.preco * item.quantidade), 0)
})

const podeCriarPedido = computed(() => {
  if (carrinho.value.length === 0) return false
  if (loading.value) return false
  
  // Se for FUNDO_CONSUMO, verificar saldo
  if (tipoPagamento.value === 'FUNDO_CONSUMO') {
    if (!fundoConsumo.value) return false
    if (totalCarrinho.value > fundoConsumo.value.saldoAtual) return false
  }
  
  return true
})

const adicionarProduto = (produto) => {
  const itemExistente = carrinho.value.find(i => i.produtoId === produto.id)
  if (itemExistente) {
    itemExistente.quantidade++
  } else {
    carrinho.value.push({
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: 1
    })
  }
}

const aumentarQuantidade = (index) => {
  carrinho.value[index].quantidade++
}

const diminuirQuantidade = (index) => {
  if (carrinho.value[index].quantidade > 1) {
    carrinho.value[index].quantidade--
  } else {
    removerItem(index)
  }
}

const removerItem = (index) => {
  carrinho.value.splice(index, 1)
}

const getTipoPreparoClasse = (tipo) => {
  const classes = {
    QUENTE: 'quente',
    FRIO: 'frio',
    BAR: 'bar',
    BEBIDA: 'bebida',
    SOBREMESA: 'sobremesa',
    ENTREGA: 'entrega'
  }
  return classes[tipo] || 'default'
}

const abrirModalCriarFundo = () => {
  emit('criar-fundo', props.unidade.cliente)
}

const abrirModalRecarregar = () => {
  emit('recarregar-fundo', fundoConsumo.value)
}

const criarPedido = async () => {
  if (carrinho.value.length === 0) {
    notificationStore.aviso('Adicione produtos ao pedido')
    return
  }

  // Validações específicas por tipo de pagamento
  if (tipoPagamento.value === 'FUNDO_CONSUMO') {
    if (!fundoConsumo.value) {
      notificationStore.aviso('Cliente não possui fundo de consumo. Crie um fundo primeiro.')
      return
    }
    
    if (totalCarrinho.value > fundoConsumo.value.saldoAtual) {
      notificationStore.aviso(`Saldo insuficiente. Recarregue o fundo.`)
      return
    }
  }

  loading.value = true
  try {
    const dados = {
      unidadeConsumoId: props.unidade.id,
      tipoPagamento: tipoPagamento.value,
      itens: carrinho.value.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      }))
    }

    console.log('[ModalNovoPedido] Criando pedido:', dados)

    const response = await pedidosBalcaoService.criar(dados)
    
    notificationStore.sucesso(`Pedido criado com sucesso! Tipo: ${tipoPagamento.value}`)
    emit('pedido-criado', response.data)
  } catch (error) {
    console.error('[ModalNovoPedido] Erro:', error)
    const mensagem = error.response?.data?.message || 'Erro ao criar pedido'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}
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
  max-width: 800px;
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

.info-unidade {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  gap: 24px;
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

.search-produtos {
  margin-bottom: 16px;
}

.search-produtos input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.produtos-lista {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.produto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.produto-item:hover {
  background: #f9f9f9;
}

.produto-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #333;
}

.produto-info .descricao {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}

.badges {
  display: flex;
  gap: 6px;
}

.badge-tipo-preparo {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-tipo-preparo.quente { background: #ffebee; color: #c62828; }
.badge-tipo-preparo.frio { background: #e3f2fd; color: #1565c0; }
.badge-tipo-preparo.bar { background: #fff3e0; color: #ef6c00; }
.badge-tipo-preparo.bebida { background: #e8f5e9; color: #2e7d32; }
.badge-tipo-preparo.sobremesa { background: #f3e5f5; color: #6a1b9a; }

.produto-preco {
  display: flex;
  align-items: center;
  gap: 12px;
}

.produto-preco .preco {
  font-size: 16px;
  font-weight: 700;
  color: #1976d2;
}

.carrinho {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #4caf50;
}

.carrinho h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.carrinho-lista {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.carrinho-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-info .nome {
  font-weight: 600;
  font-size: 14px;
}

.item-info .subtotal {
  font-size: 13px;
  color: #666;
}

.item-controles {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantidade {
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.carrinho-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 2px solid #ddd;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.valor-total {
  color: #4caf50;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 13px;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-add {
  background: #4caf50;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
}

.btn-add:hover {
  background: #43a047;
}

.text-danger {
  color: #d32f2f !important;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* Alertas */
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.alert-info {
  background: #e3f2fd;
  border: 1px solid #90caf9;
}

.alert-warning {
  background: #fff3e0;
  border: 1px solid #ffb74d;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.alert-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.alert-info .alert-icon {
  color: #1976d2;
}

.alert-warning .alert-icon {
  color: #f57c00;
}

.alert-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.alert-message {
  margin: 0;
  font-size: 13px;
  color: #666;
}

/* Tipo de Pagamento */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.payment-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.payment-option {
  position: relative;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option:hover:not(.disabled) {
  border-color: #1976d2;
  background: #f5f9ff;
}

.payment-option.selected {
  border-color: #1976d2;
  background: #e3f2fd;
}

.payment-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.payment-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 24px;
}

.option-details {
  display: flex;
  flex-direction: column;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #666;
}

.text-warning {
  color: #f57c00 !important;
}
</style>
