<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('fechar')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Novo Pedido - {{ unidade?.referencia }}</h3>
        <button @click="$emit('fechar')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Loading inicial -->
        <div v-if="carregandoFundo || carregandoSaldoAberto" class="loading-overlay">
          <div class="spinner"></div>
          <p class="loading-text">Carregando dados...</p>
        </div>

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

        <!-- Alerta: Unidade sem cliente -->
        <div v-if="!unidade?.cliente" class="alert alert-warning">
          <div class="alert-content">
            <svg class="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <p class="alert-title">Cliente não vinculado</p>
              <p class="alert-message">Para usar pagamento PRÉ-PAGO, é necessário vincular um cliente à unidade primeiro.</p>
            </div>
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
        <div v-if="fundoConsumo && totalCarrinho > fundoConsumo.saldoAtual && tipoPagamento === 'PRE_PAGO'" class="alert alert-warning">
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
                <button 
                  @click="toggleObservacoes(index)" 
                  class="btn btn-sm"
                  :class="{ 'active': item.mostrarObservacoes }"
                  title="Adicionar observações"
                >
                  📝
                </button>
                <button @click="removerItem(index)" class="btn btn-sm btn-danger">🗑️</button>
              </div>
              
              <!-- Campo de observações -->
              <div v-if="item.mostrarObservacoes" class="item-observacoes">
                <textarea 
                  v-model="item.observacoes"
                  placeholder="Ex: Sem cebola, ponto da carne mal passado..."
                  maxlength="500"
                  rows="2"
                  class="observacoes-input"
                  @input="validarObservacoes(index)"
                ></textarea>
                <div class="observacoes-info">
                  <span class="caracteres-count" :class="{ 'limit-warning': (item.observacoes?.length || 0) > 450 }">
                    {{ item.observacoes?.length || 0 }}/500
                  </span>
                  <span class="observacoes-hint">Emojis serão removidos automaticamente</span>
                </div>
              </div>
            </div>
          </div>

          <div class="carrinho-total">
            <span>Total:</span>
            <span class="valor-total">{{ formatCurrency(totalCarrinho) }}</span>
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

        <!-- Lista de Produtos (Cards Quadrados) -->
        <div class="produtos-grid">
          <div
            v-for="produto in produtosFiltrados"
            :key="produto.id"
            class="produto-card"
            :class="{ 'produto-indisponivel': !produto.ativo }"
            @click="produto.ativo && adicionarProduto(produto)"
          >
            <!-- Imagem do Produto -->
            <div class="produto-imagem">
              <img 
                v-if="produto.imagemUrl || produto.urlImagem || produto.imagem" 
                :src="produto.imagemUrl || produto.urlImagem || produto.imagem" 
                :alt="produto.nome"
                @error="handleImageError"
              />
              <div v-else class="produto-sem-imagem">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              <!-- Badge de Status -->
              <div v-if="!produto.ativo" class="badge-indisponivel">Indisponível</div>
            </div>

            <!-- Informações do Produto -->
            <div class="produto-corpo">
              <h4 class="produto-nome">{{ produto.nome }}</h4>
              <p class="produto-descricao">{{ produto.descricao || 'Sem descrição' }}</p>
              
              <!-- Badges -->
              <div class="produto-badges">
                <span :class="['badge', 'badge-tipo-preparo', getTipoPreparoClasse(produto.tipoPreparo)]">
                  {{ produto.tipoPreparo }}
                </span>
              </div>
              
              <!-- Preço e Botão -->
              <div class="produto-footer">
                <span class="produto-preco">{{ formatCurrency(produto.preco) }}</span>
                <button 
                  v-if="produto.ativo"
                  class="btn-adicionar"
                  @click.stop="adicionarProduto(produto)"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          <div v-if="produtosFiltrados.length === 0" class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>Nenhum produto encontrado</p>
          </div>
        </div>

        <!-- Tipo de Pagamento -->
        <div v-if="carrinho.length > 0" class="form-group">
          <label class="form-label">Tipo de Pagamento</label>
          <div class="payment-options">
            <label 
              class="payment-option" 
              :class="{ 
                'selected': tipoPagamento === 'PRE_PAGO',
                'disabled': !podeUsarPrePago
              }"
              :title="!podeUsarPrePago ? tooltipPrePago : ''"
            >
              <input 
                type="radio" 
                v-model="tipoPagamento" 
                value="PRE_PAGO"
                :disabled="!podeUsarPrePago"
              />
              <div class="option-content">
                <div class="option-icon">💰</div>
                <div class="option-details">
                  <span class="option-title">Pré-Pago (Fundo)</span>
                  <span class="option-desc">Débito automático do fundo</span>
                  <span v-if="!podeUsarPrePago" class="option-warning">{{ tooltipPrePago }}</span>
                </div>
              </div>
            </label>
            
            <label 
              class="payment-option" 
              :class="{ 
                'selected': tipoPagamento === 'POS_PAGO',
                'disabled': !podeUsarPosPago
              }"
              :title="!podeUsarPosPago ? tooltipPosPago : ''"
            >
              <input 
                type="radio" 
                v-model="tipoPagamento" 
                value="POS_PAGO"
                :disabled="!podeUsarPosPago"
              />
              <div class="option-content">
                <div class="option-icon">📋</div>
                <div class="option-details">
                  <span class="option-title">Pós-Pago</span>
                  <span class="option-desc">Pagar ao finalizar</span>
                  <span v-if="!podeUsarPosPago" class="option-warning">{{ tooltipPosPago }}</span>
                </div>
              </div>
            </label>
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
import { useRouter } from 'vue-router'
import { useCurrency } from '@/utils/currency'
import api from '@/services/api'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import fundoConsumoService from '@/services/fundoConsumoService'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  unidade: Object,
  produtos: Array
})

const emit = defineEmits(['fechar', 'pedido-criado', 'criar-fundo', 'recarregar-fundo'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const router = useRouter()

const buscaProduto = ref('')
const carrinho = ref([])
const loading = ref(false)
const tipoPagamento = ref('PRE_PAGO')
const fundoConsumo = ref(null)
const carregandoFundo = ref(false)
const saldoEmAberto = ref(0)
const limitePosPago = ref(50000) // 500 AOA por padrão
const carregandoSaldoAberto = ref(false)

// Buscar fundo do cliente ao montar (SIMPLIFICADO - sem travamento)
onMounted(() => {
  // CRÍTICO: Não executar se modal não está aberto
  if (!props.isOpen) {
    console.log('[ModalNovoPedido] Modal renderizado mas não aberto - ignorando onMounted')
    return
  }
  
  console.log('[ModalNovoPedido] Modal montado, unidade:', props.unidade)
  console.log('[ModalNovoPedido] Produtos recebidos:', props.produtos?.length || 0)
  if (props.produtos?.length > 0) {
    console.log('[ModalNovoPedido] Exemplo de produto:', props.produtos[0])
  }
  
  // VALIDAÇÃO: Verificar se unidade existe
  if (!props.unidade) {
    console.error('[ModalNovoPedido] ERRO: Modal aberto sem unidade definida')
    return
  }
  
  // Se usuário não pode usar POS_PAGO, forçar PRE_PAGO (se disponível)
  if (!podeUsarPosPago.value && tipoPagamento.value === 'POS_PAGO') {
    if (podeUsarPrePago.value) {
      tipoPagamento.value = 'PRE_PAGO'
    }
  }
  
  // Buscar fundo APENAS se tiver cliente (sem bloquear)
  if (props.unidade?.cliente?.id) {
    buscarFundoCliente().catch(err => {
      console.warn('[ModalNovoPedido] Erro ao buscar fundo (não crítico):', err)
    })
  }
})

const buscarSaldoEmAberto = async () => {
  // Simplificado - não buscar automaticamente para evitar travamento
  // Será usado valor padrão
  try {
    carregandoSaldoAberto.value = true
    
    // Apenas buscar limite de pós-pago se necessário
    const configResponse = await api.get('/configuracao-financeira')
    if (configResponse.data?.limitePosPago) {
      limitePosPago.value = configResponse.data.limitePosPago
    }
  } catch (err) {
    console.warn('[ModalNovoPedido] Usando limite padrão de pós-pago')
  } finally {
    carregandoSaldoAberto.value = false
  }
}

const buscarFundoCliente = async () => {
  try {
    carregandoFundo.value = true
    fundoConsumo.value = await fundoConsumoService.buscarFundoPorCliente(props.unidade.cliente.id)
    
    console.log('[ModalNovoPedido] Fundo carregado:', JSON.stringify(fundoConsumo.value, null, 2))
    
    // Se tem fundo, usa PRE_PAGO por padrão, senão usa POS_PAGO
    if (fundoConsumo.value && fundoConsumo.value.saldoAtual > 0) {
      tipoPagamento.value = 'PRE_PAGO'
    } else {
      tipoPagamento.value = 'POS_PAGO'
      if (fundoConsumo.value) {
        console.warn('[ModalNovoPedido] Fundo existe mas saldo é zero:', fundoConsumo.value.saldoAtual)
      }
    }
  } catch (error) {
    console.log('Cliente não possui fundo de consumo:', error)
    tipoPagamento.value = 'POS_PAGO'
  } finally {
    carregandoFundo.value = false
  }
}

// Validar se pode usar PRE_PAGO (requer cliente vinculado + fundo ativo)
const podeUsarPrePago = computed(() => {
  // Primeiro: unidade deve ter cliente vinculado
  if (!props.unidade?.cliente?.id) {
    return false
  }
  // Segundo: cliente deve ter fundo ativo
  if (!fundoConsumo.value) {
    return false
  }
  return true
})

// Mensagem de tooltip quando PRE_PAGO está desabilitado
const tooltipPrePago = computed(() => {
  if (!props.unidade?.cliente?.id) {
    return 'Vincule um cliente à unidade primeiro'
  }
  if (!fundoConsumo.value) {
    return 'Cliente não possui fundo de consumo ativo'
  }
  return ''
})

// Validar se pode usar POS_PAGO (apenas ADMIN e GERENTE) - SIMPLIFICADO
const podeUsarPosPago = computed(() => {
  const role = authStore.user?.role
  return role === 'ADMIN' || role === 'GERENTE'
})

// Mensagem de tooltip quando POS_PAGO está desabilitado - SIMPLIFICADO
const tooltipPosPago = computed(() => {
  const role = authStore.user?.role
  const temPermissao = role === 'ADMIN' || role === 'GERENTE'
  
  if (!temPermissao) {
    return 'Apenas Gerente ou Admin podem usar Pós-Pago'
  }
  
  return ''
})

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
  
  // Se for PRE_PAGO (fundo), verificar saldo
  if (tipoPagamento.value === 'PRE_PAGO') {
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
      quantidade: 1,
      observacoes: '',
      mostrarObservacoes: false
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

const toggleObservacoes = (index) => {
  carrinho.value[index].mostrarObservacoes = !carrinho.value[index].mostrarObservacoes
}

const validarObservacoes = (index) => {
  // Backend remove emojis automaticamente, mas podemos avisar o usuário
  const item = carrinho.value[index]
  const temEmojis = /\p{Emoji}/u.test(item.observacoes)
  
  if (temEmojis && !item._emojiWarningShown) {
    item._emojiWarningShown = true
    setTimeout(() => {
      item._emojiWarningShown = false
    }, 3000)
  }
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

// Tratar erro de carregamento de imagem
const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentElement.classList.add('produto-sem-imagem')
}

const abrirModalCriarFundo = () => {
  emit('criar-fundo', props.unidade.cliente)
}

const abrirModalRecarregar = () => {
  // Redirecionar para a página de detalhes do fundo ao invés de abrir modal
  if (fundoConsumo.value?.id) {
    console.log('[ModalNovoPedido] Redirecionando para detalhes do fundo:', fundoConsumo.value.id)
    emit('fechar')
    router.push({ name: 'FundoDetalhe', params: { id: fundoConsumo.value.id } })
  } else {
    notificationStore.erro('Fundo não encontrado')
  }
}

const criarPedido = async () => {
  if (carrinho.value.length === 0) {
    notificationStore.aviso('Adicione produtos ao pedido')
    return
  }

  // Validações específicas por tipo de pagamento
  if (tipoPagamento.value === 'PRE_PAGO') {
    if (!props.unidade?.cliente?.id) {
      notificationStore.erro('Unidade deve ter cliente vinculado para pagamento PRÉ-PAGO')
      return
    }
    
    if (!fundoConsumo.value) {
      notificationStore.aviso('Cliente não possui fundo de consumo. Crie um fundo primeiro.')
      return
    }
    
    // Validar saldo maior que zero
    if (fundoConsumo.value.saldoAtual <= 0) {
      notificationStore.erro('Saldo do fundo é zero. Recarregue o fundo antes de criar pedido.')
      return
    }
    
    if (totalCarrinho.value > fundoConsumo.value.saldoAtual) {
      notificationStore.aviso(`Saldo insuficiente. Faltam ${formatCurrency(totalCarrinho.value - fundoConsumo.value.saldoAtual)}. Recarregue o fundo.`)
      return
    }
  }
  
  // Validação de permissão para PÓS-PAGO - SIMPLIFICADO
  if (tipoPagamento.value === 'POS_PAGO') {
    if (!podeUsarPosPago.value) {
      notificationStore.erro('Apenas Gerente ou Admin podem criar pedidos Pós-Pago')
      return
    }
  }

  loading.value = true
  try {
    // DEBUG: Verificar estado do carrinho
    console.log('[ModalNovoPedido] Estado do carrinho:', JSON.stringify(carrinho.value, null, 2))
    console.log('[ModalNovoPedido] Total calculado:', totalCarrinho.value)
    console.log('[ModalNovoPedido] Unidade ID:', props.unidade.id)
    console.log('[ModalNovoPedido] Tipo Pagamento:', tipoPagamento.value)
    
    const dados = {
      unidadeConsumoId: props.unidade.id,
      tipoPagamento: tipoPagamento.value,
      itens: carrinho.value.map(item => {
        const itemPedido = {
          produtoId: item.produtoId,
          quantidade: item.quantidade
        }
        
        // Adicionar observações apenas se tiver conteúdo
        if (item.observacoes && item.observacoes.trim()) {
          itemPedido.observacoes = item.observacoes.trim()
        }
        
        console.log('[ModalNovoPedido] Item mapeado:', itemPedido)
        return itemPedido
      })
    }

    console.log('[ModalNovoPedido] Payload final:', JSON.stringify(dados, null, 2))

    const response = await pedidosBalcaoService.criar(dados)
    
    notificationStore.sucesso(`Pedido criado com sucesso! Tipo: ${tipoPagamento.value}`)
    
    // Limpar carrinho
    carrinho.value = []
    
    emit('pedido-criado', response.data)
  } catch (error) {
    console.error('[ModalNovoPedido] Erro:', error)
    
    // Mensagens amigáveis para erros específicos
    const mensagemBackend = error.response?.data?.message || ''
    
    if (mensagemBackend.includes('Limite de pós-pago excedido')) {
      // Extrair valores se possível
      const limiteMatch = mensagemBackend.match(/Limite: ([0-9.,]+)/)
      const abertoMatch = mensagemBackend.match(/Total aberto: ([0-9.,]+)/)
      
      notificationStore.erro(
        `❌ Limite de Crédito Excedido!\n\n` +
        `Você já possui ${abertoMatch ? abertoMatch[1] : 'valor'} em contas pendentes.\n` +
        `Limite máximo: ${limiteMatch ? limiteMatch[1] : 'não disponível'}\n\n` +
        `⚠️ Soluções:\n` +
        `• Regularize as contas pendentes primeiro\n` +
        `• Use pagamento Pré-Pago (Fundo de Consumo)\n` +
        `• Recarregue o fundo do cliente`,
        {
          duration: 8000
        }
      )
    } else if (mensagemBackend.includes('Valor de débito deve ser maior que zero')) {
      notificationStore.erro('Erro ao processar pagamento. Verifique se o fundo possui saldo e tente novamente.')
    } else if (mensagemBackend.includes('Saldo insuficiente')) {
      notificationStore.erro('Saldo insuficiente no fundo. Recarregue e tente novamente.')
    } else {
      notificationStore.erro(mensagemBackend || 'Erro ao criar pedido')
    }
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

/* Grid de Cards Quadrados */
.produtos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.produto-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.produto-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.produto-card.produto-indisponivel {
  opacity: 0.6;
  cursor: not-allowed;
}

.produto-card.produto-indisponivel:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* Imagem do Produto (Quadrada) */
.produto-imagem {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f0f0f0;
  overflow: hidden;
}

.produto-imagem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.produto-card:hover .produto-imagem img {
  transform: scale(1.05);
}

.produto-sem-imagem {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.produto-sem-imagem svg {
  width: 48px;
  height: 48px;
  color: #9e9e9e;
}

.badge-indisponivel {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(244, 67, 54, 0.95);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Corpo do Card */
.produto-corpo {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.produto-nome {
  margin: 0 0 6px 0;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.produto-descricao {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.produto-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge-tipo-preparo {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-tipo-preparo.quente { background: #ffebee; color: #c62828; }
.badge-tipo-preparo.frio { background: #e3f2fd; color: #1565c0; }
.badge-tipo-preparo.bar { background: #fff3e0; color: #ef6c00; }
.badge-tipo-preparo.bebida { background: #e8f5e9; color: #2e7d32; }
.badge-tipo-preparo.sobremesa { background: #f3e5f5; color: #6a1b9a; }

/* Footer do Card */
.produto-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.produto-preco {
  font-size: 18px;
  font-weight: 700;
  color: #1976d2;
}

.btn-adicionar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-adicionar:hover {
  background: #45a049;
  transform: scale(1.05);
}

.btn-adicionar svg {
  stroke-width: 2.5;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #999;
  grid-column: 1 / -1;
}

.empty-state svg {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: #ccc;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
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
  flex-direction: column;
  gap: 8px;
}

.carrinho-item > div:first-child {
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

.item-controles .btn.active {
  background: #1976d2;
  color: white;
}

.item-observacoes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding-top: 8px;
  border-top: 1px dashed #e0e0e0;
}

.observacoes-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.observacoes-input:focus {
  outline: none;
  border-color: #1976d2;
}

.observacoes-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.caracteres-count {
  color: #666;
  font-weight: 600;
}

.caracteres-count.limit-warning {
  color: #f57c00;
}

.observacoes-hint {
  color: #999;
  font-style: italic;
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

.alert-error {
  background: #ffebee;
  border: 2px solid #ef5350;
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

.alert-error .alert-icon {
  color: #d32f2f;
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

.option-warning {
  display: block;
  font-size: 11px;
  color: #f57c00;
  margin-top: 4px;
  font-style: italic;
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

/* Loading Overlay */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  margin-bottom: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}
</style>
