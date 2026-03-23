<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content max-w-md">
      <div class="modal-header">
        <h2>🟢 Abrir Sessão {{ mesaEfectiva ? '— ' + mesaEfectiva.referencia : '' }}</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      <form @submit.prevent="confirmarAbrirSessao" class="modal-body space-y-4">

        <!-- Picker de mesa quando nenhuma foi pré-seleccionada -->
        <div v-if="!mesa">
          <label class="block text-sm font-medium text-text-primary mb-1">
            Mesa <span class="text-error">*</span>
          </label>
          <select v-model="form.mesaId" class="input-field w-full" required>
            <option :value="null" disabled>Selecione uma mesa disponível</option>
            <option
              v-for="m in mesasDisponiveis"
              :key="m.id"
              :value="m.id"
            >
              {{ m.referencia }}
            </option>
          </select>
          <p v-if="mesasDisponiveis.length === 0" class="text-xs text-error mt-1">
            Não há mesas disponíveis de momento
          </p>
        </div>

        <div v-if="!form.modoAnonimo" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Nome do Cliente
            </label>
            <input
              v-model="form.nomeCliente"
              type="text"
              placeholder="Ex: João Silva"
              class="input-field w-full"
            />
            <p class="text-xs text-text-secondary mt-1">Opcional — ajuda na identificação da mesa</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Telefone do Cliente <span class="text-error">*</span>
            </label>
            <input
              v-model="form.telefoneCliente"
              type="tel"
              placeholder="923456789"
              class="input-field w-full"
              required
            />
            <p class="text-xs text-text-secondary mt-1">Obrigatório — vincula a sessão ao cliente</p>
          </div>
        </div>

        <div>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" v-model="form.modoAnonimo" class="rounded" />
            <span class="text-sm text-text-primary">Modo anônimo (sem cliente vinculado)</span>
          </label>
        </div>

        <div class="flex space-x-2 pt-4">
          <button type="button" @click="$emit('close')" class="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" :disabled="abrindo || (!mesa && !form.mesaId)" class="btn-primary flex-1">
            {{ abrindo ? 'Abrindo...' : 'Abrir Sessão' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import sessoesConsumoService from '@/api/sessoesConsumoService'

const props = defineProps({
  show: { type: Boolean, required: true },
  mesa: { type: Object, default: null },
  mesasDisponiveis: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'sessao-aberta'])

const notificationStore = useNotificationStore()

const abrindo = ref(false)
const form = ref({
  mesaId: null,
  telefoneCliente: '',
  nomeCliente: '',
  modoAnonimo: false
})

// Mesa efectivamente seleccionada (prop ou picker)
const mesaEfectiva = computed(() => {
  if (props.mesa) return props.mesa
  return props.mesasDisponiveis.find(m => m.id === form.value.mesaId) || null
})

// Reset form when modal opens or mesa changes
watch(() => props.show, (val) => {
  if (val) {
    form.value = {
      mesaId: props.mesa?.id ?? null,
      telefoneCliente: '',
      nomeCliente: '',
      modoAnonimo: false
    }
  }
})

const confirmarAbrirSessao = async () => {
  const mesaId = props.mesa?.id ?? form.value.mesaId
  if (!mesaId) {
    notificationStore.erro('Selecione uma mesa')
    return
  }

  if (!form.value.modoAnonimo) {
    const tel = (form.value.telefoneCliente || '').replace(/\D/g, '')
    if (tel.length < 9) {
      notificationStore.erro('Telefone obrigatório no fluxo identificado (mínimo 9 dígitos)')
      return
    }
  }

  try {
    abrindo.value = true

    const payload = { mesaId, modoAnonimo: form.value.modoAnonimo }
    if (!payload.modoAnonimo) {
      payload.telefoneCliente = form.value.telefoneCliente
      payload.nomeCliente = form.value.nomeCliente
    }

    const sessao = await sessoesConsumoService.abrir(payload)
    notificationStore.sucesso('Sessão aberta! Mesa está ocupada.')
    emit('sessao-aberta', sessao)
    emit('close')
  } catch (error) {
    console.error('[ModalAbrirSessao] Erro ao abrir sessão:', error)
    const status = error.response?.status
    const msg = error.response?.data?.message || error.response?.data?.error || error.message

    if (status === 400) {
      // Regra de negócio: sessão anónima já existe, cliente já tem sessão, etc.
      notificationStore.erro(msg || 'Pedido inválido — verifique os dados e tente novamente')
    } else if (status === 409) {
      if (msg.toLowerCase().includes('cliente')) {
        notificationStore.erro('Este cliente já possui uma sessão aberta em outra mesa')
      } else {
        notificationStore.erro('Esta mesa já está ocupada. Recarregue e tente novamente.')
      }
    } else if (status === 422) {
      notificationStore.erro('Mesa inativa — não é possível abrir uma sessão')
    } else {
      notificationStore.erro('Erro ao abrir sessão: ' + msg)
    }
  } finally {
    abrindo.value = false
  }
}
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
  font-size: 1.1rem;
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
.btn-close:hover { color: #111827; }
.modal-body {
  padding: 1.5rem;
  background-color: #ffffff;
}
</style>
