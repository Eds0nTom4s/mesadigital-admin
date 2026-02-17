<script setup>
import { useCurrency } from '@/utils/currency'

const { formatCurrency } = useCurrency()

/**
 * Fundos View - Módulo de gestão de fundos de consumo
 * 
 * Funcionalidades (placeholder):
 * - Listagem de fundos ativos
 * - Saldos e consumos
 * - Histórico de transações
 * - Criação de novos fundos
 */
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Fundos de Consumo</h2>
        <p class="text-text-secondary mt-1">Gestão de fundos de clientes</p>
      </div>
      <button class="btn-primary">
        + Criar Fundo
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card">
        <p class="text-text-secondary text-sm">Total em Fundos Ativos</p>
        <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(3480.00) }}</p>
        <p class="text-success text-sm mt-1">18 fundos abertos</p>
      </div>
      <div class="card">
        <p class="text-text-secondary text-sm">Média por Fundo</p>
        <p class="text-3xl font-bold text-text-primary mt-2">{{ formatCurrency(193.33) }}</p>
        <p class="text-info text-sm mt-1">Calculado hoje</p>
      </div>
      <div class="card">
        <p class="text-text-secondary text-sm">Fundos Fechados Hoje</p>
        <p class="text-3xl font-bold text-text-primary mt-2">12</p>
        <p class="text-text-secondary text-sm mt-1">Total: {{ formatCurrency(2145.80) }}</p>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-text-primary">Fundos Ativos</h3>
        <input type="text" placeholder="Buscar por nome ou código..." class="input-field w-64" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Código</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Cliente</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Saldo Inicial</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Consumido</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Saldo Atual</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4 text-sm font-medium text-text-primary">#F-2024-001</td>
              <td class="py-3 px-4 text-sm text-text-primary">João Silva</td>
              <td class="py-3 px-4 text-sm text-text-primary">{{ formatCurrency(200.00) }}</td>
              <td class="py-3 px-4 text-sm text-error">-{{ formatCurrency(45.80) }}</td>
              <td class="py-3 px-4 text-sm font-medium text-success">{{ formatCurrency(154.20) }}</td>
              <td class="py-3 px-4"><span class="badge-success">Ativo</span></td>
              <td class="py-3 px-4 text-right">
                <button class="text-primary hover:underline text-sm">Ver Detalhes</button>
              </td>
            </tr>
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4 text-sm font-medium text-text-primary">#F-2024-002</td>
              <td class="py-3 px-4 text-sm text-text-primary">Maria Costa</td>
              <td class="py-3 px-4 text-sm text-text-primary">{{ formatCurrency(150.00) }}</td>
              <td class="py-3 px-4 text-sm text-error">-{{ formatCurrency(98.40) }}</td>
              <td class="py-3 px-4 text-sm font-medium text-warning">{{ formatCurrency(51.60) }}</td>
              <td class="py-3 px-4"><span class="badge-success">Ativo</span></td>
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
