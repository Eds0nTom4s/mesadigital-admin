<template>
  <teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="handleCancel"
        @keydown.esc="handleCancel"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-md w-full"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between p-6 border-b border-border">
            <div class="flex items-start space-x-3">
              <!-- Icon based on variant -->
              <div
                v-if="variant === 'danger'"
                class="flex-shrink-0 w-10 h-10 bg-error/10 rounded-full flex items-center justify-center"
              >
                <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div
                v-else-if="variant === 'warning'"
                class="flex-shrink-0 w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center"
              >
                <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div
                v-else
                class="flex-shrink-0 w-10 h-10 bg-info/10 rounded-full flex items-center justify-center"
              >
                <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <h3 :id="titleId" class="text-lg font-semibold text-text-primary">
                  {{ title }}
                </h3>
              </div>
            </div>

            <button
              @click="handleCancel"
              class="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Fechar diálogo"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <p class="text-text-secondary">{{ message }}</p>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-border">
            <button
              ref="cancelButton"
              @click="handleCancel"
              class="btn-secondary"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmButton"
              @click="handleConfirm"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition-opacity',
                variant === 'danger' ? 'bg-error text-white hover:opacity-90' : 'btn-primary'
              ]"
              :disabled="loading"
            >
              <svg v-if="loading" class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span v-if="loading">{{ loadingText }}</span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

/**
 * ConfirmDialog - Componente reutilizável para confirmação de ações
 * 
 * Props:
 * - isOpen: boolean - controla visibilidade do diálogo
 * - title: string - título do diálogo
 * - message: string - mensagem de confirmação
 * - variant: 'info' | 'warning' | 'danger' - estilo visual
 * - confirmText: string - texto do botão de confirmação
 * - cancelText: string - texto do botão de cancelamento
 * - loading: boolean - estado de carregamento
 * - loadingText: string - texto durante carregamento
 * 
 * Emits:
 * - confirm: emitido quando usuário confirma
 * - cancel: emitido quando usuário cancela
 */

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingText: {
    type: String,
    default: 'Processando...'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmButton = ref(null)
const cancelButton = ref(null)
const titleId = `confirm-dialog-${Math.random().toString(36).substr(2, 9)}`

// Focus management
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    // Focus confirm button when dialog opens
    await nextTick()
    confirmButton.value?.focus()
  }
})

const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
