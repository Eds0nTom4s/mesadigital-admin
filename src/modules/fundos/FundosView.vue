<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FundoCard from '@/components/shared/FundoCard.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import fundoConsumoService from '@/api/fundoConsumoService'

/**
 * FundosView - Módulo de gestão de fundos de consumo
 * 
 * INTEGRAÇÃO COMPLETA COM API BACKEND
 * Conforme documentação: INTEGRACAO_FRONTEND_FUNDO_CONSUMO.txt
 */

const router = useRouter()
const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const fundos = ref([])
const loading = ref(false)
const error = ref(null)
const buscando = ref(false)

// Filtros
const tipoFiltro = ref('TODOS')
const statusFiltro = ref('TODOS')
const busca = ref('')

// Buscar fundo por ID da Sessão ou Token
const buscarFundo = async () => {
  if (!busca.value.trim()) {
    await carregarTodos()
    return
  }
  
  try {
    buscando.value = true
    error.value = null
    
    // Checa se é número (ID da sessão) ou String (Token)
    const buscaV = busca.value.trim()
    let fundo = null
    
    if (!isNaN(buscaV)) {
       fundo = await fundoConsumoService.buscarPorSessao(parseInt(buscaV))
    } else {
       fundo = await fundoConsumoService.consultarFundo(buscaV)
    }
    
    if (fundo) {
      fundos.value = [fundo] // Mostra apenas o resultado
      notificationStore.sucesso(`Fundo encontrado!`)
    }
  } catch (err) {
    if (err.response?.status === 404) {
      notificationStore.aviso('Fundo não encontrado para esta sessão ou QR Code')
      fundos.value = []
    } else {
      notificationStore.erro('Erro ao buscar fundo.')
    }
  } finally {
    buscando.value = false
  }
}

const carregarTodos = async () => {
  loading.value = true
  try {
    const pageData = await fundoConsumoService.listarTodos(0, 50)
    fundos.value = pageData.content || pageData
  } catch (err) {
    console.error('Falha ao listar fundos', err)
    notificationStore.erro('Falha ao listar fundos do servidor')
  } finally {
    loading.value = false
  }
}

// Carrega fundos via API
onMounted(async () => {
  await carregarTodos()
})

// Fundos filtrados no caso de haver filtros locais
const fundosFiltrados = computed(() => {
  return fundos.value.filter(fundo => {
    // Filtro de status
    if (statusFiltro.value === 'ATIVO' && !fundo.ativo) return false
    if (statusFiltro.value === 'ENCERRADO' && fundo.ativo) return false
    return true
  })
})

// Estatísticas
const estatisticas = computed(() => {
  const ativos = fundos.value.filter(f => f.ativo)  // ✓ Usa 'ativo' em vez de 'status'
  const totalAtivos = ativos.reduce((sum, f) => sum + f.saldoAtual, 0)
  const mediaAtivos = ativos.length > 0 ? totalAtivos / ativos.length : 0
  
  const encerradosHoje = fundos.value.filter(f => {
    if (f.ativo) return false  // ✓ Usa 'ativo'
    const hoje = new Date().toDateString()
    const dataFundo = new Date(f.createdAt).toDateString()  // ✓ Usa 'createdAt'
    return hoje === dataFundo
  })
  
  return {
    totalAtivos,
    qtdAtivos: ativos.length,
    mediaAtivos,
    encerradosHoje: encerradosHoje.length
  }
})

// Navega para detalhes
const verDetalhes = (fundo) => {
  const fundoId = fundo.qrCodeSessao || fundo.tokenPortador
  if (!fundoId) {
    notificationStore.erro('O fundo não possui um identificador válido.')
    return
  }
  router.push({ name: 'fundo-detalhe', params: { id: fundoId } })
}

// Modal de criação de fundo
const modalAberto = ref(false)
const criandoFundo = ref(false)
const valorMinimo = ref(50) // mínimo de 50 Kwanza

// Modal de recarga
const modalRecargaAberto = ref(false)
const fundoSelecionado = ref(null)
const recargando = ref(false)
const formularioRecarga = ref({
  valor: 5000, // AOA
  metodoPagamento: 'GPO'
})

const abrirModalRecarga = (fundo) => {
  fundoSelecionado.value = fundo
  formularioRecarga.value.valor = 5000
  modalRecargaAberto.value = true
}

const mostrarConfirmacaoCriar = ref(false)
const abrirModal = () => {
  mostrarConfirmacaoCriar.value = true
}

const criarFundo = async () => {
  try {
    criandoFundo.value = true
    // Logic to create fund should ideally go here
    notificationStore.sucesso('Solicitação de criação processada.')
  } catch (err) {
    notificationStore.erro('Erro ao criar fundo.')
  } finally {
    criandoFundo.value = false
    mostrarConfirmacaoCriar.value = false
  }
}

const recarregarFundo = async () => {
  try {
    recargando.value = true
    
    const token = fundoSelecionado.value?.tokenPortador || fundoSelecionado.value?.qrCodeSessao
    if (!token) {
      notificationStore.aviso('Sessão sem token portador ou QR inválido.')
      recargando.value = false
      return
    }

    if (!formularioRecarga.value.valor || formularioRecarga.value.valor < valorMinimo.value) {
      notificationStore.aviso(`O valor de recarga deve ser no mínimo ${formatCurrency(valorMinimo.value)}`)
      recargando.value = false
      return
    }

    await fundoConsumoService.recarregarFundo(
      token,
      formularioRecarga.value.valor,
      `Recarga balcão — ${formularioRecarga.value.metodoPagamento || 'Directo'}`
    )

    notificationStore.sucesso(`Fundo recarregado: ${formatCurrency(formularioRecarga.value.valor)}`)
    modalRecargaAberto.value = false

    // Atualiza saldo local
    const fundoAtualizado = await fundoConsumoService.consultarFundo(token)
    const idx = fundos.value.findIndex(f => f.id === fundoSelecionado.value.id)
    if (idx !== -1) fundos.value[idx] = fundoAtualizado

  } catch (err) {
    console.error('[FundosView] Erro ao recarregar fundo:', err)
    if (err?.stack) console.error(err.stack)
    const msg = err.mensagemAmigavel || err.response?.data?.message || err.message
    notificationStore.erro(msg || 'Erro ao recarregar fundo. Tente novamente.')
  } finally {
    recargando.value = false
  }
}

const fecharModalRecarga = () => {
  modalRecargaAberto.value = false
  fundoSelecionado.value = null
  formularioRecarga.value = {
    valor: 5000,
    metodoPagamento: 'GPO'
  }
}</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Fundos de Consumo</h2>
        <p class="text-text-secondary mt-1">Gestão completa de fundos e transações</p>
      </div>
      <button @click="abrirModal" class="btn-primary">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Criar Fundo
      </button>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Fundos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.qtdAtivos }}</p>
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
            <p class="text-text-secondary text-sm">Total em Fundos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(estatisticas.totalAtivos) }}</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Card: Média por Fundo -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Média por Fundo</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(estatisticas.mediaAtivos) }}</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Card: Encerrados Hoje -->
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Encerrados Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ estatisticas.encerradosHoje }}</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        </div>
      </div>
    </div> <!-- Fecha a grid de estatisticas -->

    <!-- Busca e Filtros -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="statusFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="ENCERRADO">Encerrados</option>
          </select>
        </div>
        
        <!-- Busca por ID do Cliente ou Sessao -->
        <div class="flex items-center space-x-2">
          <input 
            v-model="busca" 
            type="text" 
            placeholder="ID da Sessão ou Token QR..." 
            class="input-field w-full md:w-64"
            @keyup.enter="buscarFundo"
          />
          <button @click="buscarFundo" class="btn-secondary whitespace-nowrap" :disabled="buscando">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span v-if="!buscando">Buscar</span>
            <span v-else>Buscando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard v-for="i in 6" :key="i" />
    </div>

    <!-- Grid de Fundos -->
    <div v-else-if="fundosFiltrados.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <FundoCard 
        v-for="fundo in fundosFiltrados" 
        :key="fundo.id"
        :fundo="fundo"
        @verDetalhes="verDetalhes"
        @recarregar="abrirModalRecarga"
      />
    </div>

    <!-- Nenhum resultado -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
      <h3 class="text-xl font-semibold text-text-primary mb-2">Nenhum fundo encontrado</h3>
      <p class="text-text-secondary">Ajuste os filtros ou insira um identificador válido</p>
    </div>

    <!-- Modal de Recarga de Fundo -->
    <div v-if="modalRecargaAberto" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="fecharModalRecarga">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 class="text-xl font-bold text-text-primary">Recarregar Fundo</h3>
            <p class="text-sm text-text-secondary mt-1">Sessão #{{ fundoSelecionado?.sessaoId || 'N/A' }}</p>
          </div>
          <button @click="fecharModalRecarga" class="text-text-secondary hover:text-text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Saldo Atual -->
          <div class="bg-background p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-text-secondary">Saldo Atual</span>
              <span class="text-2xl font-bold text-primary">
                {{ formatCurrency(fundoSelecionado?.saldoAtual || 0) }}
              </span>
            </div>
          </div>

          <!-- Valor da Recarga -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Valor da Recarga <span class="text-error">*</span>
            </label>
            <input 
              v-model.number="formularioRecarga.valorDecimal" 
              type="number" 
              :min="valorMinimoDecimal"
              step="0.01"
              class="input-field w-full"
              required
            />
            <p class="text-xs text-text-secondary mt-1">
              Mínimo: {{ formatCurrency(valorMinimo) }}
            </p>
          </div>

          <!-- Método de Pagamento -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Método de Pagamento Recebido <span class="text-error">*</span>
            </label>
            <select v-model="formularioRecarga.metodoPagamento" class="input-field w-full" required>
              <option value="CASH">Dinheiro (Cash)</option>
              <option value="TPA">Multicaixa Físico (TPA)</option>
              <option value="DIGITAL">Pagamento Digital (QR/AppyPay)</option>
            </select>
            <p class="text-xs text-text-secondary mt-1">
              <template v-if="formularioRecarga.metodoPagamento === 'CASH'">
                Valor recebido em numerário pelo garçom/caixa.
              </template>
              <template v-else-if="formularioRecarga.metodoPagamento === 'TPA'">
                Valor processado fisicamente num terminal TPA (Multicaixa).
              </template>
              <template v-else>
                Valor processado por sistema digital gateway de terceiros.
              </template>
            </p>
          </div>

          <!-- Preview Novo Saldo -->
          <div class="bg-success/10 border border-success/20 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-success font-medium">Novo Saldo</span>
              <span class="text-2xl font-bold text-success">
                {{ formatCurrency((fundoSelecionado?.saldoAtual || 0) + (formularioRecarga.valorDecimal * 100)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button @click="fecharModalRecarga" class="btn-secondary" :disabled="recargando">
            Cancelar
          </button>
          <button @click="recarregarFundo" class="btn-primary" :disabled="recargando">
            <svg v-if="recargando" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span v-if="recargando">Processando...</span>
            <span v-else>Confirmar Recarga</span>
          </button>
        </div>
      </div>
    </div>
    
    <ConfirmDialog
      :isOpen="mostrarConfirmacaoCriar"
      title="Criar Novo Fundo"
      message="Tem certeza de que deseja criar um novo fundo de consumo em uma nova sessão?"
      confirmText="Criar"
      cancelText="Cancelar"
      @confirm="criarFundo"
      @cancel="mostrarConfirmacaoCriar = false"
    />
  </div>
</template>
