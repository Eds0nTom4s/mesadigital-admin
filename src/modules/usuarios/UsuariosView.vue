<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Gestão de Usuários</h2>
        <p class="text-text-secondary mt-1">Controle de acesso e permissões</p>
      </div>
      <button class="btn-primary">
        + Adicionar Usuário
      </button>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <div class="flex space-x-2">
          <select class="input-field w-48">
            <option>Todos os Perfis</option>
            <option>Administrador</option>
            <option>Gerente</option>
            <option>Operador</option>
          </select>
          <select class="input-field w-48">
            <option>Todos os Status</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
        <input type="text" placeholder="Buscar usuários..." class="input-field w-64" />
      </div>

      <div v-if="loading" class="animate-pulse space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 rounded"></div>
      </div>

      <div v-else-if="usuarios.length === 0" class="text-center py-12 text-text-secondary">
        Nenhum usuário encontrado
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-border">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Nome</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Email</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Perfil</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Unidade</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Último Acesso</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-text-secondary">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in usuarios" :key="usuario.id" 
                class="border-b border-border hover:bg-background">
              <td class="py-3 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">{{ getInitials(usuario.nome) }}</span>
                  </div>
                  <span class="text-sm font-medium text-text-primary">{{ usuario.nome }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-text-primary">{{ usuario.email }}</td>
              <td class="py-3 px-4"><span :class="getPerfilBadge(usuario.perfil)">{{ usuario.perfil }}</span></td>
              <td class="py-3 px-4 text-sm text-text-secondary">{{ usuario.unidade || '-' }}</td>
              <td class="py-3 px-4">
                <span :class="usuario.ativo ? 'badge-success' : 'badge-error'">
                  {{ usuario.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-text-secondary">{{ usuario.ultimoAcesso || '-' }}</td>
              <td class="py-3 px-4 text-right">
                <button class="text-primary hover:underline text-sm">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { usuariosService } from '@/services/api'

const usuarios = ref([])
const loading = ref(false)
const perfilFiltro = ref('TODOS')
const statusFiltro = ref('TODOS')
const buscaTexto = ref('')

const carregarUsuarios = async () => {
  try {
    loading.value = true
    const params = {}
    if (perfilFiltro.value !== 'TODOS') {
      params.perfil = perfilFiltro.value
    }
    if (statusFiltro.value !== 'TODOS') {
      params.status = statusFiltro.value
    }
    if (buscaTexto.value) {
      params.busca = buscaTexto.value
    }
    
    const response = await usuariosService.getAll(params)
    usuarios.value = response.data
  } catch (error) {
    console.error('[UsuariosView] Erro ao carregar usuários:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregarUsuarios()
})

watch([perfilFiltro, statusFiltro, buscaTexto], () => {
  carregarUsuarios()
})

const getPerfilBadge = (perfil) => {
  const badges = {
    'ADMINISTRADOR': 'badge-error',
    'GERENTE': 'badge-info',
    'OPERADOR': 'badge-warning'
  }
  return badges[perfil] || 'badge-info'
}

const getInitials = (nome) => {
  const names = nome.split(' ')
  return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0]
}

/**
 * Usuários View - Módulo de gestão de usuários
 * 
 * Funcionalidades:
 * - Listagem de usuários
 * - Filtros por perfil e status
 * - Controle de permissões
 * - Gestão de acessos
 */
</script>
