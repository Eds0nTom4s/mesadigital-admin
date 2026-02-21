export default {
  name: 'Painel Administrativo',
  version: '1.0.0',
  websocket: {
    url: 'http://localhost:8080/api/ws',
    reconnectDelay: 5000,
    heartbeat: 4000
  },
  audio: {
    enabled: true,
    volume: 0.7,
    sounds: {
      novoPedido: '/sounds/novo-pedido.mp3',
      pedidoPronto: '/sounds/pedido-pronto.mp3',
      alerta: '/sounds/alerta.mp3',
      sucesso: '/sounds/sucesso.mp3'
    }
  },
  notifications: {
    defaultDuration: 5000,
    maxVisible: 5
  }
}
