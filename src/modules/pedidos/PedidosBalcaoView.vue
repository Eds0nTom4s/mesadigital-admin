<template>
  <div class="pedidos-balcao-container">
    <!-- Header -->
    <div class="pedidos-header">
      <div>
        <h1>{{ tituloContexto.titulo }}</h1>
        <p class="text-muted">{{ tituloContexto.subtitulo }}</p>
      </div>
      
      <!-- Status WebSocket -->
      <div class="ws-status">
        <span 
          :class="['ws-badge', statusConexao]"
          :title="`WebSocket: ${statusConexao}`"
        >
          {{ statusConexao === 'conectado' ? '🟢' : statusConexao === 'reconectando' ? '🟡' : '🔴' }}
          {{ statusConexao }}
        </span>
      </div>
    </div>

    <!-- Lista de Unidades ou Painel de Unidade Selecionada -->
    <div v-if="!unidadeSelecionada" class="unidades-lista">
      <!-- Busca -->
      <div class="search-bar">
        <input
          v-model="busca"
          type="text"
          placeholder="🔍 Buscar por referência (mesa, quarto, evento...)"
          class="form-control"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando unidades...</p>
      </div>

      <!-- Lista de Cards -->
      <div v-else class="unidades-grid">
        <div
          v-for="unidade in unidadesFiltradas"
          :key="unidade.id"
          class="unidade-card"
          :class="['status-' + unidade.status]"
          @click="selecionarUnidade(unidade)"
        >
          <!-- Header do Card -->
          <div class="card-header">
            <span class="icone-tipo">{{ iconeTipoUnidade(unidade.tipo) }}</span>
            <h3>{{ unidade.referencia }}</h3>
            <span :class="['badge', 'badge-' + unidade.status]">
              {{ labelStatusUnidade(unidade.status) }}
            </span>
          </div>

          <!-- Corpo do Card -->
          <div class="card-body">
            <!-- Cliente -->
            <div v-if="unidade.cliente" class="card-info">
              <span class="label">Cliente:</span>
              <span class="value">{{ unidade.cliente.nome }}</span>
            </div>

            <!-- Saldo Fundo -->
            <div v-if="unidade.cliente?.fundoConsumo" class="card-info">
              <span class="label">Fundo:</span>
              <span class="value" :class="{'text-danger': unidade.cliente.fundoConsumo.saldoAtual < 10}">
                {{ formatCurrency(unidade.cliente.fundoConsumo.saldoAtual) }}
              </span>
            </div>

            <!-- Total Consumido -->
            <div v-if="unidade.totalConsumido > 0" class="card-info">
              <span class="label">Consumo:</span>
              <span class="value">{{ formatCurrency(unidade.totalConsumido) }}</span>
            </div>

            <!-- Pedidos Ativos -->
            <div v-if="unidade.quantidadePedidosAtivos > 0" class="card-info">
              <span class="label">Pedidos Ativos:</span>
              <span class="value">{{ unidade.quantidadePedidosAtivos }}</span>
            </div>
          </div>

          <!-- Footer do Card -->
          <div class="card-footer">
            <button class="btn btn-sm btn-primary">
              Ver Detalhes →
            </button>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-if="unidadesFiltradas.length === 0 && !loading" class="empty-state">
          <p>📭 Nenhuma unidade encontrada</p>
          <small v-if="busca">Tente ajustar o termo de busca</small>
        </div>
      </div>
    </div>

    <!-- Painel da Unidade Selecionada -->
    <div v-else class="unidade-selecionada">
      <PainelUnidadeConsumo
        :unidade="unidadeSelecionada"
        :pedido-ativo="pedidoAtivo"
        @pedido-atualizado="recarregarPedido"
        @fechar="voltarListaUnidades"
        @adicionar-produtos="abrirModalAdicionarProdutos"
        @ver-historico="abrirModalHistorico"
        @novo-pedido="abrirModalNovoPedido"
      />
    </div>

    <!-- Modal: Novo Pedido -->
    <Teleport to="body">
      <ModalNovoPedido
        v-if="mostrarModalNovoPedido"
        :unidade="unidadeSelecionada"
        :produtos="produtosDisponiveis"
        @fechar="fecharModalNovoPedido"
        @pedido-criado="handlePedidoCriado"
        @criar-fundo="handleCriarFundo"
        @recarregar-fundo="handleRecarregarFundo"
      />
    </Teleport>

    <!-- Modal: Adicionar Produtos (a pedido existente) -->
    <Teleport to="body">
      <ModalAdicionarProdutos
        v-if="mostrarModalAdicionarProdutos"
        :unidade="unidadeSelecionada"
        :pedido-id="pedidoAtivo?.id"
        :produtos="produtosDisponiveis"
        @fechar="fecharModalAdicionarProdutos"
        @produtos-adicionados="handleProdutosAdicionados"
      />
    </Teleport>

    <!-- Modal: Histórico de Pedidos -->
    <Teleport to="body">
      <ModalHistoricoPedidos
        v-if="mostrarModalHistorico"
        :unidade-id="unidadeSelecionada?.id"
        @fechar="fecharModalHistorico"
      />
    </Teleport>

    <!-- Modal: Criar Fundo -->
    <Teleport to="body">
      <ModalCriarFundo
        v-if="mostrarModalCriarFundo"
        :cliente="clienteSelecionadoFundo"
        @fechar="fecharModalCriarFundo"
        @fundo-criado="handleFundoCriado"
      />
    </Teleport>

    <!-- Modal: Recarregar Fundo -->
    <Teleport to="body">
      <ModalRecarregarFundo
        v-if="mostrarModalRecarregar"
        :fundo="fundoSelecionado"
        @fechar="fecharModalRecarregar"
        @recarga-criada="handleRecargaCriada"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import { unidadesConsumoService } from '@/services/unidadesConsumoService'
import produtosService from '@/services/produtosService'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import PainelUnidadeConsumo from '@/components/pedidos/PainelUnidadeConsumo.vue'
import { usePedidoWebSocket } from '@/composables/usePedidoWebSocket'

// Lazy load modals (code splitting)
const ModalNovoPedido = defineAsyncComponent(() => 
  import('@/components/pedidos/ModalNovoPedido.vue')
)
const ModalAdicionarProdutos = defineAsyncComponent(() => 
  import('@/components/pedidos/ModalAdicionarProdutos.vue')
)
const ModalHistoricoPedidos = defineAsyncComponent(() => 
  import('@/components/pedidos/ModalHistoricoPedidos.vue')
)
const ModalCriarFundo = defineAsyncComponent(() => 
  import('@/components/fundos/ModalCriarFundo.vue')
)
const ModalRecarregarFundo = defineAsyncComponent(() => 
  import('@/components/fundos/ModalRecarregarFundo.vue')
)

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()

// WebSocket integration
const {
  inscreverPedido,
  inscreverUnidade,
  statusConexao
} = usePedidoWebSocket({
  onPedidoAtualizado: (notificacao) => {
    console.log('[PedidosBalcao] Pedido atualizado via WebSocket:', notificacao)
    recarregarPedido()
  },
  onSubPedidoPronto: (notificacao) => {
    console.log('[PedidosBalcao] 🔔 SubPedido PRONTO:', notificacao)
    notificationStore.sucesso(`🍽️ SubPedido pronto! ${notificacao.cozinhaNome || 'Cozinha'}`)
    recarregarPedido()
  }
})

// Estado dos modais
const mostrarModalCriarFundo = ref(false)
const mostrarModalRecarregar = ref(false)
const clienteSelecionadoFundo = ref(null)
const fundoSelecionado = ref(null)
const unidadeSelecionada = ref(null)
const pedidoAtivo = ref(null)
const mostrarModalNovoPedido = ref(false)
const mostrarModalAdicionarProdutos = ref(false)
const mostrarModalHistorico = ref(false)
const busca = ref('')
const loading = ref(false)
const loadingProdutos = ref(false)

// Dados do backend
const unidadesConsumo = ref([])
const produtosDisponiveis = ref([])

// WebSocket cleanup functions
let cleanupPedidoWS = null
let cleanupUnidadeWS = null

// Título dinâmico baseado em role
const tituloContexto = computed(() => {
  if (authStore.isAdmin) {
    return {
      titulo: 'Gestão de Pedidos - Visão Global',
      subtitulo: 'Todas as unidades de atendimento'
    }
  } else {
    return {
      titulo: 'Gestão de Pedidos - Balcão',
      subtitulo: `${unidadesFiltradas.value.length} unidades abertas`
    }
  }
})

// Computed
const unidadesFiltradas = computed(() => {
  if (!busca.value) return unidadesConsumo.value
  return unidadesConsumo.value.filter(u => 
    u.referencia?.toLowerCase().includes(busca.value.toLowerCase())
  )
})

// Funções de carregamento
const carregarUnidades = async () => {
  loading.value = true
  try {
    let response
    try {
      response = await unidadesConsumoService.getMinhas()
    } catch (error) {
      if (error.response?.status === 400) {
        console.warn('[PedidosBalcao] Fallback para endpoint /status/OCUPADA')
        response = await unidadesConsumoService.getAbertas()
      } else {
        throw error
      }
    }
    
    const unidades = response.data || []
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
    const produtos = response.data || []
    produtosDisponiveis.value = produtos.filter(p => p.ativo === true)
    console.log('[PedidosBalcao] Produtos ativos carregados:', produtosDisponiveis.value.length)
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao carregar produtos:', error)
    notificationStore.erro('Erro ao carregar produtos')
    produtosDisponiveis.value = []
  } finally {
    loadingProdutos.value = false
  }
}

const carregarPedidoAtivo = async (unidadeId) => {
  try {
    console.log('[PedidosBalcao] Carregando pedido ativo da unidade:', unidadeId)
    const response = await pedidosBalcaoService.getPedidoAtivoUnidade(unidadeId)
    pedidoAtivo.value = response.data
    console.log('[PedidosBalcao] Pedido ativo carregado:', pedidoAtivo.value)
    
    // Inscrever no WebSocket do pedido
    if (pedidoAtivo.value?.id) {
      cleanupPedidoWS = inscreverPedido(pedidoAtivo.value.id)
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('[PedidosBalcao] Nenhum pedido ativo encontrado')
      pedidoAtivo.value = null
    } else {
      console.error('[PedidosBalcao] Erro ao carregar pedido ativo:', error)
      throw error
    }
  }
}

const recarregarPedido = async () => {
  if (!unidadeSelecionada.value?.id) return
  
  try {
    await carregarPedidoAtivo(unidadeSelecionada.value.id)
    
    // Recarregar também a unidade para atualizar saldo
    const response = await unidadesConsumoService.getById(unidadeSelecionada.value.id)
    const unidadeAtualizada = response.data
    const resumo = unidadesConsumoService.calcularResumo(unidadeAtualizada)
    unidadeSelecionada.value = { ...unidadeAtualizada, ...resumo }
    
    // Atualizar na lista também
    const index = unidadesConsumo.value.findIndex(u => u.id === unidadeSelecionada.value.id)
    if (index !== -1) {
      unidadesConsumo.value[index] = unidadeSelecionada.value
    }
  } catch (error) {
    console.error('[PedidosBalcao] Erro ao recarregar pedido:', error)
  }
}

// Ações de navegação
const selecionarUnidade = async (unidade) => {
  unidadeSelecionada.value = unidade
  
  // Carregar pedido ativo
  await carregarPedidoAtivo(unidade.id)
  
  // Inscrever no tópico da unidade
  cleanupUnidadeWS = inscreverUnidade(unidade.id)
  
  // Carregar produtos se ainda não carregou
  if (produtosDisponiveis.value.length === 0) {
    await carregarProdutos()
  }
}

const voltarListaUnidades = () => {
  // Cleanup WebSocket subscriptions
  if (cleanupPedidoWS) {
    cleanupPedidoWS()
    cleanupPedidoWS = null
  }
  if (cleanupUnidadeWS) {
    cleanupUnidadeWS()
    cleanupUnidadeWS = null
  }
  
  unidadeSelecionada.value = null
  pedidoAtivo.value = null
  
  // Recarregar lista de unidades
  carregarUnidades()
}

// Modals
const abrirModalNovoPedido = () => {
  mostrarModalNovoPedido.value = true
}

const fecharModalNovoPedido = () => {
  mostrarModalNovoPedido.value = false
}

const handlePedidoCriado = (pedidoCriado) => {
  console.log('[PedidosBalcao] Pedido criado:', pedidoCriado)
  notificationStore.sucesso(`Pedido ${pedidoCriado.numero || pedidoCriado.id} criado com sucesso`)
  fecharModalNovoPedido()
  recarregarPedido()Abrindo modal para criar fundo para cliente:', cliente)
  clienteSelecionadoFundo.value = cliente
  mostrarModalCriarFundo.value = true
}

const fecharModalCriarFundo = () => {
  mostrarModalCriarFundo.value = false
  clienteSelecionadoFundo.value = null
}

const handleFundoCriado = async (fundo) => {
  console.log('[PedidosBalcao] Fundo criado:', fundo)
  notificationStore.sucesso('Fundo criado com sucesso!')
  fecharModalCriarFundo()
  
  // Recarregar unidade selecionada para atualizar dados do fundo
  if (unidadeSelecionada.value) {
    await selecionarUnidade(unidadeSelecionada.value.id)
  }
}

const handleRecarregarFundo = (fundo) => {
  console.log('[PedidosBalcao] Abrindo modal para recarregar fundo:', fundo)
  fundoSelecionado.value = fundo
  mostrarModalRecarregar.value = true
}

const fecharModalRecarregar = () => {
  mostrarModalRecarregar.value = false
  fundoSelecionado.value = null
}

const handleRecargaCriada = async (pagamento) => {
  console.log('[PedidosBalcao] Pagamento criado:', pagamento)
  
  // Não fecha o modal automaticamente - usuário pode precisar ver informações de pagamento
  // Modal será fechado quando usuário clicar em "Fechar"
  
  // Recarregar unidade selecionada para atualizar saldo (quando pagamento for confirmado)
  if (unidadeSelecionada.value) {
    setTimeout(async () => {
      await selecionarUnidade(unidadeSelecionada.value.id)
    }, 2000)
  }
const handleRecarregarFundo = (fundo) => {
  console.log('[PedidosBalcao] Solicita recarga de fundo:', fundo)
  notificationStore.info('Funcionalidade de recarga em desenvolvimento. Acesse o módulo Fundos de Consumo.')
  // TODO: Implementar modal de recarga ou redirecionar para módulo de fundos
}

const abrirModalAdicionarProdutos = () => {
  mostrarModalAdicionarProdutos.value = true
}

const fecharModalAdicionarProdutos = () => {
  mostrarModalAdicionarProdutos.value = false
}

const handleProdutosAdicionados = () => {
  notificationStore.sucesso('Produtos adicionados ao pedido')
  fecharModalAdicionarProdutos()
  recarregarPedido()
}

const abrirModalHistorico = () => {
  mostrarModalHistorico.value = true
}

const fecharModalHistorico = () => {
  mostrarModalHistorico.value = false
}

// Helpers
const iconeTipoUnidade = (tipo) => {
  const icones = {
    MESA_FISICA: '🪑',
    QUARTO: '🛏️',
    CAMARIM: '🎭',
    BARRACA_EVENTO: '🎪',
    STAND_FEIRA: '🏢',
    ESPACO_COWORKING: '💼'
  }
  return icones[tipo] || '📍'
}

const labelStatusUnidade = (status) => {
  const labels = {
    DISPONIVEL: 'Disponível',
    OCUPADA: 'Ocupada',
    AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
    FINALIZADA: 'Finalizada'
  }
  return labels[status] || status
}

// Lifecycle
onMounted(async () => {
  console.log('[PedidosBalcao] Componente montado')
  await carregarUnidades()
})

onUnmounted(() => {
  // Cleanup WebSocket subscriptions
  if (cleanupPedidoWS) cleanupPedidoWS()
  if (cleanupUnidadeWS) cleanupUnidadeWS()
})
</script>

<style scoped>
.pedidos-balcao-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.pedidos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.pedidos-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.text-muted {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ws-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ws-badge.conectado {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.ws-badge.reconectando {
  background-color: #fff3e0;
  color: #f57c00;
}

.ws-badge.desconectado {
  background-color: #ffebee;
  color: #c62828;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  max-width: 500px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
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

.unidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.unidade-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.unidade-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.unidade-card.status-OCUPADA {
  border-color: #4caf50;
}

.unidade-card.status-AGUARDANDO_PAGAMENTO {
  border-color: #ff9800;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.icone-tipo {
  font-size: 24px;
}

.card-header h3 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  color: #333;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-DISPONIVEL {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-OCUPADA {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.badge-AGUARDANDO_PAGAMENTO {
  background-color: #fff3e0;
  color: #f57c00;
}

.badge-FINALIZADA {
  background-color: #f3f3f3;
  color: #757575;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.card-info .label {
  color: #666;
  font-weight: 500;
}

.card-info .value {
  color: #333;
  font-weight: 600;
}

.text-danger {
  color: #d32f2f !important;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
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

.unidade-selecionada {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
