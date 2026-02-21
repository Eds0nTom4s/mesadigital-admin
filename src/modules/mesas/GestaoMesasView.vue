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
            <option value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</option>
            <option value="FINALIZADA">Finalizadas</option>
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
    <div v-if="modalNovaAberto" class="modal-overlay" @click.self="fecharModalNova">
      <div class="modal-content max-w-md">
        <div class="modal-header">
          <h2>Nova Mesa</h2>
          <button @click="fecharModalNova" class="btn-close">✕</button>
        </div>
        <form @submit.prevent="criarMesa" class="modal-body space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Telefone do Cliente *
            </label>
            <input v-model="formNovaMesa.telefoneCliente" 
                   type="tel" 
                   placeholder="+244923456789"
                   class="input-field w-full"
                   required 
                   pattern="^\+244\d{9}$"
                   title="Formato: +244 seguido de 9 dígitos" />
            <p class="text-xs text-text-secondary mt-1">
              Formato: +244XXXXXXXXX (9 dígitos)
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Referência *</label>
            <input v-model="formNovaMesa.referencia" 
                   type="text" 
                   placeholder="Ex: Mesa 10"
                   class="input-field w-full"
                   required />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tipo *</label>
            <select v-model="formNovaMesa.tipo" class="input-field w-full" required>
              <option value="MESA_FISICA">Mesa Física</option>
              <option value="QUARTO">Quarto (Room Service)</option>
              <option value="AREA_EVENTO">Área de Evento</option>
              <option value="ESPACO_LOUNGE">Espaço Lounge</option>
              <option value="VIRTUAL">Virtual/Delivery</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Número</label>
              <input v-model.number="formNovaMesa.numero" 
                     type="number" 
                     placeholder="10"
                     class="input-field w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Capacidade</label>
              <input v-model.number="formNovaMesa.capacidade" 
                     type="number" 
                     placeholder="4"
                     class="input-field w-full"
                     min="1" />
            </div>
          </div>

          <div>
            <label class="flex items-center space-x-2">
              <input type="checkbox" v-model="formNovaMesa.gerarQrCode" class="rounded" />
              <span class="text-sm text-text-primary">Gerar QR Code automaticamente (válido por 1 ano)</span>
            </label>
          </div>

          <div class="flex space-x-2 pt-4">
            <button type="button" @click="fecharModalNova" 
                    class="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" :disabled="criandoMesa" 
                    class="btn-primary flex-1">
              {{ criandoMesa ? 'Criando...' : 'Criar Mesa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Detalhes da Mesa -->
    <ModalDetalhesMesa
      :is-open="modalDetalhesAberto"
      :mesa="mesaSelecionada || {}"
      :fundo="fundoSelecionado"
      :qr-code="qrCodeSelecionado"
      @close="fecharDetalhesMesa"
      @fechar-mesa="fecharMesa"
      @novo-pedido="novoPedido"
      @imprimir-conta="imprimirConta"
      @recarregar="recarregarFundo"
      @atualizar-qr-code="atualizarQrCode"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import unidadesConsumoService from '@/services/unidadesConsumoService'
import fundoConsumoService from '@/services/fundoConsumoService'
import qrcodeService from '@/services/qrcodeService'
import CardMesa from '@/components/shared/CardMesa.vue'
import ModalDetalhesMesa from '@/components/mesas/ModalDetalhesMesa.vue'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const mesas = ref([])
const loading = ref(false)
const statusFiltro = ref('TODOS')
const tipoFiltro = ref('TODOS')
const busca = ref('')

// Modal Nova Mesa
const modalNovaAberto = ref(false)
const criandoMesa = ref(false)
const formNovaMesa = ref({
  referencia: '',
  telefoneCliente: '',
  tipo: 'MESA_FISICA',
  numero: null,
  capacidade: 4,
  unidadeAtendimentoId: null,
  gerarQrCode: true
})

// Modal Detalhes
const modalDetalhesAberto = ref(false)
const mesaSelecionada = ref(null)
const fundoSelecionado = ref(null)
const qrCodeSelecionado = ref(null)

// Estatísticas
const estatisticas = computed(() => {
  const total = mesas.value.length
  const ocupadas = mesas.value.filter(m => m.status === 'OCUPADA').length
  const disponiveis = mesas.value.filter(m => m.status === 'DISPONIVEL').length
  const aguardandoPagamento = mesas.value.filter(m => m.status === 'AGUARDANDO_PAGAMENTO').length
  const taxaOcupacao = total > 0 ? Math.round((ocupadas / total) * 100) : 0

  return {
    total,
    ocupadas,
    disponiveis,
    aguardandoPagamento,
    taxaOcupacao
  }
})

// Mesas filtradas
const mesasFiltradas = computed(() => {
  return mesas.value.filter(mesa => {
    // Filtro de status
    if (statusFiltro.value !== 'TODOS' && mesa.status !== statusFiltro.value) {
      return false
    }
    
    // Filtro de tipo
    if (tipoFiltro.value !== 'TODOS' && mesa.tipo !== tipoFiltro.value) {
      return false
    }
    
    // Busca por referência ou nome do cliente
    if (busca.value) {
      const buscaLower = busca.value.toLowerCase()
      return (
        mesa.referencia?.toLowerCase().includes(buscaLower) ||
        mesa.cliente?.nome?.toLowerCase().includes(buscaLower) ||
        mesa.numero?.toString().includes(buscaLower)
      )
    }
    
    return true
  })
})

// Carregar mesas
const carregarMesas = async () => {
  try {
    loading.value = true
    
    // Usa endpoint /minhas para filtro automático por role
    const response = await unidadesConsumoService.getMinhas()
    mesas.value = response.data || response
    
    console.log('[GestaoMesasView] Mesas carregadas:', mesas.value.length)
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao carregar mesas:', error)
    notificationStore.erro('Erro ao carregar mesas: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

// Abrir modal nova mesa
const abrirModalNova = () => {
  formNovaMesa.value = {
    referencia: '',
    telefoneCliente: '',
    tipo: 'MESA_FISICA',
    numero: null,
    capacidade: 4,
    unidadeAtendimentoId: authStore.user?.unidadeAtendimentoId || null,
    gerarQrCode: true
  }
  modalNovaAberto.value = true
}

// Criar mesa
const criarMesa = async () => {
  try {
    criandoMesa.value = true
    
    // 1. Criar unidade de consumo
    const response = await unidadesConsumoService.criar(formNovaMesa.value)
    const novaUnidade = response.data
    
    console.log('[GestaoMesasView] Mesa criada:', novaUnidade)
    
    // 2. Gerar QR Code se solicitado
    if (formNovaMesa.value.gerarQrCode) {
      try {
        await qrcodeService.gerarQrCode({
          tipo: 'MESA',
          unidadeDeConsumoId: novaUnidade.id,
          validadeMinutos: 525600 // 1 ano
        })
        notificationStore.sucesso('Mesa criada com QR Code!')
      } catch (qrError) {
        console.error('[GestaoMesasView] Erro ao gerar QR Code:', qrError)
        notificationStore.aviso('Mesa criada, mas erro ao gerar QR Code')
      }
    } else {
      notificationStore.sucesso('Mesa criada com sucesso!')
    }
    
    modalNovaAberto.value = false
    await carregarMesas()
    
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao criar mesa:', error)
    
    if (error.response?.status === 400) {
      const msg = error.response.data.message
      if (msg?.includes('já possui uma unidade ativa')) {
        notificationStore.erro('Este cliente já possui uma mesa ativa')
      } else {
        notificationStore.erro('Erro: ' + msg)
      }
    } else {
      notificationStore.erro('Erro ao criar mesa')
    }
  } finally {
    criandoMesa.value = false
  }
}

// Fechar modal nova
const fecharModalNova = () => {
  modalNovaAberto.value = false
}

// Abrir detalhes da mesa
const abrirDetalhesMesa = async (mesa) => {
  try {
    mesaSelecionada.value = mesa
    modalDetalhesAberto.value = true
    
    // Buscar dados adicionais em paralelo
    const promises = []
    
    // Buscar fundo se cliente tem
    if (mesa.cliente?.id) {
      promises.push(
        fundoConsumoService.buscarFundoPorCliente(mesa.cliente.id)
          .then(fundo => { fundoSelecionado.value = fundo })
          .catch(() => { fundoSelecionado.value = null })
      )
    } else {
      fundoSelecionado.value = null
    }
    
    // Buscar QR Code
    promises.push(
      qrcodeService.buscarQrCodeUnidade(mesa.id)
        .then(qrCodes => { 
          qrCodeSelecionado.value = qrCodes.length > 0 ? qrCodes[0] : null 
        })
        .catch(() => { qrCodeSelecionado.value = null })
    )
    
    await Promise.all(promises)
    
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao abrir detalhes:', error)
    notificationStore.erro('Erro ao carregar detalhes da mesa')
  }
}

// Fechar detalhes
const fecharDetalhesMesa = () => {
  modalDetalhesAberto.value = false
  mesaSelecionada.value = null
  fundoSelecionado.value = null
  qrCodeSelecionado.value = null
}

// Fechar mesa
const fecharMesa = async (mesa) => {
  try {
    await unidadesConsumoService.fechar(mesa.id)
    notificationStore.sucesso('Mesa fechada com sucesso!')
    fecharDetalhesMesa()
    await carregarMesas()
  } catch (error) {
    console.error('[GestaoMesasView] Erro ao fechar mesa:', error)
    notificationStore.erro('Erro ao fechar mesa')
  }
}

// Novo pedido
const novoPedido = (mesa) => {
  notificationStore.info('Funcionalidade de novo pedido em desenvolvimento')
  // TODO: Redirecionar para página de pedidos com mesa pre-selecionada
}

// Imprimir conta
const imprimirConta = (mesa) => {
  notificationStore.info('Funcionalidade de impressão em desenvolvimento')
  // TODO: Gerar PDF da conta
}

// Recarregar fundo
const recarregarFundo = (fundo) => {
  notificationStore.info('Funcionalidade de recarga em desenvolvimento')
  // TODO: Abrir modal de recarga
}

// Atualizar QR Code
const atualizarQrCode = (novoQrCode) => {
  qrCodeSelecionado.value = novoQrCode
}

onMounted(() => {
  carregarMesas()
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
