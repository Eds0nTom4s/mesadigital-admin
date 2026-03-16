import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/api/authService'

/**
 * Store de Autenticação
 * 
 * Gerencia o estado de autenticação do usuário no painel administrativo.
 * Baseado EXCLUSIVAMENTE na documentação em integration-docs/admin_panel_integration.md
 */

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const isAuthenticated = ref(false)
  const token = ref(null)

  // Getters
  const userInitials = computed(() => {
    if (!user.value?.nome) return ''
    const names = user.value.nome.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
  })

  const isAdmin = computed(() => {
    return user.value?.tipoUsuario === 'ADMIN' || user.value?.roles?.includes('ROLE_ADMIN')
  })

  const isGerente = computed(() => {
    return user.value?.tipoUsuario === 'GERENTE' || user.value?.roles?.includes('ROLE_GERENTE')
  })

  const isAtendente = computed(() => {
    return user.value?.tipoUsuario === 'ATENDENTE' || user.value?.roles?.includes('ROLE_ATENDENTE')
  })

  const isCozinha = computed(() => {
    return user.value?.tipoUsuario === 'COZINHA' || user.value?.roles?.includes('ROLE_COZINHA')
  })

  const hasPermission = computed(() => {
    return (permission) => {
      // No momento as permissões são baseadas nos roles/tipoUsuario
      if (isAdmin.value) return true
      return false
    }
  })

  // Actions
  /**
   * Realiza o login do operador
   * @param {string} telefone - +244...
   * @param {string} senha - password
   */
  const login = async (telefone, senha) => {
    try {
      console.log('[AuthStore] Iniciando login para:', telefone)
      
      const result = await authService.login(telefone, senha)
      
      if (result.success) {
        user.value = {
          ...result.user,
          // Mapeamento de conveniência para compatibilidade com componentes existentes
          role: result.user.tipoUsuario,
          roles: [`ROLE_${result.user.tipoUsuario}`]
        }
        token.value = result.token
        isAuthenticated.value = true
        
        // Sincronizar com localStorage para persistência entre tabs se necessário
        // (Service já usa sessionStorage para segurança extra)
        localStorage.setItem('token', result.token)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        console.log('[AuthStore] Login bem-sucedido:', user.value.tipoUsuario)
        return { success: true }
      }
      
      return { success: false, error: 'Erro desconhecido' }
    } catch (error) {
      console.error('[AuthStore] Erro no login:', error.message)
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
