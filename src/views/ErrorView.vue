<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="max-w-2xl w-full">
      <div class="card text-center space-y-6">
        <!-- Icon -->
        <div class="flex justify-center">
          <div class="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <div>
          <h1 class="text-3xl font-bold text-text-primary mb-2">Ops! Algo deu errado</h1>
          <p class="text-lg text-text-secondary">
            Encontramos um erro inesperado. Não se preocupe, já estamos trabalhando nisso.
          </p>
        </div>

        <!-- Error Details (apenas em dev) -->
        <div v-if="isDev && error" class="text-left">
          <details class="bg-background rounded-lg p-4">
            <summary class="cursor-pointer text-sm font-medium text-text-primary mb-2">
              Detalhes Técnicos do Erro
            </summary>
            <div class="mt-3 space-y-2">
              <div>
                <p class="text-xs font-semibold text-text-secondary mb-1">Mensagem:</p>
                <p class="text-sm text-error font-mono">{{ error.message }}</p>
              </div>
              <div v-if="error.stack">
                <p class="text-xs font-semibold text-text-secondary mb-1">Stack Trace:</p>
                <pre class="text-xs text-text-primary bg-gray-50 p-3 rounded overflow-x-auto">{{ error.stack }}</pre>
              </div>
              <div v-if="errorInfo">
                <p class="text-xs font-semibold text-text-secondary mb-1">Component Info:</p>
                <pre class="text-xs text-text-primary bg-gray-50 p-3 rounded overflow-x-auto">{{ errorInfo }}</pre>
              </div>
            </div>
          </details>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            @click="recarregar"
            class="btn-primary px-6 py-3"
          >
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Recarregar Página
          </button>
          <button
            @click="voltarInicio"
            class="px-6 py-3 border border-border rounded-lg text-text-primary hover:bg-background transition-colors"
          >
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Voltar ao Início
          </button>
        </div>

        <!-- Help -->
        <div class="pt-6 border-t border-border">
          <p class="text-sm text-text-secondary">
            Se o problema persistir, entre em contato com o suporte técnico.
          </p>
          <p class="text-xs text-text-secondary mt-2">
            Código do erro: <span class="font-mono">{{ errorCode }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  error: {
    type: Error,
    default: null
  },
  errorInfo: {
    type: String,
    default: null
  }
})

const router = useRouter()

const isDev = computed(() => import.meta.env.DEV)
const errorCode = computed(() => {
  const timestamp = new Date().getTime()
  return `ERR-${timestamp.toString(36).toUpperCase()}`
})

const recarregar = () => {
  window.location.reload()
}

const voltarInicio = () => {
  router.push('/admin/dashboard')
}
</script>
