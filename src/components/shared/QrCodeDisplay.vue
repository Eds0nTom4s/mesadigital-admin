<template>
  <div class="card">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-text-primary flex items-center">
        <svg class="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
        </svg>
        QR Code da Mesa
      </h3>
      <div v-if="qrCode" :class="['px-3 py-1 rounded-full text-xs font-bold shadow-sm', statusClass]">
        {{ qrCode.expirado ? '⚠️ Expirado' : '✓ Ativo' }}
      </div>
    </div>

    <!-- Imagem do QR Code -->
    <div v-if="qrCode" class="space-y-4">
      <!-- QR Code Image (destaque visual) -->
      <div class="flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300">
        <img 
          :src="imagemUrl" 
          :alt="`QR Code ${qrCode.unidadeDeConsumoNome || ''}`"
          loading="lazy"
          width="350"
          height="350"
          class="rounded-lg shadow-xl border-4 border-white"
          @error="handleImageError"
        />
        <p class="text-center text-sm text-text-secondary mt-4 font-medium">
          📱 Escaneie com o celular para acessar o cardápio
        </p>
      </div>

      <!-- Informações -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-secondary flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            Tipo:
          </span>
          <span class="font-semibold text-text-primary">{{ tipoLabel }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-secondary flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Expira em:
          </span>
          <span class="font-semibold text-text-primary">{{ formatarDataExpiracao }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-text-secondary flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Criado por:
          </span>
          <span class="font-semibold text-text-primary">{{ qrCode.criadoPor || 'Sistema' }}</span>
        </div>
      </div>

      <!-- Ações -->
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button 
          v-if="!qrCode.expirado"
          @click="$emit('renovar')" 
          class="btn-secondary font-semibold"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Renovar QR Code
        </button>
        
        <button 
          @click="baixarParaImpressao" 
          class="btn-secondary font-semibold"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Baixar Imagem
        </button>

        <button 
          v-if="podeGerenciar"
          @click="confirmarCancelar" 
          class="col-span-2 btn-secondary text-error hover:bg-error/10 font-semibold border-error/20"
          :disabled="loading"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cancelar QR Code
        </button>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-else class="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
      <div class="max-w-sm mx-auto">
        <svg class="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
        </svg>
        <h4 class="text-lg font-semibold text-text-primary mb-2">Nenhum QR Code ativo</h4>
        <p class="text-sm text-text-secondary mb-6">Gere um QR Code para permitir que clientes acessem o cardápio digital desta mesa</p>
        <button @click="$emit('gerar')" class="btn-primary font-semibold shadow-lg">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Gerar QR Code
        </button>
      </div>
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
