<template>
  <div class="configuracoes-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>⚙️ Configurações do Sistema</h1>
        <p class="subtitle">Gerencie parâmetros globais do sistema</p>
      </div>
      <div v-if="!isAdmin" class="alert alert-warning">
        <span>⚠️</span>
        <p>Você não tem permissão para alterar configurações. Apenas visualização.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando configurações...</p>
    </div>

    <!-- Configurações -->
    <div v-else class="config-sections">
      <!-- Seção: Financeiro -->
      <div class="config-section">
        <div class="section-header">
          <div class="section-icon">💰</div>
          <div>
            <h2>Configurações Financeiras</h2>
            <p class="section-description">Controle de modalidades de pagamento e limites</p>
          </div>
        </div>

        <div class="section-body">
          <!-- Interruptor Pós-Pago -->
          <div class="config-item">
            <div class="config-info">
              <div class="config-label">
                <h3>Modalidade Pós-Pago</h3>
                <span :class="['badge', posPagoAtivo ? 'badge-success' : 'badge-error']">
                  {{ posPagoAtivo ? '✅ ATIVADO' : '🚫 DESATIVADO' }}
                </span>
              </div>
              <p class="config-description">
                {{ posPagoAtivo 
                  ? 'Sistema aceita criação de pedidos pós-pago (pagamento posterior). Gerentes podem autorizar crédito.'
                  : 'Pós-pago está bloqueado. Apenas pagamento antecipado (fundo de consumo) é permitido.'
                }}
              </p>
              
              <!-- Detalhes da última atualização -->
              <div v-if="configuracao" class="config-meta">
                <span class="meta-item">
                  <strong>Última atualização:</strong> {{ formatData(configuracao.atualizadoEm) }}
                </span>
                <span class="meta-item">
                  <strong>Por:</strong> {{ configuracao.atualizadoPorNome }} ({{ configuracao.atualizadoPorRole }})
                </span>
              </div>

              <!-- Aviso de impacto -->
              <div v-if="isAdmin" class="config-warning">
                <span class="warning-icon">⚠️</span>
                <div>
                  <strong>Atenção:</strong>
                  <ul>
                    <li v-if="posPagoAtivo">Desativar bloqueará <strong>novos pedidos pós-pago</strong> imediatamente</li>
                    <li v-else>Ativar permitirá que Gerentes criem pedidos com pagamento posterior</li>
                    <li>Pedidos pós-pago existentes não são afetados</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Switch -->
            <div class="config-action">
              <label class="switch-container">
                <input 
                  type="checkbox" 
                  v-model="posPagoAtivo"
                  :disabled="!isAdmin || alterando"
                  @change="alterarPosPago"
                  class="switch-input"
                />
                <span class="switch-slider"></span>
              </label>
              <span class="switch-label">
                {{ posPagoAtivo ? 'Ativado' : 'Desativado' }}
              </span>
            </div>
          </div>

          <!-- Informações de Limite -->
          <div class="info-box">
            <div class="info-header">
              <span class="info-icon">ℹ️</span>
              <h4>Limites de Pós-Pago</h4>
            </div>
            <div class="info-content">
              <div class="limit-item">
                <span class="limit-label">Limite por Unidade de Consumo:</span>
                <span class="limit-value">500,00 AOA</span>
              </div>
              <p class="limit-description">
                Cada mesa/quarto pode ter até 500 AOA em pedidos pós-pago não pagos. 
                Após atingir o limite, será necessário efetuar pagamento antes de novos pedidos.
              </p>
              <p class="limit-note">
                <strong>Nota:</strong> Este limite é fixo no sistema. Para alterá-lo, contate o suporte técnico.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção: Auditoria (Futuro) -->
      <div class="config-section disabled">
        <div class="section-header">
          <div class="section-icon">📊</div>
          <div>
            <h2>Auditoria e Logs</h2>
            <p class="section-description">Histórico de alterações e eventos do sistema</p>
            <span class="badge badge-secondary">Em breve</span>
          </div>
        </div>
      </div>

      <!-- Seção: Notificações (Futuro) -->
      <div class="config-section disabled">
        <div class="section-header">
          <div class="section-icon">🔔</div>
          <div>
            <h2>Notificações</h2>
            <p class="section-description">Alertas e notificações em tempo real</p>
            <span class="badge badge-secondary">Em breve</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import configuracaoFinanceiraService from '@/services/configuracaoFinanceiraService'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const configuracao = ref(null)
const posPagoAtivo = ref(true)
const loading = ref(false)
const alterando = ref(false)

const isAdmin = computed(() => authStore.isAdmin)

// Carregar configuração
const carregarConfiguracao = async () => {
  loading.value = true
  try {
    const response = await configuracaoFinanceiraService.buscarConfiguracao()
    configuracao.value = response.data
    posPagoAtivo.value = response.data.posPagoAtivo
    
    console.log('[Configuracoes] Configuração carregada:', configuracao.value)
  } catch (error) {
    console.error('[Configuracoes] Erro ao carregar:', error)
    
    if (error.response?.status === 403) {
      notificationStore.erro('Você não tem permissão para acessar configurações')
    } else if (error.response?.status === 401) {
      notificationStore.erro('Sessão expirada. Faça login novamente')
    } else {
      notificationStore.erro('Erro ao carregar configurações do sistema')
    }
  } finally {
    loading.value = false
  }
}

// Alterar pós-pago
const alterarPosPago = async () => {
  if (!isAdmin.value) {
    notificationStore.erro('Apenas administradores podem alterar configurações')
    // Reverter o switch
    posPagoAtivo.value = !posPagoAtivo.value
    return
  }

  const novoEstado = posPagoAtivo.value
  const acao = novoEstado ? 'ativar' : 'desativar'
  
  // Confirmar ação
  const confirmacao = confirm(
    novoEstado
      ? '⚠️ Ativar pós-pago?\n\nGerentes poderão criar pedidos com pagamento posterior.'
      : '⚠️ Desativar pós-pago?\n\nNovos pedidos pós-pago serão bloqueados imediatamente.\nPedidos existentes não serão afetados.'
  )
  
  if (!confirmacao) {
    // Reverter o switch
    posPagoAtivo.value = !novoEstado
    return
  }

  alterando.value = true
  try {
    let response
    if (novoEstado) {
      response = await configuracaoFinanceiraService.ativarPosPago()
      notificationStore.sucesso('✅ Pós-pago ATIVADO com sucesso')
    } else {
      response = await configuracaoFinanceiraService.desativarPosPago()
      notificationStore.sucesso('🚫 Pós-pago DESATIVADO com sucesso')
    }
    
    // Atualizar dados
    configuracao.value = response.data
    posPagoAtivo.value = response.data.posPagoAtivo
    
    console.log(`[Configuracoes] Pós-pago ${acao}do:`, configuracao.value)
  } catch (error) {
    console.error(`[Configuracoes] Erro ao ${acao} pós-pago:`, error)
    
    // Reverter o switch
    posPagoAtivo.value = !novoEstado
    
    if (error.response?.status === 403) {
      notificationStore.erro('Você não tem permissão para alterar esta configuração')
    } else if (error.response?.status === 401) {
      notificationStore.erro('Sessão expirada. Faça login novamente')
    } else if (error.response?.status === 400) {
      notificationStore.erro(error.response?.data?.message || 'Erro de validação ao alterar configuração')
    } else {
      notificationStore.erro(`Erro ao ${acao} pós-pago`)
    }
  } finally {
    alterando.value = false
  }
}

// Formatar data
const formatData = (isoDate) => {
  if (!isoDate) return '-'
  const data = new Date(isoDate)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  carregarConfiguracao()
})
</script>

<style scoped>
.configuracoes-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.alert span {
  font-size: 20px;
}

.alert p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.loading-state {
  text-align: center;
  padding: 80px 20px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.config-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.config-section.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(to right, #f8f9fa, white);
}

.section-icon {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.section-description {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.section-body {
  padding: 24px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
}

.config-info {
  flex: 1;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.config-label h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-error {
  background: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background: #e2e3e5;
  color: #383d41;
}

.config-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.config-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #666;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.config-warning {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin-top: 12px;
}

.warning-icon {
  font-size: 20px;
}

.config-warning strong {
  color: #856404;
}

.config-warning ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
  color: #856404;
}

.config-warning li {
  margin: 4px 0;
}

.config-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Switch Toggle */
.switch-container {
  position: relative;
  display: inline-block;
  width: 64px;
  height: 34px;
}

.switch-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.switch-input:checked + .switch-slider {
  background-color: #4caf50;
}

.switch-input:checked + .switch-slider:before {
  transform: translateX(30px);
}

.switch-input:disabled + .switch-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-label {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

/* Info Box */
.info-box {
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 16px;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.info-icon {
  font-size: 20px;
}

.info-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0d47a1;
}

.info-content {
  font-size: 14px;
  color: #0d47a1;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #90caf9;
  margin-bottom: 8px;
}

.limit-label {
  font-weight: 600;
}

.limit-value {
  font-size: 18px;
  font-weight: 700;
}

.limit-description {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

.limit-note {
  margin: 12px 0 0 0;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-left: 3px solid #1976d2;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}

.limit-note strong {
  font-weight: 700;
}
</style>
