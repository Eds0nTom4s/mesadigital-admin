<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content max-w-md">
      <div class="modal-header">
        <h2>🟢 Abrir Sessão — {{ mesa?.referencia }}</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      <form @submit.prevent="confirmarAbrirSessao" class="modal-body space-y-4">
        <div v-if="!form.modoAnonimo">
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
          <p class="text-xs text-text-secondary mt-1">Obrigatório — vincula a sessão a um cliente cadastrado</p>
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
          <button type="submit" :disabled="abrindo" class="btn-primary flex-1">
            {{ abrindo ? 'Abrindo...' : 'Abrir Sessão' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import sessoesConsumoService from '@/services/sessoesConsumoService'

const props = defineProps({
  show: { type: Boolean, required: true },
  mesa: { type: Object, default: null }
})

const emit = defineEmits(['close', 'sessao-aberta'])

const notificationStore = useNotificationStore()

const abrindo = ref(false)
const form = ref({
  mesaId: null,
  telefoneCliente: '',
  modoAnonimo: false
})

// Reset form when modal opens or mesa changes
watch(() => props.show, (val) => {
  if (val) {
    form.value = {
      mesaId: props.mesa?.id ?? null,
      telefoneCliente: '',
      modoAnonimo: false
    }
  }
})

const confirmarAbrirSessao = async () => {
  if (!form.value.modoAnonimo) {
    const tel = (form.value.telefoneCliente || '').replace(/\D/g, '')
    if (tel.length < 9) {
      notificationStore.erro('Telefone obrigatório no fluxo identificado (mínimo 9 dígitos)')
      return
    }
  }

  try {
    abrindo.value = true

    const payload = { ...form.value }
    if (payload.modoAnonimo) delete payload.telefoneCliente

    const sessao = await sessoesConsumoService.abrir(payload)
    notificationStore.sucesso('Sessão aberta! Mesa está ocupada.')
    emit('sessao-aberta', sessao)
    emit('close')
  } catch (error) {
    console.error('[ModalAbrirSessao] Erro ao abrir sessão:', error)
    if (error.response?.status === 409) {
      const msg = error.response.data?.message || ''
      if (msg.toLowerCase().includes('cliente')) {
        notificationStore.erro('Este cliente já possui uma sessão aberta em outra mesa')
      } else {
        notificationStore.erro('Esta mesa já está ocupada. Recarregue o mapa e tente novamente.')
      }
    } else if (error.response?.status === 422) {
      notificationStore.erro('Mesa inativa — não é possível abrir uma sessão')
    } else {
      notificationStore.erro('Erro ao abrir sessão: ' + (error.response?.data?.message || error.message))
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
