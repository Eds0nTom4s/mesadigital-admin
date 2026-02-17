<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * Pedidos View - Módulo de gestão de pedidos
 * 
 * Funcionalidades (placeholder):
 * - Listagem de pedidos
 * - Filtros por status
 * - Busca de pedidos
 * - Detalhes do pedido
 */
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Pedidos</h2>
        <p class="text-text-secondary mt-1">Acompanhamento de todos os pedidos</p>
      </div>
      <button class="btn-primary">
        + Novo Pedido
      </button>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex space-x-2">
          <button class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">Todos</button>
          <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Pendentes</button>
          <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Em Preparação</button>
          <button class="px-4 py-2 bg-background text-text-secondary rounded-lg text-sm font-medium hover:bg-gray-200">Concluídos</button>
        </div>
        <input type="text" placeholder="Buscar pedidos..." class="input-field w-64" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">ID</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Mesa</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Cliente</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Total</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Horário</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4 text-sm text-text-primary font-medium">#1234</td>
              <td class="py-3 px-4 text-sm text-text-primary">Mesa 5</td>
              <td class="py-3 px-4 text-sm text-text-primary">João Silva</td>
              <td class="py-3 px-4"><span class="badge-warning">Em Preparação</span></td>
              <td class="py-3 px-4 text-sm font-medium text-text-primary">{{ formatCurrency(45.80) }}</td>
              <td class="py-3 px-4 text-sm text-text-secondary">14:30</td>
              <td class="py-3 px-4 text-right">
                <button class="text-primary hover:underline text-sm">Ver Detalhes</button>
              </td>
            </tr>
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4 text-sm text-text-primary font-medium">#1233</td>
              <td class="py-3 px-4 text-sm text-text-primary">Mesa 3</td>
              <td class="py-3 px-4 text-sm text-text-primary">Maria Costa</td>
              <td class="py-3 px-4"><span class="badge-success">Concluído</span></td>
              <td class="py-3 px-4 text-sm font-medium text-text-primary">{{ formatCurrency(32.50) }}</td>
              <td class="py-3 px-4 text-sm text-text-secondary">14:15</td>
              <td class="py-3 px-4 text-right">
                <button class="text-primary hover:underline text-sm">Ver Detalhes</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
