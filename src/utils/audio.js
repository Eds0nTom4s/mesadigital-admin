/**
 * Utilitário para reproduzir sons de notificação
 */

class AudioNotification {
  constructor() {
    this.sounds = {}
    this.enabled = false
    this.initSounds()
  }

  /**
   * Inicializar sons com tratamento de erro
   */
  initSounds() {
    const soundFiles = {
      novoPedido: '/sounds/novo-pedido.mp3',
      pedidoPronto: '/sounds/pedido-pronto.mp3',
      alerta: '/sounds/alerta.mp3',
      sucesso: '/sounds/sucesso.mp3'
    }

    Object.entries(soundFiles).forEach(([key, path]) => {
      try {
        const audio = new Audio(path)
        audio.volume = 0.7
        
        // Listener para detectar se o arquivo é válido
        audio.addEventListener('canplaythrough', () => {
          this.enabled = true
        }, { once: true })
        
        audio.addEventListener('error', (e) => {
          console.warn(`[AudioNotification] Arquivo de áudio não disponível: ${path}`)
        }, { once: true })
        
        this.sounds[key] = audio
      } catch (error) {
        console.warn(`[AudioNotification] Erro ao inicializar som ${key}:`, error)
      }
    })
  }

  /**
   * Tocar som
   */
  async tocar(tipo = 'alerta') {
    if (!this.enabled) {
      // Sons não disponíveis - silenciosamente ignora
      return
    }

    try {
      const audio = this.sounds[tipo]
      if (audio) {
        audio.currentTime = 0
        await audio.play()
      }
    } catch (error) {
      // Silenciosamente ignora erros de reprodução
      // (usuário pode ter bloqueado autoplay)
    }
  }

  /**
   * Ajustar volume
   */
  setVolume(volume) {
    const vol = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(audio => {
      audio.volume = vol
    })
  }

  /**
   * Tocar som de novo pedido
   */
  novoPedido() {
    return this.tocar('novoPedido')
  }

  /**
   * Tocar som de pedido pronto
   */
  pedidoPronto() {
    return this.tocar('pedidoPronto')
  }

  /**
   * Tocar alerta genérico
   */
  alerta() {
    return this.tocar('alerta')
  }

  /**
   * Tocar som de sucesso
   */
  sucesso() {
    return this.tocar('sucesso')
  }
}

// Exportar instância singleton
export const audioNotification = new AudioNotification()

// Composable para uso em componentes Vue
export function useAudioNotification() {
  return audioNotification
}
