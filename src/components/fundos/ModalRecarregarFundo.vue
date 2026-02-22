<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Recarregar Fundo de Consumo</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Informações do Fundo -->
        <div class="fundo-info">
          <div class="info-row">
            <span class="label">Saldo Atual:</span>
            <span class="value saldo-atual">{{ formatCurrency(fundo.saldoAtual) }}</span>
          </div>
          <div class="info-row" v-if="fundo.cliente">
            <span class="label">Cliente:</span>
            <span class="value">{{ fundo.cliente.nome }}</span>
          </div>
        </div>

        <!-- Valor da Recarga -->
        <div class="form-group">
          <label class="form-label">
            Valor da Recarga <span class="required">*</span>
          </label>
          <input 
            v-model.number="formulario.valor" 
            type="number" 
            :min="valorMinimo"
            step="100"
            class="form-control"
            placeholder="Ex: 5000"
            required
          />
          <p class="form-hint">
            Mínimo: {{ formatCurrency(valorMinimo) }}
          </p>
        </div>

        <!-- Método de Pagamento -->
        <div class="form-group">
          <label class="form-label">
            Método de Pagamento AppyPay <span class="required">*</span>
          </label>
          <div class="payment-methods">
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'GPO' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="GPO" />
              <div class="method-content">
                <div class="method-icon">⚡</div>
                <div class="method-details">
                  <span class="method-title">GPO - Pagamento Instantâneo</span>
                  <span class="method-desc">Redirecionamento para AppyPay</span>
                </div>
              </div>
            </label>
            
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'REF' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="REF" />
              <div class="method-content">
                <div class="method-icon">🏦</div>
                <div class="method-details">
                  <span class="method-title">REF - Referência Bancária</span>
                  <span class="method-desc">Pagamento via banco</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Preview do Novo Saldo -->
        <div class="preview-box">
          <div class="preview-row">
            <span>Saldo Atual:</span>
            <span>{{ formatCurrency(fundo.saldoAtual) }}</span>
          </div>
          <div class="preview-row plus">
            <span>+ Recarga:</span>
            <span>{{ formatCurrency(formulario.valor) }}</span>
          </div>
          <div class="preview-row total">
            <span>Novo Saldo:</span>
            <span class="preview-value">{{ formatCurrency(fundo.saldoAtual + formulario.valor) }}</span>
          </div>
        </div>

        <!-- Informações do Pagamento -->
        <div v-if="pagamentoCriado" class="payment-info">
          <h4>Informações do Pagamento</h4>
          
          <div v-if="formulario.metodoPagamento === 'GPO' && pagamentoCriado.urlPagamento" class="payment-details">
            <p class="info-text">Clique no botão abaixo para ser redirecionado ao AppyPay:</p>
            <a 
              :href="pagamentoCriado.urlPagamento" 
              target="_blank" 
              class="btn btn-appypay"
            >
              Pagar com AppyPay →
            </a>
          </div>

          <div v-if="formulario.metodoPagamento === 'REF'" class="payment-details">
            <div class="ref-info">
              <div class="ref-row">
                <span class="ref-label">Entidade:</span>
                <span class="ref-value">{{ pagamentoCriado.entidade }}</span>
              </div>
              <div class="ref-row">
                <span class="ref-label">Referência:</span>
                <span class="ref-value large">{{ pagamentoCriado.referencia }}</span>
              </div>
            </div>
            <p class="info-text">Use estes dados para efetuar o pagamento no banco.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('fechar')" class="btn btn-secondary" :disabled="loading">
          {{ pagamentoCriado ? 'Fechar' : 'Cancelar' }}
        </button>
        <button 
          v-if="!pagamentoCriado"
          @click="confirmarRecarga" 
          class="btn btn-primary"
          :disabled="!podeConfirmar || loading"
        >
          {{ loading ? 'Processando...' : 'Confirmar Recarga' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useNotificationStore } from '@/store/notifications'
import fundoConsumoService from '@/services/fundoConsumoService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  fundo: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'recarga-realizada'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const valorMinimo = ref(5000)
const loading = ref(false)
const pagamentoCriado = ref(null)
const formulario = ref({
  valor: 5000,
  metodoPagamento: 'GPO'
})

const podeConfirmar = computed(() => {
  return formulario.value.valor >= valorMinimo.value && 
         formulario.value.metodoPagamento
})

onMounted(async () => {
  try {
    const config = await fundoConsumoService.consultarValorMinimo()
    valorMinimo.value = config.valorMinimo
    formulario.value.valor = config.valorMinimo
  } catch (error) {
    console.error('Erro ao carregar valor mínimo:', error)
  }
})

const confirmarRecarga = async () => {
  if (!podeConfirmar.value) {
    notificationStore.aviso('Preencha todos os campos corretamente')
    return
  }

  if (formulario.value.valor < valorMinimo.value) {
    notificationStore.aviso(`Valor mínimo de recarga: ${formatCurrency(valorMinimo.value)}`)
    return
  }

  loading.value = true
  try {
    const pagamento = await fundoConsumoService.recarregarFundo(
      props.fundo.id,
      {
        valor: formulario.value.valor,
        metodoPagamento: formulario.value.metodoPagamento
      }
    )

    pagamentoCriado.value = pagamento
    
    if (formulario.value.metodoPagamento === 'GPO') {
      notificationStore.sucesso('Redirecionando para AppyPay...')
      // URL será aberta pelo usuário clicando no botão
    } else if (formulario.value.metodoPagamento === 'REF') {
      notificationStore.sucesso('Referência bancária gerada com sucesso!')
    }

    emit('recarga-realizada', pagamento)
  } catch (error) {
    const mensagem = error.response?.data?.message || error.message || 'Erro ao criar recarga'
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
  z-index: 9999;
  padding: 20px;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
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

.fundo-info {
  background: #f0f7ff;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #d0e3ff;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.saldo-atual {
  color: #1976d2;
  font-size: 18px;
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

.form-hint {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #666;
}

.payment-methods {
  display: grid;
  gap: 12px;
}

.payment-method {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-method:hover {
  border-color: #1976d2;
  background: #f5f9ff;
}

.payment-method.selected {
  border-color: #1976d2;
  background: #e3f2fd;
}

.payment-method input[type="radio"] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.method-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.method-icon {
  font-size: 24px;
}

.method-details {
  display: flex;
  flex-direction: column;
}

.method-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.method-desc {
  font-size: 12px;
  color: #666;
}

.preview-box {
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.preview-row:last-child {
  margin-bottom: 0;
}

.preview-row.plus {
  color: #4caf50;
  font-weight: 600;
}

.preview-row.total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid #ddd;
  font-size: 16px;
  font-weight: 700;
}

.preview-value {
  color: #1976d2;
  font-size: 20px;
}

.payment-info {
  background: #fff3e0;
  border: 2px solid #ffb74d;
  border-radius: 8px;
  padding: 16px;
  margin-top: 20px;
}

.payment-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-text {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.btn-appypay {
  display: inline-block;
  padding: 12px 24px;
  background: #ff6b00;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
  transition: background 0.2s;
}

.btn-appypay:hover {
  background: #e65100;
}

.ref-info {
  background: white;
  padding: 12px;
  border-radius: 6px;
}

.ref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ref-row:last-child {
  margin-bottom: 0;
}

.ref-label {
  font-weight: 600;
  color: #666;
}

.ref-value {
  font-weight: 700;
  color: #333;
}

.ref-value.large {
  font-size: 18px;
  color: #1976d2;
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
</style>
