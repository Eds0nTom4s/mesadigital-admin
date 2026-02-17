<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * Mesas View - Módulo de gestão de mesas
 * 
 * Funcionalidades (placeholder):
 * - Visualização do status das mesas
 * - Filtros por disponibilidade
 * - Valor atual por mesa ocupada
 * - Gestão de reservas
 */
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Mesas</h2>
        <p class="text-text-secondary mt-1">Status e ocupação das mesas</p>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-text-secondary">12 de 20 ocupadas</span>
        <div class="w-32 bg-border rounded-full h-2">
          <div class="bg-primary h-2 rounded-full" style="width: 60%"></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex space-x-2 mb-6">
        <button class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Todas</button>
        <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Disponíveis</button>
        <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Ocupadas</button>
        <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Reservadas</button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div class="border-2 border-success bg-success/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">1</div>
          <span class="badge-success">Disponível</span>
          <p class="text-xs text-text-secondary mt-2">4 lugares</p>
        </div>

        <div class="border-2 border-error bg-error/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">2</div>
          <span class="badge-error">Ocupada</span>
          <p class="text-xs text-text-secondary mt-2">4 lugares</p>
          <p class="text-xs text-text-primary mt-1 font-medium">{{ formatCurrency(45.80) }}</p>
        </div>

        <div class="border-2 border-error bg-error/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">3</div>
          <span class="badge-error">Ocupada</span>
          <p class="text-xs text-text-secondary mt-2">2 lugares</p>
          <p class="text-xs text-text-primary mt-1 font-medium">{{ formatCurrency(32.50) }}</p>
        </div>

        <div class="border-2 border-success bg-success/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">4</div>
          <span class="badge-success">Disponível</span>
          <p class="text-xs text-text-secondary mt-2">6 lugares</p>
        </div>

        <div class="border-2 border-error bg-error/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">5</div>
          <span class="badge-error">Ocupada</span>
          <p class="text-xs text-text-secondary mt-2">4 lugares</p>
          <p class="text-xs text-text-primary mt-1 font-medium">{{ formatCurrency(28.90) }}</p>
        </div>

        <div class="border-2 border-warning bg-warning/5 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow">
          <div class="text-3xl font-bold text-text-primary mb-2">6</div>
          <span class="badge-warning">Reservada</span>
          <p class="text-xs text-text-secondary mt-2">4 lugares</p>
          <p class="text-xs text-text-primary mt-1 font-medium">19:00</p>
        </div>
      </div>
    </div>
  </div>
</template>
