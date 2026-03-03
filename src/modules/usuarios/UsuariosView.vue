<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Usuários</h2>
        <p class="text-text-secondary mt-1">Controle de acesso e permissões do sistema</p>
      </div>
      <button 
        @click="abrirModalCriar"
        class="btn-primary flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Adicionar Usuário
      </button>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div class="flex space-x-2">
          <select 
            v-model="filtroRole" 
            @change="carregarUsuarios"
            class="input-field w-48"
          >
            <option value="">Todos os Perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="GERENTE">Gerente</option>
            <option value="ATENDENTE">Atendente</option>
            <option value="COZINHA">Cozinha</option>
          </select>
          <select 
            v-model="filtroAtivo" 
            @change="carregarUsuarios"
            class="input-field w-48"
          >
            <option value="">Todos os Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>
        <input 
          v-model="buscaTexto"
          @input="debounceCarregar"
          type="text" 
          placeholder="Buscar por nome, email ou telefone..." 
          class="input-field w-64" 
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 rounded"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="usuarios.length === 0" class="text-center py-16">
        <div class="text-text-secondary">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          <p class="text-lg mb-2">Nenhum usuário encontrado</p>
          <p class="text-sm">Ajuste os filtros ou adicione um novo usuário</p>
        </div>
      </div>

      <!-- Tabela -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Nome</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Contato</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Perfil</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Unidade</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Último Acesso</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id" 
                class="border-b border-border hover:bg-background transition-colors">
              <td class="py-4 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-semibold">{{ getInitials(usuario.nome) }}</span>
                  </div>
                  <span class="text-sm font-medium text-text-primary">{{ usuario.nome }}</span>
                </div>
              </td>
              <td class="py-4 px-4">
                <div class="text-sm">
                  <div class="text-text-primary">{{ usuario.telefone }}</div>
                  <div class="text-text-secondary">{{ usuario.email || 'Sem email' }}</div>
                </div>
              </td>
              <td class="py-4 px-4">
                <span :class="getRoleBadge(usuario.role)" class="text-xs px-3 py-1 rounded-full font-medium">
                  {{ getRoleLabel(usuario.role) }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-text-secondary">{{ usuario.unidadeNome || '-' }}</td>
              <td class="py-4 px-4">
                <span :class="usuario.ativo ? 'badge-success' : 'badge-error'" class="text-xs">
                  {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-text-secondary">
                {{ formatarDataHora(usuario.ultimoAcesso) }}
              </td>
              <td class="py-4 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="abrirModalEditar(usuario)"
                    class="text-info hover:text-info/80 p-2"
                    title="Editar usuário"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button 
                    @click="abrirModalSenha(usuario)"
                    class="text-warning hover:text-warning/80 p-2"
                    title="Alterar senha"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                    </svg>
                  </button>
                  <button 
                    v-if="usuario.ativo"
                    @click="confirmarDesativar(usuario)"
                    class="text-error hover:text-error/80 p-2"
                    title="Desativar usuário"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                  </button>
                  <button 
                    v-else
                    @click="ativarUsuario(usuario.id)"
                    class="text-success hover:text-success/80 p-2"
                    title="Ativar usuário"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Criar/Editar -->
    <ModalUsuario
      v-if="modalAberto"
      :usuario="usuarioSelecionado"
      @close="fecharModal"
      @sucesso="handleSucesso"
    />

    <!-- Modal Alterar Senha -->
    <ModalAlterarSenha
      v-if="modalSenhaAberto"
      :usuario="usuarioSelecionado"
      @close="modalSenhaAberto = false"
      @sucesso="handleSenhaAlterada"
    />

    <!-- Dialog de Confirmação -->
    <ConfirmDialog
      v-if="dialogConfirmacao"
      :titulo="'Desativar Usuário'"
      :mensagem="`Tem certeza que deseja desativar ${usuarioSelecionado?.nome}? O usuário não poderá mais acessar o sistema.`"
      @confirmar="desativarUsuario"
      @cancelar="dialogConfirmacao = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/store/notifications'
import usuariosService from '@/services/usuariosService'
import ModalUsuario from '@/components/usuarios/ModalUsuario.vue'
import ModalAlterarSenha from '@/components/usuarios/ModalAlterarSenha.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const notificationStore = useNotificationStore()

// Estado
const usuarios = ref([])
const loading = ref(false)
const filtroRole = ref('')
const filtroAtivo = ref('')
const buscaTexto = ref('')

// Modais
const modalAberto = ref(false)
const modalSenhaAberto = ref(false)
const usuarioSelecionado = ref(null)
const dialogConfirmacao = ref(false)

let debounceTimer = null

// Carregar usuários
const carregarUsuarios = async () => {
  try {
    loading.value = true
    
    const params = {}
    if (filtroRole.value) params.role = filtroRole.value
    if (filtroAtivo.value) params.ativo = filtroAtivo.value === 'true'
    if (buscaTexto.value) params.busca = buscaTexto.value
    
    usuarios.value = await usuariosService.listar(params)
  } catch (error) {
    console.error('[UsuariosView] Erro ao carregar usuários:', error)
    if (error?.stack) console.error(error.stack)
    const mensagem = error.mensagemAmigavel || error.response?.data?.message || error.message
    notificationStore.erro(mensagem || 'Erro ao carregar usuários. Tente novamente.')
  } finally {
    loading.value = false
  }
}

const debounceCarregar = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    carregarUsuarios()
  }, 500)
}

// Ações de Modal
const abrirModalCriar = () => {
  usuarioSelecionado.value = null
  modalAberto.value = true
}

const abrirModalEditar = (usuario) => {
  usuarioSelecionado.value = usuario
  modalAberto.value = true
}

const abrirModalSenha = (usuario) => {
  usuarioSelecionado.value = usuario
  modalSenhaAberto.value = true
}

const fecharModal = () => {
  modalAberto.value = false
  usuarioSelecionado.value = null
}

const handleSucesso = () => {
  fecharModal()
  carregarUsuarios()
  notificationStore.sucesso('Usuário salvo com sucesso!')
}

const handleSenhaAlterada = () => {
  modalSenhaAberto.value = false
  notificationStore.sucesso('Senha alterada com sucesso!')
}

// Ativar/Desativar
const confirmarDesativar = (usuario) => {
  usuarioSelecionado.value = usuario
  dialogConfirmacao.value = true
}

const desativarUsuario = async () => {
  try {
    await usuariosService.desativar(usuarioSelecionado.value.id)
    dialogConfirmacao.value = false
    carregarUsuarios()
    notificationStore.sucesso('Usuário desativado com sucesso!')
  } catch (error) {
    console.error('[UsuariosView] Erro ao desativar:', error)
    notificationStore.erro(error.message || 'Erro ao desativar usuário')
  }
}

const ativarUsuario = async (id) => {
  try {
    await usuariosService.ativar(id)
    carregarUsuarios()
    notificationStore.sucesso('Usuário ativado com sucesso!')
  } catch (error) {
    console.error('[UsuariosView] Erro ao ativar:', error)
    notificationStore.erro(error.message || 'Erro ao ativar usuário')
  }
}

// Utilitários
const getInitials = (nome) => {
  if (!nome) return '?'
  const partes = nome.split(' ')
  if (partes.length > 1) {
    return `${partes[0][0]}${partes[1][0]}`.toUpperCase()
  }
  return partes[0][0].toUpperCase()
}

const getRoleLabel = (role) => {
  const labels = {
    ADMIN: 'Administrador',
    GERENTE: 'Gerente',
    ATENDENTE: 'Atendente',
    COZINHA: 'Cozinha'
  }
  return labels[role] || role
}

const getRoleBadge = (role) => {
  const badges = {
    ADMIN: 'bg-error/10 text-error',
    GERENTE: 'bg-warning/10 text-warning',
    ATENDENTE: 'bg-info/10 text-info',
    COZINHA: 'bg-success/10 text-success'
  }
  return badges[role] || 'bg-gray-100 text-gray-600'
}

const formatarDataHora = (isoString) => {
  if (!isoString) return '-'
  const data = new Date(isoString)
  return data.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Inicialização
onMounted(() => {
  carregarUsuarios()
})
</script>
