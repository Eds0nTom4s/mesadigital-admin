<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * Dashboard View - Módulo de visão geral
 * 
 * Exibe métricas principais do sistema:
 * - Pedidos ativos
 * - Receita do dia
 * - Ocupação de mesas
 * - Fundos de consumo ativos
 * 
 * Dados atualmente em mock - pronto para integração
 */
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Dashboard</h2>
        <p class="text-text-secondary mt-1">Visão geral do sistema</p>
      </div>
      <div class="flex items-center space-x-2 text-sm text-text-secondary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Atualizado há 2 minutos</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Pedidos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">24</p>
            <p class="text-success text-sm mt-1">+12% vs ontem</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Receita Hoje</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(1247) }}</p>
            <p class="text-success text-sm mt-1">+8% vs ontem</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Mesas Ocupadas</p>
            <p class="text-3xl font-bold text-text-primary mt-2">12/20</p>
            <p class="text-info text-sm mt-1">60% ocupação</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-text-secondary text-sm">Fundos Ativos</p>
            <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(3480) }}</p>
            <p class="text-warning text-sm mt-1">18 fundos abertos</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Pedidos Recentes</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-success rounded-full"></div>
              <div>
                <p class="text-sm font-medium text-text-primary">Mesa 5 - Pedido #1234</p>
                <p class="text-xs text-text-secondary">Há 2 minutos</p>
              </div>
            </div>
            <span class="text-sm font-medium text-text-primary">{{ formatCurrency(45.80) }}</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="w-2 h-2 bg-warning rounded-full"></div>
              <div>
                <p class="text-sm font-medium text-text-primary">Mesa 3 - Pedido #1233</p>
                <p class="text-xs text-text-secondary">Há 5 minutos</p>
              </div>
            </div>
            <span class="text-sm font-medium text-text-primary">{{ formatCurrency(32.50) }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Produtos em Destaque</h3>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div>
              <p class="text-sm font-medium text-text-primary">Cerveja Super Bock</p>
              <p class="text-xs text-text-secondary">42 vendas hoje</p>
            </div>
            <span class="badge-success">Top #1</span>
          </div>
          <div class="flex items-center justify-between p-3 bg-background rounded-lg">
            <div>
              <p class="text-sm font-medium text-text-primary">Francesinha</p>
              <p class="text-xs text-text-secondary">28 vendas hoje</p>
            </div>
            <span class="badge-success">Top #2</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
