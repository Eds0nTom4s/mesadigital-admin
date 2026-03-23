<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Criar Fundo de Consumo</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Cliente -->
        <div v-if="cliente" class="cliente-info">
          <div class="info-row">
            <span class="label">Cliente:</span>
            <span class="value">{{ cliente.nome }}</span>
          </div>
          <div class="info-row" v-if="cliente.telefone">
            <span class="label">Telefone:</span>
            <span class="value">{{ cliente.telefone }}</span>
          </div>
        </div>

        <div v-if="sessao && !props.cliente" class="cliente-info" style="background: #fff8e1; border-color: #ffe082;">
          <div class="info-row">
            <span class="label">Sessão:</span>
            <span class="value">Sessão Anónima #{{ sessao.id }}</span>
          </div>
          <p style="font-size: 11px; color: #795548; margin: 4px 0 0 0;">O fundo será vinculado automaticamente a esta sessão.</p>
        </div>

        <!-- Formulário -->
        <div class="form-group" v-if="!sessao && !cliente">
          <label class="form-label">
            ID do Cliente <span class="required">*</span>
          </label>
          <input 
            v-model.number="formulario.clienteId" 
            type="number" 
            class="form-control"
            placeholder="Ex: 123"
            required
          />
          <p class="form-hint">ID numérico do cliente no sistema</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            Saldo Inicial <span class="required">*</span>
          </label>
          <input 
            v-model.number="formulario.saldoInicialDecimal" 
            type="number" 
            :min="valorMinimoDecimal"
            step="0.01"
            class="form-control"
            required
          />
          <p class="form-hint">
            Mínimo: {{ formatCurrency(valorMinimo) }}
          </p>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea 
            v-model="formulario.observacoes" 
            class="form-control"
            rows="2"
            placeholder="Informações adicionais (opcional)"
          />
        </div>

        <!-- Método de Recebimento -->
        <div class="form-group">
          <label class="form-label">
            Método de Recebimento <span class="required">*</span>
          </label>
          <div class="payment-methods">
            <!-- CASH -->
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'CASH' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="CASH" />
              <div class="method-content">
                <div class="method-icon">💵</div>
                <div class="method-details">
                  <span class="method-title">Dinheiro (CASH)</span>
                </div>
              </div>
            </label>

            <!-- TPA -->
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'TPA' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="TPA" />
              <div class="method-content">
                <div class="method-icon">💳</div>
                <div class="method-details">
                  <span class="method-title">Multicaixa (TPA)</span>
                </div>
              </div>
            </label>

            <!-- DIGITAL -->
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'GPO' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="GPO" />
              <div class="method-content">
                <div class="method-icon">⚡</div>
                <div class="method-details">
                  <span class="method-title">Digital (M-Express)</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Telefone para Digital (GPO) -->
        <div v-if="formulario.metodoPagamento === 'GPO'" class="form-group animate-fade-in">
          <label class="form-label">Número do Telemóvel <span class="required">*</span></label>
          <div class="input-with-prefix">
            <span class="prefix">+244</span>
            <input 
              v-model="formulario.telefoneDigital"
              type="tel"
              placeholder="9xx xxx xxx"
              class="form-control"
              maxlength="9"
              @input="limparTelefone"
            />
          </div>
        </div>

        <!-- Preview do Valor -->
        <div class="preview-box">
          <div class="preview-row">
            <span>Saldo Inicial:</span>
            <span class="preview-value">{{ formatCurrency(formulario.saldoInicialDecimal) }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="loading">
          Cancelar
        </button>
        <button 
          @click="confirmarCriacao" 
          class="btn btn-primary"
          :disabled="!podeConfirmar || loading"
        >
          {{ loading ? 'Criando...' : 'Criar Fundo' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import fundoConsumoService from '@/api/fundoConsumoService'
import pagamentoService from '@/api/pagamentoService'
import { configuracaoFinanceiraService } from '@/api/configuracaoFinanceiraService'

const props = defineProps({
  cliente: {
    type: Object,
    default: null
  },
  sessao: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'sucesso'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const valorMinimo = ref(10) // Valor em AOA (Fonte: ConfiguracaoFinanceira)
const loading = ref(false)
const formulario = ref({
  clienteId: props.cliente?.id || null,
  saldoInicialDecimal: 50.00,
  metodoPagamento: 'CASH',
  telefoneDigital: props.cliente?.telefone || '',
  observacoes: ''
})

// Computed para converter decimal → centavos
const saldoInicialCentavos = computed(() => {
  return Math.round((formulario.value.saldoInicialDecimal || 0) * 100)
})

// Computed para valor mínimo em decimal (AOA)
const valorMinimoDecimal = computed(() => {
  return (valorMinimo.value || 0).toFixed(2)
})

const podeConfirmar = computed(() => {
  // Obrigatório ter ou Cliente ou Sessão ou ID do Cliente manual
  const temContexto = !!(props.cliente?.id || props.sessao?.id || formulario.value.clienteId)
  
  // Saldo mínimo para criação administrativa: respeita a configuração do backend
  const baseValid = temContexto && 
         formulario.value.saldoInicialDecimal >= valorMinimo.value && 
         formulario.value.metodoPagamento

  if (formulario.value.metodoPagamento === 'GPO') {
    return baseValid && (formulario.value.telefoneDigital?.length || 0) >= 9
  }
  return baseValid
})

onMounted(async () => {
  try {
    // Buscar configuração global (Fonte única da verdade §1.1)
    const config = await configuracaoFinanceiraService.buscarConfiguracao()
    if (config?.valorMinimoOperacao) {
      valorMinimo.value = config.valorMinimoOperacao
    }
  } catch (err) {
    console.warn('[ModalCriarFundo] Não foi possível carregar valorMinimo, usando fallback 10 Kz')
  }

  // Define o valor inicial como o mínimo configurado (AOA)
  formulario.value.saldoInicialDecimal = valorMinimo.value 
})

const limparTelefone = (event) => {
  const val = event.target.value.replace(/\D/g, '')
  formulario.value.telefoneDigital = val.substring(0, 9)
}

const confirmarCriacao = async () => {
  if (formulario.value.saldoInicialDecimal < valorMinimo.value) {
    notificationStore.aviso(`Valor mínimo para criação: ${formatCurrency(valorMinimo.value)}`)
    return
  }

  loading.value = true
  try {
    // 1. Criar o fundo (Backend sempre com saldo 0 ou saldo inicial administrativo)
    const fundo = await fundoConsumoService.criarFundo({
      clienteId: formulario.value.clienteId || props.cliente?.id,
      sessaoId: props.sessao?.id, // Novo: vincula à sessão se fornecido
      saldoInicial: (formulario.value.metodoPagamento === 'CASH' || formulario.value.metodoPagamento === 'TPA') 
        ? formulario.value.saldoInicialDecimal 
        : 0,
      observacoes: formulario.value.observacoes || `Carga inicial ${formulario.value.metodoPagamento}`
    })

    // 2. Se for Digital, disparar pagamento
    if (formulario.value.metodoPagamento === 'GPO') {
      await pagamentoService.recarregarFundo({
        fundoId: fundo.id,
        valor: formulario.value.saldoInicialDecimal,
        metodo: 'GPO',
        telefone: formulario.value.telefoneDigital
      })
      notificationStore.sucesso('Fundo criado. Pedido de pagamento enviado ao telemóvel.')
    } else {
      notificationStore.sucesso(`Fundo criado com sucesso! Saldo: ${formatCurrency(saldoInicialCentavos.value)}`)
    }

    emit('sucesso', fundo)
  } catch (error) {
    const mensagem = error.response?.data?.message || error.message || 'Erro ao criar fundo'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
  padding: 20px;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.cliente-info {
  background: #f5f9ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #d0e3ff;
}

.info-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #666;
  font-weight: 500;
}

.info-row .value {
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.required {
  color: #d32f2f;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #1976d2;
}

.form-control:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-hint {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #666;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.payment-method {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.payment-method.selected {
  border-color: #1976d2;
  background: #e3f2fd;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.payment-method input {
  display: none;
}

.method-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.method-title {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  display: block;
}

.preview-box {
  background: #f0f7ff;
  border: 2px solid #1976d2;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}

.preview-value {
  color: #1976d2;
  font-size: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.input-with-prefix {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.prefix {
  background: #eee;
  padding: 10px;
  font-weight: 600;
  border-right: 1px solid #ddd;
}

.input-with-prefix .form-control {
  border: none;
}
</style>
