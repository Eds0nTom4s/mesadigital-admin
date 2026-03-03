<template>
  <ErrorBoundary>
    <router-view />
    <ToastNotifications />
  </ErrorBoundary>
</template>

<script setup>
import ToastNotifications from '@/components/shared/ToastNotifications.vue'
import ErrorBoundary from '@/components/shared/ErrorBoundary.vue'

/**
 * Ponto de entrada principal do painel administrativo
 * 
 * WebSocket é inicializado sob demanda em cada componente que precisa
 * Componente ToastNotifications está sempre ativo para exibir notificações
 */
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
