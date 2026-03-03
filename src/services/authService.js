import api from './api'

/**
 * Serviço de Autenticação
 * 
 * Implementa autenticação JWT conforme especificação do backend
 * Token armazenado em sessionStorage (mais seguro que localStorage)
 */

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

/**
 * Faz login com telefone e senha (Admin/Atendente)
 * Endpoint: POST /api/auth/admin/login  ← único endpoint correcto para o Painel
 * Confirmado pelo backend em RESPOSTA_RELATORIO_FRONTEND.txt §3.1
 * NÃO usar /auth/jwt/login (autenticação técnica, não para o Painel)
 *
 * @param {string} telefone - Telefone do utilizador
 * @param {string} senha - Palavra-passe
 * @returns {Promise<{token: string, expiresIn: number, atendente: object}>}
 */
export const login = async (telefone, senha) => {
  try {
    // Endpoint correcto para o Painel Administrativo: POST /auth/admin/login
    // Confirmado pelo backend em RESPOSTA_RELATORIO_FRONTEND.txt §3.1
    const response = await api.post('/auth/admin/login', {
      telefone,
      senha
    })

    // Estrutura de resposta: ApiResponse<AuthResponse>
    // { message, data: { token, tipo, expiresIn, usuario }, error }
    const data = response.data.data || response.data
    // Resposta: { token, tipo: "Bearer", usuario: { id, username, nomeCompleto, telefone, roles } }
    const { token, expiresIn, usuario, atendente } = data
    const user = usuario || atendente

    // Armazena token no sessionStorage (NÃO localStorage por segurança)
    sessionStorage.setItem(TOKEN_KEY, token)
    
    // Armazena timestamp de expiração (expiresIn vem em millisegundos)
    const expirationTime = Date.now() + expiresIn
    sessionStorage.setItem(`${TOKEN_KEY}_expires`, expirationTime)
    
    // Armazena dados do usuário como JSON string
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    }

    return { token, expiresIn, atendente: user }
  } catch (error) {
    // Trata erro 401 (credenciais inválidas)
    if (error.response?.status === 401) {
      throw new Error('Telefone ou senha incorretos')
    }
    // Outros erros
    throw new Error(error.response?.data?.message || 'Erro ao fazer login')
  }
}

/**
 * Faz logout removendo token e dados do sessionStorage
 */
export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(`${TOKEN_KEY}_expires`)
  sessionStorage.removeItem(USER_KEY)
}

/**
 * Obtém token JWT armazenado
 * @returns {string|null}
 */
export const getToken = () => {
  return sessionStorage.getItem(TOKEN_KEY)
}

/**
 * Verifica se usuário está autenticado (possui token válido)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false

  // Verifica se token expirou
  const expirationTime = sessionStorage.getItem(`${TOKEN_KEY}_expires`)
  if (expirationTime && Date.now() > parseInt(expirationTime)) {
    logout() // Remove token expirado
    return false
  }

  return true
}

/**
 * Armazena dados do usuário autenticado
 * @param {Object} user - Dados do usuário
 */
export const setUser = (user) => {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Obtém dados do usuário autenticado
 * @returns {Object|null}
 */
export const getUser = () => {
  const userData = sessionStorage.getItem(USER_KEY)
  if (!userData) return null
  
  try {
    return JSON.parse(userData)
  } catch (error) {
    console.error('Erro ao parsear dados do usuário:', error)
    // Limpa dados corrompidos
    sessionStorage.removeItem(USER_KEY)
    return null
  }
}

export default {
  login,
  logout,
  getToken,
  isAuthenticated,
  setUser,
  getUser
}
