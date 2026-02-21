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
 * Endpoint: POST /api/auth/admin/login
 * Conforme INSTRUCOES_AUTENTICACAO_FRONTEND.txt
 * 
 * @param {string} telefone - Telefone do atendente (ex: 999999999)
 * @param {string} senha - Senha do atendente
 * @returns {Promise<{token: string, expiresIn: number, atendente: object}>}
 */
export const login = async (telefone, senha) => {
  try {
    const response = await api.post('/auth/admin/login', {
      telefone,
      senha
    })

    // Estrutura de resposta conforme documentação:
    // { success, message, data: { token, tipo, expiresIn, atendente }, timestamp }
    const { token, expiresIn, atendente } = response.data.data

    // Armazena token no sessionStorage (NÃO localStorage por segurança)
    sessionStorage.setItem(TOKEN_KEY, token)
    
    // Armazena timestamp de expiração (expiresIn vem em millisegundos)
    const expirationTime = Date.now() + expiresIn
    sessionStorage.setItem(`${TOKEN_KEY}_expires`, expirationTime)
    
    // Armazena dados do atendente como JSON string
    if (atendente) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(atendente))
    }

    return { token, expiresIn, atendente }
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
