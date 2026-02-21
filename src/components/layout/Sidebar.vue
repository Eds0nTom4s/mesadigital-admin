<template>
  <aside 
    :class="[
      'fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Logo / Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-border">
      <div v-if="!isCollapsed" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">A</span>
        </div>
        <span class="font-semibold text-text-primary">Admin Panel</span>
      </div>
      <button 
        @click="toggleSidebar"
        class="p-2 hover:bg-background rounded-lg transition-colors"
        :class="isCollapsed ? 'mx-auto' : ''"
      >
        <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    <!-- Menu Items -->
    <nav class="py-4 px-2">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center space-x-3 px-3 py-3 mb-1 rounded-lg transition-colors group"
        :class="isActiveRoute(item.path) ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-background hover:text-text-primary'"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath"/>
        </svg>
        <span v-if="!isCollapsed" class="font-medium">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const isActiveRoute = (path) => {
  return route.path.startsWith(path)
}

// Menu items com ícones SVG (apenas paths)
// Nota: Estoque e Configurações Financeiras removidos temporariamente (não-funcionais)
const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    label: 'Pedidos',
    path: '/admin/pedidos',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    label: 'Produtos',
    path: '/admin/produtos',
    iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  },
  {
    label: 'Unidades de Consumo',
    path: '/admin/unidades-consumo',
    iconPath: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
  },
  {
    label: 'Fundos',
    path: '/admin/fundos',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
  },
  {
    label: 'Usuários',
    path: '/admin/usuarios',
    iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  },
  {
    label: 'Auditoria',
    path: '/admin/auditoria',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }
]
</script>
