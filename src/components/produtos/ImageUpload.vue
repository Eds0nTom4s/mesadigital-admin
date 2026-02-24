<template>
  <div class="image-upload-container">
    <!-- Preview da Imagem -->
    <div class="image-preview-section">
      <div class="image-preview-wrapper">
        <img 
          v-if="currentImageUrl" 
          :src="currentImageUrl" 
          :alt="imageAlt"
          class="image-preview"
          @error="handleImageError"
        />
        <div v-else class="image-placeholder">
          <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="placeholder-text">Sem imagem</p>
        </div>

        <!-- Overlay com ações quando há imagem -->
        <div v-if="currentImageUrl && !disabled" class="image-overlay">
          <button 
            type="button"
            @click="triggerFileInput"
            class="overlay-button"
            title="Trocar imagem"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          <button 
            type="button"
            @click="removerImagem"
            class="overlay-button overlay-button-danger"
            title="Remover imagem"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Informações da Imagem -->
      <div v-if="fileInfo" class="file-info">
        <p class="file-name">{{ fileInfo.name }}</p>
        <p class="file-size">{{ formatFileSize(fileInfo.size) }}</p>
      </div>
    </div>

    <!-- Input de Upload (escondido) -->
    <input 
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/webp"
      class="hidden"
      @change="handleFileChange"
      :disabled="disabled"
    />

    <!-- Botão de Upload (quando não há imagem) -->
    <button 
      v-if="!currentImageUrl && !disabled"
      type="button"
      @click="triggerFileInput"
      class="upload-button"
      :disabled="uploading"
    >
      <svg v-if="!uploading" class="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <svg v-else class="button-icon animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{{ uploading ? 'Enviando...' : 'Escolher Imagem' }}</span>
    </button>

    <!-- Progress Bar -->
    <div v-if="uploading" class="progress-container">
      <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
    </div>

    <!-- Mensagens de Validação -->
    <div v-if="validationMessage" class="validation-message" :class="validationClass">
      {{ validationMessage }}
    </div>

    <!-- Ajuda -->
    <div class="help-text">
      <p class="help-title">Requisitos da imagem:</p>
      <ul class="help-list">
        <li>Formatos: JPG, JPEG, PNG ou WebP</li>
        <li>Tamanho máximo: 5 MB</li>
        <li>Dimensões recomendadas: 800x600 pixels (proporção 4:3)</li>
      </ul>
      <p class="help-note">
        💡 <strong>Dica:</strong> Imagens com proporção 4:3 ficam melhor exibidas. Evite imagens muito largas ou muito altas.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import produtosService from '@/services/produtosService'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  produtoId: {
    type: Number,
    default: null
  },
  imageAlt: {
    type: String,
    default: 'Imagem do produto'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error', 'remove-success'])

const fileInput = ref(null)
const currentImageUrl = ref(props.modelValue)
const fileInfo = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const validationMessage = ref('')
const validationClass = ref('')

// Constantes de validação
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Watch para atualizar URL quando prop mudar
watch(() => props.modelValue, (newValue) => {
  currentImageUrl.value = newValue
})

// Trigger input de arquivo
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Validar arquivo
const validateFile = (file) => {
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `Arquivo muito grande. Máximo: 5 MB (tamanho: ${formatFileSize(file.size)})`
    }
  }

  // Validar extensão
  const extension = file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      message: `Extensão não permitida. Use: ${ALLOWED_EXTENSIONS.join(', ')}`
    }
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: `Tipo de arquivo inválido. Use imagens JPG, PNG ou WebP`
    }
  }

  return { valid: true }
}

// Handle mudança de arquivo
const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Limpar mensagens anteriores
  validationMessage.value = ''
  validationClass.value = ''

  // Validar arquivo
  const validation = validateFile(file)
  if (!validation.valid) {
    validationMessage.value = validation.message
    validationClass.value = 'validation-error'
    fileInput.value.value = '' // Limpar input
    return
  }

  // Armazenar info do arquivo
  fileInfo.value = {
    name: file.name,
    size: file.size
  }

  // Preview local imediato
  const reader = new FileReader()
  reader.onload = (e) => {
    currentImageUrl.value = e.target.result
  }
  reader.readAsDataURL(file)

  // Se tem ID do produto, fazer upload automaticamente
  if (props.produtoId) {
    await uploadFile(file)
  } else {
    // Emitir arquivo para o pai decidir quando fazer upload
    emit('update:modelValue', file)
  }
}

// Upload de arquivo
const uploadFile = async (file) => {
  if (!props.produtoId) {
    validationMessage.value = 'Salve o produto antes de fazer upload da imagem'
    validationClass.value = 'validation-warning'
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    // Simulação de progresso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 100)

    // Usar produtosService ao invés de fetch direto
    const imageUrl = await produtosService.uploadImagem(props.produtoId, file)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    // Atualizar URL da imagem
    currentImageUrl.value = imageUrl
    emit('update:modelValue', imageUrl)
    emit('upload-success', imageUrl)

    validationMessage.value = 'Imagem enviada com sucesso!'
    validationClass.value = 'validation-success'

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)

  } catch (error) {
    console.error('[ImageUpload] Erro ao fazer upload:', error)
    
    // Tratamento específico para erro 403 (Forbidden)
    if (error.response?.status === 403) {
      validationMessage.value = '❌ Permissão negada. Você não tem autorização para fazer upload de imagens. Entre em contato com o administrador.'
    } else if (error.response?.status === 401) {
      validationMessage.value = '⚠️ Sessão expirada. Faça login novamente.'
    } else {
      validationMessage.value = error.response?.data?.message || error.message || 'Erro ao fazer upload da imagem'
    }
    
    validationClass.value = 'validation-error'
    emit('upload-error', error)
    
    // Reverter preview
    currentImageUrl.value = props.modelValue
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    fileInput.value.value = '' // Limpar input
  }
}

// Remover imagem
const removerImagem = async () => {
  if (!props.produtoId) {
    currentImageUrl.value = ''
    fileInfo.value = null
    emit('update:modelValue', '')
    return
  }

  if (!confirm('Tem certeza que deseja remover esta imagem?')) {
    return
  }

  uploading.value = true

  try {
    // Usar produtosService ao invés de fetch direto
    await produtosService.removerImagem(props.produtoId)

    currentImageUrl.value = ''
    fileInfo.value = null
    emit('update:modelValue', '')
    emit('remove-success')

    validationMessage.value = 'Imagem removida com sucesso!'
    validationClass.value = 'validation-success'

    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)

  } catch (error) {
    console.error('[ImageUpload] Erro ao remover imagem:', error)
    
    // Tratamento específico para erro 403 (Forbidden)
    if (error.response?.status === 403) {
      validationMessage.value = '❌ Permissão negada. Você não tem autorização para remover imagens. Entre em contato com o administrador.'
    } else if (error.response?.status === 401) {
      validationMessage.value = '⚠️ Sessão expirada. Faça login novamente.'
    } else {
      validationMessage.value = error.response?.data?.message || 'Erro ao remover imagem'
    }
    
    validationClass.value = 'validation-error'
  } finally {
    uploading.value = false
  }
}

// Formatar tamanho de arquivo
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.image-upload-container {
  width: 100%;
}

.image-preview-section {
  margin-bottom: 1rem;
}

.image-preview-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f3f4f6;
  border: 2px dashed #d1d5db;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.placeholder-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 0.5rem;
}

.placeholder-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.overlay-button {
  padding: 0.75rem;
  background-color: white;
  border-radius: 0.5rem;
  color: #3b82f6;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.overlay-button:hover {
  background-color: #3b82f6;
  color: white;
  transform: scale(1.1);
}

.overlay-button-danger {
  color: #ef4444;
}

.overlay-button-danger:hover {
  background-color: #ef4444;
  color: white;
}

.file-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

.upload-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.upload-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.progress-container {
  width: 100%;
  height: 0.5rem;
  background-color: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-bar {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s;
}

.validation-message {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.validation-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.validation-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.validation-warning {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.help-text {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.help-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.help-list {
  list-style-type: disc;
  padding-left: 1.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.help-list li {
  margin-bottom: 0.25rem;
}

.help-note {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #1e40af;
  line-height: 1.4;
}

.help-note strong {
  font-weight: 600;
}

.hidden {
  display: none;
}
</style>
