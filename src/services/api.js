import axios from 'axios'

/**
 * Configuração base do Axios para integração com a API
 * 
 * Centraliza todas as chamadas HTTP do painel administrativo
 * Inclui interceptors para autenticação e tratamento de erros
 */

// Base URL da API (configurar conforme ambiente)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Configuração do Axios
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000
}

// Instância do Axios configurada
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor - Adiciona token JWT de autenticação
api.interceptors.request.use(
  (config) => {
    // Obter token do localStorage (usado pela auth store)
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      
      // Debug: decodificar e mostrar conteúdo do token
      if (import.meta.env.DEV) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          console.log(`[API] Token JWT enviado:`, {
            sub: payload.sub,
            roles: payload.roles,
            unidadeAtendimentoId: payload.unidadeAtendimentoId,
            exp: new Date(payload.exp * 1000).toLocaleString()
          })
        } catch (e) {
          console.warn('[API] Erro ao decodificar token:', e)
        }
      }
    } else {
      console.warn('[API] Nenhum token encontrado no localStorage')
    }
    
    // Log de requisições em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    return config
  },
  (error) => {
    console.error('[API] Request Error:', error)
    return Promise.reject(error)
  }
)

// Response Interceptor - Trata erros globalmente
api.interceptors.response.use(
  (response) => {
    // Log de respostas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[API] Response from ${response.config.url}:`, response.status)
    }
    return response
  },
  (error) => {
    // Tratamento de erros por código HTTP
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token inválido ou expirado - redireciona para login
          console.error('[API] Token inválido ou expirado')
          sessionStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token_expires')
          sessionStorage.removeItem('auth_user')
          
          // Evita loop infinito se já estiver na tela de login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
          break
        
        case 403:
          console.error('[API] Acesso negado - permissão insuficiente')
          break
        
        case 404:
          console.error('[API] Recurso não encontrado:', data?.message)
          break
        
        case 500:
          console.error('[API] Erro interno do servidor:', data?.message)
          break
        
        default:
          console.error('[API] Erro:', error.response.status, error.response.data)
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('[API] Sem resposta do servidor')
    } else {
      // Erro na configuração da requisição
      console.error('[API] Erro na configuração:', error.message)
    }
    
    return Promise.reject(error)
  }
)

/**
 * Serviços da API organizados por domínio
 */

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
}

export const pedidosService = {
  getAll: (params) => api.get('/pedidos', { params }),
  getById: (id) => api.get(`/pedidos/${id}`),
  create: (data) => api.post('/pedidos', data),
  update: (id, data) => api.put(`/pedidos/${id}`, data),
  delete: (id) => api.delete(`/pedidos/${id}`),
  updateStatus: (id, status) => api.patch(`/pedidos/${id}/status`, { status })
}

export const produtosService = {
  getAll: (params) => api.get('/produtos', { params }),
  getById: (id) => api.get(`/produtos/${id}`),
  create: (data) => api.post('/produtos', data),
  update: (id, data) => api.put(`/produtos/${id}`, data),
  delete: (id) => api.delete(`/produtos/${id}`),
  updateStock: (id, quantity) => api.patch(`/produtos/${id}/stock`, { quantity })
}

export const mesasService = {
  getAll: (params) => api.get('/mesas', { params }),
  getById: (id) => api.get(`/mesas/${id}`),
  create: (data) => api.post('/mesas', data),
  update: (id, data) => api.put(`/mesas/${id}`, data),
  delete: (id) => api.delete(`/mesas/${id}`),
  updateStatus: (id, status) => api.patch(`/mesas/${id}/status`, { status })
}

export const fundosService = {
  getAll: (params) => api.get('/fundos', { params }),
  getById: (id) => api.get(`/fundos/${id}`),
  create: (data) => api.post('/fundos', data),
  update: (id, data) => api.put(`/fundos/${id}`, data),
  close: (id) => api.post(`/fundos/${id}/close`),
  addTransaction: (id, data) => api.post(`/fundos/${id}/transactions`, data)
}

export const usuariosService = {
  getAll: (params) => api.get('/usuarios', { params }),
  getById: (id) => api.get(`/usuarios/${id}`),
  create: (data) => api.post('/usuarios', data),
  update: (id, data) => api.put(`/usuarios/${id}`, data),
  delete: (id) => api.delete(`/usuarios/${id}`),
  updatePermissions: (id, permissions) => api.patch(`/usuarios/${id}/permissions`, { permissions })
}

export const auditoriaService = {
  getAll: (params) => api.get('/auditoria', { params }),
  getById: (id) => api.get(`/auditoria/${id}`),
  export: (params) => api.get('/auditoria/export', { params, responseType: 'blob' })
}

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/activity'),
  getTopProducts: () => api.get('/dashboard/top-products')
}

// Exporta a instância do Axios para casos customizados
export default api
