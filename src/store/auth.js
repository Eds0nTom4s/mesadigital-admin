import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Store de Autenticação
 * 
 * Gerencia o estado de autenticação do usuário no painel administrativo.
 * Atualmente usa dados mock - pronto para integração com backend.
 */

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref({
    id: 1,
    name: 'Margarida Silva',
    email: 'margarida@centraltec.com',
    role: 'Administrador',
    avatar: null,
    permissions: [
      'dashboard.view',
      'pedidos.view',
      'pedidos.edit',
      'produtos.view',
      'produtos.edit',
      'mesas.view',
      'mesas.edit',
      'fundos.view',
      'fundos.edit',
      'usuarios.view',
      'usuarios.edit',
      'auditoria.view'
    ]
  })

  const isAuthenticated = ref(true)
  const token = ref('mock-token-12345')

  // Getters
  const userInitials = computed(() => {
    if (!user.value.name) return ''
    const names = user.value.name.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
  })

  const hasPermission = computed(() => {
    return (permission) => {
      return user.value.permissions.includes(permission)
    }
  })

  // Actions
  const login = async (email, password) => {
    // TODO: Implementar integração com API
    try {
      // Simulação de login
      isAuthenticated.value = true
      return { success: true }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    // TODO: Limpar token do backend
    user.value = null
    isAuthenticated.value = false
    token.value = null
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
  }

  const checkAuth = async () => {
    // TODO: Validar token no backend
    try {
      // Simulação de verificação
      return isAuthenticated.value
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      logout()
      return false
    }
  }

  return {
    // Estado
    user,
    isAuthenticated,
    token,
    // Getters
    userInitials,
    hasPermission,
    // Actions
    login,
    logout,
    updateUser,
    checkAuth
  }
})
