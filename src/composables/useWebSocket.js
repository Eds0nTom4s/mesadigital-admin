import { ref, onMounted, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

/**
 * Composable para gerenciar conexões WebSocket
 * 
 * Baseado na documentação oficial do sistema
 * Suporta reconexão automática, heartbeat e múltiplas inscrições
 * 
 * @param {string[]} topicos - Lista de tópicos para inscrever
 * @param {function} onMensagem - Callback quando mensagem chegar
 * @param {object} options - Opções de configuração
 */
export function useWebSocket(topicos = [], onMensagem = null, options = {}) {
  const conectado = ref(false)
  const reconectando = ref(false)
  const erro = ref(null)
  const ultimaMensagem = ref(null)
  const mensagens = ref([])
  const cliente = ref(null)

  // Configurações padrão
  const config = {
    url: options.url || import.meta.env.VITE_WS_URL || 'http://localhost:8080/api/ws',
    reconnectDelay: options.reconnectDelay || 5000,
    heartbeatIncoming: options.heartbeatIncoming || 4000,
    heartbeatOutgoing: options.heartbeatOutgoing || 4000,
    debug: options.debug || false,
    autoConnect: options.autoConnect !== false
  }

  /**
   * Conectar ao WebSocket
   */
  const conectar = () => {
    try {
      console.log('[WebSocket] Conectando...', config.url)
      
      const socket = new SockJS(config.url)
      
      cliente.value = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: config.reconnectDelay,
        heartbeatIncoming: config.heartbeatIncoming,
        heartbeatOutgoing: config.heartbeatOutgoing,
        debug: config.debug ? (str) => console.log('[STOMP]', str) : undefined,

        onConnect: (frame) => {
          console.log('[WebSocket] Conectado com sucesso', frame)
          conectado.value = true
          reconectando.value = false
          erro.value = null

          // Inscrever em todos os tópicos
          topicos.forEach(topico => {
            inscrever(topico)
          })
        },

        onDisconnect: () => {
          console.log('[WebSocket] Desconectado')
          conectado.value = false
        },

        onStompError: (frame) => {
          console.error('[WebSocket] Erro STOMP:', frame.headers['message'], frame.body)
          erro.value = `Erro: ${frame.headers['message']}`
          conectado.value = false
        },

        onWebSocketClose: () => {
          console.log('[WebSocket] Conexão fechada. Tentando reconectar...')
          reconectando.value = true
        }
      })

      cliente.value.activate()
    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error)
      erro.value = error.message
    }
  }

  /**
   * Desconectar do WebSocket
   */
  const desconectar = () => {
    if (cliente.value) {
      console.log('[WebSocket] Desconectando...')
      cliente.value.deactivate()
      conectado.value = false
    }
  }

  /**
   * Inscrever em um tópico
   */
  const inscrever = (topico) => {
    if (!cliente.value || !conectado.value) {
      console.warn('[WebSocket] Não conectado. Não é possível inscrever em:', topico)
      return null
    }

    console.log('[WebSocket] Inscrevendo em:', topico)

    return cliente.value.subscribe(topico, (message) => {
      try {
        const dados = JSON.parse(message.body)
        ultimaMensagem.value = dados
        mensagens.value.push(dados)

        // Limitar histórico a 100 mensagens
        if (mensagens.value.length > 100) {
          mensagens.value.shift()
        }

        // Chamar callback se fornecido
        if (onMensagem) {
          onMensagem(dados, topico)
        }

        console.log('[WebSocket] Mensagem recebida:', topico, dados)
      } catch (error) {
        console.error('[WebSocket] Erro ao processar mensagem:', error)
      }
    })
  }

  /**
   * Adicionar novo tópico dinamicamente
   */
  const adicionarTopico = (topico) => {
    if (!topicos.includes(topico)) {
      topicos.push(topico)
      if (conectado.value) {
        inscrever(topico)
      }
    }
  }

  /**
   * Limpar histórico de mensagens
   */
  const limparMensagens = () => {
    mensagens.value = []
    ultimaMensagem.value = null
  }

  // Auto-conectar se configurado
  onMounted(() => {
    if (config.autoConnect) {
      conectar()
    }
  })

  // Desconectar ao desmontar componente
  onUnmounted(() => {
    desconectar()
  })

  return {
    // Estado
    conectado,
    reconectando,
    erro,
    ultimaMensagem,
    mensagens,

    // Métodos
    conectar,
    desconectar,
    inscrever,
    adicionarTopico,
    limparMensagens
  }
}
