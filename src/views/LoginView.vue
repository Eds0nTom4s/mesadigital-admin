<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

/**
 * LoginView - Tela de autenticação
 * 
 * INTEGRAÇÃO COM API BACKEND
 * POST /api/auth/admin/login
 */

const router = useRouter()
const authStore = useAuthStore()

const formulario = ref({
  telefone: '',
  senha: ''
})

const loading = ref(false)
const erro = ref('')
const mostrarSenha = ref(false)

const toggleMostrarSenha = () => {
  mostrarSenha.value = !mostrarSenha.value
}

const fazerLogin = async () => {
  try {
    loading.value = true
    erro.value = ''
    
    // Valida campos (erro inline é mostrado automaticamente)
    if (!formulario.value.telefone) {
      erro.value = 'Informe o telefone'
      loading.value = false
      return
    }
    if (!formulario.value.senha) {
      erro.value = 'Informe a senha'
      loading.value = false
      return
    }
    
    console.log('[LoginView] Tentando login...')
    
    // Chama API de login através da store
    const result = await authStore.login(formulario.value.telefone, formulario.value.senha)
    
    if (result.success) {
      console.log('[LoginView] Login bem-sucedido, redirecionando...')
      // Redireciona para dashboard
      router.push('/admin/dashboard')
    } else {
      erro.value = result.error || 'Credenciais inválidas. Tente novamente.'
    }
    
  } catch (err) {
    console.error('[LoginView] Erro no login:', err)
    erro.value = err.response?.data?.message || 'Credenciais inválidas. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Submit ao pressionar Enter (handler consolidado no form @submit.prevent)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5">
    <div class="w-full max-w-md px-6">
      <!-- Logo e Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-text-primary mb-2">Painel Administrativo</h1>
        <p class="text-text-secondary">Sistema de Gestão - Mesa Digital</p>
      </div>

      <!-- Card de Login -->
      <div class="card">
        <h2 class="text-xl font-semibold text-text-primary mb-6">Entrar no Sistema</h2>

        <!-- Formulário -->
        <form @submit.prevent="fazerLogin" class="space-y-4">
          <!-- Telefone -->
          <div>
            <label for="telefone" class="block text-sm font-medium text-text-primary mb-2">
              Telefone
            </label>
            <input
              id="telefone"
              v-model="formulario.telefone"
              type="tel"
              class="input-field w-full"
              placeholder="999999999"
              :disabled="loading"
              autocomplete="tel"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text-primary mb-2">
              Senha
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="formulario.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                class="input-field w-full pr-10"
                placeholder="Digite sua senha"
                :disabled="loading"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="toggleMostrarSenha"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                :disabled="loading"
                aria-label="Mostrar ou ocultar senha"
              >
                <svg v-if="!mostrarSenha" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Erro -->
          <div v-if="erro" class="bg-error/10 border border-error/20 rounded-lg p-3">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-error mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p class="text-sm text-error">{{ erro }}</p>
            </div>
          </div>

          <!-- Botão -->
          <button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
          >
            <svg v-if="loading" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span v-if="loading">Entrando...</span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <!-- Info de desenvolvimento -->
        <div class="mt-6 pt-6 border-t border-border">
          <p class="text-xs text-text-secondary text-center">
            <strong>Ambiente de Desenvolvimento</strong><br>
            Telefone: <code class="bg-background px-1 py-0.5 rounded">999999999</code> • 
            Senha: <code class="bg-background px-1 py-0.5 rounded">admin123</code><br>
            <span class="text-[10px] mt-1 block">Role: GERENTE (acesso total)</span>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-center">
        <p class="text-sm text-text-secondary">
          © 2026 Mesa Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
code {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}
</style>
