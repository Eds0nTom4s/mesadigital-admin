<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <h3 class="text-xl font-semibold text-text-primary">Alterar Senha</h3>
        <button @click="$emit('close')" class="text-text-secondary hover:text-text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="salvar" class="p-6 space-y-4">
        <!-- Info do usuário -->
        <div class="bg-background rounded-lg p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-semibold">{{ getInitials(usuario.nome) }}</span>
            </div>
            <div>
              <p class="font-medium text-text-primary">{{ usuario.nome }}</p>
              <p class="text-sm text-text-secondary">{{ usuario.telefone }}</p>
            </div>
          </div>
        </div>

        <!-- Nova senha -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">
            Nova Senha * <span class="text-xs text-text-secondary">(mínimo 6 caracteres)</span>
          </label>
          <div class="relative">
            <input
              v-model="novaSenha"
              :type="mostrarSenha ? 'text' : 'password'"
              required
              minlength="6"
              class="input-field w-full pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="mostrarSenha = !mostrarSenha"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
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

        <!-- Confirmar senha -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">
            Confirmar Nova Senha *
          </label>
          <input
            v-model="confirmarSenha"
            type="password"
            required
            minlength="6"
            class="input-field w-full"
            placeholder="••••••••"
          />
        </div>

        <!-- Força da senha -->
        <div v-if="novaSenha" class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-text-secondary">Força da senha:</span>
            <span :class="getForcaSenhaColor(forcaSenha)">{{ getForcaSenhaLabel(forcaSenha) }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              :class="getForcaSenhaBg(forcaSenha)"
              class="h-2 rounded-full transition-all duration-300"
              :style="{ width: `${forcaSenha}%` }"
            ></div>
          </div>
        </div>

        <!-- Erro -->
        <div v-if="erro" class="bg-error/10 border border-error text-error rounded-lg p-3 text-sm">
          {{ erro }}
        </div>

        <!-- Aviso -->
        <div class="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-text-secondary">
          <div class="flex gap-2">
            <svg class="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p>O usuário precisará usar a nova senha no próximo login.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            @click="$emit('close')"
            class="px-6 py-2 border border-border rounded-lg text-text-primary hover:bg-background transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading || !senhasValidas"
            class="btn-primary px-6 py-2"
            :class="{ 'opacity-60 cursor-not-allowed': loading || !senhasValidas }"
          >
            <span v-if="loading">Alterando...</span>
            <span v-else>Alterar Senha</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import usuariosService from '@/services/usuariosService'

const props = defineProps({
  usuario: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'sucesso'])

// Estado
const novaSenha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)
const loading = ref(false)
const erro = ref('')

// Validação
const senhasValidas = computed(() => {
  return novaSenha.value.length >= 6 && 
         novaSenha.value === confirmarSenha.value
})

// Força da senha
const forcaSenha = computed(() => {
  const senha = novaSenha.value
  if (!senha) return 0
  
  let forca = 0
  
  // Comprimento
  if (senha.length >= 6) forca += 25
  if (senha.length >= 8) forca += 25
  
  // Contém números
  if (/\d/.test(senha)) forca += 25
  
  // Contém letras maiúsculas e minúsculas
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) forca += 15
  
  // Contém caracteres especiais
  if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) forca += 10
  
  return Math.min(forca, 100)
})

// Salvar
const salvar = async () => {
  try {
    loading.value = true
    erro.value = ''
    
    if (novaSenha.value !== confirmarSenha.value) {
      erro.value = 'As senhas não coincidem'
      return
    }
    
    if (novaSenha.value.length < 6) {
      erro.value = 'A senha deve ter no mínimo 6 caracteres'
      return
    }
    
    await usuariosService.alterarSenha(props.usuario.id, novaSenha.value)
    emit('sucesso')
  } catch (error) {
    console.error('[ModalAlterarSenha] Erro ao alterar senha:', error)
    erro.value = error.message || 'Erro ao alterar senha. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Utilitários
const getInitials = (nome) => {
  if (!nome) return '?'
  const partes = nome.split(' ')
  if (partes.length > 1) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }
  return partes[0][0].toUpperCase()
}

const getForcaSenhaLabel = (forca) => {
  if (forca < 40) return 'Fraca'
  if (forca < 70) return 'Média'
  return 'Forte'
}

const getForcaSenhaColor = (forca) => {
  if (forca < 40) return 'text-error'
  if (forca < 70) return 'text-warning'
  return 'text-success'
}

const getForcaSenhaBg = (forca) => {
  if (forca < 40) return 'bg-error'
  if (forca < 70) return 'bg-warning'
  return 'bg-success'
}
</script>
