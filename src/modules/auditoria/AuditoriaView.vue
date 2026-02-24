<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Auditoria do Sistema</h2>
        <p class="text-text-secondary mt-1">Rastreabilidade completa de operações críticas</p>
      </div>
      <div class="flex gap-2">
        <button 
          @click="exportarCSV"
          :disabled="loading || logs.length === 0"
          class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-background transition-colors flex items-center gap-2"
          :class="{ 'opacity-60 cursor-not-allowed': loading || logs.length === 0 }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Exportar CSV
        </button>
        <button 
          @click="exportarPDF"
          :disabled="loading || logs.length === 0"
          class="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-background transition-colors flex items-center gap-2"
          :class="{ 'opacity-60 cursor-not-allowed': loading || logs.length === 0 }"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Exportar PDF
        </button>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-secondary mb-1">Total de Logs</p>
            <p class="text-2xl font-bold text-text-primary">{{ stats.totalLogs || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-secondary mb-1">Hoje</p>
            <p class="text-2xl font-bold text-text-primary">{{ stats.logsHoje || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-secondary mb-1">Usuários Ativos</p>
            <p class="text-2xl font-bold text-text-primary">{{ stats.usuariosAtivos || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-text-secondary mb-1">Última Ação</p>
            <p class="text-sm font-medium text-text-primary">{{ formatarTempoRelativo(stats.ultimaAcao) }}</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Módulo</label>
          <select v-model="filtros.modulo" @change="carregarLogs" class="input-field w-full">
            <option value="">Todos</option>
            <option v-for="modulo in modulos" :key="modulo" :value="modulo">
              {{ modulo }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Ação</label>
          <select v-model="filtros.acao" @change="carregarLogs" class="input-field w-full">
            <option value="">Todas</option>
            <option v-for="acao in acoes" :key="acao" :value="acao">
              {{ acao }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Data Início</label>
          <input 
            v-model="filtros.dataInicio" 
            @change="carregarLogs"
            type="date" 
            class="input-field w-full" 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Data Fim</label>
          <input 
            v-model="filtros.dataFim" 
            @change="carregarLogs"
            type="date" 
            class="input-field w-full" 
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Buscar</label>
          <input 
            v-model="filtros.busca" 
            @input="debounceCarregar"
            type="text" 
            placeholder="Usuário, IP..." 
            class="input-field w-full" 
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 5" :key="i" class="h-24 bg-gray-200 rounded"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="logs.length === 0" class="text-center py-12 text-text-secondary">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p class="text-lg mb-2">Nenhum log encontrado</p>
        <p class="text-sm">Ajuste os filtros para visualizar registros</p>
      </div>

      <!-- Lista de Logs -->
      <div v-else class="space-y-3">
        <div 
          v-for="log in logs" 
          :key="log.id"
          class="flex items-start space-x-4 p-4 bg-background rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
          @click="abrirDetalhes(log)"
        >
          <div class="flex-shrink-0">
            <div 
              :class="getAcaoIcon(log.acao).bg"
              class="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <svg class="w-5 h-5" :class="getAcaoIcon(log.acao).color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getAcaoIcon(log.acao).path"/>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <p class="text-sm font-medium text-text-primary truncate">{{ log.descricao }}</p>
              <span class="text-xs text-text-secondary whitespace-nowrap ml-2">{{ formatarDataHora(log.dataHora) }}</span>
            </div>
            <p class="text-sm text-text-secondary truncate">
              <span class="font-medium">{{ log.usuarioNome }}</span> • {{ log.detalhes || 'Sem detalhes adicionais' }}
            </p>
            <div class="flex items-center space-x-2 mt-2">
              <span :class="getAcaoBadge(log.acao)" class="text-xs px-2 py-0.5 rounded-full">
                {{ log.acao }}
              </span>
              <span class="badge-info text-xs">{{ log.modulo }}</span>
              <span class="text-xs text-text-secondary">IP: {{ log.enderecoIP || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Paginação -->
      <div v-if="paginacao.totalPaginas > 1" class="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <p class="text-sm text-text-secondary">
          Mostrando {{ (paginacao.paginaAtual - 1) * paginacao.tamanhoPagina + 1 }} - 
          {{ Math.min(paginacao.paginaAtual * paginacao.tamanhoPagina, paginacao.totalElementos) }} 
          de {{ paginacao.totalElementos }} registros
        </p>
        <div class="flex gap-2">
          <button
            @click="paginaAnterior"
            :disabled="paginacao.paginaAtual === 1"
            class="px-3 py-1 border border-border rounded text-sm hover:bg-background transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': paginacao.paginaAtual === 1 }"
          >
            Anterior
          </button>
          <button
            @click="proximaPagina"
            :disabled="paginacao.paginaAtual === paginacao.totalPaginas"
            class="px-3 py-1 border border-border rounded text-sm hover:bg-background transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': paginacao.paginaAtual === paginacao.totalPaginas }"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalhes -->
    <ModalDetalhesLog
      v-if="modalDetalhes"
      :log="logSelecionado"
      @close="modalDetalhes = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import auditoriaService from '@/services/auditoriaService'
import ModalDetalhesLog from '@/components/auditoria/ModalDetalhesLog.vue'

const notificationStore = useNotificationStore()

// Estado
const logs = ref([])
const loading = ref(false)
const stats = ref({
  totalLogs: 0,
  logsHoje: 0,
  usuariosAtivos: 0,
  ultimaAcao: null
})
const modulos = ref([])
const acoes = ref([])

const filtros = ref({
  modulo: '',
  acao: '',
  dataInicio: '',
  dataFim: '',
  busca: ''
})

const paginacao = ref({
  paginaAtual: 1,
  tamanhoPagina: 20,
  totalPaginas: 1,
  totalElementos: 0
})

const modalDetalhes = ref(false)
const logSelecionado = ref(null)

let debounceTimer = null

// Carregar dados
const carregarLogs = async () => {
  try {
    loading.value = true
    
    const params = {
      pagina: paginacao.value.paginaAtual,
      tamanhoPagina: paginacao.value.tamanhoPagina,
      ...filtros.value
    }
    
    const resultado = await auditoriaService.listar(params)
    
    if (resultado.conteudo) {
      logs.value = resultado.conteudo
      paginacao.value.totalPaginas = resultado.totalPaginas
      paginacao.value.totalElementos = resultado.totalElementos
    } else {
      logs.value = resultado
    }
  } catch (error) {
    console.error('[AuditoriaView] Erro ao carregar logs:', error)
    notificationStore.erro('Erro ao carregar logs de auditoria')
  } finally {
    loading.value = false
  }
}

const carregarEstatisticas = async () => {
  try {
    stats.value = await auditoriaService.obterEstatisticas()
  } catch (error) {
    console.error('[AuditoriaView] Erro ao carregar estatísticas:', error)
  }
}

const carregarFiltros = async () => {
  try {
    [modulos.value, acoes.value] = await Promise.all([
      auditoriaService.listarModulos(),
      auditoriaService.listarAcoes()
    ])
  } catch (error) {
    console.error('[AuditoriaView] Erro ao carregar filtros:', error)
  }
}

const debounceCarregar = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    paginacao.value.paginaAtual = 1
    carregarLogs()
  }, 500)
}

// Paginação
const proximaPagina = () => {
  if (paginacao.value.paginaAtual < paginacao.value.totalPaginas) {
    paginacao.value.paginaAtual++
    carregarLogs()
  }
}

const paginaAnterior = () => {
  if (paginacao.value.paginaAtual > 1) {
    paginacao.value.paginaAtual--
    carregarLogs()
  }
}

// Exportação
const exportarCSV = async () => {
  try {
    const blob = await auditoriaService.exportarCSV(filtros.value)
    baixarArquivo(blob, `auditoria_${new Date().toISOString().split('T')[0]}.csv`)
    notificationStore.sucesso('CSV exportado com sucesso!')
  } catch (error) {
    console.error('[AuditoriaView] Erro ao exportar CSV:', error)
    notificationStore.erro('Erro ao exportar CSV')
  }
}

const exportarPDF = async () => {
  try {
    const blob = await auditoriaService.exportarPDF(filtros.value)
    baixarArquivo(blob, `auditoria_${new Date().toISOString().split('T')[0]}.pdf`)
    notificationStore.sucesso('PDF exportado com sucesso!')
  } catch (error) {
    console.error('[AuditoriaView] Erro ao exportar PDF:', error)
    notificationStore.erro('Erro ao exportar PDF')
  }
}

const baixarArquivo = (blob, nome) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Detalhes
const abrirDetalhes = (log) => {
  logSelecionado.value = log
  modalDetalhes.value = true
}

// Utilitários
const getAcaoIcon = (acao) => {
  const icons = {
    CRIAR: { 
      path: 'M12 4v16m8-8H4',
      color: 'text-success',
      bg: 'bg-success/10'
    },
    EDITAR: {
      path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    EXCLUIR: {
      path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      color: 'text-error',
      bg: 'bg-error/10'
    },
    LOGIN: {
      path: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      color: 'text-info',
      bg: 'bg-info/10'
    },
    LOGOUT: {
      path: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      color: 'text-text-secondary',
      bg: 'bg-gray-100'
    }
  }
  return icons[acao] || icons.EDITAR
}

const getAcaoBadge = (acao) => {
  const badges = {
    CRIAR: 'bg-success/10 text-success',
    EDITAR: 'bg-warning/10 text-warning',
    EXCLUIR: 'bg-error/10 text-error',
    LOGIN: 'bg-info/10 text-info',
    LOGOUT: 'bg-gray-100 text-gray-600'
  }
  return badges[acao] || 'bg-gray-100 text-gray-600'
}

const formatarDataHora = (isoString) => {
  if (!isoString) return '-'
  const data = new Date(isoString)
  return data.toLocaleString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatarTempoRelativo = (isoString) => {
  if (!isoString) return '-'
  const agora = new Date()
  const data = new Date(isoString)
  const diff = Math.floor((agora - data) / 1000)
  
  if (diff < 60) return 'Agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

// Inicialização
onMounted(() => {
  carregarFiltros()
  carregarLogs()
  carregarEstatisticas()
})
</script>
