<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
        <h3 class="text-2xl font-bold text-text-primary">
          {{ modoEdicao ? 'Editar Produto' : 'Novo Produto' }}
        </h3>
        <button @click="$emit('close')" class="text-text-secondary hover:text-text-primary text-2xl font-bold">
          ×
        </button>
      </div>

      <!-- Formulário -->
      <form @submit.prevent="salvarProduto" class="p-6 space-y-4">
        <!-- Código -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">Código *</label>
          <input
            v-model="form.codigo"
            type="text"
            maxlength="50"
            class="input-field w-full"
            :class="{ 'border-error': erros.codigo }"
            placeholder="Ex: PROD-001"
          />
          <p v-if="erros.codigo" class="text-error text-sm mt-1">{{ erros.codigo }}</p>
        </div>

        <!-- Nome -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">Nome *</label>
          <input
            v-model="form.nome"
            type="text"
            maxlength="150"
            class="input-field w-full"
            :class="{ 'border-error': erros.nome }"
            placeholder="Nome do produto"
          />
          <p v-if="erros.nome" class="text-error text-sm mt-1">{{ erros.nome }}</p>
        </div>

        <!-- Descrição -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1">Descrição</label>
          <textarea
            v-model="form.descricao"
            maxlength="500"
            rows="3"
            class="input-field w-full"
            :class="{ 'border-error': erros.descricao }"
            placeholder="Descrição detalhada do produto"
          ></textarea>
          <p v-if="erros.descricao" class="text-error text-sm mt-1">{{ erros.descricao }}</p>
          <p class="text-text-secondary text-xs mt-1">{{ form.descricao?.length || 0 }}/500 caracteres</p>
        </div>

        <!-- Preço e Categoria -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Preço (Kz) *</label>
            <input
              v-model="form.preco"
              type="number"
              step="0.01"
              min="0.01"
              class="input-field w-full"
              :class="{ 'border-error': erros.preco }"
              placeholder="0,00"
            />
            <p v-if="erros.preco" class="text-error text-sm mt-1">{{ erros.preco }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Categoria *</label>
            <select
              v-model="form.categoria"
              class="input-field w-full"
              :class="{ 'border-error': erros.categoria }"
            >
              <option v-for="cat in categoriasExibicao" :key="cat.valor" :value="cat.valor">
                {{ cat.label }}
              </option>
            </select>
            <p v-if="erros.categoria" class="text-error text-sm mt-1">{{ erros.categoria }}</p>
          </div>
        </div>

        <!-- Imagem -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Imagem do Produto</label>
          <ImageUpload
            v-model="form.urlImagem"
            :produto-id="modoEdicao ? produto?.id : null"
            :image-alt="form.nome || 'Produto'"
            @upload-success="handleUploadSuccess"
            @upload-error="handleUploadError"
            @remove-success="handleRemoveSuccess"
          />
        </div>

        <!-- Tempo de Preparo e Tipo de Preparo -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tempo de Preparo (minutos)</label>
            <input
              v-model="form.tempoPreparoMinutos"
              type="number"
              min="1"
              class="input-field w-full"
              :class="{ 'border-error': erros.tempoPreparoMinutos }"
              placeholder="15"
            />
            <p v-if="erros.tempoPreparoMinutos" class="text-error text-sm mt-1">{{ erros.tempoPreparoMinutos }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Tipo de Preparo *</label>
            <select
              v-model="form.tipoPreparo"
              class="input-field w-full"
              :class="{ 'border-error': erros.tipoPreparo }"
            >
              <option v-for="tipo in tiposPreparo" :key="tipo.valor" :value="tipo.valor">
                {{ tipo.label }} - {{ tipo.descricao }}
              </option>
            </select>
            <p v-if="erros.tipoPreparo" class="text-error text-sm mt-1">{{ erros.tipoPreparo }}</p>
          </div>
        </div>

        <!-- Botões -->
        <div class="flex space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 bg-background text-text-primary rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="salvando"
            class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ salvando ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Criar Produto') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import api from '@/services/api'
import ImageUpload from '@/components/produtos/ImageUpload.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  modoEdicao: { type: Boolean, default: false },
  produto: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const notificationStore = useNotificationStore()

const salvando = ref(false)
const erros = ref({})

// Static lookup data (same as ProdutosView)
const categorias = [
  { valor: 'TODAS', label: 'Todas Categorias' },
  { valor: 'ENTRADA', label: 'Entrada' },
  { valor: 'PRATO_PRINCIPAL', label: 'Prato Principal' },
  { valor: 'ACOMPANHAMENTO', label: 'Acompanhamento' },
  { valor: 'SOBREMESA', label: 'Sobremesa' },
  { valor: 'BEBIDA_ALCOOLICA', label: 'Bebida Alcoólica' },
  { valor: 'BEBIDA_NAO_ALCOOLICA', label: 'Bebida Não Alcoólica' },
  { valor: 'LANCHE', label: 'Lanche' },
  { valor: 'PIZZA', label: 'Pizza' },
  { valor: 'OUTROS', label: 'Outros' }
]

const categoriasExibicao = categorias.filter(c => c.valor !== 'TODAS')

const tiposPreparo = [
  { valor: 'QUENTE', label: '🔥 Quente', descricao: 'Requer cozinha quente' },
  { valor: 'FRIO', label: '❄️ Frio', descricao: 'Preparação fria' },
  { valor: 'BAR', label: '🍹 Bar', descricao: 'Preparado no bar' },
  { valor: 'BEBIDA', label: '🥤 Bebida', descricao: 'Bebidas sem preparo' },
  { valor: 'SOBREMESA', label: '🍰 Sobremesa', descricao: 'Sobremesas' },
  { valor: 'ENTREGA', label: '🚚 Entrega', descricao: 'Produtos para delivery' }
]

const emptyForm = () => ({
  codigo: '',
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'LANCHE',
  urlImagem: '',
  tempoPreparoMinutos: '',
  tipoPreparo: 'QUENTE'
})

const form = ref(emptyForm())

// Reinitialize form when modal opens or produto changes
watch(
  () => [props.show, props.produto],
  ([show]) => {
    if (!show) return
    erros.value = {}
    if (props.modoEdicao && props.produto) {
      form.value = {
        codigo: props.produto.codigo || '',
        nome: props.produto.nome || '',
        descricao: props.produto.descricao || '',
        preco: props.produto.preco != null ? (props.produto.preco / 100).toFixed(2) : '',
        categoria: props.produto.categoria || 'LANCHE',
        urlImagem: props.produto.urlImagem || '',
        tempoPreparoMinutos: props.produto.tempoPreparoMinutos?.toString() || '',
        tipoPreparo: props.produto.tipoPreparo || 'QUENTE'
      }
    } else {
      form.value = emptyForm()
    }
  },
  { immediate: false }
)

const validar = () => {
  erros.value = {}

  if (!form.value.codigo || form.value.codigo.length > 50) {
    erros.value.codigo = 'Código é obrigatório (máx 50 caracteres)'
  }
  if (!form.value.nome || form.value.nome.length < 3 || form.value.nome.length > 150) {
    erros.value.nome = 'Nome é obrigatório (3-150 caracteres)'
  }
  const preco = parseFloat(form.value.preco)
  if (!form.value.preco || isNaN(preco) || preco < 0.01) {
    erros.value.preco = 'Preço é obrigatório e deve ser maior que 0'
  }
  if (!form.value.categoria) {
    erros.value.categoria = 'Categoria é obrigatória'
  }
  if (form.value.descricao && form.value.descricao.length > 500) {
    erros.value.descricao = 'Descrição deve ter no máximo 500 caracteres'
  }
  if (form.value.tempoPreparoMinutos && parseInt(form.value.tempoPreparoMinutos) < 1) {
    erros.value.tempoPreparoMinutos = 'Tempo de preparo deve ser maior que 0'
  }
  if (!form.value.tipoPreparo) {
    erros.value.tipoPreparo = 'Tipo de preparo é obrigatório'
  }

  return Object.keys(erros.value).length === 0
}

const salvarProduto = async () => {
  if (!validar()) {
    notificationStore.aviso('Por favor, corrija os erros no formulário')
    return
  }

  try {
    salvando.value = true

    const payload = {
      codigo: form.value.codigo,
      nome: form.value.nome,
      descricao: form.value.descricao || null,
      preco: Math.round(parseFloat(form.value.preco) * 100),
      categoria: form.value.categoria,
      urlImagem: form.value.urlImagem || null,
      tempoPreparoMinutos: form.value.tempoPreparoMinutos ? parseInt(form.value.tempoPreparoMinutos) : null,
      tipoPreparo: form.value.tipoPreparo
    }

    if (props.modoEdicao && props.produto) {
      await api.put(`/produtos/${props.produto.id}`, payload)
      notificationStore.sucesso('Produto atualizado com sucesso')
    } else {
      await api.post('/produtos', payload)
      notificationStore.sucesso('Produto criado com sucesso')
    }

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('[ModalProduto] Erro ao salvar produto:', error)
    if (error.response?.data?.validationErrors) {
      erros.value = error.response.data.validationErrors
    }
    notificationStore.erro(error.response?.data?.message || 'Erro ao salvar produto')
  } finally {
    salvando.value = false
  }
}

const handleUploadSuccess = (imageUrl) => {
  form.value.urlImagem = imageUrl
}

const handleUploadError = () => {
  notificationStore.erro('Erro ao fazer upload da imagem')
}

const handleRemoveSuccess = () => {
  form.value.urlImagem = ''
}
</script>
