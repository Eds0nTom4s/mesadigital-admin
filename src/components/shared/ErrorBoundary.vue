<template>
  <slot v-if="!hasError" />
  <ErrorView v-else :error="error" :error-info="errorInfo" />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import ErrorView from '@/views/ErrorView.vue'

/**
 * ErrorBoundary - Componente para capturar erros em tempo de execução
 * 
 * Uso:
 * <ErrorBoundary>
 *   <SeuComponente />
 * </ErrorBoundary>
 * 
 * Captura erros não tratados e exibe uma interface amigável
 */

const hasError = ref(false)
const error = ref(null)
const errorInfo = ref(null)

// Hook do Vue 3 para capturar erros dos componentes filhos
onErrorCaptured((err, instance, info) => {
  hasError.value = true
  error.value = err
  errorInfo.value = info
  
  // Log do erro
  console.error('[ErrorBoundary] Erro capturado:', err)
  console.error('[ErrorBoundary] Info:', info)
  console.error('[ErrorBoundary] Componente:', instance)
  
  // Evita propagação do erro
  return false
})

// Expor método para resetar o erro (se necessário)
defineExpose({
  reset: () => {
    hasError.value = false
    error.value = null
    errorInfo.value = null
  }
})
</script>
