<template>
  <div class="configuracoes-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>⚙️ Configurações do Sistema</h1>
        <p class="subtitle">Parâmetros financeiros e operacionais</p>
      </div>
      <div v-if="!isAdmin" class="alert alert-warning">
        <span>⚠️</span>
        <p>Você não tem permissão para alterar configurações. Apenas visualização.</p>
      </div>
    </div>

    <!-- Loading inicial -->
    <div v-if="carregando" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando configurações...</p>
    </div>

    <!-- Erro de carregamento -->
    <div v-else-if="!configuracao && erro" class="alert alert-danger mt-4">
      <span>❌</span>
      <p>{{ erro }}</p>
      <button @click="carregarConfiguracao" class="btn btn-sm btn-primary ml-4">Tentar novamente</button>
    </div>

    <!-- Conteúdo -->
    <div v-else-if="configuracao" class="config-sections">

      <!-- ─────────────────────────────────────────────── -->
      <!-- Barra de auditoria: última alteração            -->
      <!-- ─────────────────────────────────────────────── -->
      <div v-if="configuracao.atualizadoPorNome" class="audit-bar">
        <span class="audit-icon">🕵️</span>
        <span>
          Última alteração por <strong>{{ configuracao.atualizadoPorNome }}</strong>
          ({{ configuracao.atualizadoPorRole }})
          em {{ formatData(configuracao.updatedAt) }}
          <span v-if="configuracao.motivoUltimaAlteracao">
            — <em>"{{ configuracao.motivoUltimaAlteracao }}"</em>
          </span>
        </span>
      </div>

      <!-- ─────────────────────────────────────────────── -->
      <!-- Secção: Controlo do Pós-Pago                   -->
      <!-- ─────────────────────────────────────────────── -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">🔄</div>
          <div>
            <h2>Modalidade Pós-Pago</h2>
            <p class="section-description">Ativar ou desativar pagamento posterior em todo o sistema</p>
          </div>
        </div>

        <div class="section-body">
          <div class="config-item">
            <div class="config-info">
              <div class="config-label">
                <h3>Estado atual</h3>
                <span :class="['badge', configuracao.posPagoAtivo ? 'badge-success' : 'badge-error']">
                  {{ configuracao.posPagoAtivo ? '✅ ATIVADO' : '🚫 DESATIVADO' }}
                </span>
              </div>
              <p class="config-description">
                {{ configuracao.posPagoAtivo
                  ? 'Pedidos pós-pago podem ser criados (respeitando limite por unidade).'
                  : 'Pós-pago bloqueado globalmente. Apenas pagamento pré-pago aceite.' }}
              </p>

              <div v-if="isAdmin" class="config-warning">
                <span>⚠️</span>
                <ul>
                  <li v-if="configuracao.posPagoAtivo">Desativar bloqueia <strong>novos pedidos pós-pago</strong> imediatamente.</li>
                  <li v-else>Ativar permite pedidos com pagamento posterior (respeitando limites).</li>
                  <li>Pedidos existentes não são afetados.</li>
                </ul>
              </div>
            </div>

            <div v-if="isAdmin" class="config-action">
              <button
                v-if="!configuracao.posPagoAtivo"
                @click="abrirModalPosPago('ativar')"
                :disabled="carregando"
                class="btn btn-success"
              >
                Ativar Pós-Pago
              </button>
              <button
                v-else
                @click="abrirModalPosPago('desativar')"
                :disabled="carregando"
                class="btn btn-danger"
              >
                Desativar Pós-Pago
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────────────── -->
      <!-- Secção: Parâmetros Financeiros                  -->
      <!-- ─────────────────────────────────────────────── -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">💰</div>
          <div>
            <h2>Parâmetros Financeiros</h2>
            <p class="section-description">Limites e valores mínimos de operação (carregados do backend)</p>
          </div>
        </div>

        <div class="section-body">

          <!-- Limite Pós-Pago -->
          <div class="param-row">
            <div class="param-info">
              <h4>Limite Pós-Pago por Unidade</h4>
              <p>
                Valor máximo de consumo em aberto por mesa/quarto sem pagamento.
                Mínimo aceite: <strong>{{ formatCurrency(LIMITE_POS_PAGO_MINIMO) }}</strong>.
              </p>
            </div>
            <div class="param-value">
              <span class="valor-destaque">{{ formatCurrency(configuracao.limitePosPago) }}</span>
              <button v-if="isAdmin" @click="abrirModalLimite" class="btn btn-sm btn-secondary">
                ✏️ Editar
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Valor Mínimo de Operação -->
          <div class="param-row">
            <div class="param-info">
              <h4>Valor Mínimo de Operação</h4>
              <p>
                Valor mínimo para recargas, débitos e estornos.
                Nunca fixo — carregado do backend via GET /configuracoes-financeiras.
              </p>
            </div>
            <div class="param-value">
              <span class="valor-destaque">{{ formatCurrency(configuracao.valorMinimoOperacao) }}</span>
              <button v-if="isAdmin" @click="abrirModalValorMinimo" class="btn btn-sm btn-secondary">
                ✏️ Editar
              </button>
            </div>
          </div>

        </div>
      </div>

    </div><!-- /config-sections -->

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Ativar / Desativar Pós-Pago                -->
    <!-- ══════════════════════════════════════════════════ -->
    <div v-if="modalPosPago.aberto" class="modal-overlay" @click.self="modalPosPago.aberto = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            {{ modalPosPago.acao === 'ativar' ? '✅ Ativar Pós-Pago' : '🚫 Desativar Pós-Pago' }}
          </h2>
          <button @click="modalPosPago.aberto = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body space-y-4">
          <p class="text-sm text-gray-600">
            <template v-if="modalPosPago.acao === 'ativar'">
              Ao ativar, pedidos pós-pago poderão ser criados (respeitando o limite por unidade).
            </template>
            <template v-else>
              Ao desativar, nenhum novo pedido pós-pago será criado. Pedidos existentes não são afetados.
            </template>
          </p>

          <div>
            <label class="block text-sm font-medium mb-1">
              Motivo da alteração
              <span class="text-xs text-amber-hint ml-1">(recomendado para auditoria)</span>
            </label>
            <textarea
              v-model="modalPosPago.motivo"
              rows="3"
              placeholder="Ex: Retomada após auditoria / Excesso de inadimplência..."
              class="input w-full resize-none"
              maxlength="500"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">{{ modalPosPago.motivo.length }}/500</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="modalPosPago.aberto = false" class="btn btn-secondary">Cancelar</button>
          <button
            @click="confirmarAlterarPosPago"
            :disabled="carregando"
            :class="['btn', modalPosPago.acao === 'ativar' ? 'btn-success' : 'btn-danger']"
          >
            {{ carregando ? 'Aguarde...' : (modalPosPago.acao === 'ativar' ? 'Confirmar Ativação' : 'Confirmar Desativação') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Editar Limite de Pós-Pago                  -->
    <!-- ══════════════════════════════════════════════════ -->
    <div v-if="modalLimite.aberto" class="modal-overlay" @click.self="modalLimite.aberto = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Alterar Limite de Pós-Pago</h2>
          <button @click="modalLimite.aberto = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              Novo limite (AOA) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="modalLimite.novoValor"
              type="number"
              :min="LIMITE_POS_PAGO_MINIMO"
              step="0.01"
              class="input w-full"
              placeholder="Ex: 500.00"
            />
            <p class="text-xs text-gray-400 mt-1">
              Mínimo aceite: <strong>{{ formatCurrency(LIMITE_POS_PAGO_MINIMO) }}</strong>
            </p>
            <p v-if="modalLimite.novoValor !== null && modalLimite.novoValor < LIMITE_POS_PAGO_MINIMO"
               class="text-xs text-red-500 mt-1">
              ❌ Valor abaixo do mínimo ({{ formatCurrency(LIMITE_POS_PAGO_MINIMO) }})
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Motivo da alteração
              <span class="text-xs text-amber-hint ml-1">(recomendado)</span>
            </label>
            <textarea
              v-model="modalLimite.motivo"
              rows="3"
              placeholder="Ex: Ajuste por alta temporada / Redução por risco..."
              class="input w-full resize-none"
              maxlength="500"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">{{ modalLimite.motivo.length }}/500</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="modalLimite.aberto = false" class="btn btn-secondary">Cancelar</button>
          <button
            @click="confirmarAlterarLimite"
            :disabled="carregando || !modalLimite.novoValor || modalLimite.novoValor < LIMITE_POS_PAGO_MINIMO"
            class="btn btn-primary"
          >
            {{ carregando ? 'Aguarde...' : 'Salvar Limite' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════ -->
    <!-- MODAL: Editar Valor Mínimo de Operação            -->
    <!-- ══════════════════════════════════════════════════ -->
    <div v-if="modalValorMinimo.aberto" class="modal-overlay" @click.self="modalValorMinimo.aberto = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>✏️ Alterar Valor Mínimo de Operação</h2>
          <button @click="modalValorMinimo.aberto = false" class="btn-close">✕</button>
        </div>
        <div class="modal-body space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">
              Novo valor mínimo (AOA) <span class="text-red-500">*</span>
            </label>
            <input
              v-model.number="modalValorMinimo.novoValor"
              type="number"
              min="0.01"
              step="0.01"
              class="input w-full"
              placeholder="Ex: 15.00"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">
              Motivo da alteração
              <span class="text-xs text-amber-hint ml-1">(recomendado)</span>
            </label>
            <textarea
              v-model="modalValorMinimo.motivo"
              rows="3"
              placeholder="Ex: Ajuste operacional Q1 2026..."
              class="input w-full resize-none"
              maxlength="500"
            ></textarea>
            <p class="text-xs text-gray-400 mt-1">{{ modalValorMinimo.motivo.length }}/500</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="modalValorMinimo.aberto = false" class="btn btn-secondary">Cancelar</button>
          <button
            @click="confirmarAlterarValorMinimo"
            :disabled="carregando || !modalValorMinimo.novoValor || modalValorMinimo.novoValor <= 0"
            class="btn btn-primary"
          >
            {{ carregando ? 'Aguarde...' : 'Salvar Valor Mínimo' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import { useConfiguracaoFinanceira } from '@/composables/useConfiguracaoFinanceira'
import { useCurrency } from '@/utils/currency'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { formatCurrency } = useCurrency()

const {
  configuracao,
  carregando,
  erro,
  carregarConfiguracao,
  ativarPosPago,
  desativarPosPago,
  alterarLimitePosPago,
  alterarValorMinimo
} = useConfiguracaoFinanceira()

// Mínimo de pós-pago aceite pelo backend (ALINHAMENTO §3.3 — baixou de 1.000 para 100 AOA)
const LIMITE_POS_PAGO_MINIMO = 100

const isAdmin = computed(() => authStore.isAdmin)

// ─── Estado dos modais ────────────────────────────────────────────────────────

const modalPosPago = ref({ aberto: false, acao: 'ativar', motivo: '' })
const modalLimite = ref({ aberto: false, novoValor: null, motivo: '' })
const modalValorMinimo = ref({ aberto: false, novoValor: null, motivo: '' })

// ─── Abrir modais ─────────────────────────────────────────────────────────────

function abrirModalPosPago(acao) {
  modalPosPago.value = { aberto: true, acao, motivo: '' }
}

function abrirModalLimite() {
  modalLimite.value = {
    aberto: true,
    novoValor: configuracao.value?.limitePosPago ?? null,
    motivo: ''
  }
}

function abrirModalValorMinimo() {
  modalValorMinimo.value = {
    aberto: true,
    novoValor: configuracao.value?.valorMinimoOperacao ?? null,
    motivo: ''
  }
}

// ─── Confirmar alterações ─────────────────────────────────────────────────────

async function confirmarAlterarPosPago() {
  const { acao, motivo } = modalPosPago.value
  try {
    if (acao === 'ativar') {
      await ativarPosPago(motivo)
      notificationStore.sucesso('✅ Pós-pago ativado com sucesso.')
    } else {
      await desativarPosPago(motivo)
      notificationStore.sucesso('🚫 Pós-pago desativado com sucesso.')
    }
    modalPosPago.value.aberto = false
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao alterar pós-pago'
    notificationStore.erro(msg)
  }
}

async function confirmarAlterarLimite() {
  const { novoValor, motivo } = modalLimite.value
  if (!novoValor || novoValor < LIMITE_POS_PAGO_MINIMO) {
    notificationStore.aviso(`Valor mínimo permitido é ${formatCurrency(LIMITE_POS_PAGO_MINIMO)}`)
    return
  }
  try {
    await alterarLimitePosPago(novoValor, motivo)
    notificationStore.sucesso('Limite de pós-pago atualizado com sucesso.')
    modalLimite.value.aberto = false
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao alterar limite'
    notificationStore.erro(msg)
  }
}

async function confirmarAlterarValorMinimo() {
  const { novoValor, motivo } = modalValorMinimo.value
  if (!novoValor || novoValor <= 0) {
    notificationStore.aviso('Informe um valor maior que zero.')
    return
  }
  try {
    await alterarValorMinimo(novoValor, motivo)
    notificationStore.sucesso('Valor mínimo de operação atualizado com sucesso.')
    modalValorMinimo.value.aberto = false
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || 'Erro ao alterar valor mínimo'
    notificationStore.erro(msg)
  }
}

// ─── Formatação ───────────────────────────────────────────────────────────────

function formatData(isoDate) {
  if (!isoDate) return '-'
  return new Date(isoDate).toLocaleString('pt-AO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── Inicialização ────────────────────────────────────────────────────────────

onMounted(() => {
  carregarConfiguracao().catch(e => {
    const status = e?.response?.status
    const msg = e?.response?.data?.message || e?.message
    if (status === 403) {
      notificationStore.erro('Sem permissão para aceder às configurações.')
    } else if (status === 401) {
      notificationStore.erro('Sessão expirada. Faça login novamente.')
    } else {
      notificationStore.erro(msg || 'Erro ao carregar configurações.')
    }
  })
})
</script>

<style scoped>
.configuracoes-container {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px 0;
}

.subtitle {
  font-size: 15px;
  color: #666;
  margin: 0;
}

/* ── Audit bar ───────────────────────────────────────────── */
.audit-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  font-size: 13px;
  color: #0369a1;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.audit-icon { font-size: 18px; }

/* ── Secções ─────────────────────────────────────────────── */
.config-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(to right, #f8f9fa, white);
}

.section-icon {
  font-size: 30px;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
}

.section-header h2 {
  margin: 0 0 3px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.section-description {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.section-body { padding: 24px; }

/* ── Config item (Pós-pago) ──────────────────────────────── */
.config-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.config-info { flex: 1; min-width: 0; }

.config-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.config-label h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.config-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #6b7280;
}

.config-warning {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
}

.config-warning ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #92400e;
}

.config-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Parâmetros financeiros ──────────────────────────────── */
.param-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 0;
}

.param-info { flex: 1; min-width: 0; }

.param-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.param-info p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.param-value {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.valor-destaque {
  font-size: 20px;
  font-weight: 700;
  color: #1d4ed8;
}

.divider { border-top: 1px solid #f3f4f6; }

/* ── Badges ─────────────────────────────────────────────── */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-success { background: #dcfce7; color: #166534; }
.badge-error   { background: #fee2e2; color: #991b1b; }

/* ── Alerts ─────────────────────────────────────────────── */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
}

.alert-warning { background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; }
.alert-danger  { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }
.alert p { margin: 0; font-size: 14px; }
.mt-4 { margin-top: 16px; }

/* ── Loading ─────────────────────────────────────────────── */
.loading-state { text-align: center; padding: 60px 20px; }

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin .9s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modais ─────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,.25);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
}

.btn-close:hover { color: #111827; }

.modal-body { padding: 20px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* ── Botões ─────────────────────────────────────────────── */
.btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity .2s;
}

.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-primary   { background: #1d4ed8; color: white; }
.btn-primary:hover:not(:disabled)   { background: #1e40af; }
.btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-secondary:hover:not(:disabled) { background: #e5e7eb; }
.btn-success   { background: #16a34a; color: white; }
.btn-success:hover:not(:disabled)   { background: #15803d; }
.btn-danger    { background: #dc2626; color: white; }
.btn-danger:hover:not(:disabled)    { background: #b91c1c; }
.btn-sm        { padding: 5px 12px; font-size: 13px; }

/* ── Input / Textarea ───────────────────────────────────── */
.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color .2s;
  box-sizing: border-box;
  font-family: inherit;
}

.input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,.1); }

/* ── Utils ──────────────────────────────────────────────── */
.space-y-4 > * + * { margin-top: 16px; }
.w-full   { width: 100%; }
.resize-none { resize: none; }
.ml-4 { margin-left: 16px; }
.block { display: block; }
.text-sm { font-size: 14px; }
.text-xs { font-size: 12px; }
.font-medium { font-weight: 500; }
.mb-1 { margin-bottom: 4px; }
.mt-1 { margin-top: 4px; }
.text-gray-400 { color: #9ca3af; }
.text-gray-600 { color: #4b5563; }
.text-red-500  { color: #ef4444; }
</style>
