<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <h3 class="text-xl font-semibold text-text-primary">
          {{ usuario ? 'Editar Usuário' : 'Novo Usuário' }}
        </h3>
        <button @click="$emit('close')" class="text-text-secondary hover:text-text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="salvar" class="p-6 space-y-4">
        <!-- Nome Completo -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">
            Nome Completo *
          </label>
          <input
            v-model="form.nome"
            type="text"
            required
            class="input-field w-full"
            placeholder="Ex: João Silva Santos"
          />
        </div>

        <!-- Telefone e Email -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Telefone * <span class="text-xs text-text-secondary">(usado no login)</span>
            </label>
            <input
              v-model="form.telefone"
              type="tel"
              required
              :disabled="!!usuario"
              class="input-field w-full"
              :class="{ 'opacity-60 cursor-not-allowed': !!usuario }"
              placeholder="+244 900 000 000"
            />
            <p v-if="usuario" class="text-xs text-text-secondary mt-1">
              Telefone não pode ser alterado
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Email (opcional)
            </label>
            <input
              v-model="form.email"
              type="email"
              class="input-field w-full"
              placeholder="usuario@exemplo.com"
            />
          </div>
        </div>

        <!-- Senha (apenas criação) -->
        <div v-if="!usuario">
          <label class="block text-sm font-medium text-text-primary mb-2">
            Senha Inicial * <span class="text-xs text-text-secondary">(mínimo 6 caracteres)</span>
          </label>
          <input
            v-model="form.senha"
            type="password"
            required
            minlength="6"
            class="input-field w-full"
            placeholder="••••••••"
          />
        </div>

        <!-- Role e Unidade -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Perfil de Acesso *
            </label>
            <select v-model="form.role" required class="input-field w-full">
              <option value="">Selecione...</option>
              <option value="ADMIN">Administrador</option>
              <option value="GERENTE">Gerente</option>
              <option value="ATENDENTE">Atendente</option>
              <option value="COZINHA">Cozinha</option>
            </select>
            <p class="text-xs text-text-secondary mt-1">
              {{ getRoleDescription(form.role) }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-2">
              Unidade <span class="text-xs text-text-secondary">(opcional para ADMIN)</span>
            </label>
            <select v-model="form.unidadeId" class="input-field w-full">
              <option value="">Nenhuma</option>
              <option v-for="unidade in unidades" :key="unidade.id" :value="unidade.id">
                {{ unidade.nome }}
              </option>
            </select>
          </div>
        </div>

        <!-- Permissões (informativo) -->
        <div v-if="form.role" class="bg-info/5 border border-info/20 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-info mb-2">Permissões do Perfil</h4>
          <ul class="text-sm text-text-secondary space-y-1">
            <li v-for="permissao in getPermissoes(form.role)" :key="permissao" class="flex items-start gap-2">
              <svg class="w-4 h-4 text-success mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              <span>{{ permissao }}</span>
            </li>
          </ul>
        </div>

        <!-- Erro -->
        <div v-if="erro" class="bg-error/10 border border-error text-error rounded-lg p-3 text-sm">
          {{ erro }}
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            @click="$emit('close')"
            class="px-6 py-2 border border-border rounded-lg text-text-primary hover:bg-background transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary px-6 py-2"
            :class="{ 'opacity-60 cursor-not-allowed': loading }"
          >
            <span v-if="loading">Salvando...</span>
            <span v-else>{{ usuario ? 'Atualizar' : 'Criar Usuário' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import usuariosService from '@/services/usuariosService'
import unidadesConsumoService from '@/services/unidadesConsumoService'

const props = defineProps({
  usuario: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'sucesso'])

// Estado
const form = ref({
  nome: '',
  telefone: '',
  email: '',
  senha: '',
  role: '',
  unidadeId: ''
})

const unidades = ref([])
const loading = ref(false)
const erro = ref('')

// Carregar unidades
const carregarUnidades = async () => {
  try {
    unidades.value = await unidadesConsumoService.listar()
  } catch (error) {
    console.error('[ModalUsuario] Erro ao carregar unidades:', error)
  }
}

// Preencher form no modo edição
if (props.usuario) {
  form.value = {
    nome: props.usuario.nome || '',
    telefone: props.usuario.telefone || '',
    email: props.usuario.email || '',
    senha: '',
    role: props.usuario.role || '',
    unidadeId: props.usuario.unidadeId || ''
  }
}

// Salvar
const salvar = async () => {
  try {
    loading.value = true
    erro.value = ''

    if (props.usuario) {
      // Editar
      await usuariosService.atualizar(props.usuario.id, {
        nome: form.value.nome,
        email: form.value.email || null,
        role: form.value.role,
        unidadeId: form.value.unidadeId || null
      })
    } else {
      // Criar
      await usuariosService.criar(form.value)
    }

    emit('sucesso')
  } catch (error) {
    console.error('[ModalUsuario] Erro ao salvar:', error)
    erro.value = error.message || 'Erro ao salvar usuário. Tente novamente.'
  } finally {
    loading.value = false
  }
}

// Utilitários
const getRoleDescription = (role) => {
  const descriptions = {
    ADMIN: 'Acesso total ao sistema',
    GERENTE: 'Gestão operacional da unidade',
    ATENDENTE: 'Atendimento e pedidos',
    COZINHA: 'Preparação de pedidos'
  }
  return descriptions[role] || ''
}

const getPermissoes = (role) => {
  const permissoes = {
    ADMIN: [
      'Gerenciar usuários',
      'Configurar sistema',
      'Visualizar auditoria',
      'Acessar relatórios financeiros',
      'Todas as operações'
    ],
    GERENTE: [
      'Gestão de pedidos',
      'Gestão de produtos',
      'Gestão de mesas',
      'Fundos de consumo',
      'Relatórios operacionais'
    ],
    ATENDENTE: [
      'Criar pedidos',
      'Gerenciar mesas',
      'Visualizar produtos',
      'Fundos de consumo'
    ],
    COZINHA: [
      'Visualizar pedidos',
      'Atualizar status de preparação',
      'Marcar como pronto',
      'Visualizar itens do pedido'
    ]
  }
  return permissoes[role] || []
}

// Inicialização
onMounted(() => {
  carregarUnidades()
})
</script>
