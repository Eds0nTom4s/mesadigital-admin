<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <h3 class="text-xl font-semibold text-text-primary">Detalhes do Log</h3>
        <button @click="$emit('close')" class="text-text-secondary hover:text-text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-6">
        <!-- Info Principal -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">ID do Log</label>
            <p class="text-text-primary">#{{ log.id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Data/Hora</label>
            <p class="text-text-primary">{{ formatarDataHora(log.dataHora) }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Módulo</label>
            <span class="badge-info">{{ log.modulo }}</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Ação</label>
            <span :class="getAcaoBadge(log.acao)" class="text-xs px-2 py-1 rounded-full">
              {{ log.acao }}
            </span>
          </div>
        </div>

        <!-- Usuário -->
        <div class="bg-background rounded-lg p-4">
          <label class="block text-sm font-medium text-text-secondary mb-2">Usuário</label>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-semibold">{{ getInitials(log.usuarioNome) }}</span>
            </div>
            <div>
              <p class="font-medium text-text-primary">{{ log.usuarioNome }}</p>
              <p class="text-sm text-text-secondary">ID: {{ log.usuarioId }}</p>
            </div>
          </div>
        </div>

        <!-- Descrição -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">Descrição</label>
          <p class="text-text-primary">{{ log.descricao }}</p>
        </div>

        <!-- Detalhes -->
        <div v-if="log.detalhes">
          <label class="block text-sm font-medium text-text-secondary mb-2">Detalhes</label>
          <p class="text-text-primary">{{ log.detalhes }}</p>
        </div>

        <!-- Dados Adicionais -->
        <div v-if="log.dadosAdicionais" class="bg-background rounded-lg p-4">
          <label class="block text-sm font-medium text-text-secondary mb-2">Dados Adicionais (JSON)</label>
          <pre class="text-xs text-text-primary overflow-x-auto">{{ formatJSON(log.dadosAdicionais) }}</pre>
        </div>

        <!-- Informações Técnicas -->
        <div class="grid grid-cols-2 gap-4 bg-background rounded-lg p-4">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">Endereço IP</label>
            <p class="text-text-primary font-mono text-sm">{{ log.enderecoIP || 'N/A' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1">User Agent</label>
            <p class="text-text-primary text-sm truncate" :title="log.userAgent">
              {{ log.userAgent || 'N/A' }}
            </p>
          </div>
          <div v-if="log.entidadeTipo">
            <label class="block text-sm font-medium text-text-secondary mb-1">Entidade Tipo</label>
            <p class="text-text-primary">{{ log.entidadeTipo }}</p>
          </div>
          <div v-if="log.entidadeId">
            <label class="block text-sm font-medium text-text-secondary mb-1">Entidade ID</label>
            <p class="text-text-primary">#{{ log.entidadeId }}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end p-6 border-t border-border">
        <button
          @click="$emit('close')"
          class="btn-primary px-6 py-2"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  log: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const getInitials = (nome) => {
  if (!nome) return '?'
  const partes = nome.split(' ')
  if (partes.length > 1) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }
  return partes[0][0].toUpperCase()
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

const formatJSON = (obj) => {
  if (typeof obj === 'string') {
    try {
      return JSON.stringify(JSON.parse(obj), null, 2)
    } catch {
      return obj
    }
  }
  return JSON.stringify(obj, null, 2)
}
</script>
