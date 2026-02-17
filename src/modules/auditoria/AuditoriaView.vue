<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Auditoria do Sistema</h2>
        <p class="text-text-secondary mt-1">Registro de todas as operações</p>
      </div>
      <button class="btn-secondary">
        Exportar Relatório
      </button>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex space-x-2">
          <select class="input-field w-48">
            <option>Todas as Ações</option>
            <option>Login</option>
            <option>Criação</option>
            <option>Edição</option>
            <option>Exclusão</option>
          </select>
          <select class="input-field w-48">
            <option>Todos os Módulos</option>
            <option>Pedidos</option>
            <option>Produtos</option>
            <option>Mesas</option>
            <option>Fundos</option>
            <option>Usuários</option>
          </select>
          <input type="date" class="input-field w-48" />
        </div>
        <input type="text" placeholder="Buscar..." class="input-field w-64" />
      </div>

      <div class="space-y-3">
        <div class="flex items-start space-x-4 p-4 bg-background rounded-lg">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-text-primary">Pedido #1234 criado</p>
              <span class="text-xs text-text-secondary">14:30:15</span>
            </div>
            <p class="text-sm text-text-secondary">
              <span class="font-medium">Margarida Silva</span> criou um novo pedido para Mesa 5 no valor de {{ formatCurrency(45.80) }}
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span class="badge-success">Criação</span>
              <span class="badge-info">Pedidos</span>
              <span class="text-xs text-text-secondary">IP: 192.168.1.100</span>
            </div>
          </div>
        </div>

        <div class="flex items-start space-x-4 p-4 bg-background rounded-lg">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-text-primary">Produto "Cerveja Super Bock" atualizado</p>
              <span class="text-xs text-text-secondary">14:25:42</span>
            </div>
            <p class="text-sm text-text-secondary">
              <span class="font-medium">João Santos</span> alterou o preço de {{ formatCurrency(2.30) }} para {{ formatCurrency(2.50) }}
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span class="badge-warning">Edição</span>
              <span class="badge-info">Produtos</span>
              <span class="text-xs text-text-secondary">IP: 192.168.1.105</span>
            </div>
          </div>
        </div>

        <div class="flex items-start space-x-4 p-4 bg-background rounded-lg">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-text-primary">Login realizado</p>
              <span class="text-xs text-text-secondary">14:00:12</span>
            </div>
            <p class="text-sm text-text-secondary">
              <span class="font-medium">Margarida Silva</span> fez login no sistema
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span class="badge-info">Login</span>
              <span class="badge-success">Sistema</span>
              <span class="text-xs text-text-secondary">IP: 192.168.1.100</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <p class="text-sm text-text-secondary">Mostrando 3 de 1,247 registros</p>
        <div class="flex space-x-2">
          <button class="btn-secondary">Anterior</button>
          <button class="btn-primary">Próximo</button>
        </div>
      </div>
    </div>
  </div>
</template>
