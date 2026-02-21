<script setup>
import LoadingSpinner from './LoadingSpinner.vue'

/**
 * FullPageLoading - Loading de tela cheia
 * 
 * Exibe overlay com logo animado
 * Usado em transições de rota e carregamento inicial
 */

defineProps({
  mensagem: {
    type: String,
    default: 'Carregando...'
  },
  show: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-background via-card to-background backdrop-blur-sm">
      <div class="flex flex-col items-center">
        <LoadingSpinner tamanho="xl" :mensagem="mensagem" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
