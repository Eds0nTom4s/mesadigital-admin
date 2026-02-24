<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCurrency } from '@/utils/currency'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notifications'
import api from '@/services/api'
import ImageUpload from '@/components/produtos/ImageUpload.vue'

const { formatCurrency } = useCurrency()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Estado
const produtos = ref([])
const loading = ref(false)
const categoriaFiltro = ref('TODAS')
const buscaTexto = ref('')
const mostrarModal = ref(false)
const modoEdicao = ref(false)
const produtoEditando = ref(null)
const buscaTimeout = ref(null)

// Formulário
const form = ref({
  codigo: '',
  nome: '',
  descricao: '',
  preco: '',
  categoria: 'LANCHE',
  urlImagem: '',
  tempoPreparoMinutos: '',
  tipoPreparo: 'QUENTE' // Default conforme backend
})

const formErros = ref({})

// Categorias conforme documentação
const categorias = [
  { valor: 'TODAS', label: 'Todas Categorias', cor: '#9E9E9E' },
  { valor: 'ENTRADA', label: 'Entrada', cor: '#4CAF50' },
  { valor: 'PRATO_PRINCIPAL', label: 'Prato Principal', cor: '#2196F3' },
  { valor: 'ACOMPANHAMENTO', label: 'Acompanhamento', cor: '#FFC107' },
  { valor: 'SOBREMESA', label: 'Sobremesa', cor: '#E91E63' },
  { valor: 'BEBIDA_ALCOOLICA', label: 'Bebida Alcoólica', cor: '#9C27B0' },
  { valor: 'BEBIDA_NAO_ALCOOLICA', label: 'Bebida Não Alcoólica', cor: '#00BCD4' },
  { valor: 'LANCHE', label: 'Lanche', cor: '#FF5722' },
  { valor: 'PIZZA', label: 'Pizza', cor: '#F44336' },
  { valor: 'OUTROS', label: 'Outros', cor: '#9E9E9E' }
]

// Tipos de Preparo conforme RELATORIO_MUDANCAS_API_PRODUTOS.md
// Enum exato do backend - NÃO ALTERAR
const tiposPreparo = [
  { valor: 'QUENTE', label: '🔥 Quente', descricao: 'Requer cozinha quente', cor: '#F44336' },
  { valor: 'FRIO', label: '❄️ Frio', descricao: 'Preparação fria', cor: '#03A9F4' },
  { valor: 'BAR', label: '🍹 Bar', descricao: 'Preparado no bar', cor: '#FF9800' },
  { valor: 'BEBIDA', label: '🥤 Bebida', descricao: 'Bebidas sem preparo', cor: '#2196F3' },
  { valor: 'SOBREMESA', label: '🍰 Sobremesa', descricao: 'Sobremesas', cor: '#4CAF50' },
  { valor: 'ENTREGA', label: '🚚 Entrega', descricao: 'Produtos para delivery', cor: '#9E9E9E' }
]

// Computed
const isGerente = computed(() => {
  // Verifica múltiplas formas de role
  const role = authStore.user?.role
  const roles = authStore.user?.roles || []
  
  return role === 'ADMIN' || 
         role === 'GERENTE' || 
         role === 'Administrador' ||
         roles.includes('ROLE_ADMIN') || 
         roles.includes('ROLE_GERENTE') ||
         authStore.isAdmin ||
         authStore.isGerente
})

const categoriasExibicao = computed(() => categorias.filter(c => c.valor !== 'TODAS'))

const getCorCategoria = (categoria) => {
  const cat = categorias.find(c => c.valor === categoria)
  return cat?.cor || '#9E9E9E'
}

const getLabelCategoria = (categoria) => {
  const cat = categorias.find(c => c.valor === categoria)
  return cat?.label || categoria
}

const getLabelTipoPreparo = (tipo) => {
  const t = tiposPreparo.find(tp => tp.valor === tipo)
  return t?.label || tipo
}

const getCorTipoPreparo = (tipo) => {
  const t = tiposPreparo.find(tp => tp.valor === tipo)
  return t?.cor || '#9E9E9E'
}

// Carregar produtos
const carregarProdutos = async () => {
  try {
    loading.value = true
    let response
    
    if (categoriaFiltro.value === 'TODAS') {
      response = await api.get('/produtos')
    } else {
      response = await api.get(`/produtos/categoria/${categoriaFiltro.value}`)
    }
    
    produtos.value = response.data.data || response.data || []
  } catch (error) {
    console.error('[ProdutosView] Erro ao carregar produtos:', error)
    notificationStore.erro('Erro ao carregar produtos')
  } finally {
    loading.value = false
  }
}

// Buscar produtos com debounce
const buscarProdutos = async (termo) => {
  if (!termo || termo.length < 2) {
    carregarProdutos()
    return
  }
  
  try {
    loading.value = true
    const response = await api.get(`/produtos/buscar?nome=${encodeURIComponent(termo)}`)
    produtos.value = response.data.data || response.data || []
  } catch (error) {
    console.error('[ProdutosView] Erro ao buscar produtos:', error)
    notificationStore.erro('Erro ao buscar produtos')
  } finally {
    loading.value = false
  }
}

// Watch com debounce para busca
watch(buscaTexto, (novoValor) => {
  if (buscaTimeout.value) {
    clearTimeout(buscaTimeout.value)
  }
  
  buscaTimeout.value = setTimeout(() => {
    buscarProdutos(novoValor)
  }, 500)
})

watch(categoriaFiltro, () => {
  if (!buscaTexto.value) {
    carregarProdutos()
  }
})

// Abrir modal para criar
const abrirModalCriar = () => {
  modoEdicao.value = false
  produtoEditando.value = null
  limparFormulario()
  mostrarModal.value = true
}

// Abrir modal para editar
const abrirModalEditar = (produto) => {
  modoEdicao.value = true
  produtoEditando.value = produto
  form.value = {
    codigo: produto.codigo,
    nome: produto.nome,
    descricao: produto.descricao || '',
    preco: (produto.preco / 100).toFixed(2), // Converter centavos para decimal
    categoria: produto.categoria,
    urlImagem: produto.urlImagem || '',
    tempoPreparoMinutos: produto.tempoPreparoMinutos?.toString() || '',
    tipoPreparo: produto.tipoPreparo || 'QUENTE'
  }
  formErros.value = {}
  mostrarModal.value = true
}

// Fechar modal
const fecharModal = () => {
  mostrarModal.value = false
  limparFormulario()
}

// Limpar formulário
const limparFormulario = () => {
  form.value = {
    codigo: '',
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'LANCHE',
    urlImagem: '',
    tempoPreparoMinutos: '',
    tipoPreparo: 'QUENTE'
  }
  formErros.value = {}
}

// Validar formulário
const validarFormulario = () => {
  formErros.value = {}
  
  if (!form.value.codigo || form.value.codigo.length > 50) {
    formErros.value.codigo = 'Código é obrigatório (máx 50 caracteres)'
  }
  
  if (!form.value.nome || form.value.nome.length < 3 || form.value.nome.length > 150) {
    formErros.value.nome = 'Nome é obrigatório (3-150 caracteres)'
  }
  
  const preco = parseFloat(form.value.preco)
  if (!form.value.preco || isNaN(preco) || preco < 0.01) {
    formErros.value.preco = 'Preço é obrigatório e deve ser maior que 0'
  }
  
  if (!form.value.categoria) {
    formErros.value.categoria = 'Categoria é obrigatória'
  }
  
  if (form.value.descricao && form.value.descricao.length > 500) {
    formErros.value.descricao = 'Descrição deve ter no máximo 500 caracteres'
  }
  
  if (form.value.tempoPreparoMinutos && parseInt(form.value.tempoPreparoMinutos) < 1) {
    formErros.value.tempoPreparoMinutos = 'Tempo de preparo deve ser maior que 0'
  }
  
  if (!form.value.tipoPreparo) {
    formErros.value.tipoPreparo = 'Tipo de preparo é obrigatório'
  }
  
  return Object.keys(formErros.value).length === 0
}

// Salvar produto
const salvarProduto = async () => {
  if (!validarFormulario()) {
    notificationStore.aviso('Por favor, corrija os erros no formulário')
    return
  }
  
  try {
    loading.value = true
    
    const payload = {
      codigo: form.value.codigo,
      nome: form.value.nome,
      descricao: form.value.descricao || null,
      preco: Math.round(parseFloat(form.value.preco) * 100), // Converter decimal para centavos
      categoria: form.value.categoria,
      urlImagem: form.value.urlImagem || null,
      tempoPreparoMinutos: form.value.tempoPreparoMinutos ? parseInt(form.value.tempoPreparoMinutos) : null,
      tipoPreparo: form.value.tipoPreparo
    }
    
    if (modoEdicao.value && produtoEditando.value) {
      await api.put(`/produtos/${produtoEditando.value.id}`, payload)
      notificationStore.sucesso('Produto atualizado com sucesso')
    } else {
      await api.post('/produtos', payload)
      notificationStore.sucesso('Produto criado com sucesso')
    }
    
    fecharModal()
    carregarProdutos()
  } catch (error) {
    console.error('[ProdutosView] Erro ao salvar produto:', error)
    if (error.response?.data?.validationErrors) {
      formErros.value = error.response.data.validationErrors
    }
    notificationStore.erro(error.response?.data?.message || 'Erro ao salvar produto')
  } finally {
    loading.value = false
  }
}

// Alterar status ativo/inativo
const alterarStatus = async (produto) => {
  try {
    const novoStatus = !produto.ativo
    await api.patch(`/produtos/${produto.id}/disponibilidade`, { ativo: novoStatus })
    produto.ativo = novoStatus
    notificationStore.sucesso(`Produto marcado como ${novoStatus ? 'ativo' : 'inativo'}`)
  } catch (error) {
    console.error('[ProdutosView] Erro ao alterar status:', error)
    notificationStore.erro('Erro ao alterar status')
  }
}

// Excluir produto
const excluirProduto = async (produto) => {
  if (!confirm(`Tem certeza que deseja remover "${produto.nome}" do cardápio?\n\nEsta ação é permanente e o produto não aparecerá mais nas listagens.`)) {
    return
  }
  
  try {
    await api.delete(`/produtos/${produto.id}`)
    notificationStore.sucesso('Produto removido do cardápio')
    carregarProdutos()
  } catch (error) {
    console.error('[ProdutosView] Erro ao excluir produto:', error)
    notificationStore.erro('Erro ao excluir produto')
  }
}

onMounted(() => {
  carregarProdutos()
})

// Handlers de upload
const handleUploadSuccess = (imageUrl) => {
  console.log('[ProdutosView] Upload bem-sucedido:', imageUrl)
  form.value.urlImagem = imageUrl
  
  // Se estiver editando, atualizar produto na lista
  if (modoEdicao.value && produtoEditando.value) {
    produtoEditando.value.urlImagem = imageUrl
    const index = produtos.value.findIndex(p => p.id === produtoEditando.value.id)
    if (index !== -1) {
      produtos.value[index].urlImagem = imageUrl
    }
  }
}

const handleUploadError = (error) => {
  console.error('[ProdutosView] Erro no upload:', error)
  notificationStore.erro('Erro ao fazer upload da imagem')
}

const handleRemoveSuccess = () => {
  console.log('[ProdutosView] Imagem removida')
  form.value.urlImagem = ''
  
  if (modoEdicao.value && produtoEditando.value) {
    produtoEditando.value.urlImagem = null
    const index = produtos.value.findIndex(p => p.id === produtoEditando.value.id)
    if (index !== -1) {
      produtos.value[index].urlImagem = null
    }
  }
}

/**
 * Produtos View - Gestão completa do cardápio
 * Conforme especificação: INSTRUCOES_FRONTEND_PAGINA_PRODUTOS.txt
 */
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Cardápio</h2>
        <p class="text-text-secondary mt-1">Gestão completa do cardápio e produtos</p>
        <div v-if="authStore.user" class="text-xs text-text-secondary mt-1">
          Role: {{ authStore.user.role }} | isGerente: {{ isGerente }}
        </div>
      </div>
      <button @click="abrirModalCriar" 
              class="btn-primary flex items-center space-x-2">
        <span class="text-xl">+</span>
        <span>Adicionar Produto</span>
      </button>
    </div>

    <!-- Filtros -->
    <div class="card">
      <!-- Campo de Busca -->
      <div class="mb-4">
        <div class="relative">
          <input v-model="buscaTexto" 
                 type="text" 
                 placeholder="Buscar produtos por nome..." 
                 class="input-field w-full pl-10" />
          <svg class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- Tabs de Categorias -->
      <div class="flex space-x-2 overflow-x-auto pb-2">
        <button v-for="categoria in categorias" 
                :key="categoria.valor"
                @click="categoriaFiltro = categoria.valor"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  categoriaFiltro === categoria.valor 
                    ? 'bg-primary text-white' 
                    : 'bg-background text-text-secondary hover:bg-gray-200'
                ]">
          {{ categoria.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && produtos.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="card animate-pulse">
        <div class="h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="produtos.length === 0 && !loading" class="card text-center py-16">
      <div class="text-6xl mb-4">🍽️</div>
      <p class="text-xl font-semibold text-text-primary mb-2">Nenhum produto encontrado</p>
      <p class="text-text-secondary">
        {{ buscaTexto ? 'Tente ajustar sua busca' : 'Comece adicionando produtos ao cardápio' }}
      </p>
    </div>

    <!-- Grid de Produtos -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="produto in produtos" 
           :key="produto.id"
           class="card hover:shadow-lg transition-shadow"
           :class="{ 'opacity-60': !produto.ativo }">
        <!-- Imagem -->
        <div class="relative mb-4 h-48 bg-gray-100 rounded-lg overflow-hidden">
          <img v-if="produto.urlImagem" 
               :src="produto.urlImagem" 
               :alt="produto.nome"
               class="w-full h-full object-cover"
               @error="$event.target.src = 'https://via.placeholder.com/300x200?text=Sem+Imagem'" />
          <div v-else class="w-full h-full flex items-center justify-center text-6xl">
            🍽️
          </div>
          
          <!-- Badge de Categoria -->
          <div class="absolute top-2 left-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  :style="{ backgroundColor: getCorCategoria(produto.categoria) }">
              {{ getLabelCategoria(produto.categoria) }}
            </span>
          </div>

          <!-- Badge de Disponibilidade -->
          <!-- Badge de Status Ativo/Inativo -->
          <div v-if="!produto.ativo" class="absolute top-2 right-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-error text-white">
              Inativo
            </span>
          </div>
          
          <!-- Badge de Tipo de Preparo -->
          <div v-if="produto.tipoPreparo" class="absolute bottom-2 left-2">
            <span class="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  :style="{ backgroundColor: getCorTipoPreparo(produto.tipoPreparo) }">
              {{ getLabelTipoPreparo(produto.tipoPreparo) }}
            </span>
          </div>
        </div>

        <!-- Informações -->
        <div class="space-y-3">
          <!-- Nome -->
          <h3 class="font-semibold text-lg text-text-primary line-clamp-1">
            {{ produto.nome }}
          </h3>

          <!-- Descrição -->
          <p class="text-sm text-text-secondary line-clamp-2 min-h-[2.5rem]">
            {{ produto.descricao || 'Sem descrição' }}
          </p>

          <!-- Preço e Tempo -->
          <div class="flex items-center justify-between">
            <span class="text-2xl font-bold text-primary">
              {{ formatCurrency(produto.preco) }}
            </span>
            <span v-if="produto.tempoPreparoMinutos" 
                  class="text-sm text-text-secondary flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>~{{ produto.tempoPreparoMinutos }} min</span>
            </span>
          </div>

          <!-- Ações -->
          <div class="flex items-center space-x-2 pt-3 border-t border-border">
            <!-- Toggle Status Ativo/Inativo -->
            <label class="flex items-center space-x-2 cursor-pointer flex-1">
              <div class="relative">
                <input type="checkbox" 
                       :checked="produto.ativo"
                       @change="alterarStatus(produto)"
                       class="sr-only peer">
                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success"></div>
              </div>
              <span class="text-sm text-text-secondary">
                {{ produto.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </label>

            <!-- Botão Editar -->
            <button @click="abrirModalEditar(produto)"
                    class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Editar produto">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>

            <!-- Botão Excluir -->
            <button @click="excluirProduto(produto)"
                    class="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="Remover produto">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Criar/Editar -->
    <div v-if="mostrarModal" 
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         @click.self="fecharModal">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Header do Modal -->
        <div class="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <h3 class="text-2xl font-bold text-text-primary">
            {{ modoEdicao ? 'Editar Produto' : 'Novo Produto' }}
          </h3>
          <button @click="fecharModal" 
                  class="text-text-secondary hover:text-text-primary text-2xl font-bold">
            ×
          </button>
        </div>

        <!-- Formulário -->
        <form @submit.prevent="salvarProduto" class="p-6 space-y-4">
          <!-- Código -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Código *
            </label>
            <input v-model="form.codigo" 
                   type="text" 
                   maxlength="50"
                   class="input-field w-full"
                   :class="{ 'border-error': formErros.codigo }"
                   placeholder="Ex: PROD-001" />
            <p v-if="formErros.codigo" class="text-error text-sm mt-1">{{ formErros.codigo }}</p>
          </div>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Nome *
            </label>
            <input v-model="form.nome" 
                   type="text" 
                   maxlength="150"
                   class="input-field w-full"
                   :class="{ 'border-error': formErros.nome }"
                   placeholder="Nome do produto" />
            <p v-if="formErros.nome" class="text-error text-sm mt-1">{{ formErros.nome }}</p>
          </div>

          <!-- Descrição -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Descrição
            </label>
            <textarea v-model="form.descricao" 
                      maxlength="500"
                      rows="3"
                      class="input-field w-full"
                      :class="{ 'border-error': formErros.descricao }"
                      placeholder="Descrição detalhada do produto"></textarea>
            <p v-if="formErros.descricao" class="text-error text-sm mt-1">{{ formErros.descricao }}</p>
            <p class="text-text-secondary text-xs mt-1">{{ form.descricao?.length || 0 }}/500 caracteres</p>
          </div>

          <!-- Preço e Categoria (lado a lado) -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Preço -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Preço (Kz) *
              </label>
              <input v-model="form.preco" 
                     type="number" 
                     step="0.01"
                     min="0.01"
                     class="input-field w-full"
                     :class="{ 'border-error': formErros.preco }"
                     placeholder="0,00" />
              <p v-if="formErros.preco" class="text-error text-sm mt-1">{{ formErros.preco }}</p>
            </div>

            <!-- Categoria -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Categoria *
              </label>
              <select v-model="form.categoria" 
                      class="input-field w-full"
                      :class="{ 'border-error': formErros.categoria }">
                <option v-for="cat in categoriasExibicao" 
                        :key="cat.valor" 
                        :value="cat.valor">
                  {{ cat.label }}
                </option>
              </select>
              <p v-if="formErros.categoria" class="text-error text-sm mt-1">{{ formErros.categoria }}</p>
            </div>
          </div>

          <!-- URL da Imagem -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Imagem do Produto
            </label>
            
            <!-- Componente de Upload -->
            <ImageUpload 
              v-model="form.urlImagem"
              :produto-id="modoEdicao ? produtoEditando?.id : null"
              :image-alt="form.nome || 'Produto'"
              @upload-success="handleUploadSuccess"
              @upload-error="handleUploadError"
              @remove-success="handleRemoveSuccess"
            />
          </div>

          <!-- Tempo de Preparo e Tipo de Preparo -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Tempo de Preparo -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Tempo de Preparo (minutos)
              </label>
              <input v-model="form.tempoPreparoMinutos" 
                     type="number" 
                     min="1"
                     class="input-field w-full"
                     :class="{ 'border-error': formErros.tempoPreparoMinutos }"
                     placeholder="15" />
              <p v-if="formErros.tempoPreparoMinutos" class="text-error text-sm mt-1">{{ formErros.tempoPreparoMinutos }}</p>
            </div>

            <!-- Tipo de Preparo -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Tipo de Preparo *
              </label>
              <select v-model="form.tipoPreparo" 
                      class="input-field w-full"
                      :class="{ 'border-error': formErros.tipoPreparo }">
                <option v-for="tipo in tiposPreparo" 
                        :key="tipo.valor" 
                        :value="tipo.valor">
                  {{ tipo.label }} - {{ tipo.descricao }}
                </option>
              </select>
              <p v-if="formErros.tipoPreparo" class="text-error text-sm mt-1">{{ formErros.tipoPreparo }}</p>
            </div>
          </div>

          <!-- Botões -->
          <div class="flex space-x-3 pt-4">
            <button type="button" 
                    @click="fecharModal"
                    class="flex-1 px-4 py-2 bg-background text-text-primary rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" 
                    :disabled="loading"
                    class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {{ loading ? 'Salvando...' : (modoEdicao ? 'Salvar Alterações' : 'Criar Produto') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
