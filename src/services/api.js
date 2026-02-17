import axios from 'axios'

/**
 * Configuração base do Axios para integração com a API
 * 
 * Centraliza todas as chamadas HTTP do painel administrativo
 * Inclui interceptors para autenticação e tratamento de erros
 */

// Base URL da API (configurar conforme ambiente)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Instância do Axios configurada
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor - Adiciona token de autenticação
api.interceptors.request.use(
  (config) => {
    // Obter token do localStorage ou store
    const token = localStorage.getItem('auth_token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log de requisições (remover em produção)
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    
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
    // Log de respostas (remover em produção)
    console.log(`[API] Response from ${response.config.url}:`, response.status)
    return response
  },
  (error) => {
    // Tratamento de erros por código HTTP
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token inválido ou expirado
          console.error('[API] Não autenticado - redirecionando para login')
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break
        
        case 403:
          console.error('[API] Acesso negado - permissão insuficiente')
          break
        
        case 404:
          console.error('[API] Recurso não encontrado')
          break
        
        case 500:
          console.error('[API] Erro interno do servidor')
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
