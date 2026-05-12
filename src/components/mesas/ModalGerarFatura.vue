<template>
  <teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4" @click.self="$emit('close')">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold text-text-primary">Gerar Fatura</h3>
            <p class="text-sm text-text-secondary">{{ mesa?.referencia || sessao?.referenciaMesa || 'Mesa' }}</p>
          </div>
          <button @click="$emit('close')" class="text-text-secondary hover:text-text-primary">✕</button>
        </div>

        <div class="p-6 space-y-5">
          <div class="bg-background rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-text-secondary">Total consumido</p>
              <p class="text-xl font-bold text-text-primary">{{ formatCurrency(totalConsumido) }}</p>
            </div>
            <div>
              <p class="text-sm text-text-secondary">Total a pagar</p>
              <p class="text-xl font-bold text-warning">{{ formatCurrency(totalPagar) }}</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">Ação</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                :class="botaoAcaoClasse('imprimir')"
                @click="acao = 'imprimir'"
              >
                Imprimir
              </button>
              <button
                type="button"
                :class="botaoAcaoClasse('sms')"
                @click="acao = 'sms'"
              >
                Enviar SMS
              </button>
              <button
                type="button"
                :class="botaoAcaoClasse('email')"
                @click="acao = 'email'"
              >
                Email
              </button>
            </div>
          </div>

          <div v-if="acao === 'sms'" class="space-y-2">
            <label class="block text-sm font-medium text-text-primary">
              Número de telemóvel <span v-if="precisaTelefoneSms" class="text-error">*</span>
            </label>
            <div class="flex rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/30">
              <span class="px-3 py-2 bg-background text-text-secondary border-r border-border">+244</span>
              <input
                v-model="telefoneSms"
                type="tel"
                maxlength="9"
                placeholder="9xx xxx xxx"
                class="flex-1 px-3 py-2 outline-none"
                @input="normalizarCampoTelefone"
              />
            </div>
            <p class="text-xs text-text-secondary">
              {{ sessao?.modoAnonimo ? 'Sessão anónima: informe o número para receber a fatura.' : 'Pode alterar o número antes de enviar.' }}
            </p>
          </div>

          <div v-if="acao === 'email'" class="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Envio por email em desenvolvimento.
          </div>
        </div>

        <div class="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button type="button" class="btn-secondary" :disabled="enviando" @click="$emit('close')">Cancelar</button>
          <button type="button" class="btn-primary" :disabled="!podeConfirmar || enviando" @click="confirmar">
            {{ textoConfirmar }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useCurrency } from '@/utils/currency'
import { limitarTelefoneLocal, normalizarTelefoneAngola } from '@/utils/telefone'
import { useNotificationStore } from '@/store/notifications'
import faturaService from '@/api/faturaService'

const props = defineProps({
  show: { type: Boolean, default: false },
  mesa: { type: Object, default: null },
  sessao: { type: Object, default: null },
  fundo: { type: Object, default: null }
})

const emit = defineEmits(['close', 'imprimir'])

const { formatCurrency } = useCurrency()
const notificationStore = useNotificationStore()

const acao = ref('imprimir')
const telefoneSms = ref('')
const enviando = ref(false)

const totalConsumido = computed(() => Number(props.sessao?.totalConsumo || 0))
const saldoFundo = computed(() => Number(props.fundo?.saldoAtual ?? props.fundo?.saldo ?? props.sessao?.saldoFundo ?? 0))
const totalPagar = computed(() => Math.max(totalConsumido.value - Math.max(saldoFundo.value, 0), 0))
const precisaTelefoneSms = computed(() => props.sessao?.modoAnonimo || !props.sessao?.telefoneCliente)

const telefonePreenchido = computed(() => {
  try {
    return Boolean(normalizarTelefoneAngola(telefoneSms.value))
  } catch {
    return false
  }
})

const podeConfirmar = computed(() => {
  if (!props.sessao?.id) return false
  if (acao.value === 'email') return false
  if (acao.value === 'sms') return telefonePreenchido.value
  return true
})

const textoConfirmar = computed(() => {
  if (enviando.value) return 'A processar...'
  if (acao.value === 'sms') return 'Enviar por SMS'
  if (acao.value === 'email') return 'Indisponível'
  return 'Imprimir'
})

watch(() => props.show, (show) => {
  if (!show) return
  acao.value = 'imprimir'
  telefoneSms.value = limitarTelefoneLocal(props.sessao?.telefoneCliente || '')
})

const botaoAcaoClasse = (valor) => [
  'px-4 py-3 rounded-lg border text-sm font-semibold transition-colors',
  acao.value === valor
    ? 'border-primary bg-primary text-white'
    : 'border-border bg-white text-text-primary hover:bg-background'
]

const normalizarCampoTelefone = () => {
  telefoneSms.value = limitarTelefoneLocal(telefoneSms.value)
}

const confirmar = async () => {
  if (acao.value === 'imprimir') {
    emit('imprimir', props.mesa)
    emit('close')
    return
  }

  if (acao.value === 'email') {
    notificationStore.info('Envio por email ainda está em desenvolvimento.')
    return
  }

  try {
    enviando.value = true
    const telefone = normalizarTelefoneAngola(telefoneSms.value)
    await faturaService.enviarPorSms(props.sessao.id, telefone)
    notificationStore.sucesso('Fatura enviada por SMS.')
    emit('close')
  } catch (error) {
    notificationStore.erro(error?.mensagemAmigavel || error?.message || 'Erro ao enviar fatura por SMS.')
  } finally {
    enviando.value = false
  }
}
</script>
