<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Unidades de Atendimento</h2>
        <p class="text-text-secondary mt-1">Pontos operacionais usados por mesas, pedidos e fundos</p>
      </div>
      <button v-if="podeGerir" @click="abrirModalCriar" class="btn-primary flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nova Unidade
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 4" :key="i" class="h-16 bg-gray-200 rounded"></div>
      </div>

      <div v-else-if="unidades.length === 0" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21h8m-8 0V7a2 2 0 012-2h4a2 2 0 012 2v14m-8 0H5a2 2 0 01-2-2v-8a2 2 0 012-2h3m8 12h3a2 2 0 002-2v-8a2 2 0 00-2-2h-3"/>
        </svg>
        <p class="text-lg text-text-primary mb-2">Nenhuma unidade cadastrada</p>
        <p class="text-sm text-text-secondary">Crie pelo menos uma unidade antes de cadastrar mesas.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Nome</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Tipo</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Cozinhas</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Estado</th>
              <th v-if="podeGerir" class="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="unidade in unidades" :key="unidade.id" class="border-b border-border hover:bg-background transition-colors">
              <td class="py-4 px-4">
                <div class="font-medium text-text-primary">{{ unidade.nome }}</div>
                <div class="text-xs text-text-secondary">{{ unidade.descricao || 'Sem descrição' }}</div>
              </td>
              <td class="py-4 px-4 text-sm text-text-secondary">{{ getTipoLabel(unidade.tipo) }}</td>
              <td class="py-4 px-4 text-sm text-text-secondary">
                {{ unidade.cozinhas?.length || 0 }}
              </td>
              <td class="py-4 px-4">
                <span :class="unidade.ativa ? 'badge-success' : 'badge-error'" class="text-xs">
                  {{ unidade.ativa ? 'Ativa' : 'Inativa' }}
                </span>
                <span v-if="unidade.operacional" class="badge-success text-xs ml-2">Operacional</span>
              </td>
              <td v-if="podeGerir" class="py-4 px-4 text-right">
                <button
                  v-if="unidade.ativa"
                  @click="desativarUnidade(unidade)"
                  class="text-error hover:text-error/80 px-3 py-1 text-sm"
                >
                  Desativar
                </button>
                <button
                  v-else
                  @click="ativarUnidade(unidade)"
                  class="text-success hover:text-success/80 px-3 py-1 text-sm"
                >
                  Ativar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalAberto && podeGerir" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="fecharModal">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6 border-b border-border flex items-center justify-between">
          <h3 class="text-xl font-bold text-text-primary">Nova Unidade</h3>
          <button @click="fecharModal" class="text-text-secondary hover:text-text-primary text-2xl">×</button>
        </div>
        <form @submit.prevent="criarUnidade" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Nome *</label>
            <input v-model.trim="form.nome" maxlength="100" required class="input-field w-full" placeholder="Restaurante Principal" />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tipo *</label>
            <select v-model="form.tipo" required class="input-field w-full">
              <option v-for="tipo in tipos" :key="tipo.valor" :value="tipo.valor">{{ tipo.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Descrição</label>
            <textarea v-model.trim="form.descricao" maxlength="500" rows="3" class="input-field w-full resize-none" placeholder="Descrição operacional"></textarea>
            <p class="text-xs text-text-secondary mt-1">{{ form.descricao.length }}/500</p>
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
import unidadesAtendimentoService from '@/api/unidadesAtendimentoService'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

const unidades = ref([])
const loading = ref(false)
const salvando = ref(false)
const modalAberto = ref(false)
const podeGerir = authStore.isAdmin || authStore.isGerente

const tipos = [
  { valor: 'RESTAURANTE', label: 'Restaurante' },
  { valor: 'BAR', label: 'Bar' },
  { valor: 'CAFETERIA', label: 'Cafeteria' },
  { valor: 'ROOM_SERVICE', label: 'Room Service' },
  { valor: 'EVENTO', label: 'Evento' },
  { valor: 'PISCINA', label: 'Piscina' },
  { valor: 'LOUNGE', label: 'Lounge' }
]

const form = ref({
  nome: '',
  tipo: 'RESTAURANTE',
  descricao: ''
})

const getTipoLabel = (tipo) => tipos.find(t => t.valor === tipo)?.label || tipo

const carregarUnidades = async () => {
  try {
    loading.value = true
    unidades.value = await unidadesAtendimentoService.listar()
  } catch (error) {
    console.error('[UnidadesAtendimentoView] Erro ao carregar unidades:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao carregar unidades de atendimento')
  } finally {
    loading.value = false
  }
}

const abrirModalCriar = () => {
  if (!podeGerir) return
  form.value = { nome: '', tipo: 'RESTAURANTE', descricao: '' }
  modalAberto.value = true
}

const fecharModal = () => {
  modalAberto.value = false
}

const criarUnidade = async () => {
  if (!podeGerir) return
  try {
    salvando.value = true
    await unidadesAtendimentoService.criar({
      nome: form.value.nome,
      tipo: form.value.tipo,
      descricao: form.value.descricao || null
    })
    notificationStore.sucesso('Unidade de atendimento criada com sucesso')
    fecharModal()
    await carregarUnidades()
  } catch (error) {
    console.error('[UnidadesAtendimentoView] Erro ao criar unidade:', error)
    notificationStore.erro(error.response?.data?.message || 'Erro ao criar unidade de atendimento')
  } finally {
    salvando.value = false
  }
}

const ativarUnidade = async (unidade) => {
  if (!podeGerir) return
  try {
    await unidadesAtendimentoService.ativar(unidade.id)
    notificationStore.sucesso('Unidade ativada')
    await carregarUnidades()
  } catch (error) {
    notificationStore.erro(error.response?.data?.message || 'Erro ao ativar unidade')
  }
}

const desativarUnidade = async (unidade) => {
  if (!podeGerir) return
  try {
    await unidadesAtendimentoService.desativar(unidade.id)
    notificationStore.sucesso('Unidade desativada')
    await carregarUnidades()
  } catch (error) {
    notificationStore.erro(error.response?.data?.message || 'Erro ao desativar unidade')
  }
}

onMounted(carregarUnidades)
</script>
