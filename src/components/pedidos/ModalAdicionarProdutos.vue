<template>
  <div class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Adicionar Produtos ao Pedido #{{ pedidoId }}</h3>
        <button @click="$emit('fechar')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Info -->
        <div class="info-box">
          <p>
            ℹ️ Os produtos serão adicionados ao pedido existente. O backend criará automaticamente novos SubPedidos 
            nas cozinhas correspondentes.
          </p>
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
          <h4>Produtos a Adicionar ({{ carrinho.length }})</h4>
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
            <span>Valor Adicional:</span>
            <span class="valor-total">{{ formatCurrency(totalCarrinho) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('fechar')" class="btn btn-secondary">Cancelar</button>
        <button 
          @click="adicionarProdutos" 
          class="btn btn-primary"
          :disabled="carrinho.length === 0 || loading"
        >
          {{ loading ? 'Adicionando...' : 'Adicionar ao Pedido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCurrency } from '@/utils/currency'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import { useNotificationStore } from '@/store/notifications'

const props = defineProps({
  unidade: Object,
  pedidoId: [String, Number],
  produtos: Array
})

const emit = defineEmits(['fechar', 'produtos-adicionados'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const buscaProduto = ref('')
const carrinho = ref([])
const loading = ref(false)

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

const adicionarProdutos = async () => {
  if (carrinho.value.length === 0) {
    notificationStore.aviso('Adicione produtos ao carrinho')
    return
  }

  loading.value = true
  try {
    // Backend espera mesmo payload de criar pedido
    // mas com unidadeConsumoId que já tem pedido ativo
    // Backend identifica automaticamente e adiciona ao pedido existente
    const dados = {
      unidadeConsumoId: props.unidade.id,
      itens: carrinho.value.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.preco
      })),
      valorDebito: totalCarrinho.value,
      observacao: ''
    }

    console.log('[ModalAdicionarProdutos] Adicionando produtos:', dados)
    await pedidosBalcaoService.criar(dados)
    emit('produtos-adicionados')
  } catch (error) {
    console.error('[ModalAdicionarProdutos] Erro:', error)
    const mensagem = error.response?.data?.message || 'Erro ao adicionar produtos'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Reutilizar estilos do ModalNovoPedido */
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

.info-box {
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.info-box p {
  margin: 0;
  font-size: 14px;
  color: #1565c0;
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
  border: 2px solid #ff9800;
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
  color: #ff9800;
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
  background: #ff9800;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #f57c00;
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
  background: #ff9800;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
}

.btn-add:hover {
  background: #f57c00;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
</style>
