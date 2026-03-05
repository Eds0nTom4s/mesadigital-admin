<template>
  <div class="pedidos-balcao-container">
    <!-- Header -->
    <div class="pedidos-header">
      <div>
        <h1>{{ tituloContexto.titulo }}</h1>
        <p class="text-muted">{{ tituloContexto.subtitulo }}</p>
      </div>
      
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
          :class="['status-' + unidade.status]"
          @click="selecionarUnidade(unidade)"
        >
          <!-- Header do Card -->
          <div class="card-header">
            <span class="icone-tipo">{{ iconeTipoUnidade(unidade.tipo) }}</span>
            <h3>{{ unidade.referencia }}</h3>
            <span :class="['badge', 'badge-' + unidade.status]">
              {{ labelStatusUnidade(unidade.status) }}
            </span>
          </div>

          <!-- Corpo do Card -->
          <div class="card-body">
            <!-- Cliente -->
            <div v-if="unidade.cliente" class="card-info">
              <span class="label">Cliente:</span>
              <span class="value">{{ unidade.cliente.nome }}</span>
            </div>

            <!-- Saldo Fundo -->
            <div v-if="unidade.cliente?.fundoConsumo" class="card-info">
              <span class="label">Fundo:</span>
              <span class="value" :class="{'text-danger': unidade.cliente.fundoConsumo.saldoAtual < 10}">
                {{ formatCurrency(unidade.cliente.fundoConsumo.saldoAtual) }}
              </span>
            </div>

            <!-- Total Consumido -->
            <div v-if="unidade.totalConsumido > 0" class="card-info">
              <span class="label">Consumo:</span>
              <span class="value">{{ formatCurrency(unidade.totalConsumido) }}</span>
            </div>

            <!-- Pedidos Ativos -->
            <div v-if="unidade.quantidadePedidosAtivos > 0" class="card-info">
              <span class="label">Pedidos Ativos:</span>
              <span class="value">{{ unidade.quantidadePedidosAtivos }}</span>
            </div>
          </div>

          <!-- Footer do Card -->
          <div class="card-footer">
            <button class="btn btn-sm btn-primary">
              Ver Detalhes →
            </button>
          </div>
        </div>

        <!-- Estado Vazio -->
        <div v-if="unidadesFiltradas.length === 0 && !loading" class="empty-state">
          <p>🪑 Nenhuma mesa ocupada de momento</p>
          <small v-if="busca">Nenhuma mesa ocupada corresponde a "{{ busca }}"</small>
          <small v-else>Aguarde a abertura de uma sessão para criar pedidos</small>
        </div>
      </div>
    </div>

    <!-- Painel da Unidade Selecionada -->
    <div v-else class="unidade-selecionada">
      <PainelUnidadeConsumo
        :unidade="unidadeSelecionada"
        :pedido-ativo="pedidoAtivo"
        @pedido-atualizado="recarregarPedido"
        @fechar="voltarListaUnidades"
        @adicionar-produtos="abrirModalAdicionarProdutos"
        @ver-historico="abrirModalHistorico"
        @novo-pedido="abrirModalNovoPedido"
      />
    </div>

    <!-- Modal: Novo Pedido -->
    <Teleport to="body">
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
    </Teleport>

    <!-- Modal: Adicionar Produtos (a pedido existente) -->
    <Teleport to="body">
      <ModalAdicionarProdutos
        v-if="mostrarModalAdicionarProdutos"
        :unidade="unidadeSelecionada"
        :pedido-id="pedidoAtivo?.id"
        :produtos="produtosDisponiveis"
        @fechar="fecharModalAdicionarProdutos"
        @produtos-adicionados="handleProdutosAdicionados"
      />
    </Teleport>

    <!-- Modal: Histórico de Pedidos -->
    <Teleport to="body">
      <ModalHistoricoPedidos
        v-if="mostrarModalHistorico"
        :sessao-consumo-id="unidadeSelecionada?.sessaoConsumoId"
        :referencia="unidadeSelecionada?.referencia"
        @fechar="fecharModalHistorico"
      />
    </Teleport>

    <!-- Modal: Criar Fundo -->
    <Teleport to="body">
      <ModalCriarFundo
        v-if="mostrarModalCriarFundo"
        :cliente="clienteSelecionadoFundo"
        @close="fecharModalCriarFundo"
        @sucesso="handleFundoCriado"
      />
    </Teleport>

    <!-- Modal: Recarregar Fundo -->
    <Teleport to="body">
      <ModalRecarregarFundo
        v-if="mostrarModalRecarregar"
        :fundo="fundoSelecionado"
        @fechar="fecharModalRecarregar"
        @recarga-criada="handleRecargaCriada"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import PainelUnidadeConsumo from '@/components/pedidos/PainelUnidadeConsumo.vue'
import { usePedidosBalcao } from '@/composables/usePedidosBalcao'

// Lazy load modals (code splitting)
const ModalNovoPedido = defineAsyncComponent(() =>
  import('@/components/pedidos/ModalNovoPedido.vue')
)
const ModalAdicionarProdutos = defineAsyncComponent(() =>
  import('@/components/pedidos/ModalAdicionarProdutos.vue')
)
const ModalHistoricoPedidos = defineAsyncComponent(() =>
  import('@/components/pedidos/ModalHistoricoPedidos.vue')
)
const ModalCriarFundo = defineAsyncComponent(() =>
  import('@/components/fundos/ModalCriarFundo.vue')
)
const ModalRecarregarFundo = defineAsyncComponent(() =>
  import('@/components/fundos/ModalRecarregarFundo.vue')
)

const {
  formatCurrency,
  statusConexao,
  busca,
  loading,
  unidadeSelecionada,
  pedidoAtivo,
  produtosDisponiveis,
  mostrarModalNovoPedido,
  mostrarModalAdicionarProdutos,
  mostrarModalHistorico,
  mostrarModalCriarFundo,
  mostrarModalRecarregar,
  clienteSelecionadoFundo,
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
  iconeTipoUnidade,
  labelStatusUnidade
} = usePedidosBalcao()
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
</style>
