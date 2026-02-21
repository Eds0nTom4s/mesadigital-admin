import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Store de Autenticação
 * 
 * Gerencia o estado de autenticação do usuário no painel administrativo.
 * Usa dados reais do backend após login.
 */

export const useAuthStore = defineStore('auth', () => {
  // Estado - SEM DADOS MOCK
  const user = ref(null)
  const isAuthenticated = ref(false)
  const token = ref(null)

  // Getters
  const userInitials = computed(() => {
    if (!user.value?.name) return ''
    const names = user.value.name.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
  })

  const isAdmin = computed(() => {
    return user.value?.roles?.includes('ROLE_ADMIN') || user.value?.role === 'ADMIN'
  })

  const isGerente = computed(() => {
    return user.value?.roles?.includes('ROLE_GERENTE') || user.value?.role === 'GERENTE'
  })

  const hasPermission = computed(() => {
    return (permission) => {
      return user.value?.permissions?.includes(permission) || false
    }
  })

  // Actions
  const login = async (telefone, senha) => {
    // Integração real com API - sem mock
    try {
      console.log('[Auth] Iniciando login...', { telefone })
      
      const response = await fetch('http://localhost:8080/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone, senha })
      })
      
      console.log('[Auth] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Auth] Erro na resposta:', errorData)
        throw new Error(errorData.message || 'Credenciais inválidas')
      }
      
      const responseData = await response.json()
      console.log('[Auth] Resposta completa:', JSON.stringify(responseData, null, 2))
      
      // Estrutura REAL do backend (diferente da documentação):
      // { success, message, data: { id, nome, telefone, email, tipoUsuario, token, expiresIn } }
      if (!responseData.data?.token) {
        console.error('[Auth] responseData.data:', responseData.data)
        throw new Error('Token não encontrado na resposta')
      }
      
      const userData = responseData.data
      console.log('[Auth] Token extraído:', userData.token ? 'SIM' : 'NÃO')
      console.log('[Auth] Usuário extraído:', { id: userData.id, nome: userData.nome, tipoUsuario: userData.tipoUsuario })
      
      // Armazenar token
      token.value = userData.token
      localStorage.setItem('token', userData.token)
      console.log('[Auth] Token salvo no localStorage')
      
      // Usar dados do usuário da resposta (estrutura real do backend)
      user.value = {
        id: userData.id,
        name: userData.nome,
        telefone: userData.telefone,
        email: userData.email || '',
        role: userData.tipoUsuario, // GERENTE, ATENDENTE, etc
        roles: [`ROLE_${userData.tipoUsuario}`],
        ativo: true, // Se logou, está ativo
        unidadeAtendimentoId: userData.unidadeAtendimentoId || null,
        permissions: []
      }
      
      console.log('[Auth] Usuário logado:', user.value)
      
      isAuthenticated.value = true
      console.log('[Auth] isAuthenticated:', isAuthenticated.value)
      
      return { success: true }
    } catch (error) {
      console.error('[Auth] Erro no login:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    token.value = null
    localStorage.removeItem('token')
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
  }

  const checkAuth = async () => {
    // Verificar se há token salvo
    const savedToken = localStorage.getItem('token')
    
    if (!savedToken) {
      logout()
      return false
    }
    
    try {
      // Decodificar token e verificar expiração
      const payload = JSON.parse(atob(savedToken.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      
      if (payload.exp && payload.exp < now) {
        // Token expirado
        logout()
        return false
      }
      
      // Restaurar dados do usuário
      token.value = savedToken
      user.value = {
        id: payload.userId || payload.sub,
        name: payload.nome || payload.name,
        email: payload.email || '',
        role: payload.roles?.[0]?.replace('ROLE_', '') || 'ATENDENTE',
        roles: payload.roles || [],
        unidadeAtendimentoId: payload.unidadeAtendimentoId || null,
        permissions: []
      }
      isAuthenticated.value = true
      
      return true
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
    isAdmin,
    isGerente,
    hasPermission,
    // Actions
    login,
    logout,
    updateUser,
    checkAuth
  }
})
