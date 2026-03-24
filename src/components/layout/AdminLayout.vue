<template>
  <div class="min-h-screen bg-background">
    <!-- Sidebar -->
    <Sidebar :is-collapsed="isCollapsed" @toggle="toggleSidebar" />

    <!-- Main Content -->
    <div :class="['transition-all duration-300', isCollapsed ? 'pl-20' : 'pl-64']">
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
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import { useWebSocketStore } from '@/store/websocket'

const wsStore = useWebSocketStore()
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

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
