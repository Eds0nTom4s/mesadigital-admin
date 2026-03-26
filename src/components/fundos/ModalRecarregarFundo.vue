<template>
  <div v-if="isOpen && fundo" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3>Recarregar Fundo de Consumo</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <!-- Alerta: Fundo Encerrado -->
        <div v-if="!fundoAtivo" class="alert alert-danger">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">
            <strong>Fundo Encerrado</strong>
            <p>Este fundo foi encerrado e não pode receber novas recargas.</p>
          </div>
        </div>

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
          <div class="info-row">
            <span class="label">Status:</span>
            <span class="badge" :class="fundoAtivo ? 'badge-success' : 'badge-danger'">
              {{ fundoAtivo ? 'ATIVO' : 'ENCERRADO' }}
            </span>
          </div>
        </div>

        <!-- Valor da Recarga -->
        <div v-if="fundoAtivo" class="form-group amount-group">
          <label class="form-label">
            Valor da Recarga <span class="required">*</span>
          </label>
          <div class="input-money-wrapper">
             <span class="currency-prefix">Kz</span>
             <input 
               :value="valorFormatado"
               type="text"
               class="form-control money-input"
               placeholder="0,00"
               @input="handleInputMoney"
               required
             />
          </div>
          <div class="quick-amounts">
            <button v-for="q in [1000, 2000, 5000, 10000]" :key="q" 
                    type="button" class="btn-quick" 
                    @click="formulario.valorDecimal = q">
              + {{ q.toLocaleString() }}
            </button>
          </div>
          <p class="form-hint" :class="{ 'warning': formulario.valorDecimal < valorMinimo }">
            Mínimo permitido: <strong>{{ formatCurrency(valorMinimo) }}</strong>
          </p>
        </div>

        <!-- Método de Pagamento -->
        <div v-if="fundoAtivo" class="form-group">
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
                  <span class="method-desc">Recebimento manual em espécie</span>
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
                  <span class="method-desc">Pagamento via terminal físico</span>
                </div>
              </div>
            </label>

            <!-- DIGITAL (GPO) -->
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'GPO' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="GPO" />
              <div class="method-content">
                <div class="method-icon">⚡</div>
                <div class="method-details">
                  <span class="method-title">Digital (M-Express / GPO)</span>
                  <span class="method-desc">Disparar pedido para o telemóvel do cliente</span>
                </div>
              </div>
            </label>
            
            <!-- REF (Opcional, manter se necessário) -->
            <label 
              class="payment-method" 
              :class="{ 'selected': formulario.metodoPagamento === 'REF' }"
            >
              <input type="radio" v-model="formulario.metodoPagamento" value="REF" />
              <div class="method-content">
                <div class="method-icon">🏦</div>
                <div class="method-details">
                  <span class="method-title">Referência Bancária</span>
                  <span class="method-desc">Gerar dados para ATM/Internet Banking</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Telefone para Digital (GPO/M-Express) -->
        <div v-if="formulario.metodoPagamento === 'GPO' && !pagamentoCriado" class="form-group mt-4 animate-fade-in">
          <label class="form-label">Número do Telemóvel (Cliente) <span class="required">*</span></label>
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
          <p class="form-hint">O cliente receberá o pedido de confirmação no telemóvel.</p>
        </div>

        <!-- Preview do Novo Saldo -->
        <div v-if="fundoAtivo" class="preview-box">
          <div class="preview-row">
            <span>Saldo Atual:</span>
            <span>{{ formatCurrency(fundo.saldoAtual) }}</span>
          </div>
          <div class="preview-row plus">
            <span>+ Recarga:</span>
            <span>{{ formatCurrency(formulario.valorDecimal) }}</span>
          </div>
          <div class="preview-row total">
            <span>Novo Saldo:</span>
            <span class="preview-value">{{ formatCurrency(fundo.saldoAtual + formulario.valorDecimal) }}</span>
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
        <button @click="$emit('close')" class="btn btn-secondary" :disabled="loading">
          {{ (pagamentoCriado || recargaSucesso) ? 'Fechar' : 'Cancelar' }}
        </button>
        <button 
          v-if="!pagamentoCriado && !recargaSucesso"
          @click="confirmarRecarga" 
          class="btn btn-primary"
          :disabled="!podeConfirmar || loading"
        >
          {{ loading ? 'Processando...' : 'Confirmar e Creditar' }}
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
  fundo: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'recarga-realizada'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const valorMinimo = ref(10) // AOA
const loading = ref(false)
const pagamentoCriado = ref(null)
const recargaSucesso = ref(false)
const formulario = ref({
  valorDecimal: 50.00, // valor em decimal (Kz)
  metodoPagamento: 'CASH',
  telefoneDigital: ''
})

// Lógica de formatação de moeda em tempo real
const valorFormatado = computed(() => {
  if (!formulario.value.valorDecimal) return ''
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(formulario.value.valorDecimal)
})

const handleInputMoney = (event) => {
  let value = event.target.value.replace(/\D/g, '') // Remove tudo exceto dígitos
  
  if (!value) {
    formulario.value.valorDecimal = 0
    return
  }

  // Converte string de dígitos para decimal (ex: "5000" -> 50.00)
  const numericValue = parseFloat(value) / 100
  
  // Limite de segurança
  if (numericValue <= 99999999) {
    formulario.value.valorDecimal = numericValue
  }
}

// Computed para converter decimal → centavos
const valorRecargaCentavos = computed(() => {
  return Math.round((formulario.value.valorDecimal || 0) * 100)
})

// Computed para valor mínimo em decimal (AOA)
const valorMinimoDecimal = computed(() => {
  return (valorMinimo.value || 0).toFixed(2)
})

const podeConfirmar = computed(() => {
  const baseValid = fundoAtivo.value &&
         formulario.value.valorDecimal >= valorMinimo.value && 
         formulario.value.metodoPagamento
  
  if (formulario.value.metodoPagamento === 'GPO') {
    return baseValid && formulario.value.telefoneDigital.length >= 9
  }
  
  return baseValid
})

const fundoAtivo = computed(() => {
  return props.fundo?.ativo === true
})

onMounted(async () => {
  try {
    const config = await configuracaoFinanceiraService.buscarConfiguracao()
    // Backend envia BigDecimal (AOA), ex: 10.00
    valorMinimo.value = config.valorMinimoOperacao ?? 10
    formulario.value.valorDecimal = valorMinimo.value
  } catch (error) {
    console.error('Erro ao carregar valor mínimo:', error)
  }
})

const limparTelefone = (event) => {
  // Remove tudo que não é dígito
  const val = event.target.value.replace(/\D/g, '')
  formulario.value.telefoneDigital = val.substring(0, 9)
}

const confirmarRecarga = async () => {
  if (!fundoAtivo.value) {
    notificationStore.erro('Não é possível recarregar um fundo encerrado')
    return
  }

  if (!podeConfirmar.value) {
    notificationStore.aviso('Preencha todos os campos corretamente')
    return
  }

  if (formulario.value.valorDecimal < valorMinimo.value) {
    notificationStore.aviso(`Valor mínimo de recarga: ${formatCurrency(valorMinimo.value)}`)
    return
  }

  if (formulario.value.valorDecimal > 99999999) {
    notificationStore.erro('O valor da recarga não pode exceder 99.999.999,99 Kz')
    return
  }

  loading.value = true
  try {
    // Caso 1: CASH ou TPA (Direto Administrativo)
    if (formulario.value.metodoPagamento === 'CASH' || formulario.value.metodoPagamento === 'TPA') {
      const token = props.fundo.qrCodeSessao || props.fundo.tokenPortador || props.fundo.token
      const resp = await fundoConsumoService.recarregarFundo(
        token,
        formulario.value.valorDecimal, // API espera AOA
        `Recarga Balcão ${formulario.value.metodoPagamento}`
      )
      notificationStore.sucesso(`${formulario.value.metodoPagamento} creditado com sucesso!`)
      recargaSucesso.value = true
      emit('recarga-realizada', resp)
      return
    }

    // Caso 2: DIGITAL (GPO) ou REF (Gateway)
    const pagamento = await pagamentoService.recarregarFundo({
      fundoId: props.fundo.id,
      valor: formulario.value.valorDecimal,
      metodo: formulario.value.metodoPagamento,
      telefone: formulario.value.metodoPagamento === 'GPO' ? formulario.value.telefoneDigital : null
    })

    pagamentoCriado.value = pagamento
    
    if (formulario.value.metodoPagamento === 'GPO') {
      notificationStore.sucesso('Pedido enviado ao telemóvel do cliente.')
    } else if (formulario.value.metodoPagamento === 'REF') {
      notificationStore.sucesso('Referência bancária gerada!')
    }

    emit('recarga-realizada', pagamento)
  } catch (error) {
    const mensagem = error.response?.data?.message || error.message || 'Erro ao processar recarga'
    notificationStore.erro(mensagem)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.prefix {
  background: #eee;
  padding: 10px 12px;
  font-weight: 600;
  color: #666;
  border-right: 1px solid #ddd;
}

.input-with-prefix .form-control {
  border: none;
  border-radius: 0;
}
</style>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.payment-method {
  flex: 1 1 calc(50% - 12px);
  min-width: 200px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
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
  font-size: 20px;
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
  font-size: 11px;
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

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert-danger {
  background: #fdecea;
  border: 1px solid #f5c2c7;
}

.alert-icon {
  font-size: 20px;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 4px;
  color: #d32f2f;
  font-size: 14px;
}

.alert-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-success {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-danger {
  background: #ffebee;
  color: #c62828;
}

/* Novos estilos para o input financeiro */
.amount-group {
  background: #fdfdfd;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-bottom: 25px;
}

.input-money-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 0 15px;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.input-money-wrapper:focus-within {
  border-color: #1976d2;
  box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.1);
}

.currency-prefix {
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  margin-right: 10px;
  user-select: none;
}

.money-input {
  border: none !important;
  font-size: 32px !important;
  font-weight: 700 !important;
  color: #333 !important;
  padding: 10px 0 !important;
  background: transparent !important;
  width: 100%;
  outline: none !important;
  box-shadow: none !important;
}

.money-input::placeholder {
  color: #ccc;
}

/* Remover flechas do input number */
.money-input::-webkit-outer-spin-button,
.money-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.btn-quick {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-quick:hover {
  border-color: #1976d2;
  color: #1976d2;
  background: #f0f7ff;
}

.btn-quick:active {
  transform: translateY(1px);
}

.form-hint.warning {
  color: #d32f2f;
  font-weight: 600;
}
</style>
