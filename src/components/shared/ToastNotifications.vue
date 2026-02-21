<template>
  <teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <transition-group name="toast">
        <div
          v-for="notificacao in notificacoes"
          :key="notificacao.id"
          class="rounded-lg shadow-lg p-4 flex items-start space-x-3 backdrop-blur-sm"
          :class="classesPorTipo[notificacao.tipo] || classesPorTipo.info"
        >
          <!-- Ícone -->
          <div class="flex-shrink-0">
            <component :is="iconePorTipo[notificacao.tipo]" class="w-6 h-6" />
          </div>

          <!-- Conteúdo -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">
              {{ notificacao.mensagem }}
            </p>
          </div>

          <!-- Botão fechar -->
          <button
            @click="remover(notificacao.id)"
            class="flex-shrink-0 text-current hover:opacity-70 transition-opacity"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useNotificationStore } from '@/store/notifications'

const notificationStore = useNotificationStore()
const { notificacoes } = storeToRefs(notificationStore)
const { remover } = notificationStore

// Classes CSS por tipo
const classesPorTipo = {
  success: 'bg-success/90 text-white',
  error: 'bg-error/90 text-white',
  warning: 'bg-warning/90 text-white',
  info: 'bg-info/90 text-white'
}

// Ícones por tipo (usando h() para evitar runtime compilation)
import { h } from 'vue'

const iconePorTipo = {
  success: () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 
      'fill-rule': 'evenodd', 
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z', 
      'clip-rule': 'evenodd' 
    })
  ]),
  error: () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 
      'fill-rule': 'evenodd', 
      d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z', 
      'clip-rule': 'evenodd' 
    })
  ]),
  warning: () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 
      'fill-rule': 'evenodd', 
      d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z', 
      'clip-rule': 'evenodd' 
    })
  ]),
  info: () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
    h('path', { 
      'fill-rule': 'evenodd', 
      d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z', 
      'clip-rule': 'evenodd' 
    })
  ])
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
