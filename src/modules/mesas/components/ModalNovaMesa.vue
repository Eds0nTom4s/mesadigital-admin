<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content max-w-md">
      <div class="modal-header">
        <h2>Nova Mesa</h2>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>
      <form @submit.prevent="criarMesa" class="modal-body space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">Referência *</label>
          <input
            v-model="form.referencia"
            type="text"
            placeholder="Ex: Mesa 10"
            class="input-field w-full"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">Tipo *</label>
          <select v-model="form.tipo" class="input-field w-full" required>
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
            <input
              v-model.number="form.numero"
              type="number"
              placeholder="10"
              class="input-field w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Capacidade</label>
            <input
              v-model.number="form.capacidade"
              type="number"
              placeholder="4"
              class="input-field w-full"
              min="1"
            />
          </div>
        </div>

        <div>
          <label class="flex items-center space-x-2">
            <input type="checkbox" v-model="form.gerarQrCode" class="rounded" />
            <span class="text-sm text-text-primary">Gerar QR Code automaticamente (válido por 1 ano)</span>
          </label>
        </div>

        <div class="flex space-x-2 pt-4">
          <button type="button" @click="$emit('close')" class="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" :disabled="criando" class="btn-primary flex-1">
            {{ criando ? 'Criando...' : 'Criar Mesa' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import mesasService from '@/services/mesasService'
import qrcodeService from '@/services/qrcodeService'

const props = defineProps({
  show: { type: Boolean, required: true }
})

const emit = defineEmits(['close', 'mesa-criada'])

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const criando = ref(false)
const form = ref({
  referencia: '',
  tipo: 'MESA_FISICA',
  numero: null,
  capacidade: 4,
  unidadeAtendimentoId: null,
  gerarQrCode: true
})

// Reset form when modal opens
watch(() => props.show, (val) => {
  if (val) {
    form.value = {
      referencia: '',
      tipo: 'MESA_FISICA',
      numero: null,
      capacidade: 4,
      unidadeAtendimentoId: authStore.user?.unidadeAtendimentoId || null,
      gerarQrCode: true
    }
  }
})

const criarMesa = async () => {
  try {
    criando.value = true

    const { gerarQrCode, ...dadosMesa } = form.value
    const novaMesa = await mesasService.criar(dadosMesa)
    const mesaData = novaMesa.data || novaMesa

    if (gerarQrCode) {
      try {
        await qrcodeService.gerarQrCode({
          tipo: 'MESA',
          mesaId: mesaData.id,
          validadeMinutos: 525600 // 1 ano
        })
        notificationStore.sucesso('Mesa criada com QR Code!')
      } catch {
        notificationStore.aviso('Mesa criada, mas erro ao gerar QR Code')
      }
    } else {
      notificationStore.sucesso('Mesa criada com sucesso!')
    }

    emit('mesa-criada', mesaData)
    emit('close')
  } catch (error) {
    console.error('[ModalNovaMesa] Erro ao criar mesa:', error)
    if (error.response?.status === 400) {
      notificationStore.erro('Erro: ' + (error.response.data?.message || 'Dados inválidos'))
    } else {
      notificationStore.erro('Erro ao criar mesa')
    }
  } finally {
    criando.value = false
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
.btn-close:hover { color: #111827; }
.modal-body {
  padding: 1.5rem;
  background-color: #ffffff;
}
</style>
