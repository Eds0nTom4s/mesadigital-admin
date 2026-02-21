<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import { unidadesConsumoService } from '@/services/unidadesConsumoService'
import produtosService from '@/services/produtosService'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

// Estado local
const unidadeSelecionada = ref(null)
const mostrarModalNovoPedido = ref(false)
const mostrarModalPagamento = ref(false)
const mostrarModalFecharUnidade = ref(false)
const carrinhoItens = ref([])
const busca = ref('')
const loading = ref(false)
const loadingProdutos = ref(false)

// Dados do backend
const unidadesConsumo = ref([])
const produtosDisponiveis = ref([])

// Política global (viria do backend ou configuração)
const politicaPospagoAtiva = ref(false)

// Título dinâmico baseado em role (conforme REFATORACAO_HIERARQUIA_UNIDADES.txt)
const tituloContexto = computed(() => {
  if (authStore.isAdmin) {
    return {
      titulo: 'Gestão de Pedidos - Visão Global',
      subtitulo: 'Todas as unidades de atendimento'
    }
  } else {
    // GERENTE/ATENDENTE vê apenas sua UnidadeAtendimento
    return {
      titulo: 'Gestão de Pedidos - Balcão',
      subtitulo: `${unidadesFiltradas.value.length} unidades abertas`
    }
  }
})

// Funções de carregamento de dados
const carregarUnidades = async () => {
  loading.value = true
  try {
    // NOVO: Usa endpoint /minhas que filtra automaticamente por role
    // - ADMIN: retorna TODAS as unidades
    // - GERENTE/ATENDENTE: retorna apenas unidades da sua UnidadeAtendimento
    // FALLBACK: Se erro 400 (token mock sem unidadeAtendimentoId), usa endpoint antigo
    let response
    try {
      response = await unidadesConsumoService.getMinhas()
    } catch (error) {
      if (error.response?.status === 400) {
        console.warn('[PedidosBalcao] Fallback para endpoint /status/OCUPADA (modo dev sem login real)')
        response = await unidadesConsumoService.getAbertas()
      } else {
        throw error
      }
    }
    
    const unidades = response.data || []
    
    // Calcular resumos financeiros para cada unidade
    unidadesConsumo.value = unidades.map(unidade => ({
      ...unidade,
      ...unidadesConsumoService.calcularResumo(unidade)
    }))
    
    console.log('[PedidosBalcao] Unidades carregadas:', unidadesConsumo.value.length)
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao carregar unidades:', error)
    notificationStore.erro('Erro ao carregar unidades abertas')
    unidadesConsumo.value = []
  } finally {
    loading.value = false
  }
}

const carregarProdutos = async () => {
  loadingProdutos.value = true
  try {
    const response = await produtosService.getAll()
    // Backend não tem endpoint /disponiveis, filtrar aqui
    const produtos = response.data || []
    produtosDisponiveis.value = produtos.filter(p => p.disponivel === true)
    console.log('[PedidosBalcao] Produtos carregados:', produtosDisponiveis.value.length)
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao carregar produtos:', error)
    notificationStore.erro('Erro ao carregar produtos')
    produtosDisponiveis.value = []
  } finally {
    loadingProdutos.value = false
  }
}

const carregarDetalhesUnidade = async (unidadeId) => {
  try {
    const response = await unidadesConsumoService.getById(unidadeId)
    const unidadeAtualizada = response.data
    
    // Calcular resumo financeiro
    const resumo = unidadesConsumoService.calcularResumo(unidadeAtualizada)
    const unidadeCompleta = { ...unidadeAtualizada, ...resumo }
    
    // Atualizar na lista
    const index = unidadesConsumo.value.findIndex(u => u.id === unidadeId)
    if (index !== -1) {
      unidadesConsumo.value[index] = unidadeCompleta
    }
    
    // Atualizar selecionada se for a mesma
    if (unidadeSelecionada.value?.id === unidadeId) {
      unidadeSelecionada.value = unidadeCompleta
    }
    
    return unidadeCompleta
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao carregar detalhes da unidade:', error)
    throw error
  }
}

// Lifecycle
onMounted(async () => {
  console.log('[PedidosBalcao] Componente montado, carregando dados...')
  await Promise.all([
    carregarUnidades(),
    carregarProdutos()
  ])
})

// Computed
const unidadesFiltradas = computed(() => {
  if (!busca.value) return unidadesConsumo.value
  return unidadesConsumo.value.filter(u => 
    u.referencia?.toLowerCase().includes(busca.value.toLowerCase())
  )
})

const totalCarrinho = computed(() => {
  return carrinhoItens.value.reduce((acc, item) => acc + (item.preco * item.quantidade), 0)
})

const podeFinalizarPedido = computed(() => {
  if (carrinhoItens.value.length === 0) return false
  if (!unidadeSelecionada.value) return false
  
  const unidade = unidadeSelecionada.value
  const fundoCliente = unidade.cliente?.fundoConsumo
  const temFundoSuficiente = fundoCliente && fundoCliente.saldoAtual >= totalCarrinho.value
  
  // Pode finalizar se: tem fundo OU pós-pago está ativo
  return temFundoSuficiente || politicaPospagoAtiva.value
})

const mensagemBloqueio = computed(() => {
  if (!unidadeSelecionada.value) return ''
  if (carrinhoItens.value.length === 0) return 'Adicione itens ao carrinho'
  
  const unidade = unidadeSelecionada.value
  const fundoCliente = unidade.cliente?.fundoConsumo
  const temFundo = fundoCliente && fundoCliente.saldoAtual >= totalCarrinho.value
  
  if (!temFundo && !politicaPospagoAtiva.value) {
    return 'Sem fundo suficiente. Pós-pago desativado. Recarregue o fundo primeiro.'
  }
  
  return ''
})

// Funções
const selecionarUnidade = (unidade) => {
  unidadeSelecionada.value = unidade
  carrinhoItens.value = []
}

const voltarListaUnidades = () => {
  unidadeSelecionada.value = null
  carrinhoItens.value = []
}

const abrirModalNovoPedido = async () => {
  if (!unidadeSelecionada.value) {
    notificationStore.erro('Selecione uma unidade primeiro')
    return
  }
  
  // Carregar produtos se ainda não carregou
  if (produtosDisponiveis.value.length === 0) {
    await carregarProdutos()
  }
  
  mostrarModalNovoPedido.value = true
}

const fecharModalNovoPedido = () => {
  mostrarModalNovoPedido.value = false
  carrinhoItens.value = []
}

const adicionarAoCarrinho = (produto) => {
  if (!produto.disponivel) {
    notificationStore.aviso('Produto indisponível no momento')
    return
  }
  
  const itemExistente = carrinhoItens.value.find(i => i.produtoId === produto.id)
  if (itemExistente) {
    itemExistente.quantidade++
  } else {
    carrinhoItens.value.push({
      produtoId: produto.id,
      produtoNome: produto.nome,
      preco: produto.preco,
      quantidade: 1
    })
  }
}

const removerDoCarrinho = (index) => {
  carrinhoItens.value.splice(index, 1)
}

const alterarQuantidade = (index, delta) => {
  const item = carrinhoItens.value[index]
  item.quantidade += delta
  if (item.quantidade <= 0) {
    removerDoCarrinho(index)
  }
}

const finalizarPedido = async () => {
  if (!podeFinalizarPedido.value) {
    notificationStore.erro(mensagemBloqueio.value)
    return
  }
  
  const unidade = unidadeSelecionada.value
  const fundoCliente = unidade.cliente?.fundoConsumo
  const temFundoSuficiente = fundoCliente && fundoCliente.saldoAtual >= totalCarrinho.value
  
  if (temFundoSuficiente) {
    // Criar pedido PRE_PAGO (débito automático)
    await criarPedidoComFundo()
  } else {
    // Sem fundo - precisa ação de pagamento POS_PAGO
    mostrarModalPagamento.value = true
  }
}

const criarPedidoComFundo = async () => {
  loading.value = true
  try {
    console.log('[PedidosBalcao] Criando pedido PRE_PAGO com débito automático de fundo')
    
    // Preparar dados do pedido
    const dadosPedido = {
      unidadeConsumoId: unidadeSelecionada.value.id,
      itens: carrinhoItens.value.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      })),
      tipoPagamento: 'PRE_PAGO' // Backend debita automaticamente do fundo
    }
    
    // Criar pedido
    const response = await pedidosBalcaoService.criar(dadosPedido)
    const pedidoCriado = response.data
    
    notificationStore.sucesso(`Pedido ${pedidoCriado.numero || pedidoCriado.id} criado e pago via fundo`)
    
    // Recarregar dados da unidade atualizada
    await carregarDetalhesUnidade(unidadeSelecionada.value.id)
    
    fecharModalNovoPedido()
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao criar pedido:', error)
    const mensagem = error.response?.data?.message || 'Erro ao criar pedido'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}

const pagarAgora = async (metodo) => {
  loading.value = true
  try {
    console.log('[PedidosBalcao] Criando pedido POS_PAGO via', metodo)
    
    // Preparar dados do pedido
    const dadosPedido = {
      unidadeConsumoId: unidadeSelecionada.value.id,
      itens: carrinhoItens.value.map(item => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade
      })),
      tipoPagamento: 'POS_PAGO' // Requer GERENTE/ADMIN
    }
    
    // Criar pedido pós-pago
    const responsePedido = await pedidosBalcaoService.criar(dadosPedido)
    const pedidoCriado = responsePedido.data
    
    // Se confirmar pagamento imediato, chamar endpoint
    if (metodo !== 'POS_PAGO') {
      await pedidosBalcaoService.confirmarPagamento(pedidoCriado.id)
      notificationStore.sucesso(`Pedido ${pedidoCriado.numero} criado e pago`)
    } else {
      notificationStore.sucesso(`Pedido ${pedidoCriado.numero} criado (pagamento pendente)`)
    }
    
    // Recarregar dados
    await carregarDetalhesUnidade(unidadeSelecionada.value.id)
    
    mostrarModalPagamento.value = false
    fecharModalNovoPedido()
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao criar/pagar pedido:', error)
    const mensagem = error.response?.data?.message || 'Erro ao processar pedido'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}

const recarregarFundo = () => {
  console.log('[PedidosBalcao] Redirecionando para recarga de fundo')
  notificationStore.info('Funcionalidade de recarga será implementada')
  mostrarModalPagamento.value = false
}

const tentarFecharUnidade = () => {
  const unidade = unidadeSelecionada.value
  
  // VALIDAÇÃO RIGOROSA: Bloquear fechamento se houver pendências financeiras
  if (unidade.totalPendente > 0) {
    notificationStore.erro(
      `Não é possível fechar a unidade com ${formatCurrency(unidade.totalPendente)} pendentes. ` +
      `Confirme o pagamento dos pedidos antes de fechar.`
    )
    return
  }
  
  // AVISO: Pedidos não entregues (não bloqueia, apenas avisa)
  const pedidosNaoEntregues = unidade.pedidos?.filter(p => 
    p.status !== 'ENTREGUE' && p.status !== 'CANCELADO'
  ) || []
  
  if (pedidosNaoEntregues.length > 0) {
    notificationStore.aviso('Atenção: Existem pedidos ainda não entregues')
  }
  
  mostrarModalFecharUnidade.value = true
}

const confirmarFecharUnidade = async () => {
  loading.value = true
  try {
    console.log('[PedidosBalcao] Fechando unidade', unidadeSelecionada.value.referencia)
    
    await unidadesConsumoService.fechar(unidadeSelecionada.value.id)
    
    notificationStore.sucesso('Unidade fechada com sucesso')
    mostrarModalFecharUnidade.value = false
    
    // Remover da lista
    const index = unidadesConsumo.value.findIndex(u => u.id === unidadeSelecionada.value.id)
    if (index !== -1) {
      unidadesConsumo.value.splice(index, 1)
    }
    
    unidadeSelecionada.value = null
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao fechar unidade:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao fechar unidade')
  } finally {
    loading.value = false
  }
}

// Helpers de visualização
const getStatusFinanceiroConfig = (status) => {
  const configs = {
    PAGO: { label: 'Pago', cor: '#4CAF50', icon: '✅' },
    EM_DEBITO: { label: 'Em Débito', cor: '#F44336', icon: '⚠️' },
    PARCIAL: { label: 'Parcial', cor: '#FF9800', icon: '⏳' }
  }
  return configs[status] || configs.PARCIAL
}

const getEstadoOperacionalConfig = (estado) => {
  const configs = {
    CRIADO: { label: 'Criado', cor: '#2196F3' },
    EM_PREPARO: { label: 'Em Preparo', cor: '#FF9800' },
    PRONTO: { label: 'Pronto', cor: '#8BC34A' },
    ENTREGUE: { label: 'Entregue', cor: '#4CAF50' },
    CANCELADO: { label: 'Cancelado', cor: '#9E9E9E' }
  }
  return configs[estado] || configs.CRIADO
}

const getEstadoFinanceiroConfig = (estado) => {
  const configs = {
    NAO_PAGO: { label: 'Não Pago', cor: '#F44336' },
    PARCIAL: { label: 'Parcial', cor: '#FF9800' },
    PAGO: { label: 'Pago', cor: '#4CAF50' }
  }
  return configs[estado] || configs.NAO_PAGO
}
</script>

<template>
  <div class="pedidos-balcao">
    <!-- Header -->
    <div class="header">
      <div class="header-title">
        <h1>{{ tituloContexto.titulo }}</h1>
        <p class="header-subtitle">{{ tituloContexto.subtitulo }}</p>
      </div>
      <div class="header-info">
        <span class="badge" :class="politicaPospagoAtiva ? 'badge-success' : 'badge-danger'">
          Pós-pago: {{ politicaPospagoAtiva ? 'ATIVO' : 'INATIVO' }}
        </span>
      </div>
    </div>

    <!-- Vista: Lista de Unidades -->
    <div v-if="!unidadeSelecionada" class="lista-unidades">
      <div class="toolbar">
        <input
          v-model="busca"
          type="text"
          placeholder="Buscar unidade (mesa, quarto, área)..."
          class="input-busca"
          :disabled="loading"
        />
        <span class="contador">{{ unidadesFiltradas.length }} unidades abertas</span>
        <button @click="carregarUnidades" class="btn-refresh" :disabled="loading">
          🔄 {{ loading ? 'Carregando...' : 'Atualizar' }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando unidades abertas...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="unidadesFiltradas.length === 0" class="empty-state">
        <p v-if="busca">Nenhuma unidade encontrada com o termo "{{ busca }}"</p>
        <p v-else>Nenhuma unidade aberta no momento</p>
      </div>

      <!-- Unidades Grid -->
      <div v-else class="unidades-grid">
        <div
          v-for="unidade in unidadesFiltradas"
          :key="unidade.id"
          class="unidade-card"
          :class="`unidade-${unidade.statusFinanceiro.toLowerCase()}`"
          @click="selecionarUnidade(unidade)"
        >
          <div class="unidade-header">
            <div class="unidade-titulo">
              <!-- TipoUnidadeConsumo: MESA_FISICA, QUARTO, AREA_EVENTO, ESPACO_LOUNGE, VIRTUAL -->
              <span class="unidade-icon">{{ unidade.tipo === 'MESA_FISICA' ? '🍽️' : '📋' }}</span>
              <strong>{{ unidade.referencia }}</strong>
            </div>
            <span
              class="status-badge"
              :style="{ backgroundColor: getStatusFinanceiroConfig(unidade.statusFinanceiro).cor }"
            >
              {{ getStatusFinanceiroConfig(unidade.statusFinanceiro).icon }}
              {{ getStatusFinanceiroConfig(unidade.statusFinanceiro).label }}
            </span>
          </div>

          <div class="unidade-info">
            <div class="info-row">
              <span class="label">Total Consumido:</span>
              <span class="valor">{{ formatCurrency(unidade.totalConsumido) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Pago:</span>
              <span class="valor positivo">{{ formatCurrency(unidade.totalPago) }}</span>
            </div>
            <div v-if="unidade.totalPendente > 0" class="info-row destaque">
              <span class="label">Pendente:</span>
              <span class="valor negativo">{{ formatCurrency(unidade.totalPendente) }}</span>
            </div>
          </div>

          <div v-if="unidade.cliente?.fundoConsumo" class="fundo-info">
            <div class="fundo-label">💰 Fundo de Consumo</div>
            <div class="fundo-saldo" :class="{ 'fundo-baixo': unidade.cliente.fundoConsumo.saldoAtual < 5000 }">
              {{ formatCurrency(unidade.cliente.fundoConsumo.saldoAtual) }}
            </div>
          </div>

          <div class="unidade-footer">
            <span class="pedidos-count">{{ unidade.pedidos?.length || 0 }} pedido(s)</span>
            <span class="tempo">Aberto há {{ calcularTempo(unidade.abertaEm) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista: Detalhes da Unidade -->
    <div v-else class="unidade-detalhes">
      <div class="detalhes-header">
        <button @click="voltarListaUnidades" class="btn-voltar">
          ← Voltar
        </button>
        <h2>{{ unidadeSelecionada.referencia }}</h2>
        <div class="acoes">
          <button @click="abrirModalNovoPedido" class="btn btn-primary">
            + Novo Pedido
          </button>
          <button @click="tentarFecharUnidade" class="btn btn-danger">
            Fechar Unidade
          </button>
        </div>
      </div>

      <!-- Resumo Financeiro -->
      <div class="resumo-financeiro">
        <div class="resumo-card">
          <div class="resumo-label">Total Consumido</div>
          <div class="resumo-valor">{{ formatCurrency(unidadeSelecionada.totalConsumido) }}</div>
        </div>
        <div class="resumo-card positivo">
          <div class="resumo-label">Total Pago</div>
          <div class="resumo-valor">{{ formatCurrency(unidadeSelecionada.totalPago) }}</div>
        </div>
        <div v-if="unidadeSelecionada.totalPendente > 0" class="resumo-card negativo">
          <div class="resumo-label">Pendente</div>
          <div class="resumo-valor">{{ formatCurrency(unidadeSelecionada.totalPendente) }}</div>
        </div>
        <div v-if="unidadeSelecionada.cliente?.fundoConsumo" class="resumo-card fundo">
          <div class="resumo-label">Saldo Fundo</div>
          <div class="resumo-valor">{{ formatCurrency(unidadeSelecionada.cliente.fundoConsumo.saldoAtual) }}</div>
        </div>
      </div>

      <!-- Lista de Pedidos -->
      <div class="pedidos-lista">
        <h3>Histórico de Pedidos</h3>
        <div
          v-for="pedido in (unidadeSelecionada.pedidos || [])"
          :key="pedido.id"
          class="pedido-card"
          :class="`pedido-${pedido.statusFinanceiro?.toLowerCase() || 'nao_pago'}`"
        >
          <div class="pedido-header">
            <div>
              <strong>{{ pedido.numero }}</strong>
              <span class="pedido-data">{{ formatarDataHora(pedido.criadoEm) }}</span>
            </div>
            <div class="pedido-badges">
              <span
                class="badge"
                :style="{ backgroundColor: getEstadoOperacionalConfig(pedido.status).cor }"
              >
                {{ getEstadoOperacionalConfig(pedido.status).label }}
              </span>
              <span
                class="badge"
                :style="{ backgroundColor: getEstadoFinanceiroConfig(pedido.statusFinanceiro).cor }"
              >
                {{ getEstadoFinanceiroConfig(pedido.statusFinanceiro).label }}
              </span>
            </div>
          </div>

          <div class="pedido-itens">
            <div v-for="item in pedido.itens" :key="item.id" class="pedido-item">
              <span>{{ item.quantidade }}x {{ item.produtoNome }}</span>
              <span>{{ formatCurrency(item.precoUnitario * item.quantidade) }}</span>
            </div>
          </div>

          <div class="pedido-footer">
            <strong>Total: {{ formatCurrency(pedido.total) }}</strong>
          </div>
        </div>

        <div v-if="unidadeSelecionada.pedidos.length === 0" class="empty-state">
          Nenhum pedido nesta unidade
        </div>
      </div>
    </div>

    <!-- Modal: Novo Pedido -->
    <div v-if="mostrarModalNovoPedido" class="modal-overlay" @click.self="fecharModalNovoPedido">
      <div class="modal-content modal-grande">
        <div class="modal-header">
          <h2>Novo Pedido - {{ unidadeSelecionada?.referencia }}</h2>
          <button @click="fecharModalNovoPedido" class="btn-close">✕</button>
        </div>

        <div class="modal-body modal-duas-colunas">
          <!-- Coluna 1: Produtos -->
          <div class="produtos-coluna">
            <h3>Produtos Disponíveis</h3>
            
            <!-- Loading produtos -->
            <div v-if="loadingProdutos" class="loading-produtos">
              <div class="spinner-small"></div>
              <p>Carregando produtos...</p>
            </div>
            
            <!-- Empty produtos -->
            <div v-else-if="produtosDisponiveis.length === 0" class="empty-produtos">
              <p>Nenhum produto disponível</p>
            </div>
            
            <!-- Grid de produtos -->
            <div v-else class="produtos-grid">
              <div
                v-for="produto in produtosDisponiveis"
                :key="produto.id"
                class="produto-card"
                :class="{ 'produto-indisponivel': !produto.disponivel }"
                @click="adicionarAoCarrinho(produto)"
              >
                <div class="produto-nome">{{ produto.nome }}</div>
                <div class="produto-preco">{{ formatCurrency(produto.preco) }}</div>
                <div v-if="!produto.disponivel" class="produto-status">Indisponível</div>
              </div>
            </div>
          </div>

          <!-- Coluna 2: Carrinho -->
          <div class="carrinho-coluna">
            <h3>Carrinho</h3>
            <div class="carrinho-itens">
              <div v-for="(item, index) in carrinhoItens" :key="index" class="carrinho-item">
                <div class="item-info">
                  <strong>{{ item.produtoNome }}</strong>
                  <span>{{ formatCurrency(item.preco) }}</span>
                </div>
                <div class="item-controles">
                  <button @click="alterarQuantidade(index, -1)" class="btn-qty">-</button>
                  <span class="qty">{{ item.quantidade }}</span>
                  <button @click="alterarQuantidade(index, 1)" class="btn-qty">+</button>
                  <button @click="removerDoCarrinho(index)" class="btn-remover">🗑️</button>
                </div>
                <div class="item-subtotal">
                  {{ formatCurrency(item.preco * item.quantidade) }}
                </div>
              </div>

              <div v-if="carrinhoItens.length === 0" class="carrinho-vazio">
                Adicione produtos ao carrinho
              </div>
            </div>

            <div class="carrinho-total">
              <strong>Total:</strong>
              <strong>{{ formatCurrency(totalCarrinho) }}</strong>
            </div>

            <!-- Informação de Pagamento -->
            <div v-if="unidadeSelecionada?.fundoConsumo" class="info-pagamento">
              <div class="info-fundo">
                <span>Saldo do Fundo:</span>
                <span :class="{ 'saldo-insuficiente': unidadeSelecionada.fundoConsumo.saldoAtual < totalCarrinho }">
                  {{ formatCurrency(unidadeSelecionada.fundoConsumo.saldoAtual) }}
                </span>
              </div>
              <div v-if="unidadeSelecionada.fundoConsumo.saldoAtual >= totalCarrinho" class="info-sucesso">
                ✅ Será debitado automaticamente do fundo
              </div>
              <div v-else class="info-alerta">
                ⚠️ Fundo insuficiente. Será solicitado pagamento.
              </div>
            </div>

            <div v-else class="info-pagamento">
              <div v-if="politicaPospagoAtiva" class="info-aviso">
                💳 Conta sem fundo. Pedido ficará pendente (pós-pago).
              </div>
              <div v-else class="info-erro">
                ⚠️ Sem fundo e pós-pago desativado. Recargue o fundo.
              </div>
            </div>

            <!-- Mensagem de Bloqueio -->
            <div v-if="mensagemBloqueio" class="mensagem-bloqueio">
              {{ mensagemBloqueio }}
            </div>

            <button
              @click="finalizarPedido"
              :disabled="!podeFinalizarPedido || loading"
              class="btn btn-primary btn-block"
            >
              {{ loading ? 'Processando...' : 'Finalizar Pedido' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Pagamento -->
    <div v-if="mostrarModalPagamento" class="modal-overlay" @click.self="mostrarModalPagamento = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Pagamento Necessário</h2>
          <button @click="mostrarModalPagamento = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="aviso-pagamento">
            A conta não possui fundo suficiente para cobrir este pedido.
          </p>
          <div class="info-valores">
            <div class="info-row">
              <span>Valor do Pedido:</span>
              <strong>{{ formatCurrency(totalCarrinho) }}</strong>
            </div>
            <div v-if="unidadeSelecionada?.fundoConsumo" class="info-row">
              <span>Saldo Atual:</span>
              <span>{{ formatCurrency(unidadeSelecionada.fundoConsumo.saldoAtual) }}</span>
            </div>
          </div>

          <div class="opcoes-pagamento">
            <h3>Escolha uma opção:</h3>
            <button @click="pagarAgora('GPO')" class="btn btn-primary btn-block">
              💳 Pagar Agora via GPO
            </button>
            <button @click="pagarAgora('REFERENCIA')" class="btn btn-primary btn-block">
              📱 Gerar Referência
            </button>
            <button @click="recarregarFundo" class="btn btn-secondary btn-block">
              💰 Recarregar Fundo de Consumo
            </button>
            <button v-if="politicaPospagoAtiva" @click="pagarAgora('POS_PAGO')" class="btn btn-secondary btn-block">
              📝 Deixar em Pós-pago
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Fechar Unidade -->
    <div v-if="mostrarModalFecharUnidade" class="modal-overlay" @click.self="mostrarModalFecharUnidade = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Fechar Unidade</h2>
          <button @click="mostrarModalFecharUnidade = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja fechar a unidade <strong>{{ unidadeSelecionada?.referencia }}</strong>?</p>
          <div class="info-valores">
            <div class="info-row">
              <span>Total Consumido:</span>
              <strong>{{ formatCurrency(unidadeSelecionada?.totalConsumido) }}</strong>
            </div>
            <div class="info-row">
              <span>Total Pago:</span>
              <strong>{{ formatCurrency(unidadeSelecionada?.totalPago) }}</strong>
            </div>
            <div v-if="unidadeSelecionada?.totalPendente > 0" class="info-row destaque">
              <span>Pendente:</span>
              <strong class="valor-negativo">{{ formatCurrency(unidadeSelecionada?.totalPendente) }}</strong>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="mostrarModalFecharUnidade = false" class="btn">Cancelar</button>
          <button @click="confirmarFecharUnidade" class="btn btn-danger">Confirmar Fechamento</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Helpers fora do setup
function calcularTempo(dataISO) {
  const inicio = new Date(dataISO)
  const agora = new Date()
  const diffMs = agora - inicio
  const diffMin = Math.floor(diffMs / 60000)
  
  if (diffMin < 60) return `${diffMin} min`
  const horas = Math.floor(diffMin / 60)
  const minutos = diffMin % 60
  return `${horas}h ${minutos}m`
}

function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Exportar para uso no template
export { calcularTempo, formatarDataHora }
</script>

<style scoped>
.pedidos-balcao {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-title h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.header-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #666;
  font-weight: normal;
}

.header-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.badge-success { background: #4CAF50; }
.badge-danger { background: #F44336; }

/* Lista de Contas */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.input-busca {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  width: 300px;
}

.contador {
  font-size: 14px;
  color: #666;
}

.unidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.unidade-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #ccc;
}

.unidade-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.unidade-card.unidade-pago {
  border-left-color: #4CAF50;
}

.unidade-card.unidade-em_debito {
  border-left-color: #F44336;
}

.unidade-card.unidade-parcial {
  border-left-color: #FF9800;
}

.unidade-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.unidade-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
}

.unidade-icon {
  font-size: 24px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  font-weight: 600;
}

.unidade-info {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.info-row.destaque {
  background: #FFF3E0;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

.info-row .label {
  color: #666;
}

.info-row .valor {
  font-weight: 600;
}

.info-row .valor.positivo {
  color: #4CAF50;
}

.info-row .valor.negativo {
  color: #F44336;
}

.fundo-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  margin-bottom: 12px;
}

.fundo-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.fundo-saldo {
  font-size: 20px;
  font-weight: bold;
}

.fundo-saldo.fundo-baixo {
  color: #FFD54F;
}

.unidade-footer {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #999;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

/* Detalhes da Unidade */
.detalhes-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
}

.btn-voltar {
  padding: 10px 20px;
  background: #f5f5f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-voltar:hover {
  background: #e0e0e0;
}

.detalhes-header h2 {
  flex: 1;
  margin: 0;
}

.acoes {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover {
  background: #1976D2;
}

.btn-danger {
  background: #F44336;
  color: white;
}

.btn-danger:hover {
  background: #D32F2F;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-secondary:hover {
  background: #616161;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

/* Resumo Financeiro */
.resumo-financeiro {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.resumo-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.resumo-card.positivo {
  background: #E8F5E9;
  border: 2px solid #4CAF50;
}

.resumo-card.negativo {
  background: #FFEBEE;
  border: 2px solid #F44336;
}

.resumo-card.fundo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.resumo-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.resumo-card.fundo .resumo-label {
  color: rgba(255,255,255,0.9);
}

.resumo-valor {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.resumo-card.fundo .resumo-valor {
  color: white;
}

/* Pedidos */
.pedidos-lista h3 {
  margin-bottom: 20px;
  font-size: 20px;
}

.pedido-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 16px;
  border-left: 4px solid #ccc;
}

.pedido-card.pedido-pago {
  border-left-color: #4CAF50;
  background: #F1F8F4;
}

.pedido-card.pedido-nao_pago {
  border-left-color: #F44336;
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pedido-data {
  font-size: 13px;
  color: #999;
  margin-left: 12px;
}

.pedido-badges {
  display: flex;
  gap: 8px;
}

.pedido-itens {
  margin-bottom: 12px;
}

.pedido-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.pedido-footer {
  padding-top: 12px;
  border-top: 2px solid #eee;
  text-align: right;
  font-size: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.modal-content.modal-grande {
  max-width: 1200px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
  justify-content: flex-end;
}

/* Modal Novo Pedido */
.modal-duas-colunas {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.produtos-coluna h3,
.carrinho-coluna h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.produtos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.produto-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.produto-card:hover {
  border-color: #2196F3;
  transform: scale(1.05);
}

.produto-card.produto-indisponivel {
  opacity: 0.5;
  cursor: not-allowed;
}

.produto-card.produto-indisponivel:hover {
  border-color: #e0e0e0;
  transform: none;
}

.produto-nome {
  font-size: 14px;
  margin-bottom: 8px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.produto-preco {
  font-weight: bold;
  color: #4CAF50;
}

.produto-status {
  font-size: 11px;
  color: #F44336;
  margin-top: 4px;
}

/* Carrinho */
.carrinho-itens {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.carrinho-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-controles {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.btn-qty {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-qty:hover {
  background: #f0f0f0;
}

.qty {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.btn-remover {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  margin-left: auto;
}

.item-subtotal {
  text-align: right;
  font-weight: 600;
  color: #4CAF50;
}

.carrinho-vazio {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.carrinho-total {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 18px;
}

/* Info Pagamento */
.info-pagamento {
  background: #E3F2FD;
  border: 1px solid #2196F3;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
}

.info-fundo {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.saldo-insuficiente {
  color: #F44336;
  font-weight: bold;
}

.info-sucesso {
  color: #4CAF50;
  font-weight: 600;
}

.info-alerta {
  color: #FF9800;
  font-weight: 600;
}

.info-aviso {
  color: #2196F3;
}

.info-erro {
  color: #F44336;
  font-weight: 600;
}

.mensagem-bloqueio {
  background: #FFEBEE;
  border: 1px solid #F44336;
  color: #C62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  text-align: center;
  font-weight: 600;
}

/* Modal Pagamento */
.aviso-pagamento {
  background: #FFF3E0;
  border-left: 4px solid #FF9800;
  padding: 12px;
  margin-bottom: 16px;
}

.info-valores {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.opcoes-pagamento h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.opcoes-pagamento .btn {
  margin-bottom: 12px;
}

.valor-negativo {
  color: #F44336;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
}

/* Loading States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #666;
}

.loading-state p {
  margin-top: 16px;
  font-size: 14px;
}

.loading-produtos,
.empty-produtos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

.spinner-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-refresh {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-duas-colunas {
    grid-template-columns: 1fr;
  }
  
  .contas-grid {
    grid-template-columns: 1fr;
  }
  
  .resumo-financeiro {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .pedidos-balcao {
    padding: 12px;
  }
  
  .detalhes-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .acoes {
    width: 100%;
  }
  
  .acoes .btn {
    flex: 1;
  }
  
  .resumo-financeiro {
    grid-template-columns: 1fr;
  }
}
</style>
