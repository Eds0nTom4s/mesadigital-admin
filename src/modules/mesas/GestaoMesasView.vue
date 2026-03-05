<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Mesas</h2>
        <p class="text-text-secondary mt-1">
          <span v-if="authStore.isAdmin">Visão global - Todas as unidades de atendimento</span>
          <span v-else>{{ estatisticas.total }} mesas • {{ estatisticas.ocupadas }} ocupadas</span>
        </p>
      </div>
      <button @click="abrirModalNova" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nova Mesa
      </button>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Mesas Ocupadas</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.ocupadas }}</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Mesas Disponíveis</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.disponiveis }}</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Aguardando Pagamento</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.aguardandoPagamento }}</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Taxa de Ocupação</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.taxaOcupacao }}%</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Filtros de Status e Tipo -->
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="statusFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Status</option>
            <option value="DISPONIVEL">Disponíveis</option>
            <option value="OCUPADA">Ocupadas</option>
          </select>
          
          <select v-model="tipoFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Tipos</option>
            <option value="MESA_FISICA">Mesa Física</option>
            <option value="QUARTO">Quarto</option>
            <option value="AREA_EVENTO">Área de Evento</option>
            <option value="ESPACO_LOUNGE">Espaço Lounge</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
        
        <!-- Busca -->
        <div class="flex items-center space-x-2">
          <input 
            v-model="busca" 
            type="text" 
            placeholder="Buscar mesa ou cliente..." 
            class="input-field w-full md:w-64"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="bg-gray-200 rounded-lg h-48"></div>
      </div>
    </div>

    <!-- Grid de Mesas -->
    <div v-else-if="mesasFiltradas.length > 0" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <CardMesa 
        v-for="mesa in mesasFiltradas" 
        :key="mesa.id"
        :mesa="mesa"
        :sessao-ativa="mesa.sessaoAtiva"
        @click="abrirDetalhesMesa(mesa)"
      />
    </div>

    <!-- Nenhum resultado -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      <h3 class="text-xl font-semibold text-text-primary mb-2">Nenhuma mesa encontrada</h3>
      <p class="text-text-secondary">Ajuste os filtros ou crie uma nova mesa</p>
    </div>

    <!-- Modal: Nova Mesa -->
    <ModalNovaMesa
      :show="modalNovaAberto"
      @close="modalNovaAberto = false"
      @mesa-criada="handleMesaCriada"
    />

    <!-- Modal: Detalhes da Mesa -->
    <ModalDetalhesMesa
      :is-open="modalDetalhesAberto"
      :mesa="mesaSelecionada || {}"
      :sessao="sessaoAtiva"
      :fundo="fundoSelecionado"
      :qr-code="qrCodeSelecionado"
      @close="fecharDetalhesMesa"
      @fechar-mesa="fecharMesa"
      @aguardar-pagamento="aguardarPagamento"
      @novo-pedido="novoPedido"
      @imprimir-conta="imprimirConta"
      @recarregar="recarregarFundo"
      @atualizar-qr-code="atualizarQrCode"
    />

    <!-- Modal: Abrir Sessão -->
    <ModalAbrirSessao
      :show="modalSessaoAberto"
      :mesa="mesaSelecionada"
      @close="fecharModalSessao"
      @sessao-aberta="handleSessaoAberta"
    />

    <!-- Modal: Novo Pedido -->
    <ModalNovoPedido
      v-if="modalNovoPedidoAberto"
      :is-open="modalNovoPedidoAberto"
      :unidade="unidadeParaPedido"
      @close="fecharModalNovoPedido"
      @pedido-criado="pedidoCriado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import mesasService from '@/services/mesasService'
import sessoesConsumoService from '@/services/sessoesConsumoService'
import fundoConsumoService from '@/services/fundoConsumoService'
import qrcodeService from '@/services/qrcodeService'
import CardMesa from '@/components/shared/CardMesa.vue'
import ModalDetalhesMesa from '@/components/mesas/ModalDetalhesMesa.vue'
import ModalNovoPedido from '@/components/pedidos/ModalNovoPedido.vue'
import ModalNovaMesa from './components/ModalNovaMesa.vue'
import ModalAbrirSessao from './components/ModalAbrirSessao.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const mesas = ref([])
const loading = ref(false)
const statusFiltro = ref('TODOS')
const tipoFiltro = ref('TODOS')
const busca = ref('')

// ── Modal Nova Mesa ────────────────────────────────────────────────────────
const modalNovaAberto = ref(false)

// ── Modal Abrir Sessão ─────────────────────────────────────────────────────
const modalSessaoAberto = ref(false)

// ── Modal Detalhes ─────────────────────────────────────────────────────────
const modalDetalhesAberto = ref(false)
const mesaSelecionada = ref(null)
const sessaoAtiva = ref(null)
const fundoSelecionado = ref(null)
const qrCodeSelecionado = ref(null)

// ── Modal Novo Pedido ──────────────────────────────────────────────────────
const modalNovoPedidoAberto = ref(false)
const unidadeParaPedido = ref(null)

// ── Estatísticas ───────────────────────────────────────────────────────────
const estatisticas = computed(() => {
  const total = mesas.value.length
  const ocupadas = mesas.value.filter(m => m.status === 'OCUPADA').length
  const disponiveis = mesas.value.filter(m => m.status === 'DISPONIVEL').length
  // Aguardando pagamento = sessão com status AGUARDANDO_PAGAMENTO (sessão interna)
  const aguardandoPagamento = mesas.value.filter(m => m.sessaoAtiva?.status === 'AGUARDANDO_PAGAMENTO').length
  const taxaOcupacao = total > 0 ? Math.round((ocupadas / total) * 100) : 0

  return { total, ocupadas, disponiveis, aguardandoPagamento, taxaOcupacao }
})

// ── Mesas filtradas ────────────────────────────────────────────────────────
const mesasFiltradas = computed(() => {
  return mesas.value.filter(mesa => {
    if (statusFiltro.value !== 'TODOS' && mesa.status !== statusFiltro.value) return false
    if (tipoFiltro.value !== 'TODOS' && mesa.tipo !== tipoFiltro.value) return false

    if (busca.value) {
      const q = busca.value.toLowerCase()
      return (
        mesa.referencia?.toLowerCase().includes(q) ||
        mesa.sessaoAtiva?.nomeCliente?.toLowerCase().includes(q) ||
        mesa.numero?.toString().includes(q)
      )
    }
    return true
  })
})

// ── Carregar Mesas + Sessões ───────────────────────────────────────────────
const carregarMesas = async () => {
  try {
    loading.value = true

    const unidadeId = authStore.user?.unidadeAtendimentoId ?? null
    let rawMesas
    if (unidadeId) {
      rawMesas = await mesasService.getPorUnidadeAtendimento(unidadeId)
    } else {
      rawMesas = await mesasService.getTodas()
    }
    rawMesas = Array.isArray(rawMesas) ? rawMesas : rawMesas.data || []

    // Carregar sessões abertas para enriquecer os cards
    let sessoesMap = new Map()
    try {
      const sessoes = await sessoesConsumoService.getAbertas()
      const rawSessoes = Array.isArray(sessoes) ? sessoes : sessoes.data || []
      rawSessoes.forEach(s => sessoesMap.set(s.mesaId, s))
    } catch (err) {
      console.warn('[GestaoMesasView] Aviso ao carregar sessões:', err)
    }

    mesas.value = rawMesas.map(mesa => ({
      ...mesa,
      sessaoAtiva: sessoesMap.get(mesa.id) || null
    }))

    console.log('[GestaoMesasView] Mesas carregadas:', mesas.value.length)
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao carregar mesas:', error)
    notificationStore.erro('Erro ao carregar mesas: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// ── Modal Nova Mesa ────────────────────────────────────────────────────────
const abrirModalNova = () => { modalNovaAberto.value = true }

const handleMesaCriada = async () => { await carregarMesas() }

// ── Modal Abrir Sessão ─────────────────────────────────────────────────────
const abrirModalSessao = (mesa) => {
  mesaSelecionada.value = mesa
  modalSessaoAberto.value = true
}

const fecharModalSessao = () => { modalSessaoAberto.value = false }

const handleSessaoAberta = async () => {
  mesaSelecionada.value = null
  await carregarMesas()
}

// ── Abrir Detalhes da Mesa ─────────────────────────────────────────────────
const abrirDetalhesMesa = async (mesa) => {
  // Mesa DISPONÍVEL → fluxo de abrir sessão
  if (mesa.status === 'DISPONIVEL') {
    abrirModalSessao(mesa)
    return
  }

  // Mesa OCUPADA → mostrar detalhes + sessão ativa
  mesaSelecionada.value = mesa
  sessaoAtiva.value = mesa.sessaoAtiva || null
  modalDetalhesAberto.value = true

  try {
    // Buscar sessão completa (inclui pedidos, atendente, etc.)
    if (mesa.sessaoAtivaId || mesa.sessaoAtiva?.id) {
      const sessaoId = mesa.sessaoAtivaId || mesa.sessaoAtiva.id
      const sessaoCompleta = await sessoesConsumoService.getById(sessaoId)
      sessaoAtiva.value = sessaoCompleta.data || sessaoCompleta
    } else {
      const s = await sessoesConsumoService.getSessaoAtivaMesa(mesa.id)
      sessaoAtiva.value = s
    }

    // Buscar dados adicionais em paralelo
    const promises = []

    // Fundo do cliente (se sessão tem cliente vinculado)
    if (sessaoAtiva.value?.clienteId) {
      promises.push(
        fundoConsumoService.buscarFundoPorCliente(sessaoAtiva.value.clienteId)
          .then(fundo => { fundoSelecionado.value = fundo })
          .catch(() => { fundoSelecionado.value = null })
      )
    } else {
      fundoSelecionado.value = null
    }

    // QR Code da mesa
    promises.push(
      qrcodeService.buscarQrCodeMesa(mesa.id)
        .then(qrCodes => { qrCodeSelecionado.value = Array.isArray(qrCodes) && qrCodes.length > 0 ? qrCodes[0] : null })
        .catch(() => { qrCodeSelecionado.value = null })
    )

    await Promise.all(promises)
  } catch (err) {
    console.warn('[GestaoMesasView] Aviso ao buscar detalhes da sessão:', err)
  }
}

const fecharDetalhesMesa = () => {
  modalDetalhesAberto.value = false
  mesaSelecionada.value = null
  sessaoAtiva.value = null
  fundoSelecionado.value = null
  qrCodeSelecionado.value = null
}

// ── Aguardar Pagamento ─────────────────────────────────────────────────────
const aguardarPagamento = async (mesa) => {
  const sessaoId = sessaoAtiva.value?.id
  if (!sessaoId) {
    notificationStore.erro('Sessão não identificada')
    return
  }
  try {
    await sessoesConsumoService.aguardarPagamento(sessaoId)
    notificationStore.sucesso('Mesa a aguardar pagamento.')
    // Atualizar o estado da sessão localmente e recarregar o mapa
    if (sessaoAtiva.value) {
      sessaoAtiva.value = { ...sessaoAtiva.value, status: 'AGUARDANDO_PAGAMENTO' }
    }
    await carregarMesas()
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao marcar aguardar pagamento:', error)
    if (error.response?.status === 400) {
      notificationStore.erro('Esta sessão já foi encerrada ou não está no estado correcto.')
    } else {
      notificationStore.erro('Erro ao marcar pagamento: ' + (error.response?.data?.message || error.message))
    }
  }
}

// ── Fechar Mesa (encerrar sessão) ──────────────────────────────────────────
const fecharMesa = async (mesa) => {
  const sessaoId = sessaoAtiva.value?.id
  if (!sessaoId) {
    notificationStore.erro('Sessão não identificada')
    return
  }
  try {
    await sessoesConsumoService.fechar(sessaoId)
    notificationStore.sucesso('Sessão encerrada com sucesso!')
    fecharDetalhesMesa()
    await carregarMesas()
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao fechar sessão:', error)
    notificationStore.erro('Erro ao encerrar sessão: ' + (error.response?.data?.message || error.message))
  }
}

// ── Novo Pedido ────────────────────────────────────────────────────────────
const novoPedido = async (mesa) => {
  if (!mesa?.id) {
    notificationStore.erro('Mesa não identificada. Tente novamente.')
    return
  }

  const sessao = sessaoAtiva.value

  if (!sessao?.id) {
    notificationStore.erro('Não há sessão ativa nesta mesa. Abra uma sessão primeiro.')
    return
  }

  if (sessao.status === 'AGUARDANDO_PAGAMENTO') {
    notificationStore.erro('Não é possível adicionar pedidos. A conta já está em fecho.')
    return
  }

  if (sessao.status === 'ENCERRADA') {
    notificationStore.erro('Esta sessão já foi encerrada.')
    return
  }

  unidadeParaPedido.value = {
    id: mesa.id,
    referencia: mesa.referencia,
    tipo: mesa.tipo,
    sessaoConsumoId: sessao.id,         // ← campo-chave para o POST /pedidos
    cliente: sessao.clienteId ? {
      id: sessao.clienteId,
      nome: sessao.nomeCliente,
      telefone: sessao.telefoneCliente
    } : null,
    fundoConsumo: fundoSelecionado.value
  }

  console.log('[GestaoMesasView] Unidade para pedido:', unidadeParaPedido.value)
  modalNovoPedidoAberto.value = true
}

const fecharModalNovoPedido = () => {
  modalNovoPedidoAberto.value = false
  unidadeParaPedido.value = null
}

const pedidoCriado = async () => {
  fecharModalNovoPedido()
  fecharDetalhesMesa()
  await carregarMesas()
  notificationStore.sucesso('Pedido criado com sucesso!')
}

// ── Outros ────────────────────────────────────────────────────────────────
const imprimirConta = () => {
  notificationStore.info('Funcionalidade de impressão em desenvolvimento')
}

const recarregarFundo = (fundo) => {
  if (!fundo?.id) { notificationStore.erro('Fundo não encontrado'); return }
  router.push({ name: 'fundo-detalhe', params: { id: fundo.id } })
}

const atualizarQrCode = (novoQrCode) => {
  qrCodeSelecionado.value = novoQrCode
}

onMounted(() => { carregarMesas() })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  margin: 0 1rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
}

.btn-close {
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.btn-close:hover {
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  background-color: #ffffff;
}
</style>
