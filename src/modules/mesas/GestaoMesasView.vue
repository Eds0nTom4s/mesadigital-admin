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
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
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

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Ocupação Crítica</p>
            <p class="text-3xl font-bold text-error mt-2">{{ estatisticas.ocupacaoCritica }}</p>
          </div>
          <div class="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
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
            <option v-for="tipo in tiposMesa" :key="tipo.codigo" :value="tipo.codigo">
              {{ tipo.descricao }}
            </option>
          </select>

          <select v-model="ocupacaoFiltro" class="input-field w-56">
            <option value="TODAS">Qualquer duração</option>
            <option value="60">Abertas há mais de 1h</option>
            <option value="180">Abertas há mais de 3h</option>
            <option value="360">Abertas há mais de 6h</option>
            <option value="720">Abertas há mais de 12h</option>
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
      :tipos-mesa="tiposMesa"
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
      @liquidar-conta="liquidarConta"
      @novo-pedido="novoPedido"
      @gerar-fatura="abrirModalFatura"
      @recarregar="recarregarFundo"
      @atualizar-qr-code="atualizarQrCode"
      @atualizou-mesa="carregarMesas"
    />

    <ModalGerarFatura
      :show="modalFaturaAberto"
      :mesa="mesaSelecionada"
      :sessao="sessaoAtiva"
      :fundo="fundoSelecionado"
      @close="modalFaturaAberto = false"
      @imprimir="imprimirConta"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import mesasService from '@/api/mesasService'
import sessoesConsumoService from '@/api/sessoesConsumoService'
import fundoConsumoService from '@/api/fundoConsumoService'
import qrcodeService from '@/api/qrcodeService'
import pedidosBalcaoService from '@/api/pedidosBalcaoService'
import CardMesa from '@/components/shared/CardMesa.vue'
import ModalDetalhesMesa from '@/components/mesas/ModalDetalhesMesa.vue'
import ModalNovoPedido from '@/components/pedidos/ModalNovoPedido.vue'
import ModalGerarFatura from '@/components/mesas/ModalGerarFatura.vue'
import ModalNovaMesa from './components/ModalNovaMesa.vue'
import ModalAbrirSessao from './components/ModalAbrirSessao.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const mesas = ref([])
const tiposMesa = ref([])
const loading = ref(false)
const statusFiltro = ref('TODOS')
const tipoFiltro = ref('TODOS')
const ocupacaoFiltro = ref('TODAS')
const busca = ref('')
const agora = ref(Date.now())
let timerOcupacao = null

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
const modalFaturaAberto = ref(false)

// ── Modal Novo Pedido ──────────────────────────────────────────────────────
const modalNovoPedidoAberto = ref(false)
const unidadeParaPedido = ref(null)

// ── Estatísticas ───────────────────────────────────────────────────────────
const estatisticas = computed(() => {
  const total = mesas.value.length
  const ocupadas = mesas.value.filter(m => m.status === 'OCUPADA').length
  const disponiveis = mesas.value.filter(m => m.status === 'DISPONIVEL').length
  const ocupacaoCritica = mesas.value.filter(m => minutosOcupacaoMesa(m) >= 180).length
  // Aguardando pagamento = sessão com status AGUARDANDO_PAGAMENTO (sessão interna)
  const aguardandoPagamento = mesas.value.filter(m => m.sessaoAtiva?.status === 'AGUARDANDO_PAGAMENTO').length
  const taxaOcupacao = total > 0 ? Math.round((ocupadas / total) * 100) : 0

  return { total, ocupadas, disponiveis, aguardandoPagamento, taxaOcupacao, ocupacaoCritica }
})

const minutosOcupacaoMesa = (mesa) => {
  if (mesa.status !== 'OCUPADA') return 0
  const abertaEm = mesa.sessaoAtiva?.abertaEm || mesa.abertaEm
  if (!abertaEm) return 0
  return Math.max(Math.floor((agora.value - new Date(abertaEm).getTime()) / 60000), 0)
}

// ── Mesas filtradas ────────────────────────────────────────────────────────
const mesasFiltradas = computed(() => {
  return mesas.value.filter(mesa => {
    if (statusFiltro.value !== 'TODOS' && mesa.status !== statusFiltro.value) return false
    if (tipoFiltro.value !== 'TODOS' && mesa.tipo !== tipoFiltro.value) return false
    if (ocupacaoFiltro.value !== 'TODAS' && minutosOcupacaoMesa(mesa) < Number(ocupacaoFiltro.value)) return false

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

const carregarTiposMesa = async () => {
  try {
    const response = await mesasService.getTipos()
    const rawTipos = Array.isArray(response) ? response : response.data || []
    tiposMesa.value = rawTipos.length > 0 ? rawTipos : [
      { codigo: 'MESA_FISICA', descricao: 'Mesa Física' }
    ]
  } catch (error) {
    console.warn('[GestaoMesasView] Aviso ao carregar tipos de mesa:', error)
    tiposMesa.value = [{ codigo: 'MESA_FISICA', descricao: 'Mesa Física' }]
  }
}

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
  // Sempre mostramos detalhes/configuração para a página de Mesas, agora que é área de Gestão!
  mesaSelecionada.value = mesa

  // Tenta puxar a sessão se estiver ocupada; se não, sessaoAtiva será null
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

    if (sessaoAtiva.value?.id) {
      try {
        const pedidos = await pedidosBalcaoService.getPedidoAtivoSessao(sessaoAtiva.value.id)
        sessaoAtiva.value = {
          ...sessaoAtiva.value,
          pedidos: Array.isArray(pedidos) ? pedidos : []
        }
      } catch (pedidoErr) {
        console.warn('[GestaoMesasView] Aviso ao buscar pedidos da sessão:', pedidoErr)
        sessaoAtiva.value = { ...sessaoAtiva.value, pedidos: [] }
      }
    }

    // Buscar dados adicionais em paralelo
    const promises = []

    // Fundo vinculado à sessão (consultado pelo sessaoId — backend: GET /fundos/sessao/{sessaoId})
    if (sessaoAtiva.value?.id) {
      promises.push(
        fundoConsumoService.buscarPorSessao(sessaoAtiva.value.id)
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

// ── Fechar Mesa (encerrar sessão sem débito pendente) ──────────────────────
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

// ── Liquidar Conta Pós-Paga ────────────────────────────────────────────────
const liquidarConta = async ({ mesa, metodo, qrCodeFundoExterno }) => {
  const sessaoId = sessaoAtiva.value?.id
  if (!sessaoId) {
    notificationStore.erro('Sessão não identificada')
    return
  }
  try {
    await sessoesConsumoService.liquidar(sessaoId, metodo, qrCodeFundoExterno)
    notificationStore.sucesso('Conta liquidada e sessão encerrada com sucesso!')
    fecharDetalhesMesa()
    await carregarMesas()
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao liquidar conta:', error)
    notificationStore.erro('Erro ao liquidar conta: ' + (error.response?.data?.message || error.message))
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
const abrirModalFatura = (mesa = null) => {
  if (mesa) mesaSelecionada.value = mesa
  if (!sessaoAtiva.value?.id) {
    notificationStore.erro('Não há sessão ativa para gerar fatura.')
    return
  }
  modalFaturaAberto.value = true
}

const formatCurrency = (valor) => {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2
  }).format(Number(valor || 0))
}

const formatDateTime = (valor) => {
  if (!valor) return '-'
  return new Date(valor).toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const escapeHtml = (valor) => String(valor ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const itensDaConta = (pedidos) => {
  return pedidos.flatMap(pedido => {
    const itens = Array.isArray(pedido.itens) && pedido.itens.length > 0
      ? pedido.itens
      : (pedido.subPedidos || []).flatMap(sub => sub.itens || [])

    return itens.map(item => ({
      pedidoNumero: pedido.numero || `#${pedido.id}`,
      nome: item.produtoNome || item.nomeProduto || 'Item',
      quantidade: Number(item.quantidade || 0),
      precoUnitario: Number(item.precoUnitario || 0),
      subtotal: Number(item.subtotal ?? (Number(item.quantidade || 0) * Number(item.precoUnitario || 0))),
      observacoes: item.observacoes || item.observacao || ''
    }))
  })
}

const imprimirConta = (mesa = null) => {
  const mesaBase = mesa || mesaSelecionada.value
  const sessao = sessaoAtiva.value

  if (!sessao?.id) {
    notificationStore.erro('Não há sessão ativa para imprimir a conta.')
    return
  }

  const pedidos = sessao.pedidos || []
  if (pedidos.length === 0) {
    notificationStore.erro('Nenhum pedido encontrado para imprimir.')
    return
  }

  const itens = itensDaConta(pedidos)
  const totalPedidos = pedidos.reduce((sum, pedido) => sum + Number(pedido.total || 0), 0)
  const total = Number(sessao.totalConsumo ?? totalPedidos)
  const saldoFundo = Number(fundoSelecionado.value?.saldoAtual ?? fundoSelecionado.value?.saldo ?? sessao.saldoFundo ?? 0)
  const pendente = Math.max(total - Math.max(saldoFundo, 0), 0)
  const agora = new Date()
  const numeroFatura = `MESA-${sessao.id}-${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`

  const linhas = itens.map(item => `
    <tr>
      <td>
        <strong>${escapeHtml(item.nome)}</strong>
        <div class="muted">${escapeHtml(item.pedidoNumero)}${item.observacoes ? ' - ' + escapeHtml(item.observacoes) : ''}</div>
      </td>
      <td class="num">${item.quantidade}</td>
      <td class="num">${formatCurrency(item.precoUnitario)}</td>
      <td class="num">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('')

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Conta ${escapeHtml(mesaBase?.referencia || sessao.referenciaMesa || sessao.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; color: #111827; }
    .page { width: 80mm; padding: 12px; margin: 0 auto; }
    .center { text-align: center; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 14px; margin: 12px 0 8px; border-top: 1px dashed #9ca3af; padding-top: 8px; }
    p { margin: 3px 0; font-size: 12px; }
    .muted { color: #6b7280; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { font-size: 11px; padding: 5px 0; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    th { text-align: left; color: #374151; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 10px; border-top: 1px dashed #9ca3af; padding-top: 8px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
    .grand { font-size: 15px; font-weight: 700; }
    .footer { margin-top: 14px; border-top: 1px dashed #9ca3af; padding-top: 10px; }
    @page { size: 80mm auto; margin: 4mm; }
    @media print {
      .no-print { display: none; }
      .page { width: auto; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="center">
      <h1>Sistema de Restauração</h1>
      <p>Conta / Fatura Proforma</p>
      <p class="muted">${escapeHtml(numeroFatura)}</p>
    </div>

    <h2>Dados da Mesa</h2>
    <p><strong>Mesa:</strong> ${escapeHtml(mesaBase?.referencia || sessao.referenciaMesa || '-')}</p>
    <p><strong>Sessão:</strong> ${escapeHtml(sessao.qrCodeSessao || sessao.id)}</p>
    <p><strong>Cliente:</strong> ${escapeHtml(sessao.nomeCliente || 'Anónimo')}</p>
    <p><strong>Abertura:</strong> ${escapeHtml(formatDateTime(sessao.abertaEm))}</p>
    <p><strong>Emissão:</strong> ${escapeHtml(formatDateTime(agora))}</p>

    <h2>Itens Consumidos</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qtd</th>
          <th class="num">Preço</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${linhas}</tbody>
    </table>

    <div class="totals">
      <div class="total-row"><span>Total consumido</span><strong>${formatCurrency(total)}</strong></div>
      <div class="total-row"><span>Saldo/fundo disponível</span><strong>${formatCurrency(saldoFundo)}</strong></div>
      <div class="total-row grand"><span>Total a pagar</span><span>${formatCurrency(pendente)}</span></div>
    </div>

    <div class="footer center">
      <p>Obrigado pela preferência.</p>
      <p class="muted">Documento gerado para conferência da mesa.</p>
    </div>

    <div class="no-print center" style="margin-top:16px;">
      <button onclick="window.print()">Imprimir</button>
      <button onclick="window.close()">Fechar</button>
    </div>
  </div>
  <script>
    window.addEventListener('load', () => setTimeout(() => window.print(), 250));
  <\/script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=420,height=720')
  if (!janela) {
    notificationStore.erro('O navegador bloqueou a janela de impressão. Permita pop-ups para imprimir.')
    return
  }

  janela.document.open()
  janela.document.write(html)
  janela.document.close()
  notificationStore.sucesso('Conta enviada para impressão.')
}

const recarregarFundo = (fundo) => {
  if (!fundo?.id) { notificationStore.erro('Fundo não encontrado'); return }
  router.push({ name: 'fundo-detalhe', params: { id: fundo.id } })
}

const atualizarQrCode = (novoQrCode) => {
  qrCodeSelecionado.value = novoQrCode
}

onMounted(async () => {
  timerOcupacao = setInterval(() => {
    agora.value = Date.now()
  }, 60000)
  await Promise.all([carregarTiposMesa(), carregarMesas()])
})

onUnmounted(() => {
  if (timerOcupacao) clearInterval(timerOcupacao)
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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
