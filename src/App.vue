<template>
  <router-view />
  <ToastNotifications />
</template>

<script setup>
import { onMounted } from 'vue'
import { useWebSocketStore } from '@/store/websocket'
import ToastNotifications from '@/components/shared/ToastNotifications.vue'

/**
 * Ponto de entrada principal do painel administrativo
 * 
 * Inicializa conexão WebSocket global ao montar a aplicação
 * Componente ToastNotifications está sempre ativo para exibir notificações
 */

// Conectar ao WebSocket quando aplicação iniciar
onMounted(() => {
  console.log('[App] Inicializando conexão WebSocket...')
  const wsStore = useWebSocketStore()
  wsStore.conectar()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #F7F7F7;
  color: #333333;
}
</style>
