<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * Produtos View - Módulo de gestão de produtos
 * 
 * Funcionalidades (placeholder):
 * - Catálogo de produtos
 * - Filtros por categoria
 * - Controle de estoque
 * - Edição de produtos
 */
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Produtos</h2>
        <p class="text-text-secondary mt-1">Catálogo de produtos e estoque</p>
      </div>
      <button class="btn-primary">
        + Adicionar Produto
      </button>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex space-x-2">
          <select class="input-field w-48">
            <option>Todas Categorias</option>
            <option>Bebidas</option>
            <option>Comidas</option>
            <option>Sobremesas</option>
          </select>
        </div>
        <input type="text" placeholder="Buscar produtos..." class="input-field w-64" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="badge-success">Disponível</span>
            <span class="text-sm text-text-secondary">Stock: 45</span>
          </div>
          <h3 class="font-semibold text-text-primary mb-1">Cerveja Super Bock</h3>
          <p class="text-text-secondary text-sm mb-3">Bebida | 33cl</p>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-primary">{{ formatCurrency(2.50) }}</span>
            <button class="text-primary hover:underline text-sm">Editar</button>
          </div>
        </div>

        <div class="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="badge-success">Disponível</span>
            <span class="text-sm text-text-secondary">Stock: 22</span>
          </div>
          <h3 class="font-semibold text-text-primary mb-1">Francesinha</h3>
          <p class="text-text-secondary text-sm mb-3">Comida | Prato Principal</p>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-primary">{{ formatCurrency(12.50) }}</span>
            <button class="text-primary hover:underline text-sm">Editar</button>
          </div>
        </div>

        <div class="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <span class="badge-warning">Stock Baixo</span>
            <span class="text-sm text-text-secondary">Stock: 5</span>
          </div>
          <h3 class="font-semibold text-text-primary mb-1">Pastel de Nata</h3>
          <p class="text-text-secondary text-sm mb-3">Sobremesa | Unidade</p>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-primary">{{ formatCurrency(1.20) }}</span>
            <button class="text-primary hover:underline text-sm">Editar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
