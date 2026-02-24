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

// Controle de requisições em retry
const requestsInRetry = new Map()
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Response Interceptor - Trata erros globalmente com retry logic
api.interceptors.response.use(
  (response) => {
    // Log de respostas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[API] Response from ${response.config.url}:`, response.status)
    }
    
    // Limpar contador de retry em caso de sucesso
    const requestKey = `${response.config.method}_${response.config.url}`
    requestsInRetry.delete(requestKey)
    
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Gerar chave única para a requisição
    const requestKey = `${originalRequest?.method}_${originalRequest?.url}`
    const retryCount = requestsInRetry.get(requestKey) || 0
    
    // Tratamento de erros de rede (sem resposta do servidor)
    if (!error.response) {
      // Retry logic para falhas de rede
      if (retryCount < MAX_RETRIES && !originalRequest._retry) {
        requestsInRetry.set(requestKey, retryCount + 1)
        originalRequest._retry = true
        
        console.warn(`[API] Falha de rede. Tentativa ${retryCount + 1}/${MAX_RETRIES}`)
        
        // Delay progressivo (1s, 2s, 3s)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
        
        return api(originalRequest)
      }
      
      // Após todas as tentativas, retornar erro amigável
      requestsInRetry.delete(requestKey)
      error.mensagemAmigavel = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
      console.error('[API] Sem resposta do servidor após', MAX_RETRIES, 'tentativas')
      return Promise.reject(error)
    }
    
    // Limpar contador de retry em caso de resposta (mesmo que erro)
    requestsInRetry.delete(requestKey)
    
    // Tratamento de erros por código HTTP
    const { status, data } = error.response
    
    switch (status) {
      case 400:
        error.mensagemAmigavel = data?.message || 'Dados inválidos. Verifique as informações e tente novamente.'
        console.error('[API] Requisição inválida:', data?.message)
        break
      
      case 401:
        // Token inválido ou expirado - redireciona para login
        error.mensagemAmigavel = 'Sessão expirada. Por favor, faça login novamente.'
        console.error('[API] Token inválido ou expirado')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Evita loop infinito se já estiver na tela de login
        if (!window.location.pathname.includes('/login')) {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
        break
      
      case 403:
        error.mensagemAmigavel = 'Acesso negado. Você não tem permissão para realizar esta ação.'
        console.error('[API] Acesso negado - permissão insuficiente')
        break
      
      case 404:
        error.mensagemAmigavel = data?.message || 'Recurso não encontrado.'
        console.error('[API] Recurso não encontrado:', data?.message)
        break
      
      case 409:
        error.mensagemAmigavel = data?.message || 'Conflito de dados. O recurso já existe ou está em uso.'
        console.error('[API] Conflito:', data?.message)
        break
      
      case 422:
        error.mensagemAmigavel = data?.message || 'Dados inválidos. Verifique os campos e tente novamente.'
        console.error('[API] Validação falhou:', data?.message)
        break
      
      case 500:
        error.mensagemAmigavel = 'Erro interno do servidor. Nossa equipe foi notificada.'
        console.error('[API] Erro interno do servidor:', data?.message)
        
        // Retry automático para erros 500 (apenas uma vez)
        if (retryCount === 0 && !originalRequest._retry) {
          requestsInRetry.set(requestKey, 1)
          originalRequest._retry = true
          console.warn('[API] Tentando novamente após erro 500...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          return api(originalRequest)
        }
        break
      
      case 502:
      case 503:
      case 504:
        error.mensagemAmigavel = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.'
        console.error('[API] Serviço indisponível:', status)
        
        // Retry automático para erros de gateway
        if (retryCount < 2 && !originalRequest._retry) {
          requestsInRetry.set(requestKey, retryCount + 1)
          originalRequest._retry = true
          console.warn(`[API] Tentativa ${retryCount + 1}/2 após erro ${status}`)
          await new Promise(resolve => setTimeout(resolve, 3000))
          return api(originalRequest)
        }
        break
      
      default:
        error.mensagemAmigavel = data?.message || 'Erro inesperado. Tente novamente.'
        console.error('[API] Erro:', status, data)
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
