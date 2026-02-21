import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store para gerenciar notificações toast
 * 
 * Exibe notificações visuais para o usuário
 */
export const useNotificationStore = defineStore('notifications', () => {
  const notificacoes = ref([])
  let nextId = 1

  /**
   * Adicionar notificação
   */
  const adicionar = (mensagem, tipo = 'info', duracao = 5000) => {
    const notificacao = {
      id: nextId++,
      mensagem,
      tipo, // 'success', 'error', 'warning', 'info'
      duracao,
      timestamp: new Date().toISOString()
    }

    notificacoes.value.push(notificacao)

    // Auto-remover após duração
    if (duracao > 0) {
      setTimeout(() => {
        remover(notificacao.id)
      }, duracao)
    }

    return notificacao.id
  }

  /**
   * Remover notificação
   */
  const remover = (id) => {
    const index = notificacoes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notificacoes.value.splice(index, 1)
    }
  }

  /**
   * Limpar todas
   */
  const limparTodas = () => {
    notificacoes.value = []
  }

  /**
   * Atalhos para tipos específicos
   */
  const sucesso = (mensagem, duracao) => adicionar(mensagem, 'success', duracao)
  const erro = (mensagem, duracao) => adicionar(mensagem, 'error', duracao)
  const aviso = (mensagem, duracao) => adicionar(mensagem, 'warning', duracao)
  const info = (mensagem, duracao) => adicionar(mensagem, 'info', duracao)

  return {
    notificacoes,
    adicionar,
    remover,
    limparTodas,
    sucesso,
    erro,
    aviso,
    info
  }
})
