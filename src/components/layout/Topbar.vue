<template>
  <header class="h-16 bg-card border-b border-border flex items-center justify-between px-6">
    <!-- Breadcrumb / Contexto -->
    <div class="flex items-center space-x-4">
      <h1 class="text-xl font-semibold text-text-primary">
        {{ currentPageTitle }}
      </h1>
    </div>

    <!-- User Menu -->
    <div class="flex items-center space-x-4">
      <!-- WebSocket Status Indicator -->
      <WebSocketStatus 
        :status="wsStore.statusConexao" 
        @reconectar="wsStore.conectar"
      />

      <!-- Unidade / Contexto (placeholder) -->
      <div class="hidden md:flex items-center space-x-2 px-3 py-2 bg-background rounded-lg">
        <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        <span class="text-sm text-text-secondary">Unidade Principal</span>
      </div>

      <!-- User Profile -->
      <div class="flex items-center space-x-3 cursor-pointer hover:bg-background px-3 py-2 rounded-lg transition-colors" @click="toggleUserMenu">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-medium">{{ userInitials }}</span>
          </div>
          <div class="hidden md:block">
            <p class="text-sm font-medium text-text-primary">{{ userName }}</p>
            <p class="text-xs text-text-secondary">{{ userRole }}</p>
          </div>
        </div>
        <svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>

      <!-- User Menu Dropdown -->
      <div v-if="showUserMenu" class="absolute top-16 right-6 bg-card border border-border rounded-lg shadow-lg py-2 w-48 z-50">
        <button class="w-full text-left px-4 py-2 hover:bg-background transition-colors text-sm text-text-secondary">
          Meu Perfil
        </button>
        <button class="w-full text-left px-4 py-2 hover:bg-background transition-colors text-sm text-text-secondary">
          Configurações
        </button>
        <div class="border-t border-border my-2"></div>
        <button @click="logout" class="w-full text-left px-4 py-2 hover:bg-background transition-colors text-sm text-error flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sair
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { useWebSocketStore } from '@/store/websocket'
import WebSocketStatus from '@/components/shared/WebSocketStatus.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const wsStore = useWebSocketStore()
const showUserMenu = ref(false)

// Dados do usuário
const userName = computed(() => {
  return authStore.user?.name || 'Usuário'
})

const userRole = computed(() => {
  return authStore.user?.role || 'ATENDENTE'
})

const userInitials = computed(() => {
  const names = userName.value.split(' ')
  return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
})

// Título da página baseado na rota
const currentPageTitle = computed(() => {
  const routeTitles = {
    '/admin/dashboard': 'Dashboard',
    '/admin/pedidos': 'Gestão de Pedidos',
    '/admin/produtos': 'Gestão de Produtos',
    '/admin/unidades-consumo': 'Gestão de Unidades de Consumo',
    '/admin/fundos': 'Fundos de Consumo',
    '/admin/usuarios': 'Gestão de Usuários',
    '/admin/auditoria': 'Auditoria do Sistema'
  }
  return routeTitles[route.path] || 'Painel Administrativo'
})

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
