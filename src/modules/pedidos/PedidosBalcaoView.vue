<template>
  <div class="pedidos-balcao-container">
    <!-- Header -->
    <div class="pedidos-header">
      <div>
        <h1>{{ tituloContexto.titulo }}</h1>
        <p class="text-muted">{{ tituloContexto.subtitulo }}</p>
      </div>

      <div style="display:flex; align-items:center; gap:12px;">
        <!-- Botão Nova Sessão -->
        <button
          v-if="!unidadeSelecionada"
          @click="abrirModalAbrirSessao(null)"
          class="btn btn-primary"
          style="display:flex;align-items:center;gap:6px;"
        >
          <span style="font-size:18px;">+</span> Nova Sessão
        </button>

        <!-- Status WebSocket -->
        <div class="ws-status">
          <span
            :class="['ws-badge', statusConexao]"
            :title="`WebSocket: ${statusConexao}`"
          >
            {{ statusConexao === 'conectado' ? '🟢' : statusConexao === 'reconectando' ? '🟡' : '🔴' }}
            {{ statusConexao }}
          </span>
        </div>
      </div>
    </div>

    <!-- Lista de Unidades ou Painel de Unidade Selecionada -->
    <div v-if="!unidadeSelecionada" class="unidades-lista">
      <!-- Busca -->
      <div class="search-bar">
        <input
          v-model="busca"
          type="text"
          placeholder="🔍 Buscar por referência (mesa, quarto, evento...)"
          class="form-control"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando unidades...</p>
      </div>

      <!-- Lista de Cards -->
      <div v-else class="unidades-grid">
        <div
          v-for="unidade in unidadesFiltradas"
          :key="unidade.id"
          class="unidade-card"
          :class="['status-' + (unidade.sessaoAtiva ? unidade.status : 'DISPONIVEL')]"
          @click="selecionarUnidade(unidade)"
        >
          <!-- Header do Card -->
          <div class="card-header">
            <span class="icone-tipo">{{ iconeTipoUnidade(unidade.tipo) }}</span>
            <h3>{{ unidade.referencia }}</h3>
            <span :class="['badge', 'badge-' + (unidade.sessaoAtiva ? unidade.status : 'DISPONIVEL')]">
              {{ labelStatusUnidade(unidade.sessaoAtiva ? unidade.status : 'DISPONIVEL') }}
            </span>
          </div>

          <!-- Corpo do Card -->
          <div class="card-body">
            <div v-if="!unidade.sessaoAtiva" class="card-info" style="color:#1976d2">
              <span class="label">🟢 Disponível</span>
              <span class="value" style="font-size:12px;">clique para abrir sessão</span>
            </div>
            <div v-if="unidade.cliente" class="card-info">
              <span class="label">Cliente:</span>
              <span class="value">{{ unidade.cliente.nome }}</span>
            </div>
            <div v-if="unidade.cliente?.saldoFundo > 0" class="card-info" style="color:#2e7d32; font-weight:700;">
              <span class="label">Fundo:</span>
              <span class="value">{{ formatCurrency(unidade.cliente.saldoFundo) }}</span>
            </div>
            <div v-if="unidade.totalConsumido > 0" class="card-info">
              <span class="label">Consumo:</span>
              <span class="value">{{ formatCurrency(unidade.totalConsumido) }}</span>
            </div>
            <div v-if="unidade.quantidadePedidosAtivos > 0" class="card-info">
              <span class="label">Pedidos Ativos:</span>
              <span class="value">{{ unidade.quantidadePedidosAtivos }}</span>
            </div>
          </div>

          <!-- Footer do Card -->
          <div class="card-footer">
            <button class="btn btn-sm" :class="unidade.sessaoAtiva ? 'btn-primary' : 'btn-outline'">
              {{ unidade.sessaoAtiva ? 'Gerir →' : '＋ Abrir Sessão' }}
            </button>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-if="unidadesFiltradas.length === 0 && !loading" class="empty-state">
          <p>🪑 Nenhuma mesa registada</p>
          <small v-if="busca">Nenhuma mesa corresponde a "{{ busca }}"</small>
          <small v-else>Crie mesas em Gestão de Mesas para começar</small>
        </div>
      </div>
    </div>

    <!-- Painel da Unidade Selecionada -->
    <div v-else class="unidade-selecionada">
      <PainelUnidadeConsumo
        :unidade="unidadeSelecionada"
        :pedidos-ativos="pedidosAtivos"
        :fundo="fundoAtivo"
        @pedido-atualizado="recarregarPedido"
        @fechar="voltarListaUnidades"
        @adicionar-produtos="abrirModalAdicionarProdutos"
        @ver-historico="abrirModalHistorico"
        @novo-pedido="abrirModalNovoPedido"
        @recarregar-fundo="handleRecarregarFundo"
        @fechar-sessao="fecharSessao"
        @solicitar-liquidacao="modalLiquidarAberto = true"
        @aguardar-pagamento="aguardarPagamento"
      />
    </div>

    <!-- Modal: Novo Pedido -->
    <ModalNovoPedido
      v-if="mostrarModalNovoPedido"
      :isOpen="mostrarModalNovoPedido"
      :unidade="unidadeSelecionada"
      :produtos="produtosDisponiveis"
      @fechar="fecharModalNovoPedido"
      @pedido-criado="handlePedidoCriado"
      @criar-fundo="handleCriarFundo"
      @recarregar-fundo="handleRecarregarFundo"
    />

    <!-- Modal: Adicionar Produtos -->
    <ModalAdicionarProdutos
      v-if="mostrarModalAdicionarProdutos"
      :isOpen="mostrarModalAdicionarProdutos"
      :sessao-id="unidadeSelecionada?.sessaoAtivaId"
      :produtos-disponiveis="produtosDisponiveis"
      @fechar="fecharModalAdicionarProdutos"
      @produtos-adicionados="handleProdutosAdicionados"
    />

    <!-- Modal: Histórico de Pedidos -->
    <ModalHistoricoPedidos
      v-if="mostrarModalHistorico"
      :isOpen="mostrarModalHistorico"
      :sessao-id="unidadeSelecionada?.sessaoAtivaId"
      @fechar="fecharModalHistorico"
    />

    <!-- Modal: Criar Fundo -->
    <ModalCriarFundo
      v-if="mostrarModalCriarFundo"
      :isOpen="mostrarModalCriarFundo"
      :cliente="clienteSelecionadoFundo"
      :sessao="sessaoSelecionadaFundo"
      @fechar="fecharModalCriarFundo"
      @fundo-criado="handleFundoCriado"
    />

    <!-- Modal: Recarregar Fundo -->
    <ModalRecarregarFundo
      v-if="mostrarModalRecarregar"
      :isOpen="mostrarModalRecarregar"
      :key="fundoSelecionado?.id"
      :fundo="fundoSelecionado"
      @close="fecharModalRecarregar"
      @recarga-realizada="handleRecargaCriada"
    />

    <!-- Modal: Abrir Sessão -->
    <ModalAbrirSessao
      v-if="mostrarModalAbrirSessao"
      :show="mostrarModalAbrirSessao"
      :mesa="mesaParaAbrirSessao"
      @close="fecharModalAbrirSessao"
      @sessao-aberta="handleSessaoAberta"
    />

    <!-- Modal: Liquidação de Conta -->
    <Teleport to="body">
      <div v-if="modalLiquidarAberto" class="modal-overlay" @click.self="modalLiquidarAberto = false">
        <div class="modal-liquidar shadow-xl">
          <div class="modal-header">
            <h3>Liquidar Conta Pendente</h3>
            <button @click="modalLiquidarAberto = false" class="btn-close">&times;</button>
          </div>
          
          <div class="modal-body p-6">
            <p class="mb-4">Valor pendente: <strong>{{ formatCurrency(unidadeSelecionada?.totalConsumido || 0) }}</strong></p>
            
            <div class="form-group mb-4">
              <label class="form-label">Método de Pagamento</label>
              <select v-model="formLiquidar.metodo" class="form-control w-full">
                <option value="CASH">Dinheiro (CASH)</option>
                <option value="TPA">Multicaixa (TPA)</option>
                <option value="DIGITAL">Digital (M-Express / GPO)</option>
                <option value="FUNDO_CONSUMO">Fundo de Consumo (QR/Token)</option>
              </select>
            </div>

            <!-- Telefone para Digital -->
            <div v-if="formLiquidar.metodo === 'DIGITAL'" class="form-group mb-4 animate-fade-in">
              <label class="form-label">Telemóvel do Cliente (M-Express)</label>
              <div class="input-phone-container" style="display:flex; align-items:center; border:1px solid #ddd; border-radius:6px; overflow:hidden;">
                <span style="background:#f5f5f5; padding:8px 12px; border-right:1px solid #ddd; font-weight:600; color:#666;">+244</span>
                <input v-model="formLiquidar.telefoneDigital" type="tel" placeholder="9xx xxx xxx" class="form-control" style="border:none; flex:1;">
              </div>
              <p class="form-hint" style="font-size:11px; color:#888; margin-top:4px;">O cliente receberá uma notificação para confirmar o pagamento.</p>
            </div>

            <div v-if="formLiquidar.metodo === 'FUNDO_CONSUMO'" class="form-group mb-4">
              <label class="form-label">Token/QR do Fundo</label>
              <input v-model="formLiquidar.qrCode" type="text" placeholder="Insira o Token..." class="form-control w-full">
              <p class="text-xs text-muted mt-2">Pode deixar vazio para usar o fundo da própria sessão (se existir).</p>
            </div>

            <div class="flex justify-end gap-3 mt-6" style="display:flex; justify-content:flex-end; gap:12px;">
              <button @click="modalLiquidarAberto = false" class="btn btn-outline">Cancelar</button>
              <button @click="handleConfirmarLiquidar" class="btn btn-primary" :disabled="formLiquidar.metodo === 'FUNDO_CONSUMO' && !formLiquidar.qrCode && !fundoAtivo">Confirmar e Finalizar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import PainelUnidadeConsumo from '@/components/pedidos/PainelUnidadeConsumo.vue'
import ModalNovoPedido from '@/components/pedidos/ModalNovoPedido.vue'
import ModalAdicionarProdutos from '@/components/pedidos/ModalAdicionarProdutos.vue'
import ModalHistoricoPedidos from '@/components/pedidos/ModalHistoricoPedidos.vue'
import ModalCriarFundo from '@/components/fundos/ModalCriarFundo.vue'
import ModalRecarregarFundo from '@/components/fundos/ModalRecarregarFundo.vue'
import ModalAbrirSessao from '@/modules/mesas/components/ModalAbrirSessao.vue'
import { usePedidosBalcao } from '@/composables/usePedidosBalcao'

const modalLiquidarAberto = ref(false)
const formLiquidar = ref({
  metodo: 'CASH',
  qrCode: '',
  telefoneDigital: ''
})

const {
  formatCurrency,
  statusConexao,
  busca,
  loading,
  unidadeSelecionada,
  pedidosAtivos,
  pedidoAtivo,
  fundoAtivo,
  produtosDisponiveis,
  unidadesConsumo,
  mostrarModalNovoPedido,
  mostrarModalAdicionarProdutos,
  mostrarModalHistorico,
  mostrarModalCriarFundo,
  mostrarModalRecarregar,
  mostrarModalAbrirSessao,
  mesaParaAbrirSessao,
  clienteSelecionadoFundo,
  sessaoSelecionadaFundo,
  fundoSelecionado,
  tituloContexto,
  unidadesFiltradas,
  selecionarUnidade,
  voltarListaUnidades,
  recarregarPedido,
  abrirModalNovoPedido,
  fecharModalNovoPedido,
  handlePedidoCriado,
  handleCriarFundo,
  fecharModalCriarFundo,
  handleFundoCriado,
  handleRecarregarFundo,
  fecharModalRecarregar,
  handleRecargaCriada,
  abrirModalAdicionarProdutos,
  fecharModalAdicionarProdutos,
  handleProdutosAdicionados,
  abrirModalHistorico,
  fecharModalHistorico,
  abrirModalAbrirSessao,
  fecharModalAbrirSessao,
  handleSessaoAberta,
  fecharSessao,
  aguardarPagamento,
  liquidarConta,
  iconeTipoUnidade,
  labelStatusUnidade
} = usePedidosBalcao()

const handleConfirmarLiquidar = async () => {
  await liquidarConta({
    metodo: formLiquidar.value.metodo,
    qrCodeFundoExterno: formLiquidar.value.qrCode,
    telefone: formLiquidar.value.telefoneDigital
  })
  modalLiquidarAberto.value = false
  // Reset form
  formLiquidar.value = { metodo: 'CASH', qrCode: '', telefoneDigital: '' }
}
</script>

<style scoped>
.pedidos-balcao-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.pedidos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.pedidos-header h1 {
  margin: 0;
  font-size: 28px;
  color: #333;
}

.text-muted {
  color: #666;
  font-size: 14px;
  margin-top: 4px;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ws-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ws-badge.conectado {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.ws-badge.reconectando {
  background-color: #fff3e0;
  color: #f57c00;
}

.ws-badge.desconectado {
  background-color: #ffebee;
  color: #c62828;
}

.search-bar {
  margin-bottom: 20px;
}

.search-bar input {
  width: 100%;
  max-width: 500px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.unidades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.unidade-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.unidade-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.unidade-card.status-DISPONIVEL {
  border-color: #1976d2;
  border-style: dashed;
  opacity: 0.85;
}

.unidade-card.status-DISPONIVEL:hover {
  opacity: 1;
  border-style: solid;
}

.disponivel-cta {
  color: #1976d2;
}

.unidade-card.status-OCUPADA {
  border-color: #4caf50;
}

.unidade-card.status-AGUARDANDO_PAGAMENTO {
  border-color: #ff9800;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.icone-tipo {
  font-size: 24px;
}

.card-header h3 {
  flex: 1;
  margin: 0;
  font-size: 18px;
  color: #333;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-DISPONIVEL {
  background-color: #e3f2fd;
  color: #1976d2;
}

.badge-OCUPADA {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.badge-AGUARDANDO_PAGAMENTO {
  background-color: #fff3e0;
  color: #f57c00;
}

.badge-ENCERRADA,
.badge-FINALIZADA {
  background-color: #f3f3f3;
  color: #757575;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.card-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.card-info .label {
  color: #666;
  font-weight: 500;
}

.card-info .value {
  color: #333;
  font-weight: 600;
}

.text-danger {
  color: #d32f2f !important;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-outline {
  background-color: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn-outline:hover {
  background-color: #e3f2fd;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 8px;
}

.empty-state small {
  font-size: 14px;
  color: #999;
}

.unidade-selecionada {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-liquidar {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 14px;
}
</style>
