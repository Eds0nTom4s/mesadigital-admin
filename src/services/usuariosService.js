import api from './api'

/**
 * Serviço de Gestão de Usuários
 * 
 * Gerencia operações CRUD de usuários do sistema administrativo,
 * controle de roles, permissões e autenticação.
 * 
 * ROLES disponíveis:
 * - ADMIN: Acesso total ao sistema
 * - GERENTE: Gestão operacional da unidade
 * - ATENDENTE: Operações de atendimento (pedidos, mesas)
 * - COZINHA: Visualização e gestão de preparação de pedidos
 */

const usuariosService = {
  /**
   * Lista todos os usuários do sistema
   * @param {Object} params - Parâmetros de filtro
   * @param {string} params.role - Filtrar por role
   * @param {boolean} params.ativo - Filtrar por status ativo
   * @param {string} params.busca - Busca por nome, email ou telefone
   * @returns {Promise<Array>} Lista de usuários
   */
  async listar(params = {}) {
    try {
      console.log('[UsuariosService] Listando usuários...', params)
      
      // Backend usa paginação 0-based (page=0, não pagina=1)
      const queryParams = { ...params }
      if (queryParams.pagina) {
        queryParams.page = queryParams.pagina - 1  // Converter para 0-based
        delete queryParams.pagina
      }
      if (queryParams.tamanhoPagina) {
        queryParams.size = queryParams.tamanhoPagina
        delete queryParams.tamanhoPagina
      }
      
      const response = await api.get('/usuarios', { params: queryParams })
      
      // Unwrap response.data.data se existir (padrão backend)
      const usuarios = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuários carregados:', usuarios.length)
      return usuarios
    } catch (error) {
      // Se endpoint não existe (404), informar que backend precisa implementar
      if (error.response?.status === 404) {
        console.warn('[UsuariosService] ⚠️ Endpoint /api/usuarios não existe no backend ainda!')
        console.warn('Consultar: ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md')
        throw new Error('Módulo de usuários ainda não implementado no backend')
      }
      console.error('[UsuariosService] Erro ao listar usuários:', error)
      throw error
    }
  },

  /**
   * Busca usuário por ID
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Dados do usuário
   */
  async buscarPorId(id) {
    try {
      console.log('[UsuariosService] Buscando usuário:', id)
      const response = await api.get(`/usuarios/${id}`)
      
      const usuario = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuário encontrado:', usuario.nome)
      return usuario
    } catch (error) {
      console.error('[UsuariosService] Erro ao buscar usuário:', error)
      throw error
    }
  },

  /**
   * Cria novo usuário
   * @param {Object} dados - Dados do usuário
   * @param {string} dados.nome - Nome completo
   * @param {string} dados.email - Email (opcional)
   * @param {string} dados.telefone - Telefone (obrigatório para login)
   * @param {string} dados.senha - Senha inicial
   * @param {string} dados.role - ADMIN | GERENTE | ATENDENTE | COZINHA
   * @param {number} dados.unidadeId - ID da unidade (opcional para ADMIN)
   * @returns {Promise<Object>} Usuário criado
   */
  async criar(dados) {
    try {
      console.log('[UsuariosService] Criando usuário:', dados.nome)
      
      // Validações básicas
      if (!dados.nome || !dados.telefone || !dados.senha || !dados.role) {
        throw new Error('Campos obrigatórios: nome, telefone, senha e role')
      }
      
      const response = await api.post('/usuarios', dados)
      
      const usuario = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuário criado com sucesso:', usuario.id)
      return usuario
    } catch (error) {
      console.error('[UsuariosService] Erro ao criar usuário:', error)
      
      // Mensagens de erro amigáveis
      if (error.response?.status === 409) {
        throw new Error('Telefone já cadastrado no sistema')
      }
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Dados inválidos')
      }
      
      throw error
    }
  },

  /**
   * Atualiza dados do usuário
   * @param {number} id - ID do usuário
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise<Object>} Usuário atualizado
   */
  async atualizar(id, dados) {
    try {
      console.log('[UsuariosService] Atualizando usuário:', id)
      
      const response = await api.put(`/usuarios/${id}`, dados)
      
      const usuario = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuário atualizado com sucesso')
      return usuario
    } catch (error) {
      console.error('[UsuariosService] Erro ao atualizar usuário:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Usuário não encontrado')
      }
      if (error.response?.status === 409) {
        throw new Error('Telefone já cadastrado para outro usuário')
      }
      
      throw error
    }
  },

  /**
   * Exclui usuário (soft delete)
   * @param {number} id - ID do usuário
   * @returns {Promise<void>}
   */
  async excluir(id) {
    try {
      console.log('[UsuariosService] Excluindo usuário:', id)
      await api.delete(`/usuarios/${id}`)
      console.log('[UsuariosService] Usuário excluído com sucesso')
    } catch (error) {
      console.error('[UsuariosService] Erro ao excluir usuário:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Usuário não encontrado')
      }
      if (error.response?.status === 409) {
        throw new Error('Não é possível excluir usuário com operações ativas')
      }
      
      throw error
    }
  },

  /**
   * Ativa usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async ativar(id) {
    try {
      console.log('[UsuariosService] Ativando usuário:', id)
      const response = await api.patch(`/usuarios/${id}/ativar`)
      
      const usuario = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuário ativado com sucesso')
      return usuario
    } catch (error) {
      console.error('[UsuariosService] Erro ao ativar usuário:', error)
      throw error
    }
  },

  /**
   * Desativa usuário
   * @param {number} id - ID do usuário
   * @returns {Promise<Object>} Usuário atualizado
   */
  async desativar(id) {
    try {
      console.log('[UsuariosService] Desativando usuário:', id)
      const response = await api.patch(`/usuarios/${id}/desativar`)
      
      const usuario = response.data?.data || response.data
      
      console.log('[UsuariosService] Usuário desativado com sucesso')
      return usuario
    } catch (error) {
      console.error('[UsuariosService] Erro ao desativar usuário:', error)
      throw error
    }
  },

  /**
   * Altera senha do usuário (Admin)
   * @param {number} id - ID do usuário
   * @param {string} novaSenha - Nova senha
   * @returns {Promise<void>}
   */
  async alterarSenha(id, novaSenha) {
    try {
      console.log('[UsuariosService] Alterando senha do usuário:', id)
      
      if (!novaSenha || novaSenha.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres')
      }
      
      await api.patch(`/usuarios/${id}/senha`, { novaSenha })
      
      console.log('[UsuariosService] Senha alterada com sucesso')
    } catch (error) {
      console.error('[UsuariosService] Erro ao alterar senha:', error)
      throw error
    }
  },

  /**
   * Reset de senha (envia token por SMS/Email)
   * @param {string} telefone - Telefone do usuário
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async solicitarResetSenha(telefone) {
    try {
      console.log('[UsuariosService] Solicitando reset de senha para:', telefone)
      
      const response = await api.post('/usuarios/reset-senha', { telefone })
      
      console.log('[UsuariosService] Token de reset enviado')
      return response.data
    } catch (error) {
      console.error('[UsuariosService] Erro ao solicitar reset:', error)
      
      if (error.response?.status === 404) {
        throw new Error('Telefone não encontrado no sistema')
      }
      
      throw error
    }
  },

  /**
   * Confirma reset de senha com token
   * @param {string} token - Token recebido
   * @param {string} novaSenha - Nova senha
   * @returns {Promise<void>}
   */
  async confirmarResetSenha(token, novaSenha) {
    try {
      console.log('[UsuariosService] Confirmando reset de senha')
      
      await api.post('/usuarios/reset-senha/confirmar', { token, novaSenha })
      
      console.log('[UsuariosService] Senha resetada com sucesso')
    } catch (error) {
      console.error('[UsuariosService] Erro ao confirmar reset:', error)
      
      if (error.response?.status === 400) {
        throw new Error('Token inválido ou expirado')
      }
      
      throw error
    }
  },

  /**
   * Lista permissões disponíveis por role
   * @returns {Promise<Object>} Mapa de roles e permissões
   */
  async listarPermissoes() {
    try {
      console.log('[UsuariosService] Listando permissões')
      const response = await api.get('/usuarios/permissoes')
      
      return response.data?.data || response.data
    } catch (error) {
      console.error('[UsuariosService] Erro ao listar permissões:', error)
      throw error
    }
  },

  /**
   * Lista logs de acesso do usuário
   * @param {number} id - ID do usuário
   * @param {Object} params - Parâmetros de filtro
   * @returns {Promise<Array>} Lista de logs
   */
  async listarLogsAcesso(id, params = {}) {
    try {
      console.log('[UsuariosService] Listando logs de acesso:', id)
      const response = await api.get(`/usuarios/${id}/logs`, { params })
      
      const logs = response.data?.data || response.data
      
      return logs
    } catch (error) {
      console.error('[UsuariosService] Erro ao listar logs:', error)
      throw error
    }
  }
}

export default usuariosService
