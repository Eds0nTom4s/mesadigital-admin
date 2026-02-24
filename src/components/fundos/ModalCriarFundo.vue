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

        <!-- Formulário -->
        <div class="form-group">
          <label class="form-label">
            ID do Cliente <span class="required">*</span>
          </label>
          <input 
            v-model.number="formulario.clienteId" 
            type="number" 
            class="form-control"
            placeholder="Ex: 123"
            :disabled="!!cliente"
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
            rows="3"
            placeholder="Informações adicionais (opcional)"
          />
        </div>

        <!-- Preview do Valor -->
        <div class="preview-box">
          <div class="preview-row">
            <span>Saldo Inicial:</span>
            <span class="preview-value">{{ formatCurrency(saldoInicialCentavos) }}</span>
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
import fundoConsumoService from '@/services/fundoConsumoService'

const props = defineProps({
  cliente: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'sucesso'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const valorMinimo = ref(5000) // centavos
const loading = ref(false)
const formulario = ref({
  clienteId: props.cliente?.id || null,
  saldoInicialDecimal: 50.00, // valor em decimal (Kz)
  observacoes: ''
})

// Computed para converter decimal → centavos
const saldoInicialCentavos = computed(() => {
  return Math.round((formulario.value.saldoInicialDecimal || 0) * 100)
})

// Computed para valor mínimo em decimal
const valorMinimoDecimal = computed(() => {
  return (valorMinimo.value / 100).toFixed(2)
})

const podeConfirmar = computed(() => {
  return formulario.value.clienteId && 
         saldoInicialCentavos.value >= valorMinimo.value
})

onMounted(async () => {
  try {
    const config = await fundoConsumoService.consultarValorMinimo()
    valorMinimo.value = config.valorMinimo // já vem em centavos
    formulario.value.saldoInicialDecimal = (config.valorMinimo / 100) // converte para decimal
  } catch (error) {
    console.error('Erro ao carregar valor mínimo:', error)
  }
})

const confirmarCriacao = async () => {
  if (!podeConfirmar.value) {
    notificationStore.aviso('Preencha todos os campos obrigatórios')
    return
  }

  if (saldoInicialCentavos.value < valorMinimo.value) {
    notificationStore.aviso(`Saldo inicial deve ser no mínimo ${formatCurrency(valorMinimo.value)}`)
    return
  }

  loading.value = true
  try {
    const fundo = await fundoConsumoService.criarFundo({
      clienteId: formulario.value.clienteId,
      saldoInicial: saldoInicialCentavos.value, // envia em centavos
      observacoes: formulario.value.observacoes || 'Carga inicial'
    })

    notificationStore.sucesso(`Fundo criado com sucesso! Saldo: ${formatCurrency(saldoInicialCentavos.value)}`)
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
  z-index: 9999;
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
</style>
