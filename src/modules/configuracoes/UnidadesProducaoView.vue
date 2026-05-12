<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Unidades de Produção</h2>
        <p class="text-text-secondary mt-1">Áreas de preparo como cozinha central, bar, pastelaria e grelha</p>
      </div>
      <button v-if="podeGerir" @click="abrirModalCriar" class="btn-primary flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nova Unidade
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card lg:col-span-1">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Produção</h3>
          <button @click="carregarDados" class="text-sm text-primary hover:text-primary/80">Atualizar</button>
        </div>

        <div v-if="loading" class="animate-pulse space-y-3">
          <div v-for="i in 4" :key="i" class="h-16 bg-gray-200 rounded"></div>
        </div>

        <div v-else-if="cozinhas.length === 0" class="text-center py-12 text-text-secondary">
          <p class="text-base mb-1">Nenhuma unidade de produção cadastrada</p>
          <p class="text-sm">Crie a primeira área de preparo.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="cozinha in cozinhas"
            :key="cozinha.id"
            class="border border-border rounded-lg p-4 hover:bg-background transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h4 class="font-semibold text-text-primary truncate">{{ cozinha.nome }}</h4>
                <p class="text-sm text-text-secondary">{{ getTipoLabel(cozinha.tipo) }}</p>
                <p v-if="cozinha.impressoraId" class="text-xs text-text-secondary mt-1">
                  Impressora: {{ cozinha.impressoraId }}
                </p>
              </div>
              <span :class="cozinha.ativa ? 'badge-success' : 'badge-error'" class="text-xs shrink-0">
                {{ cozinha.ativa ? 'Ativa' : 'Inativa' }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-3 text-sm">
              <span class="text-text-secondary">{{ cozinha.subPedidosAtivos || 0 }} subpedidos ativos</span>
              <button
                v-if="cozinha.ativa"
                v-show="podeGerir"
                @click="desativarCozinha(cozinha)"
                class="text-error hover:text-error/80"
              >
                Desativar
              </button>
              <button
                v-else
                v-show="podeGerir"
                @click="ativarCozinha(cozinha)"
                class="text-success hover:text-success/80"
              >
                Ativar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card lg:col-span-2">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Associações com Atendimento</h3>
          <p class="text-sm text-text-secondary mt-1">
            Marque quais unidades de produção atendem cada ponto operacional.
          </p>
        </div>

        <div v-if="!loading && unidades.length === 0" class="text-center py-12 text-text-secondary">
          <p class="text-base mb-1">Nenhuma Unidade de Atendimento cadastrada</p>
          <router-link to="/admin/configuracoes/unidades-atendimento" class="text-primary hover:text-primary/80 text-sm">
            Criar Unidades de Atendimento
          </router-link>
        </div>

        <div v-else-if="!loading && cozinhas.length === 0" class="text-center py-12 text-text-secondary">
          <p class="text-base">Crie uma unidade de produção para configurar associações.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[680px]">
            <thead class="border-b border-border">
              <tr>
                <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Atendimento</th>
                <th
                  v-for="cozinha in cozinhas"
                  :key="cozinha.id"
                  class="text-center py-3 px-4 text-sm font-semibold text-text-secondary"
                >
                  {{ cozinha.nome }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="unidade in unidades" :key="unidade.id" class="border-b border-border">
                <td class="py-4 px-4">
                  <div class="font-medium text-text-primary">{{ unidade.nome }}</div>
                  <div class="text-xs text-text-secondary">{{ getTipoAtendimentoLabel(unidade.tipo) }}</div>
                </td>
                <td
                  v-for="cozinha in cozinhas"
                  :key="`${unidade.id}-${cozinha.id}`"
                  class="py-4 px-4 text-center"
                >
                  <input
                    type="checkbox"
                    class="h-5 w-5 accent-primary"
                    :checked="temVinculo(unidade, cozinha)"
                    :disabled="!podeGerir || associando === `${cozinha.id}:${unidade.id}`"
                    @change="alternarVinculo(cozinha, unidade, $event.target.checked)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="modalAberto && podeGerir" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="fecharModal">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-border flex items-center justify-between">
          <h3 class="text-xl font-bold text-text-primary">Nova Unidade de Produção</h3>
          <button @click="fecharModal" class="text-text-secondary hover:text-text-primary text-2xl">×</button>
        </div>
        <form @submit.prevent="criarCozinha" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Nome *</label>
            <input v-model.trim="form.nome" maxlength="100" required class="input-field w-full" placeholder="Pastelaria" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tipo *</label>
            <select v-model="form.tipo" required class="input-field w-full">
              <option v-for="tipo in tiposCozinha" :key="tipo.valor" :value="tipo.valor">{{ tipo.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">ID da Impressora</label>
            <input v-model.trim="form.idImpressora" maxlength="80" class="input-field w-full" placeholder="IMP-PASTELARIA-01" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="fecharModal" class="btn-secondary flex-1">Cancelar</button>
            <button type="submit" :disabled="salvando" class="btn-primary flex-1">
              {{ salvando ? 'Salvando...' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import { useAuthStore } from '@/store/auth'
import cozinhasService from '@/api/cozinhasService'
import unidadesAtendimentoService from '@/api/unidadesAtendimentoService'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const cozinhas = ref([])
const unidades = ref([])
const loading = ref(false)
const salvando = ref(false)
const modalAberto = ref(false)
const associando = ref(null)
const podeGerir = authStore.isAdmin || authStore.isGerente

const tiposCozinha = [
  { valor: 'CENTRAL', label: 'Cozinha Central' },
  { valor: 'BAR_PREP', label: 'Bar e Bebidas' },
  { valor: 'CONFEITARIA', label: 'Pastelaria / Confeitaria' },
  { valor: 'GRILL', label: 'Grelha / Churrasqueira' },
  { valor: 'PIZZARIA', label: 'Pizzaria' },
  { valor: 'SUSHI', label: 'Sushi Bar' },
  { valor: 'ESPECIAL', label: 'Especializada' }
]

const tiposAtendimento = {
  RESTAURANTE: 'Restaurante',
  BAR: 'Bar',
  CAFETERIA: 'Cafeteria',
  ROOM_SERVICE: 'Room Service',
  EVENTO: 'Evento',
  PISCINA: 'Piscina',
  LOUNGE: 'Lounge'
}

const form = ref({
  nome: '',
  tipo: 'CENTRAL',
  idImpressora: ''
})

const getTipoLabel = (tipo) => tiposCozinha.find(t => t.valor === tipo)?.label || tipo
const getTipoAtendimentoLabel = (tipo) => tiposAtendimento[tipo] || tipo

const carregarDados = async () => {
  try {
    loading.value = true
    const [cozinhasResp, unidadesResp] = await Promise.all([
      cozinhasService.listar(),
      unidadesAtendimentoService.listar()
    ])
    cozinhas.value = cozinhasResp
    unidades.value = unidadesResp
  } catch (error) {
    console.error('[UnidadesProducaoView] Erro ao carregar dados:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao carregar unidades de produção')
  } finally {
    loading.value = false
  }
}

const temVinculo = (unidade, cozinha) => {
  return unidade.cozinhas?.some(c => c.id === cozinha.id) || false
}

const abrirModalCriar = () => {
  if (!podeGerir) return
  form.value = { nome: '', tipo: 'CENTRAL', idImpressora: '' }
  modalAberto.value = true
}

const fecharModal = () => {
  modalAberto.value = false
}

const criarCozinha = async () => {
  if (!podeGerir) return
  try {
    salvando.value = true
    await cozinhasService.criar({
      nome: form.value.nome,
      tipo: form.value.tipo,
      idImpressora: form.value.idImpressora || null
    })
    notificationStore.sucesso('Unidade de produção criada com sucesso')
    fecharModal()
    await carregarDados()
  } catch (error) {
    console.error('[UnidadesProducaoView] Erro ao criar cozinha:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao criar unidade de produção')
  } finally {
    salvando.value = false
  }
}

const ativarCozinha = async (cozinha) => {
  if (!podeGerir) return
  try {
    await cozinhasService.ativar(cozinha.id)
    notificationStore.sucesso('Unidade de produção ativada')
    await carregarDados()
  } catch (error) {
    notificationStore.erro(error.response?.data?.message || 'Erro ao ativar unidade de produção')
  }
}

const desativarCozinha = async (cozinha) => {
  if (!podeGerir) return
  try {
    await cozinhasService.desativar(cozinha.id)
    notificationStore.sucesso('Unidade de produção desativada')
    await carregarDados()
  } catch (error) {
    notificationStore.erro(error.response?.data?.message || 'Erro ao desativar unidade de produção')
  }
}

const alternarVinculo = async (cozinha, unidade, vincular) => {
  if (!podeGerir) return
  const chave = `${cozinha.id}:${unidade.id}`
  try {
    associando.value = chave
    if (vincular) {
      await cozinhasService.vincularUnidade(cozinha.id, unidade.id)
      notificationStore.sucesso(`${cozinha.nome} vinculada a ${unidade.nome}`)
    } else {
      await cozinhasService.desvincularUnidade(cozinha.id, unidade.id)
      notificationStore.sucesso(`${cozinha.nome} desvinculada de ${unidade.nome}`)
    }
    await carregarDados()
  } catch (error) {
    console.error('[UnidadesProducaoView] Erro ao alterar vínculo:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao alterar associação')
    await carregarDados()
  } finally {
    associando.value = null
  }
}

onMounted(carregarDados)
</script>
