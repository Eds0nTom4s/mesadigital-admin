<script setup>
import { ref, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'

/**
 * ConfiguracoesFinanceirasView - Configurações do sistema financeiro
 * 
 * Exibe configurações globais relacionadas a fundos e transações
 * Somente leitura - edição será implementada futuramente
 */

const { formatCurrency } = useCurrency()
const configuracoes = ref(null)
const loading = ref(true)

// Carrega configurações mockadas
onMounted(async () => {
  try {
    const response = await fetch('/src/mock/configuracoes.json')
    configuracoes.value = await response.json()
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
  } finally {
    loading.value = false
  }
})

// Mock de função de salvar
const salvarConfiguracoes = () => {
  alert('Funcionalidade de edição será implementada com integração backend')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Configurações Financeiras</h2>
        <p class="text-text-secondary mt-1">Parâmetros globais do sistema de fundos</p>
      </div>
      <button @click="salvarConfiguracoes" class="btn-primary" disabled>
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
        </svg>
        Salvar (Em Breve)
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Configurações -->
    <template v-else-if="configuracoes">
      <!-- Configurações de Fundo -->
      <div class="card">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-text-primary">Configurações de Fundo</h3>
            <p class="text-sm text-text-secondary">Parâmetros de criação e gestão de fundos</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-background rounded-lg">
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Valor Mínimo de Fundo
            </label>
            <div class="flex items-center space-x-3">
              <input 
                type="text" 
                :value="formatCurrency(configuracoes.fundoMinimo)" 
                class="input-field flex-1" 
                disabled
              />
              <span class="text-xs text-text-secondary whitespace-nowrap">
                Mínimo recomendado para abertura
              </span>
            </div>
          </div>

          <div class="p-4 bg-background rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">
                  Permitir Saldo Negativo
                </label>
                <p class="text-xs text-text-secondary">
                  Se habilitado, fundos podem ter saldo negativo
                </p>
              </div>
              <div class="relative inline-block w-12 h-6 cursor-not-allowed">
                <input 
                  type="checkbox" 
                  :checked="configuracoes.permitirSaldoNegativo" 
                  class="sr-only" 
                  disabled
                />
                <div :class="[
                  'block w-12 h-6 rounded-full transition-colors',
                  configuracoes.permitirSaldoNegativo ? 'bg-success' : 'bg-gray-300'
                ]">
                  <div :class="[
                    'dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform',
                    configuracoes.permitirSaldoNegativo ? 'transform translate-x-6' : ''
                  ]"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-background rounded-lg">
            <label class="block text-sm font-medium text-text-secondary mb-2">
              Dias para Expiração de Fundo
            </label>
            <div class="flex items-center space-x-3">
              <input 
                type="number" 
                :value="configuracoes.diasExpiracaoFundo" 
                class="input-field w-32" 
                disabled
              />
              <span class="text-xs text-text-secondary">
                Fundos expiram após este período de inatividade
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Configurações de Transações -->
      <div class="card">
        <div class="flex items-center space-x-3 mb-6">
          <div class="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-text-primary">Configurações de Transações</h3>
            <p class="text-sm text-text-secondary">Regras e permissões operacionais</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 bg-background rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">
                  Permitir Estorno de Transações
                </label>
                <p class="text-xs text-text-secondary">
                  Operadores podem realizar estorno de transações
                </p>
              </div>
              <div class="relative inline-block w-12 h-6 cursor-not-allowed">
                <input 
                  type="checkbox" 
                  :checked="configuracoes.permitirEstorno" 
                  class="sr-only" 
                  disabled
                />
                <div :class="[
                  'block w-12 h-6 rounded-full transition-colors',
                  configuracoes.permitirEstorno ? 'bg-success' : 'bg-gray-300'
                ]">
                  <div :class="[
                    'dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform',
                    configuracoes.permitirEstorno ? 'transform translate-x-6' : ''
                  ]"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-background rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">
                  Aviso de Expiração em Recibo
                </label>
                <p class="text-xs text-text-secondary">
                  Exibe aviso de expiração nos recibos de fundos
                </p>
              </div>
              <div class="relative inline-block w-12 h-6 cursor-not-allowed">
                <input 
                  type="checkbox" 
                  :checked="configuracoes.avisoExpiracaoRecibo" 
                  class="sr-only" 
                  disabled
                />
                <div :class="[
                  'block w-12 h-6 rounded-full transition-colors',
                  configuracoes.avisoExpiracaoRecibo ? 'bg-success' : 'bg-gray-300'
                ]">
                  <div :class="[
                    'dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform',
                    configuracoes.avisoExpiracaoRecibo ? 'transform translate-x-6' : ''
                  ]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aviso de Somente Leitura -->
      <div class="card bg-warning/5 border border-warning/20">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <h4 class="font-semibold text-warning mb-1">Modo Somente Leitura</h4>
            <p class="text-sm text-text-secondary">
              As configurações estão em modo visualização. A funcionalidade de edição será implementada com integração ao backend. 
              Alterações futuras exigirão permissões de administrador.
            </p>
          </div>
        </div>
      </div>

      <!-- Informações do Sistema -->
      <div class="card">
        <h3 class="text-lg font-semibold text-text-primary mb-4">Informações do Sistema</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Versão</p>
            <p class="text-base font-medium text-text-primary">1.0.0 (Mock)</p>
          </div>
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Ambiente</p>
            <p class="text-base font-medium text-text-primary">Desenvolvimento</p>
          </div>
          <div class="p-4 bg-background rounded-lg">
            <p class="text-sm text-text-secondary mb-1">Última Atualização</p>
            <p class="text-base font-medium text-text-primary">17/02/2026</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
input:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
