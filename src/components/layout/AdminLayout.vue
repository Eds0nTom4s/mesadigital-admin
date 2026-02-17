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
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'

/**
 * AdminLayout - Layout principal do painel administrativo
 * 
 * Estrutura:
 * - Sidebar fixa à esquerda (264px)
 * - Topbar no topo
 * - Área de conteúdo com padding
 * 
 * O conteúdo dinâmico é renderizado via <router-view />
 */
</script>
