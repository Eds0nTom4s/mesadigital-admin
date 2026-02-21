<template>
  <div class="bg-white rounded-lg border border-border p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-text-primary">QR Code da Mesa</h3>
      <div v-if="qrCode" :class="['px-3 py-1 rounded-full text-xs font-medium', statusClass]">
        {{ qrCode.expirado ? 'Expirado' : 'Ativo' }}
      </div>
    </div>

    <!-- Imagem do QR Code -->
    <div v-if="qrCode" class="space-y-4">
      <!-- QR Code Image (lazy loading) -->
      <div class="flex justify-center bg-background p-6 rounded-lg">
        <img 
          :src="imagemUrl" 
          :alt="`QR Code ${qrCode.unidadeDeConsumoNome || ''}`"
          loading="lazy"
          width="300"
          height="300"
          class="rounded-lg"
          @error="handleImageError"
        />
      </div>

      <!-- Informações -->
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-text-secondary">Tipo:</span>
          <span class="font-medium text-text-primary">{{ tipoLabel }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-text-secondary">Expira em:</span>
          <span class="font-medium text-text-primary">{{ formatarDataExpiracao }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-text-secondary">Criado por:</span>
          <span class="font-medium text-text-primary">{{ qrCode.criadoPor || 'Sistema' }}</span>
        </div>
      </div>

      <!-- Ações -->
      <div class="flex flex-wrap gap-2 pt-4 border-t border-border">
        <button 
          v-if="!qrCode.expirado"
          @click="$emit('renovar')" 
          class="btn-secondary flex-1"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Renovar
        </button>
        
        <button 
          @click="baixarParaImpressao" 
          class="btn-secondary flex-1"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Baixar (500x500)
        </button>

        <button 
          v-if="podeGerenciar"
          @click="confirmarCancelar" 
          class="btn-secondary text-error hover:bg-error/10"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cancelar
        </button>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else class="text-center py-8">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
      </svg>
      <p class="text-text-secondary mb-4">Nenhum QR Code ativo</p>
      <button @click="$emit('gerar')" class="btn-primary">
        Gerar QR Code
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import qrcodeService from '@/services/qrcodeService'

const props = defineProps({
  qrCode: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['renovar', 'cancelar', 'gerar'])

const authStore = useAuthStore()

// URL da imagem (lazy loading)
const imagemUrl = computed(() => {
  return props.qrCode ? qrcodeService.getImagemUrl(props.qrCode.token) : ''
})

// Classe do status
const statusClass = computed(() => {
  if (!props.qrCode) return ''
  return props.qrCode.expirado ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
})

// Label do tipo
const tipoLabel = computed(() => {
  const tipos = {
    MESA: 'Mesa',
    ENTREGA: 'Entrega',
    PAGAMENTO: 'Pagamento'
  }
  return tipos[props.qrCode?.tipo] || props.qrCode?.tipo
})

// Formatar data de expiração
const formatarDataExpiracao = computed(() => {
  if (!props.qrCode?.expiraEm) return 'Não especificado'
  
  const data = new Date(props.qrCode.expiraEm)
  return data.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Permissão para gerenciar (GERENTE ou ADMIN)
const podeGerenciar = computed(() => {
  return authStore.isAdmin || authStore.isGerente
})

// Baixar para impressão
const baixarParaImpressao = () => {
  if (!props.qrCode) return
  
  const filename = `qrcode-${props.qrCode.unidadeDeConsumoNome || props.qrCode.token}.png`
  qrcodeService.baixarQrCode(props.qrCode.token, filename)
}

// Confirmar cancelamento
const confirmarCancelar = () => {
  if (confirm('Deseja realmente cancelar este QR Code? Esta ação não pode ser desfeita.')) {
    emit('cancelar')
  }
}

// Tratar erro de imagem
const handleImageError = (event) => {
  console.error('[QrCodeDisplay] Erro ao carregar imagem do QR Code')
  event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%239ca3af" font-size="14"%3EErro ao carregar%3C/text%3E%3C/svg%3E'
}
</script>
