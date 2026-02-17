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

      <div class="overflow-x-auto">
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
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">MS</span>
                  </div>
                  <span class="text-sm font-medium text-text-primary">Margarida Silva</span>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-text-primary">margarida@centraltec.com</td>
              <td class="py-3 px-4"><span class="badge-error">Administrador</span></td>
              <td class="py-3 px-4 text-sm text-text-secondary">Unidade Principal</td>
              <td class="py-3 px-4"><span class="badge-success">Ativo</span></td>
              <td class="py-3 px-4 text-sm text-text-secondary">Agora</td>
              <td class="py-3 px-4 text-right">
                <button class="text-primary hover:underline text-sm">Editar</button>
              </td>
            </tr>
            <tr class="border-b border-border hover:bg-background">
              <td class="py-3 px-4">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 bg-info rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-medium">JS</span>
                  </div>
                  <span class="text-sm font-medium text-text-primary">João Santos</span>
                </div>
              </td>
              <td class="py-3 px-4 text-sm text-text-primary">joao@centraltec.com</td>
              <td class="py-3 px-4"><span class="badge-info">Gerente</span></td>
              <td class="py-3 px-4 text-sm text-text-secondary">Unidade Principal</td>
              <td class="py-3 px-4"><span class="badge-success">Ativo</span></td>
              <td class="py-3 px-4 text-sm text-text-secondary">Há 2 horas</td>
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
/**
 * Usuários View - Módulo de gestão de usuários
 * 
 * Funcionalidades (placeholder):
 * - Listagem de usuários
 * - Filtros por perfil e status
 * - Controle de permissões
 * - Gestão de acessos
 */
</script>
