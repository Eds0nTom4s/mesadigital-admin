<script setup>
import { ref, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import fundoConsumoService from '@/services/fundoConsumoService'

/**
 * ConfiguracoesFinanceirasView - Configurações do sistema financeiro
 * 
 * INTEGRADO COM API BACKEND
 * Exibe configurações globais via consultarValorMinimo
 * Edição será implementada quando backend disponibilizar endpoint
 */

const { formatCurrency } = useCurrency()
const configuracoes = ref(null)
const loading = ref(true)
const error = ref(null)

// Carrega configurações via API
onMounted(async () => {
  try {
    const response = await fundoConsumoService.consultarValorMinimo()
    // Adapta para estrutura esperada pelo template
    configuracoes.value = {
      fundos: {
        valorMinimo: response.data.valorMinimo
      },
      transacoes: {
        limiteDebito: 50000, // TODO: Backend não retorna ainda
        limiteCredito: 100000 // TODO: Backend não retorna ainda
      }
    }
  } catch (err) {
    console.error('Erro ao carregar configurações:', err)
    error.value = err.response?.data?.message || err.message
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
        <p class="text-text-secondary mt-1">Visualização de parâmetros do sistema (somente leitura)</p>
      </div>
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <span class="text-sm text-info font-medium">Modo Visualização</span>
      </div>
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
      <div class="card bg-info/5 border border-info/20">
        <div class="flex items-start space-x-3">
          <svg class="w-6 h-6 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h4 class="font-semibold text-info mb-2">📖 Sobre esta Página</h4>
            <p class="text-sm text-text-secondary mb-2">
              Esta página exibe as configurações financeiras atuais do sistema em modo somente leitura. 
              Os valores são obtidos diretamente do backend e refletem as regras de negócio ativas.
            </p>
            <p class="text-sm text-text-secondary">
              <strong>Para alterar configurações:</strong> Entre em contato com o administrador do sistema ou acesse o painel de administração backend.
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
