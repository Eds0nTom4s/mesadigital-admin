<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FundoCard from '@/components/shared/FundoCard.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import fundoConsumoService from '@/services/fundoConsumoService'

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

// Buscar fundo por telefone do cliente
const buscarPorCliente = async () => {
  if (!busca.value.trim()) {
    notificationStore.aviso('Informe o telefone do cliente')
    return
  }
  
  try {
    buscando.value = true
    error.value = null
    
    // Busca por telefone normalizado (remove espaços, +, etc)
    const telefone = busca.value.trim().replace(/\D/g, '')
    
    const response = await fundoConsumoService.buscarFundoPorCliente(telefone)
    
    // Adiciona à lista se não existir
    const existe = fundos.value.find(f => f.id === response.data.id)
    if (!existe) {
      fundos.value.unshift(response.data)
    }
    
    notificationStore.sucesso(`Fundo encontrado: ${response.data.cliente.nome}`)
    busca.value = '' // Limpa o campo após busca bem-sucedida
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = 'Cliente não possui fundo de consumo'
    } else {
      error.value = err.response?.data?.message || 'Erro ao buscar fundo'
    }
    notificationStore.erro(error.value)
  } finally {
    buscando.value = false
  }
}

// Carrega fundos via API
onMounted(async () => {
  // Backend não tem endpoint de listagem completa
  // Lista começa vazia, busque por cliente quando necessário
  loading.value = false
})

// Fundos filtrados
const fundosFiltrados = computed(() => {
  return fundos.value.filter(fundo => {
    // Filtro de tipo
    if (tipoFiltro.value !== 'TODOS' && fundo.tipo !== tipoFiltro.value) {
      return false
    }
    
    // Filtro de status (API usa 'ativo' booleano)
    if (statusFiltro.value === 'ATIVO' && !fundo.ativo) return false
    if (statusFiltro.value === 'ENCERRADO' && fundo.ativo) return false
    if (statusFiltro.value === 'EXPIRADO' && fundo.ativo) return false  // Mock only
    
    // Busca por identificador ou nome do cliente
    if (busca.value) {
      const buscaLower = busca.value.toLowerCase()
      return (
        fundo.identificador?.toLowerCase().includes(buscaLower) ||
        fundo.cliente?.nome?.toLowerCase().includes(buscaLower)
      )
    }
    
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
  router.push({ name: 'fundo-detalhe', params: { id: fundo.id } })
}

// Modal de criação de fundo
const modalAberto = ref(false)
const criandoFundo = ref(false)
const valorMinimo = ref(5000)
const formulario = ref({
  clienteId: '',
  clienteNome: '',
  clienteTelefone: '',
  saldoInicial: 5000,
  metodoPagamento: 'DINHEIRO'
})

// Confirmação de criação de fundo
const mostrarConfirmacaoCriar = ref(false)
const confirmarCriacaoFundo = () => {
  // Valida campos primeiro
  if (!formulario.value.clienteNome) {
    notificationStore.aviso('Informe o nome do cliente')
    return
  }
  if (!formulario.value.clienteTelefone) {
    notificationStore.aviso('Informe o telefone do cliente')
    return
  }
  if (formulario.value.saldoInicial < valorMinimo.value) {
    notificationStore.aviso(`Saldo inicial mínimo: ${formatCurrency(valorMinimo.value)}`)
    return
  }
  
  // Mostra confirmação
  mostrarConfirmacaoCriar.value = true
}

// Carrega valor mínimo ao abrir modal
const abrirModal = async () => {
  try {
    const resp = await fundoConsumoService.consultarValorMinimo()
    valorMinimo.value = resp.data.valorMinimo
    formulario.value.saldoInicial = valorMinimo.value
    modalAberto.value = true
  } catch (err) {
    notificationStore.erro('Erro ao carregar configurações: ' + (err.response?.data?.message || err.message))
  }
}

// Cria novo fundo (chamado após confirmação)
const criarFundo = async () => {
  try {
    criandoFundo.value = true
    
    // Cria fundo via API
    // NOTA: No painel administrativo, pagamento é presencial (DINHEIRO/TPA)
    // Backend deve registrar como pagamento confirmado imediatamente
    const resp = await fundoConsumoService.criarFundo({
      clienteId: formulario.value.clienteId || null,
      clienteNome: formulario.value.clienteNome,
      clienteTelefone: formulario.value.clienteTelefone,
      saldoInicial: formulario.value.saldoInicial,
      metodoPagamento: formulario.value.metodoPagamento
    })
    
    // Sucesso
    const metodo = formulario.value.metodoPagamento === 'DINHEIRO' ? 'em dinheiro' : 'via TPA'
    notificationStore.sucesso(
      `Fundo criado com sucesso! Pagamento ${metodo} de ${formatCurrency(formulario.value.saldoInicial)} registrado.`
    )
    modalAberto.value = false
    mostrarConfirmacaoCriar.value = false
    
    // Adiciona à lista local (quando backend tiver listagem, recarregar)
    fundos.value.push(resp.data)
    
  } catch (err) {
    const msg = err.response?.data?.message || err.message
    notificationStore.erro('Erro ao criar fundo: ' + msg)
  } finally {
    criandoFundo.value = false
  }
}

const fecharModal = () => {
  modalAberto.value = false
  formulario.value = {
    clienteId: '',
    clienteNome: '',
    clienteTelefone: '',
    saldoInicial: valorMinimo.value,
    metodoPagamento: 'GPO'
  }
}
// Modal de recarga
const modalRecargaAberto = ref(false)
const fundoSelecionado = ref(null)
const recargando = ref(false)
const formularioRecarga = ref({
  valor: 5000,
  metodoPagamento: 'DINHEIRO'
})

const abrirModalRecarga = (fundo) => {
  fundoSelecionado.value = fundo
  formularioRecarga.value.valor = valorMinimo.value
  modalRecargaAberto.value = true
}

const recarregarFundo = async () => {
  try {
    recargando.value = true
    
    if (formularioRecarga.value.valor < valorMinimo.value) {
      notificationStore.aviso(`Valor mínimo de recarga: ${formatCurrency(valorMinimo.value)}`)
      recargando.value = false
      return
    }
    
    await fundoConsumoService.recarregarFundo(
      fundoSelecionado.value.id,
      formularioRecarga.value.valor,
      formularioRecarga.value.metodoPagamento
    )
    
    const metodo = formularioRecarga.value.metodoPagamento === 'DINHEIRO' ? 'em dinheiro' : 'via TPA'
    notificationStore.sucesso(
      `Recarga realizada com sucesso! Pagamento ${metodo} de ${formatCurrency(formularioRecarga.value.valor)}`
    )
    
    // Atualiza saldo local
    fundoSelecionado.value.saldoAtual += formularioRecarga.value.valor
    
    modalRecargaAberto.value = false
  } catch (err) {
    notificationStore.erro('Erro ao recarregar fundo: ' + (err.response?.data?.message || err.message))
  } finally {
    recargando.value = false
  }
}

const fecharModalRecarga = () => {
  modalRecargaAberto.value = false
  fundoSelecionado.value = null
  formularioRecarga.value = {
    valor: valorMinimo.value,
    metodoPagamento: 'DINHEIRO'
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
    </div>

    <!-- Busca e Filtros -->
    <div class="card">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Filtros -->
        <div class="flex flex-wrap items-center gap-3">
          <select v-model="tipoFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Tipos</option>
            <option value="UNIDADE_CONSUMO">Unidades de Consumo</option>
            <option value="QR_CONSUMO">QR Code</option>
            <option value="EVENTO">Eventos</option>
          </select>
          
          <select v-model="statusFiltro" class="input-field w-48">
            <option value="TODOS">Todos os Status</option>
            <option value="ATIVO">Ativos</option>
            <option value="ENCERRADO">Encerrados</option>
            <option value="EXPIRADO">Expirados</option>
          </select>
        </div>
        
        <!-- Busca por Telefone -->
        <div class="flex items-center space-x-2">
          <input 
            v-model="busca" 
            type="tel" 
            placeholder="Buscar por telefone (+244...)" 
            class="input-field w-full md:w-64"
            @keyup.enter="buscarPorCliente"
          />
          <button @click="buscarPorCliente" class="btn-secondary whitespace-nowrap" :disabled="buscando">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span v-if="!buscando">Buscar Cliente</span>
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
      <p class="text-text-secondary">Ajuste os filtros ou crie um novo fundo</p>
    </div>

    <!-- Modal de Criação de Fundo -->
    <div v-if="modalAberto" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="fecharModal">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h3 class="text-xl font-bold text-text-primary">Criar Novo Fundo</h3>
          <button @click="fecharModal" class="text-text-secondary hover:text-text-primary">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <!-- Cliente ID (opcional) -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              ID do Cliente (opcional)
            </label>
            <input 
              v-model="formulario.clienteId" 
              type="text" 
              class="input-field w-full"
              placeholder="Deixe em branco para novo cliente"
            />
          </div>

          <!-- Nome do Cliente -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Nome do Cliente <span class="text-error">*</span>
            </label>
            <input 
              v-model="formulario.clienteNome" 
              type="text" 
              class="input-field w-full"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <!-- Telefone -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Telefone <span class="text-error">*</span>
            </label>
            <input 
              v-model="formulario.clienteTelefone" 
              type="tel" 
              class="input-field w-full"
              placeholder="+244925813939"
              required
            />
            <p class="text-xs text-text-secondary mt-1">Formato: +244XXXXXXXXX</p>
          </div>

          <!-- Saldo Inicial -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Saldo Inicial <span class="text-error">*</span>
            </label>
            <input 
              v-model.number="formulario.saldoInicial" 
              type="number" 
              :min="valorMinimo"
              step="100"
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
              Método de Pagamento Presencial
            </label>
            <select v-model="formulario.metodoPagamento" class="input-field w-full">
              <option value="DINHEIRO">Dinheiro</option>
              <option value="TPA">TPA - Terminal de Pagamento Automático</option>
            </select>
            <p class="text-xs text-text-secondary mt-1">
              <template v-if="formulario.metodoPagamento === 'DINHEIRO'">
                Pagamento em dinheiro vivo (Kwanzas)
              </template>
              <template v-else>
                Pagamento via máquina de cartão (débito/crédito)
              </template>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button @click="fecharModal" class="btn-secondary" :disabled="criandoFundo">
            Cancelar
          </button>
          <button @click="confirmarCriacaoFundo" class="btn-primary" :disabled="criandoFundo">
            <span>Criar Fundo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Recarga de Fundo -->
    <div v-if="modalRecargaAberto" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="fecharModalRecarga">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 class="text-xl font-bold text-text-primary">Recarregar Fundo</h3>
            <p class="text-sm text-text-secondary mt-1">{{ fundoSelecionado?.cliente?.nome }}</p>
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
              v-model.number="formularioRecarga.valor" 
              type="number" 
              :min="valorMinimo"
              step="100"
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
              Método de Pagamento Presencial
            </label>
            <select v-model="formularioRecarga.metodoPagamento" class="input-field w-full">
              <option value="DINHEIRO">Dinheiro</option>
              <option value="TPA">TPA - Terminal de Pagamento Automático</option>
            </select>
            <p class="text-xs text-text-secondary mt-1">
              <template v-if="formularioRecarga.metodoPagamento === 'DINHEIRO'">
                Pagamento em dinheiro vivo (Kwanzas)
              </template>
              <template v-else>
                Pagamento via máquina de cartão (débito/crédito)
              </template>
            </p>
          </div>

          <!-- Preview Novo Saldo -->
          <div class="bg-success/10 border border-success/20 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <span class="text-sm text-success font-medium">Novo Saldo</span>
              <span class="text-2xl font-bold text-success">
                {{ formatCurrency((fundoSelecionado?.saldoAtual || 0) + formularioRecarga.valor) }}
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

    <!-- Diálogo de Confirmação: Criar Fundo -->
    <ConfirmDialog
      :is-open="mostrarConfirmacaoCriar"
      title="Confirmar Criação de Fundo"
      :message="`Deseja criar um fundo de ${formatCurrency(formulario.saldoInicial)} para ${formulario.clienteNome}? O pagamento ${formulario.metodoPagamento === 'DINHEIRO' ? 'em dinheiro' : 'via TPA'} será registrado imediatamente.`"
      variant="info"
      confirm-text="Criar Fundo"
      cancel-text="Cancelar"
      :loading="criandoFundo"
      loading-text="Criando..."
      @confirm="criarFundo"
      @cancel="mostrarConfirmacaoCriar = false"
    />
  </div>
</template>
