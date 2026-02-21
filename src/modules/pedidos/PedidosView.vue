<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useWebSocketStore } from '@/store/websocket'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import { useAudioNotification } from '@/utils/audio'
import pedidosService from '@/services/pedidos'
import subpedidosService from '@/services/subpedidos'

const { formatCurrency } = useCurrency()
const wsStore = useWebSocketStore()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const audio = useAudioNotification()

// Estado local
const pedidos = ref([])
const subpedidos = ref([])
const loading = ref(false)
const filtroStatus = ref('TODOS')
const buscaTexto = ref('')
const pedidoSelecionado = ref(null)
const mostrarDetalhes = ref(false)
const mostrarCancelarModal = ref(false)
const itemCancelar = ref(null)
const motivoCancelamento = ref('')

// Detectar perfil do usuário
const perfilUsuario = computed(() => {
  const role = authStore.user?.role
  if (role === 'CLIENTE') return 'CLIENTE'
  if (role === 'ATENDENTE') return 'ATENDENTE'
  if (role === 'COZINHA') return 'COZINHA'
  if (role === 'Administrador' || role === 'GERENTE') return 'GERENTE'
  return 'ATENDENTE' // padrão
})

const isGerente = computed(() => perfilUsuario.value === 'GERENTE')
const isCozinha = computed(() => perfilUsuario.value === 'COZINHA')
const isAtendente = computed(() => perfilUsuario.value === 'ATENDENTE')
const isCliente = computed(() => perfilUsuario.value === 'CLIENTE')

// Mapeamento de status do PEDIDO
const statusPedidoConfig = {
  CRIADO: { label: 'Criado', cor: '#2196F3', icon: '📝' },
  EM_ANDAMENTO: { label: 'Em Andamento', cor: '#FF9800', icon: '⏳' },
  FINALIZADO: { label: 'Finalizado', cor: '#4CAF50', icon: '✅' },
  CANCELADO: { label: 'Cancelado', cor: '#9E9E9E', icon: '❌' }
}

// Mapeamento de status do SUBPEDIDO
const statusSubPedidoConfig = {
  CRIADO: { label: 'Criado', cor: '#2196F3', icon: '📝' },
  PENDENTE: { label: 'Pendente', cor: '#FFC107', icon: '⏰' },
  EM_PREPARACAO: { label: 'Em Preparação', cor: '#FF9800', icon: '👨‍🍳' },
  PRONTO: { label: 'Pronto', cor: '#8BC34A', icon: '✅' },
  ENTREGUE: { label: 'Entregue', cor: '#4CAF50', icon: '🎉' },
  CANCELADO: { label: 'Cancelado', cor: '#9E9E9E', icon: '❌' }
}

// SubPedidos organizados por status (para kanban da cozinha)
const subpedidosPendentes = computed(() => 
  subpedidos.value.filter(sp => sp.status === 'PENDENTE')
)
const subpedidosEmPreparacao = computed(() => 
  subpedidos.value.filter(sp => sp.status === 'EM_PREPARACAO')
)
const subpedidosProntos = computed(() => 
  subpedidos.value.filter(sp => sp.status === 'PRONTO')
)

// SubPedidos prontos para atendente
const subpedidosProntosParaEntrega = computed(() => {
  if (!isAtendente.value && !isGerente.value) return []
  return subpedidos.value.filter(sp => sp.status === 'PRONTO')
})

// Carregar dados conforme perfil
const carregarDados = async () => {
  console.log('[PedidosView] Carregando dados. Perfil:', perfilUsuario.value)
  
  try {
    loading.value = true
    
    if (isCozinha.value) {
      // Cozinha: carregar subpedidos da sua cozinha
      const cozinhaId = authStore.user?.cozinhaId || 1
      console.log('[PedidosView] Carregando subpedidos da cozinha:', cozinhaId)
      const response = await subpedidosService.getAtivosByCozinha(cozinhaId)
      subpedidos.value = response.data || []
      console.log('[PedidosView] SubPedidos carregados:', subpedidos.value.length)
    } else if (isAtendente.value || isGerente.value) {
      // Atendente/Gerente: carregar pedidos ativos
      console.log('[PedidosView] Carregando pedidos ativos...')
      const response = await pedidosService.getAtivos()
      pedidos.value = response.data || []
      console.log('[PedidosView] Pedidos carregados:', pedidos.value.length)
      
      // Buscar todos os subpedidos dos pedidos ativos
      const allSubpedidos = []
      for (const pedido of pedidos.value) {
        try {
          const spResponse = await subpedidosService.getByPedido(pedido.id)
          allSubpedidos.push(...(spResponse.data || []))
        } catch (err) {
          console.warn('[PedidosView] Erro ao carregar subpedidos do pedido:', pedido.id, err)
        }
      }
      subpedidos.value = allSubpedidos
      console.log('[PedidosView] SubPedidos carregados:', subpedidos.value.length)
    } else if (isCliente.value) {
      // Cliente: carregar seus pedidos
      console.log('[PedidosView] Carregando pedidos do cliente...')
      const response = await pedidosService.getAtivos()
      pedidos.value = response.data || []
      console.log('[PedidosView] Pedidos do cliente carregados:', pedidos.value.length)
    }
  } catch (error) {
    console.error('[PedidosView] Erro ao carregar dados:', error)
    const mensagem = error.response?.data?.message || error.message || 'Erro ao carregar dados'
    notificationStore.erro(mensagem)
    
    // Se endpoint não existe, usar dados vazios para não bloquear a UI
    if (error.response?.status === 404 || error.response?.status === 405) {
      console.warn('[PedidosView] Endpoint não disponível. Sistema funcionando com dados vazios.')
      pedidos.value = []
      subpedidos.value = []
    }
  } finally {
    loading.value = false
  }
}

// Ver detalhes do pedido
const verDetalhes = async (pedido) => {
  try {
    const response = await pedidosService.getById(pedido.id)
    pedidoSelecionado.value = response.data
    
    // Carregar subpedidos do pedido
    const spResponse = await subpedidosService.getByPedido(pedido.id)
    pedidoSelecionado.value.subpedidos = spResponse.data || []
    
    mostrarDetalhes.value = true
  } catch (error) {
    console.error('[PedidosView] Erro ao carregar detalhes:', error)
    notificationStore.erro('Erro ao carregar detalhes do pedido')
  }
}

const fecharDetalhes = () => {
  mostrarDetalhes.value = false
  pedidoSelecionado.value = null
}

// Ações de SubPedido - COZINHA
const assumirSubPedido = async (subPedidoId) => {
  try {
    await subpedidosService.assumir(subPedidoId)
    notificationStore.sucesso('SubPedido assumido com sucesso')
    audio.tocar('sucesso')
    await carregarDados()
  } catch (error) {
    console.error('[PedidosView] Erro ao assumir SubPedido:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao assumir SubPedido')
  }
}

const marcarPronto = async (subPedidoId) => {
  try {
    await subpedidosService.marcarPronto(subPedidoId)
    notificationStore.sucesso('SubPedido marcado como pronto')
    audio.tocar('pedido-pronto')
    await carregarDados()
  } catch (error) {
    console.error('[PedidosView] Erro ao marcar SubPedido como pronto:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao marcar como pronto')
  }
}

// Ações de SubPedido - ATENDENTE
const marcarEntregue = async (subPedidoId) => {
  if (!confirm('Confirmar entrega deste SubPedido ao cliente?')) return
  
  try {
    await subpedidosService.marcarEntregue(subPedidoId)
    notificationStore.sucesso('SubPedido entregue com sucesso')
    audio.tocar('sucesso')
    await carregarDados()
  } catch (error) {
    console.error('[PedidosView] Erro ao marcar SubPedido como entregue:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao marcar como entregue')
  }
}

// Cancelamento - GERENTE
const abrirModalCancelar = (item, tipo) => {
  itemCancelar.value = { ...item, tipo } // tipo: 'pedido' ou 'subpedido'
  motivoCancelamento.value = ''
  mostrarCancelarModal.value = true
}

const fecharModalCancelar = () => {
  mostrarCancelarModal.value = false
  itemCancelar.value = null
  motivoCancelamento.value = ''
}

const confirmarCancelamento = async () => {
  if (!motivoCancelamento.value || motivoCancelamento.value.length < 5) {
    notificationStore.erro('Motivo deve ter no mínimo 5 caracteres')
    return
  }
  
  try {
    if (itemCancelar.value.tipo === 'pedido') {
      await pedidosService.cancelar(itemCancelar.value.id, motivoCancelamento.value)
      notificationStore.sucesso('Pedido cancelado com sucesso')
    } else {
      await subpedidosService.cancelar(itemCancelar.value.id, motivoCancelamento.value)
      notificationStore.sucesso('SubPedido cancelado com sucesso')
    }
    
    fecharModalCancelar()
    await carregarDados()
  } catch (error) {
    console.error('[PedidosView] Erro ao cancelar:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao cancelar')
  }
}

// Calcular tempo decorrido
const calcularTempoDecorrido = (dataInicio) => {
  if (!dataInicio) return '-'
  const inicio = new Date(dataInicio)
  const agora = new Date()
  const diffMs = agora - inicio
  const diffMinutos = Math.floor(diffMs / 60000)
  
  if (diffMinutos < 60) {
    return `${diffMinutos} min`
  }
  const horas = Math.floor(diffMinutos / 60)
  const minutos = diffMinutos % 60
  return `${horas}h ${minutos}m`
}

// WebSocket - Subscrições
let wsSubscriptions = []

const setupWebSocket = () => {
  if (!wsStore.connected) {
    console.log('[PedidosView] WebSocket não conectado, aguardando...')
    return
  }
  
  // Limpar subscrições anteriores
  wsSubscriptions.forEach(unsub => unsub())
  wsSubscriptions = []
  
  if (isCozinha.value) {
    // Cozinha: subscrever em /topic/cozinha/{id}
    const cozinhaId = authStore.user?.cozinhaId || 1
    const unsub = wsStore.subscrever(`/topic/cozinha/${cozinhaId}`, handleNotificacaoWS)
    wsSubscriptions.push(unsub)
    console.log(`[PedidosView] Inscrito em: /topic/cozinha/${cozinhaId}`)
  } else if (isAtendente.value) {
    // Atendente: subscrever em /topic/atendente/unidade/{id}
    const unidadeId = authStore.user?.unidadeId || 1
    const unsub = wsStore.subscrever(`/topic/atendente/unidade/${unidadeId}`, handleNotificacaoWS)
    wsSubscriptions.push(unsub)
    console.log(`[PedidosView] Inscrito em: /topic/atendente/unidade/${unidadeId}`)
  } else if (isCliente.value && pedidoSelecionado.value) {
    // Cliente: subscrever no pedido específico
    const unsub = wsStore.subscrever(`/topic/pedido/${pedidoSelecionado.value.id}`, handleNotificacaoWS)
    wsSubscriptions.push(unsub)
    console.log(`[PedidosView] Inscrito em: /topic/pedido/${pedidoSelecionado.value.id}`)
  }
}

// Handler de notificações WebSocket
const handleNotificacaoWS = (notificacao) => {
  console.log('[PedidosView] Notificação WebSocket recebida:', notificacao)
  
  // Tocar som conforme tipo de ação
  if (notificacao.tipoAcao === 'MUDANCA_STATUS') {
    if (notificacao.statusNovo === 'PENDENTE' && isCozinha.value) {
      audio.tocar('novo-pedido')
      notificationStore.info(`Novo SubPedido: ${notificacao.numeroPedido}`)
    } else if (notificacao.statusNovo === 'PRONTO' && isAtendente.value) {
      audio.tocar('pedido-pronto')
      notificationStore.info(`SubPedido pronto: ${notificacao.numeroPedido}`)
    }
  }
  
  // Recarregar dados
  carregarDados()
}

// Watch para reconectar WebSocket
watch(() => wsStore.connected, (connected) => {
  if (connected) {
    setupWebSocket()
  }
})

// Lifecycle
onMounted(() => {
  console.log('[PedidosView] Componente montado. Perfil:', perfilUsuario.value)
  carregarDados()
  setupWebSocket()
})

onUnmounted(() => {
  // Limpar subscrições WebSocket
  wsSubscriptions.forEach(unsub => unsub())
  wsSubscriptions = []
})
</script>

<template>
  <div class="pedidos-view">
    <!-- Header -->
    <div class="header">
      <h1>Pedidos</h1>
      <span class="badge" :class="`badge-${perfilUsuario.toLowerCase()}`">
        {{ perfilUsuario }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Carregando...</div>

    <!-- PAINEL DA COZINHA (Kanban) -->
    <div v-else-if="isCozinha" class="kanban-container">
      <div class="kanban-column">
        <div class="column-header pendente">
          <span class="icon">⏰</span>
          <h3>Pendentes</h3>
          <span class="badge-count">{{ subpedidosPendentes.length }}</span>
        </div>
        <div class="cards-container">
          <div
            v-for="sp in subpedidosPendentes"
            :key="sp.id"
            class="subpedido-card"
          >
            <div class="card-header">
              <strong>{{ sp.numeroPedido }}</strong>
              <span class="tempo-decorrido">{{ calcularTempoDecorrido(sp.recebidoEm) }}</span>
            </div>
            <div class="card-mesa">{{ sp.nomeUnidadeAtendimento }}</div>
            <div class="card-itens">
              <div v-for="item in sp.itens" :key="item.id" class="item">
                {{ item.quantidade }}x {{ item.produtoNome }}
                <span v-if="item.observacoes" class="obs">⚠️ {{ item.observacoes }}</span>
              </div>
            </div>
            <button @click="assumirSubPedido(sp.id)" class="btn-action btn-primary">
              Assumir Pedido
            </button>
          </div>
          <div v-if="subpedidosPendentes.length === 0" class="empty-state">
            Nenhum pedido pendente
          </div>
        </div>
      </div>

      <div class="kanban-column">
        <div class="column-header preparacao">
          <span class="icon">👨‍🍳</span>
          <h3>Em Preparação</h3>
          <span class="badge-count">{{ subpedidosEmPreparacao.length }}</span>
        </div>
        <div class="cards-container">
          <div
            v-for="sp in subpedidosEmPreparacao"
            :key="sp.id"
            class="subpedido-card"
          >
            <div class="card-header">
              <strong>{{ sp.numeroPedido }}</strong>
              <span class="tempo-decorrido">{{ calcularTempoDecorrido(sp.iniciadoEm) }}</span>
            </div>
            <div class="card-mesa">{{ sp.nomeUnidadeAtendimento }}</div>
            <div class="card-itens">
              <div v-for="item in sp.itens" :key="item.id" class="item">
                {{ item.quantidade }}x {{ item.produtoNome }}
                <span v-if="item.observacoes" class="obs">⚠️ {{ item.observacoes }}</span>
              </div>
            </div>
            <button @click="marcarPronto(sp.id)" class="btn-action btn-success">
              Marcar Pronto
            </button>
          </div>
          <div v-if="subpedidosEmPreparacao.length === 0" class="empty-state">
            Nenhum pedido em preparo
          </div>
        </div>
      </div>

      <div class="kanban-column">
        <div class="column-header pronto">
          <span class="icon">✅</span>
          <h3>Prontos</h3>
          <span class="badge-count">{{ subpedidosProntos.length }}</span>
        </div>
        <div class="cards-container">
          <div
            v-for="sp in subpedidosProntos"
            :key="sp.id"
            class="subpedido-card"
          >
            <div class="card-header">
              <strong>{{ sp.numeroPedido }}</strong>
              <span class="tempo-decorrido">{{ calcularTempoDecorrido(sp.prontoEm) }}</span>
            </div>
            <div class="card-mesa">{{ sp.nomeUnidadeAtendimento }}</div>
            <div class="card-itens">
              <div v-for="item in sp.itens" :key="item.id" class="item">
                {{ item.quantidade }}x {{ item.produtoNome }}
              </div>
            </div>
            <div class="aguardando">Aguardando atendente...</div>
          </div>
          <div v-if="subpedidosProntos.length === 0" class="empty-state">
            Nenhum pedido pronto
          </div>
        </div>
      </div>
    </div>

    <!-- PAINEL DO ATENDENTE -->
    <div v-else-if="isAtendente" class="atendente-panel">
      <!-- Seção prioritária: SubPedidos prontos -->
      <div v-if="subpedidosProntosParaEntrega.length > 0" class="secao-prioritaria">
        <h2>🔔 SubPedidos Prontos para Entrega</h2>
        <div class="cards-grid">
          <div
            v-for="sp in subpedidosProntosParaEntrega"
            :key="sp.id"
            class="pronto-card"
          >
            <div class="card-header">
              <strong>{{ sp.numeroPedido }}</strong>
              <span class="cozinha">{{ sp.nomeCozinha }}</span>
            </div>
            <div class="card-mesa">{{ sp.nomeUnidadeAtendimento }}</div>
            <div class="card-itens">
              <div v-for="item in sp.itens" :key="item.id" class="item">
                {{ item.quantidade }}x {{ item.produtoNome }}
              </div>
            </div>
            <div class="tempo-info">
              Pronto há: {{ calcularTempoDecorrido(sp.prontoEm) }}
            </div>
            <button @click="marcarEntregue(sp.id)" class="btn-action btn-success">
              ✅ Confirmar Entrega
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de pedidos ativos -->
      <div class="secao-pedidos">
        <h2>Pedidos Ativos</h2>
        <div class="pedidos-lista">
          <div
            v-for="pedido in pedidos"
            :key="pedido.id"
            class="pedido-card"
            @click="verDetalhes(pedido)"
          >
            <div class="pedido-header">
              <strong class="numero">{{ pedido.numero }}</strong>
              <span
                class="status-badge"
                :style="{ backgroundColor: statusPedidoConfig[pedido.status]?.cor }"
              >
                {{ statusPedidoConfig[pedido.status]?.icon }} {{ statusPedidoConfig[pedido.status]?.label }}
              </span>
            </div>
            <div class="pedido-info">
              <span class="mesa">{{ pedido.referenciaUnidadeConsumo }}</span>
              <span class="total">{{ formatCurrency(pedido.total) }}</span>
            </div>
            <div class="pedido-tempo">
              Há {{ calcularTempoDecorrido(pedido.createdAt) }}
            </div>
          </div>
          <div v-if="pedidos.length === 0" class="empty-state">
            Nenhum pedido ativo no momento
          </div>
        </div>
      </div>
    </div>

    <!-- PAINEL DO CLIENTE -->
    <div v-else-if="isCliente" class="cliente-panel">
      <div class="pedidos-lista">
        <div
          v-for="pedido in pedidos"
          :key="pedido.id"
          class="pedido-card-cliente"
          @click="verDetalhes(pedido)"
        >
          <div class="numero-grande">{{ pedido.numero }}</div>
          <div
            class="status-badge-grande"
            :style="{ backgroundColor: statusPedidoConfig[pedido.status]?.cor }"
          >
            {{ statusPedidoConfig[pedido.status]?.icon }} {{ statusPedidoConfig[pedido.status]?.label }}
          </div>
          <div class="total-grande">{{ formatCurrency(pedido.total) }}</div>
          <button class="btn-acompanhar">Ver Acompanhamento</button>
        </div>
        <div v-if="pedidos.length === 0" class="empty-state">
          Você não tem pedidos ativos
        </div>
      </div>
    </div>

    <!-- PAINEL DO GERENTE -->
    <div v-else-if="isGerente" class="gerente-panel">
      <div class="kpis">
        <div class="kpi-card">
          <div class="kpi-valor">{{ pedidos.length }}</div>
          <div class="kpi-label">Pedidos Ativos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-valor">{{ subpedidosProntosParaEntrega.length }}</div>
          <div class="kpi-label">Prontos para Entrega</div>
        </div>
      </div>

      <div class="pedidos-lista">
        <div
          v-for="pedido in pedidos"
          :key="pedido.id"
          class="pedido-card-gerente"
        >
          <div class="pedido-header">
            <strong class="numero">{{ pedido.numero }}</strong>
            <span
              class="status-badge"
              :style="{ backgroundColor: statusPedidoConfig[pedido.status]?.cor }"
            >
              {{ statusPedidoConfig[pedido.status]?.label }}
            </span>
          </div>
          <div class="pedido-info">
            <span class="mesa">{{ pedido.referenciaUnidadeConsumo }}</span>
            <span class="total">{{ formatCurrency(pedido.total) }}</span>
          </div>
          <div class="acoes">
            <button @click="verDetalhes(pedido)" class="btn-action btn-info">
              Ver Detalhes
            </button>
            <button
              v-if="pedido.status !== 'CANCELADO' && pedido.status !== 'FINALIZADO'"
              @click="abrirModalCancelar(pedido, 'pedido')"
              class="btn-action btn-danger"
            >
              Cancelar
            </button>
          </div>
        </div>
        <div v-if="pedidos.length === 0" class="empty-state">
          Nenhum pedido ativo
        </div>
      </div>
    </div>

    <!-- Modal de Detalhes -->
    <div v-if="mostrarDetalhes" class="modal-overlay" @click.self="fecharDetalhes">
      <div class="modal-content modal-detalhes">
        <div class="modal-header">
          <h2>Detalhes do Pedido {{ pedidoSelecionado.numero }}</h2>
          <button @click="fecharDetalhes" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="info-geral">
            <div class="info-item">
              <strong>Status:</strong>
              <span
                class="status-badge"
                :style="{ backgroundColor: statusPedidoConfig[pedidoSelecionado.status]?.cor }"
              >
                {{ statusPedidoConfig[pedidoSelecionado.status]?.label }}
              </span>
            </div>
            <div class="info-item">
              <strong>Unidade:</strong> {{ pedidoSelecionado.referenciaUnidadeConsumo }}
            </div>
            <div class="info-item">
              <strong>Total:</strong> {{ formatCurrency(pedidoSelecionado.total) }}
            </div>
            <div class="info-item">
              <strong>Criado:</strong> {{ new Date(pedidoSelecionado.createdAt).toLocaleString('pt-BR') }}
            </div>
          </div>

          <!-- Timeline de SubPedidos -->
          <div class="timeline-subpedidos">
            <h3>Progresso</h3>
            <div
              v-for="sp in pedidoSelecionado.subpedidos"
              :key="sp.id"
              class="timeline-item"
            >
              <div class="timeline-icon"
                :style="{ backgroundColor: statusSubPedidoConfig[sp.status]?.cor }"
              >
                {{ statusSubPedidoConfig[sp.status]?.icon }}
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong>{{ sp.nomeCozinha }}</strong>
                  <span class="status-badge">{{ statusSubPedidoConfig[sp.status]?.label }}</span>
                </div>
                <div class="timeline-itens">
                  <div v-for="item in sp.itens" :key="item.id">
                    {{ item.quantidade }}x {{ item.produtoNome }}
                  </div>
                </div>
                <div v-if="sp.observacoes" class="timeline-obs">
                  {{ sp.observacoes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Cancelamento -->
    <div v-if="mostrarCancelarModal" class="modal-overlay" @click.self="fecharModalCancelar">
      <div class="modal-content modal-cancelar">
        <div class="modal-header">
          <h2>Cancelar {{ itemCancelar.tipo === 'pedido' ? 'Pedido' : 'SubPedido' }}</h2>
          <button @click="fecharModalCancelar" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="aviso">
            <strong>Atenção:</strong>
            {{ itemCancelar.tipo === 'pedido' ? 'TODOS os SubPedidos serão cancelados.' : 'Esta ação não pode ser desfeita.' }}
          </p>
          <label>Motivo do cancelamento (mínimo 5 caracteres):</label>
          <textarea
            v-model="motivoCancelamento"
            rows="4"
            placeholder="Digite o motivo do cancelamento..."
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="fecharModalCancelar" class="btn-action">Voltar</button>
          <button @click="confirmarCancelamento" class="btn-action btn-danger">
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pedidos-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.badge-cozinha { background: #FF9800; color: white; }
.badge-atendente { background: #2196F3; color: white; }
.badge-cliente { background: #4CAF50; color: white; }
.badge-gerente { background: #9C27B0; color: white; }

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

/* Kanban da Cozinha */
.kanban-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.kanban-column {
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 400px;
}

.column-header {
  padding: 16px;
  color: white;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-header.pendente { background: #FFC107; }
.column-header.preparacao { background: #FF9800; }
.column-header.pronto { background: #8BC34A; }

.column-header .icon {
  font-size: 24px;
}

.column-header h3 {
  flex: 1;
  margin: 0;
  font-size: 18px;
}

.badge-count {
  background: rgba(255,255,255,0.3);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
}

.cards-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subpedido-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.subpedido-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header strong {
  font-size: 16px;
  color: #333;
}

.tempo-decorrido {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-mesa {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.card-itens {
  margin-bottom: 12px;
}

.card-itens .item {
  font-size: 14px;
  padding: 4px 0;
  color: #444;
}

.card-itens .obs {
  display: block;
  font-size: 12px;
  color: #FF5722;
  margin-top: 2px;
  padding: 4px 8px;
  background: #FFF3E0;
  border-radius: 4px;
}

.btn-action {
  width: 100%;
  padding: 10px;
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

.btn-success {
  background: #4CAF50;
  color: white;
}

.btn-success:hover {
  background: #45a049;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #da190b;
}

.btn-info {
  background: #2196F3;
  color: white;
}

.aguardando {
  text-align: center;
  font-size: 13px;
  color: #888;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

/* Painel do Atendente */
.atendente-panel {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.secao-prioritaria {
  background: #E8F5E9;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4CAF50;
}

.secao-prioritaria h2 {
  margin: 0 0 20px 0;
  color: #2E7D32;
  font-size: 20px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.pronto-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.cozinha {
  font-size: 12px;
  background: #E3F2FD;
  color: #1976D2;
  padding: 4px 8px;
  border-radius: 4px;
}

.tempo-info {
  font-size: 13px;
  color: #666;
  margin: 8px 0;
  padding: 8px;
  background: #FFF9C4;
  border-radius: 4px;
  text-align: center;
}

.secao-pedidos h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.pedidos-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pedido-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.pedido-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.numero {
  font-size: 18px;
  color: #333;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  color: white;
  font-weight: 600;
}

.pedido-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mesa {
  font-size: 14px;
  color: #666;
}

.total {
  font-size: 16px;
  font-weight: 600;
  color: #4CAF50;
}

.pedido-tempo {
  font-size: 13px;
  color: #999;
}

/* Painel do Cliente */
.cliente-panel {
  max-width: 800px;
  margin: 0 auto;
}

.pedido-card-cliente {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.pedido-card-cliente:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.numero-grande {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.status-badge-grande {
  display: inline-block;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 16px;
  color: white;
  font-weight: 600;
  margin-bottom: 16px;
}

.total-grande {
  font-size: 28px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 20px;
}

.btn-acompanhar {
  background: #2196F3;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-acompanhar:hover {
  background: #1976D2;
}

/* Painel do Gerente */
.gerente-panel {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.kpi-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.kpi-valor {
  font-size: 36px;
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 14px;
  color: #666;
}

.pedido-card-gerente {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.acoes {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.acoes .btn-action {
  width: auto;
  flex: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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

.info-geral {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item strong {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.timeline-subpedidos h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.timeline-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.timeline-itens {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.timeline-obs {
  font-size: 13px;
  color: #FF5722;
  background: #FFF3E0;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.modal-cancelar .aviso {
  background: #FFF3E0;
  border-left: 4px solid #FF9800;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 4px;
}

.modal-cancelar label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.modal-cancelar textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.modal-footer .btn-action {
  flex: 1;
}

/* Responsive */
@media (max-width: 1024px) {
  .kanban-container {
    grid-template-columns: 1fr;
  }
  
  .info-geral {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .pedidos-view {
    padding: 12px;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
