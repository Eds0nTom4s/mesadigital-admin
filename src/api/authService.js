import api from './api'

/**
 * Serviço de Autenticação
 *
 * Implementa autenticação JWT conforme especificação do backend.
 * Token armazenado em localStorage para persistência entre tabs.
 * Chaves alinhadas com auth.js store e api.js interceptor.
 */

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

/**
 * Faz login com username ou telefone e senha (Admin/Atendente)
 * Endpoint: POST /api/auth/admin/login
 * Fonte de Verdade: integration-docs/admin_panel_integration.md §2
 *
 * @param {string} identificador - Username ou telefone do utilizador (+244...)
 * @param {string} senha - Palavra-passe
 * @returns {Promise<Object>} Dados de autenticação e usuário
 */
export const login = async (identificador, senha) => {
  try {
    // Endpoint: /api (prefixo) + /auth/admin/login
    // Payload: { username, senha } ou { telefone, senha }
    const valor = identificador.trim()
    const somenteNumeros = valor.replace(/\D/g, '')
    const pareceTelefone = valor.startsWith('+') || /^\d+$/.test(valor) || somenteNumeros.length >= 9
    const payload = pareceTelefone
      ? { telefone: valor, senha }
      : { username: valor, senha }

    const response = await api.post('/auth/admin/login', payload)

    // Resposta padrão: { success, message, data: { ... } }
    const { success, data, message } = response.data

    if (!success) {
      throw new Error(message || 'Credenciais inválidas')
    }

    // Estrutura conforme documentação:
    // { id, nome, telefone, tipoUsuario, token, tokenType, expiresIn }
    const { token, expiresIn } = data

    // Armazena token
    localStorage.setItem(TOKEN_KEY, token)

    // Armazena timestamp de expiração (expiresIn em segundos)
    const expirationTime = Date.now() + (expiresIn * 1000)
    localStorage.setItem(`${TOKEN_KEY}_expires`, expirationTime)

    // Armazena dados do usuário (omitindo o token)
    const user = { ...data }
    delete user.token
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    return { success: true, user, token }
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Usuário/telefone ou senha incorretos')
    }
    if (error.response?.status === 403) {
      throw new Error('Conta desativada ou permissão insuficiente')
    }
    throw new Error(error.response?.data?.message || 'Falha na conexão com o servidor')
  }
}

/**
 * Faz logout removendo token e dados do sessionStorage
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(`${TOKEN_KEY}_expires`)
  localStorage.removeItem(USER_KEY)
}

/**
 * Obtém token JWT armazenado
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Verifica se usuário está autenticado (possui token válido)
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false

  // Verifica se token expirou
  const expirationTime = localStorage.getItem(`${TOKEN_KEY}_expires`)
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
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * Obtém dados do usuário autenticado
 * @returns {Object|null}
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY)
  if (!userData) return null

  try {
    return JSON.parse(userData)
  } catch (error) {
    console.error('Erro ao parsear dados do usuário:', error)
    // Limpa dados corrompidos
    localStorage.removeItem(USER_KEY)
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
