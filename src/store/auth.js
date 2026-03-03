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
      
      const response = await fetch('/api/auth/admin/login', {
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

      // [BACKEND] expiresIn é em SEGUNDOS (86400 = 24h), NÃO milissegundos.
      // A expiração real é lida pelo checkAuth() via claim 'exp' do JWT.
      // Fórmula correta se necessário: Date.now() + (userData.expiresIn * 1000)

      // Armazenar token
      token.value = userData.token
      localStorage.setItem('token', userData.token)
      console.log('[Auth] Token salvo no localStorage')
      
      // Usar dados do usuário da resposta (estrutura real do backend)
      // [BACKEND] campo é 'tipoUsuario' (string), NÃO 'role' nem 'roles'
      user.value = {
        id: userData.id,
        name: userData.nome,
        telefone: userData.telefone,
        email: userData.email || '',
        role: userData.tipoUsuario,                    // 'ADMIN' | 'GERENTE' | 'ATENDENTE'
        roles: [`ROLE_${userData.tipoUsuario}`],       // Derivado do tipoUsuario
        ativo: true,
        unidadeAtendimentoId: userData.unidadeAtendimentoId || null, // Não vem no JWT — lido daqui
        permissions: []
      }

      // Persistir dados do utilizador para restaurar após refresh de página
      // (JWT não contém nome, email, unidadeAtendimentoId)
      localStorage.setItem('user', JSON.stringify(user.value))
      
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
    localStorage.removeItem('user')
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
  }

  const checkAuth = async () => {
    // Verificar se há token salvo
    const savedToken = localStorage.getItem('token')
    
    if (!savedToken) {
      console.log('[Auth] checkAuth: Nenhum token encontrado')
      logout()
      return false
    }
    
    try {
      // Decodificar token e verificar expiração
      const payload = JSON.parse(atob(savedToken.split('.')[1]))
      const now = Math.floor(Date.now() / 1000)
      
      console.log('[Auth] checkAuth: Token decodificado', {
        exp: payload.exp,
        now: now,
        expiresIn: payload.exp ? `${Math.floor((payload.exp - now) / 60)} minutos` : 'SEM EXPIRAÇÃO'
      })
      
      if (payload.exp && payload.exp < now) {
        // Token expirado
        console.warn('[Auth] checkAuth: Token EXPIRADO')
        logout()
        return false
      }
      
      // Restaurar dados do utilizador
      // [BACKEND] JWT de /auth/admin/login contém apenas: sub (telefone), roles (STRING), iat, exp
      // Campos como nome, email, id e unidadeAtendimentoId NÃO estão no JWT.
      // São restaurados do localStorage (gravados no login()).

      // [BACKEND] roles é STRING simples: "ROLE_ADMIN" (não array)
      const rolesRaw = payload.roles || ''
      const rolesList = typeof rolesRaw === 'string'
        ? rolesRaw.split(',').map(r => r.trim()).filter(Boolean)
        : (Array.isArray(rolesRaw) ? rolesRaw : [rolesRaw])
      const roleClean = (rolesList[0] || 'ROLE_ATENDENTE').replace('ROLE_', '')

      // Tentar restaurar dados completos do utilizador do localStorage
      let storedUser = {}
      try {
        const raw = localStorage.getItem('user')
        if (raw) storedUser = JSON.parse(raw)
      } catch (_) { /* ignore */ }

      token.value = savedToken
      user.value = {
        ...storedUser,                             // id, name, telefone, email, unidadeAtendimentoId
        role: roleClean,                           // Sempre derivado do JWT (fonte de verdade)
        roles: rolesList,                          // Sempre derivado do JWT
        permissions: storedUser.permissions || []
      }
      isAuthenticated.value = true
      
      console.log('[Auth] checkAuth: Sessão VÁLIDA', user.value)
      return true
    } catch (error) {
      console.error('[Auth] checkAuth: Erro ao validar token:', error)
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
