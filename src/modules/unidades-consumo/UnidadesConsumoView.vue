<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import { unidadesConsumoService } from '@/services/unidadesConsumoService'
import { useAuthStore } from '@/store/auth'

const { formatCurrency } = useCurrency()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const unidades = ref([])
const loading = ref(false)
const filtroStatus = ref('TODAS')
const mostrarModalNova = ref(false)
const unidadeEmEdicao = ref(null)

// Confirmação de fechar unidade
const mostrarConfirmacaoFechar = ref(false)
const unidadeParaFechar = ref(null)

// Form para nova unidade - conforme especificação backend
const formNovaUnidade = ref({
  referencia: '',
  telefoneCliente: '',
  tipo: 'MESA_FISICA',
  numero: null,
  qrCode: '',
  capacidade: 4,
  unidadeAtendimentoId: null
})

const unidadesFiltradas = computed(() => {
  if (filtroStatus.value === 'TODAS') return unidades.value
  return unidades.value.filter(u => u.status === filtroStatus.value)
})

const unidadesOcupadas = computed(() => 
  unidades.value.filter(u => u.status === 'OCUPADA').length
)

const unidadesTotal = computed(() => unidades.value.length)

const porcentagemOcupacao = computed(() => 
  unidadesTotal.value > 0 ? Math.round((unidadesOcupadas.value / unidadesTotal.value) * 100) : 0
)

const carregarUnidades = async () => {
  try {
    loading.value = true
    
    // Tentar usar endpoint /minhas (recomendado pelo backend)
    try {
      const response = await unidadesConsumoService.getMinhas()
      
      // Response tem estrutura: { success: true, message: "...", data: [...] }
      unidades.value = response.data || response
      
      console.log('[UnidadesConsumoView] Unidades carregadas via /minhas:', unidades.value.length)
    } catch (error) {
      // Fallback para modo dev sem JWT válido
      if (error.response?.status === 400) {
        console.warn('[UnidadesConsumoView] Fallback para /api/unidades-consumo (modo dev)')
        const response = await unidadesConsumoService.getAll()
        unidades.value = response.data || response
        console.log('[UnidadesConsumoView] Unidades carregadas via fallback:', unidades.value.length)
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('[UnidadesConsumoView] Erro ao carregar unidades:', error)
    
    // Tratamento de erro conforme documento
    if (error.response?.status === 401) {
      notificationStore.erro('Sessão expirada. Faça login novamente.')
      // Redirecionar para login
    } else if (error.response?.status !== 400) {
      // Não mostrar toast para erro 400 (já tem fallback)
      notificationStore.erro('Erro ao carregar unidades: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    loading.value = false
  }
}

const abrirModalNova = () => {
  formNovaUnidade.value = {
    referencia: '',
    telefoneCliente: '',
    tipo: 'MESA_FISICA',
    numero: null,
    qrCode: '',
    capacidade: 4,
    unidadeAtendimentoId: authStore.user?.unidadeAtendimentoId || null
  }
  unidadeEmEdicao.value = null
  mostrarModalNova.value = true
}

const criarUnidade = async () => {
  try {
    // Validação conforme documento
    if (!formNovaUnidade.value.referencia) {
      notificationStore.aviso('Referência é obrigatória')
      return
    }
    
    if (!formNovaUnidade.value.telefoneCliente) {
      notificationStore.aviso('Telefone do cliente é obrigatório')
      return
    }
    
    // Validar formato telefone: +244XXXXXXXXX
    const telefoneRegex = /^\+244\d{9}$/
    if (!telefoneRegex.test(formNovaUnidade.value.telefoneCliente)) {
      notificationStore.aviso('Telefone inválido. Formato: +244XXXXXXXXX (9 dígitos após 244)')
      return
    }
    
    if (!formNovaUnidade.value.unidadeAtendimentoId && !authStore.isAdmin) {
      notificationStore.aviso('Unidade de atendimento é obrigatória')
      return
    }
    
    loading.value = true
    
    const response = await unidadesConsumoService.abrir(formNovaUnidade.value)
    
    console.log('[UnidadesConsumoView] Unidade criada:', response)
    
    mostrarModalNova.value = false
    await carregarUnidades()
    
    notificationStore.sucesso('Unidade de consumo criada com sucesso!')
  } catch (error) {
    console.error('[UnidadesConsumoView] Erro ao criar unidade:', error)
    
    // Tratamento de erros conforme documento
    if (error.response?.status === 400) {
      const msg = error.response.data.message
      if (msg.includes('já possui uma unidade ativa')) {
        notificationStore.erro('Este cliente já possui uma unidade ativa. Feche a unidade anterior primeiro.')
      } else {
        notificationStore.erro('Erro: ' + msg)
      }
    } else if (error.response?.status === 404) {
      notificationStore.erro('Unidade de atendimento não encontrada')
    } else {
      notificationStore.erro('Erro ao criar unidade de consumo')
    }
  } finally {
    loading.value = false
  }
}

const confirmarFecharUnidade = (unidade) => {
  unidadeParaFechar.value = unidade
  mostrarConfirmacaoFechar.value = true
}

const fecharUnidade = async () => {
  try {
    loading.value = true
    await unidadesConsumoService.fechar(unidadeParaFechar.value.id)
    await carregarUnidades()
    notificationStore.sucesso('Unidade fechada com sucesso!')
    mostrarConfirmacaoFechar.value = false
    unidadeParaFechar.value = null
  } catch (error) {
    console.error('[UnidadesConsumoView] Erro ao fechar unidade:', error)
    notificationStore.erro('Erro ao fechar unidade de consumo')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregarUnidades()
})

const getStatusBadge = (status) => {
  // Conforme documento backend: DISPONIVEL, OCUPADA, AGUARDANDO_PAGAMENTO, FINALIZADA
  const badges = {
    'DISPONIVEL': 'badge-info',
    'OCUPADA': 'badge-success',
    'AGUARDANDO_PAGAMENTO': 'badge-warning',
    'FINALIZADA': 'badge-secondary'
  }
  return badges[status] || 'badge-info'
}

const getStatusBorder = (status) => {
  const borders = {
    'DISPONIVEL': 'border-info bg-info/5',
    'OCUPADA': 'border-success bg-success/5',
    'AGUARDANDO_PAGAMENTO': 'border-warning bg-warning/5',
    'FINALIZADA': 'border-border bg-background'
  }
  return borders[status] || 'border-info bg-info/5'
}

const getStatusLabel = (status) => {
  const labels = {
    'DISPONIVEL': 'Disponível',
    'OCUPADA': 'Ocupada',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'FINALIZADA': 'Finalizada'
  }
  return labels[status] || status
}

const getTipoLabel = (tipo) => {
  // Conforme documento backend: MESA_FISICA, QUARTO, AREA_EVENTO, ESPACO_LOUNGE, VIRTUAL
  const labels = {
    'MESA_FISICA': 'Mesa',
    'QUARTO': 'Quarto',
    'AREA_EVENTO': 'Evento',
    'ESPACO_LOUNGE': 'Lounge',
    'VIRTUAL': 'Virtual/Delivery'
  }
  return labels[tipo] || tipo
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Unidades de Consumo</h2>
        <p class="text-text-secondary mt-1">
          <span v-if="authStore.isAdmin">Visão global - Todas as unidades de atendimento</span>
          <span v-else>{{ unidadesTotal }} unidades no seu setor</span>
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-text-secondary">{{ unidadesOcupadas }} de {{ unidadesTotal }} ocupadas</span>
          <div class="w-32 bg-border rounded-full h-2">
            <div class="bg-primary h-2 rounded-full" :style="`width: ${porcentagemOcupacao}%`"></div>
          </div>
        </div>
        <button @click="abrirModalNova" class="btn btn-primary">
          + Nova Unidade
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="flex space-x-2 mb-6">
        <button @click="filtroStatus = 'TODAS'" 
                :class="filtroStatus === 'TODAS' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Todas</button>
        <button @click="filtroStatus = 'OCUPADA'" 
                :class="filtroStatus === 'OCUPADA' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Ocupadas</button>
        <button @click="filtroStatus = 'AGUARDANDO_PAGAMENTO'" 
                :class="filtroStatus === 'AGUARDANDO_PAGAMENTO' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Aguardando Pagamento</button>
        <button @click="filtroStatus = 'FINALIZADA'" 
                :class="filtroStatus === 'FINALIZADA' ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'"
                class="px-4 py-2 rounded-lg text-sm font-medium">Finalizadas</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="i in 10" :key="i" class="rounded-lg p-6 animate-pulse bg-gray-200 h-40"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="unidadesFiltradas.length === 0" class="text-center py-12 text-text-secondary">
        <p class="text-lg mb-2">Nenhuma unidade de consumo encontrada</p>
        <button @click="abrirModalNova" class="btn btn-primary mt-4">
          + Criar Primeira Unidade
        </button>
      </div>

      <!-- Grid de Unidades -->
      <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div v-for="unidade in unidadesFiltradas" :key="unidade.id" 
             :class="['border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow', getStatusBorder(unidade.status)]">
          
          <!-- Cabeçalho do Card -->
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="text-2xl font-bold text-text-primary">{{ unidade.numero || '—' }}</div>
              <p class="text-xs text-text-secondary">{{ getTipoLabel(unidade.tipo) }}</p>
            </div>
            <span :class="['text-xs px-2 py-1 rounded-full', getStatusBadge(unidade.status)]">
              {{ getStatusLabel(unidade.status) }}
            </span>
          </div>

          <!-- Referência -->
          <p class="text-sm font-medium text-text-primary mb-2 truncate">{{ unidade.referencia }}</p>

          <!-- Cliente (conforme estrutura backend) -->
          <p v-if="unidade.cliente" class="text-xs text-text-secondary mb-2 truncate">
            👤 {{ unidade.cliente.nome }}
          </p>
          <p v-if="unidade.cliente?.telefone" class="text-xs text-text-secondary mb-1 truncate">
            📞 {{ unidade.cliente.telefone }}
          </p>

          <!-- Unidade de Atendimento (para ADMIN) -->
          <p v-if="authStore.isAdmin && unidade.nomeUnidadeAtendimento" 
             class="text-xs text-info mb-2 truncate">
            🏢 {{ unidade.nomeUnidadeAtendimento }}
          </p>

          <!-- Informações de Ocupação -->
          <div v-if="unidade.status === 'OCUPADA' || unidade.status === 'AGUARDANDO_PAGAMENTO'" class="mt-3 pt-3 border-t border-border">
            <p class="text-xs text-text-secondary">Valor consumido:</p>
            <p class="text-sm font-bold text-error">{{ formatCurrency(unidade.total || 0) }}</p>
            
            <p v-if="unidade.pedidos && unidade.pedidos.length > 0" class="text-xs text-text-secondary mt-1">
              {{ unidade.pedidos.length }} pedido(s)
            </p>
            
            <button v-if="authStore.isAdmin || authStore.isGerente"
                    @click.stop="confirmarFecharUnidade(unidade)" 
                    class="mt-2 w-full px-2 py-1 text-xs bg-error text-white rounded hover:bg-error/80">
              Fechar Conta
            </button>
          </div>

          <!-- Capacidade -->
          <p v-else class="text-xs text-text-secondary mt-2">
            👥 {{ unidade.capacidade || 4 }} lugares
          </p>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Unidade -->
    <div v-if="mostrarModalNova" class="modal-overlay" @click.self="mostrarModalNova = false">
      <div class="modal-content max-w-md">
        <div class="modal-header">
          <h2>Nova Unidade de Consumo</h2>
          <button @click="mostrarModalNova = false" class="btn-close">✕</button>
        </div>
        <form @submit.prevent="criarUnidade" class="modal-body space-y-4">
          
          <!-- Telefone Cliente (OBRIGATÓRIO conforme backend) -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Telefone do Cliente *
            </label>
            <input v-model="formNovaUnidade.telefoneCliente" 
                   type="tel" 
                   placeholder="+244923456789"
                   class="input"
                   required 
                   pattern="^\+244\d{9}$"
                   title="Formato: +244 seguido de 9 dígitos" />
            <p class="text-xs text-text-secondary mt-1">
              Formato: +244XXXXXXXXX (9 dígitos)
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Referência *</label>
            <input v-model="formNovaUnidade.referencia" 
                   type="text" 
                   placeholder="Ex: Mesa 10"
                   class="input"
                   required />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tipo *</label>
            <select v-model="formNovaUnidade.tipo" class="input" required>
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
              <input v-model.number="formNovaUnidade.numero" 
                     type="number" 
                     placeholder="10"
                     class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Capacidade</label>
              <input v-model.number="formNovaUnidade.capacidade" 
                     type="number" 
                     placeholder="4"
                     class="input"
                     min="1" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">QR Code</label>
            <input v-model="formNovaUnidade.qrCode" 
                   type="text" 
                   placeholder="Ex: QR12345"
                   class="input" />
            <p class="text-xs text-text-secondary mt-1">
              Opcional - para vincular com QR Code físico
            </p>
          </div>

          <div class="flex space-x-2 pt-4">
            <button type="button" @click="mostrarModalNova = false" 
                    class="btn btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" :disabled="loading" 
                    class="btn btn-primary flex-1">
              {{ loading ? 'Criando...' : 'Criar Unidade' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Diálogo de Confirmação: Fechar Unidade -->
    <ConfirmDialog
      v-if="unidadeParaFechar"
      :is-open="mostrarConfirmacaoFechar"
      title="Fechar Unidade de Consumo"
      :message="`Deseja fechar ${unidadeParaFechar.referencia}? Esta ação encerrará o consumo e finalizará todos os pedidos pendentes.`"
      variant="danger"
      confirm-text="Fechar Unidade"
      cancel-text="Cancelar"
      :loading="loading"
      loading-text="Fechando..."
      @confirm="fecharUnidade"
      @cancel="mostrarConfirmacaoFechar = false; unidadeParaFechar = null"
    />
  </div>
</template>

<style scoped>
.badge-success {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: var(--color-success);
  color: white;
}

.badge-error {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: var(--color-error);
  color: white;
}

.badge-warning {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: var(--color-warning);
  color: white;
}

.badge-info {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: var(--color-info);
  color: white;
}

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
  max-width: 28rem;
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
