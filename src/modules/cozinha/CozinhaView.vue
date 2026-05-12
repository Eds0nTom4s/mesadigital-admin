<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Fila da Cozinha</h1>
        <p class="text-text-secondary mt-1">Subpedidos pendentes e em preparação</p>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          v-model="cozinhaSelecionadaId"
          class="input-field min-w-64"
          :disabled="loadingCozinhas || cozinhas.length === 0"
          @change="selecionarCozinha"
        >
          <option v-for="cozinha in cozinhas" :key="cozinha.id" :value="cozinha.id">
            {{ cozinha.nome }} - {{ getTipoLabel(cozinha.tipo) }}
          </option>
        </select>

        <button class="btn btn-outline" :disabled="loadingSubpedidos" @click="carregarSubpedidos">
          Atualizar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="card">
        <p class="text-sm text-text-secondary">Pendentes</p>
        <p class="text-3xl font-bold text-warning mt-1">{{ totalPendentes }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-text-secondary">Em preparação</p>
        <p class="text-3xl font-bold text-primary mt-1">{{ totalPreparacao }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-text-secondary">Prontos</p>
        <p class="text-3xl font-bold text-success mt-1">{{ totalProntos }}</p>
      </div>
    </div>

    <div v-if="erro" class="p-4 rounded-lg bg-error/10 text-error">
      {{ erro }}
    </div>

    <div v-if="loadingSubpedidos" class="card text-center py-10 text-text-secondary">
      Carregando fila...
    </div>

    <div v-else-if="subpedidos.length === 0" class="card text-center py-10 text-text-secondary">
      Nenhum subpedido ativo para esta cozinha.
    </div>

    <div v-else class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article
        v-for="subpedido in subpedidos"
        :key="subpedido.id"
        class="card border-l-4"
        :class="statusBorda(subpedido.status)"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-text-secondary">Pedido</p>
            <h2 class="text-xl font-bold text-text-primary">{{ subpedido.numeroPedido }}</h2>
            <p class="text-sm text-text-secondary mt-1">{{ subpedido.nomeUnidadeAtendimento }}</p>
          </div>

          <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusClasse(subpedido.status)">
            {{ getStatusLabel(subpedido.status) }}
          </span>
        </div>

        <div class="mt-4 divide-y divide-border">
          <div
            v-for="item in subpedido.itens"
            :key="item.id"
            class="py-3 flex items-start justify-between gap-4"
          >
            <div>
              <p class="font-semibold text-text-primary">{{ item.produtoNome }}</p>
              <p v-if="item.observacoes" class="text-sm text-text-secondary mt-1">{{ item.observacoes }}</p>
            </div>
            <span class="font-bold text-text-primary">x{{ item.quantidade }}</span>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap justify-end gap-2">
          <button
            v-if="subpedido.status === 'PENDENTE'"
            class="btn btn-primary"
            :disabled="acaoEmAndamento === subpedido.id"
            @click="assumir(subpedido)"
          >
            Assumir
          </button>
          <button
            v-if="subpedido.status === 'EM_PREPARACAO'"
            class="btn btn-success"
            :disabled="acaoEmAndamento === subpedido.id"
            @click="marcarPronto(subpedido)"
          >
            Marcar pronto
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import cozinhasService from '@/api/cozinhasService'
import subpedidosService from '@/api/subpedidos'
import { useWebSocketStore } from '@/store/websocket'

const wsStore = useWebSocketStore()

const cozinhas = ref([])
const cozinhaSelecionadaId = ref(null)
const subpedidos = ref([])
const loadingCozinhas = ref(false)
const loadingSubpedidos = ref(false)
const acaoEmAndamento = ref(null)
const erro = ref('')
let cancelarInscricao = null

const totalPendentes = computed(() => subpedidos.value.filter(s => s.status === 'PENDENTE').length)
const totalPreparacao = computed(() => subpedidos.value.filter(s => s.status === 'EM_PREPARACAO').length)
const totalProntos = computed(() => subpedidos.value.filter(s => s.status === 'PRONTO').length)

const getTipoLabel = (tipo) => ({
  CENTRAL: 'Central',
  PIZZARIA: 'Pizzaria',
  CONFEITARIA: 'Confeitaria',
  BAR_PREP: 'Bar',
  GRILL: 'Grelha'
}[tipo] || tipo)

const getStatusLabel = (status) => ({
  PENDENTE: 'Pendente',
  EM_PREPARACAO: 'Em preparação',
  PRONTO: 'Pronto'
}[status] || status)

const statusClasse = (status) => ({
  PENDENTE: 'bg-warning/10 text-warning',
  EM_PREPARACAO: 'bg-primary/10 text-primary',
  PRONTO: 'bg-success/10 text-success'
}[status] || 'bg-background text-text-secondary')

const statusBorda = (status) => ({
  PENDENTE: 'border-warning',
  EM_PREPARACAO: 'border-primary',
  PRONTO: 'border-success'
}[status] || 'border-border')

const selecionarCozinha = () => {
  if (cozinhaSelecionadaId.value) {
    localStorage.setItem('cozinhaSelecionadaId', String(cozinhaSelecionadaId.value))
  }
  inscreverCozinha()
  carregarSubpedidos()
}

const carregarCozinhas = async () => {
  loadingCozinhas.value = true
  erro.value = ''
  try {
    const response = await cozinhasService.listarAtivas()
    cozinhas.value = response?.data || response || []
    const salva = Number(localStorage.getItem('cozinhaSelecionadaId'))
    const existeSalva = cozinhas.value.some(c => c.id === salva)
    cozinhaSelecionadaId.value = existeSalva ? salva : cozinhas.value[0]?.id || null
    if (cozinhaSelecionadaId.value) selecionarCozinha()
  } catch (error) {
    console.error('[CozinhaView] Erro ao carregar cozinhas:', error)
    erro.value = 'Não foi possível carregar as cozinhas ativas.'
  } finally {
    loadingCozinhas.value = false
  }
}

const carregarSubpedidos = async () => {
  if (!cozinhaSelecionadaId.value) return
  loadingSubpedidos.value = true
  erro.value = ''
  try {
    const response = await subpedidosService.getAtivosByCozinha(cozinhaSelecionadaId.value)
    subpedidos.value = response?.data || response || []
  } catch (error) {
    console.error('[CozinhaView] Erro ao carregar subpedidos:', error)
    erro.value = 'Não foi possível carregar a fila da cozinha.'
  } finally {
    loadingSubpedidos.value = false
  }
}

const executarAcao = async (subpedido, acao) => {
  acaoEmAndamento.value = subpedido.id
  erro.value = ''
  try {
    await acao(subpedido.id)
    await carregarSubpedidos()
  } catch (error) {
    console.error('[CozinhaView] Erro ao atualizar subpedido:', error)
    erro.value = error.response?.data?.message || 'Não foi possível atualizar o subpedido.'
  } finally {
    acaoEmAndamento.value = null
  }
}

const assumir = (subpedido) => executarAcao(subpedido, subpedidosService.assumir)
const marcarPronto = (subpedido) => executarAcao(subpedido, subpedidosService.marcarPronto)

const inscreverCozinha = () => {
  if (cancelarInscricao) cancelarInscricao()
  if (!cozinhaSelecionadaId.value) return
  cancelarInscricao = wsStore.inscreverCozinha(cozinhaSelecionadaId.value, carregarSubpedidos)
}

watch(() => wsStore.conectado, () => inscreverCozinha())

onMounted(() => {
  carregarCozinhas()
})

onUnmounted(() => {
  if (cancelarInscricao) cancelarInscricao()
})
</script>
