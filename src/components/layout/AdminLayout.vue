<template>
  <div class="min-h-screen bg-background">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="pl-64 transition-all duration-300">
      <!-- Topbar -->
      <Topbar />

      <!-- Content Area -->
      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import { useWebSocketStore } from '@/store/websocket'

const wsStore = useWebSocketStore()

/**
 * AdminLayout — Layout principal do painel.
 * A conexão WebSocket é iniciada aqui porque:
 *   - é o wrapper de todas as rotas autenticadas,
 *   - garante que o WS existe antes de qualquer sub-componente se inscrever,
 *   - e é encerrada quando o utilizador faz logout (componente desmonado).
 */
onMounted(() => {
  wsStore.conectar()
})

onUnmounted(() => {
  wsStore.desconectar()
})
</script>
