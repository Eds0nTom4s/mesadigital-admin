import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'

/**
 * Configuração de rotas do painel administrativo
 * 
 * Todas as rotas administrativas estão sob o prefixo /admin
 * e utilizam o AdminLayout como wrapper
 */

const routes = [
  {
    path: '/',
    redirect: '/admin/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      title: 'Login',
      requiresAuth: false
    }
  },
  {
    path: '/admin',
    component: AdminLayout,
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'cozinha',
        name: 'Cozinha',
        component: () => import('@/modules/cozinha/CozinhaView.vue'),
        meta: {
          title: 'Fila da Cozinha',
          requiresAuth: true,
          roles: ['COZINHA', 'GERENTE', 'ADMIN']
        }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/modules/dashboard/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE', 'ATENDENTE']
        }
      },
      {
        path: 'pedidos',
        name: 'Pedidos',
        component: () => import('@/modules/pedidos/PedidosBalcaoView.vue'),
        meta: {
          title: 'Gestão de Pedidos - Balcão',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE', 'ATENDENTE']
        }
      },
      {
        path: 'produtos',
        name: 'Produtos',
        component: () => import('@/modules/produtos/ProdutosView.vue'),
        meta: {
          title: 'Gestão de Produtos',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE']
        }
      },
      {
        path: 'mesas',
        name: 'Mesas',
        component: () => import('@/modules/mesas/GestaoMesasView.vue'),
        meta: {
          title: 'Gestão de Mesas',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'fundos',
        name: 'Fundos',
        component: () => import('@/modules/fundos/FundosView.vue'),
        meta: {
          title: 'Fundos de Consumo',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE', 'ATENDENTE']
        }
      },
      {
        path: 'fundos/:id',
        name: 'fundo-detalhe',
        component: () => import('@/modules/fundos/FundoDetalheView.vue'),
        meta: {
          title: 'Detalhes do Fundo',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE', 'ATENDENTE']
        }
      },
      {
        path: 'estoque',
        name: 'Estoque',
        component: () => import('@/modules/estoque/EstoqueView.vue'),
        meta: {
          title: 'Gestão de Estoque',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE']
        }
      },
      {
        path: 'configuracoes-financeiras',
        name: 'ConfiguracoesFinanceiras',
        component: () => import('@/modules/configuracoes/ConfiguracoesFinanceirasView.vue'),
        meta: {
          title: 'Configurações Financeiras',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/modules/usuarios/UsuariosView.vue'),
        meta: {
          title: 'Gestão de Usuários',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      },
      {
        path: 'configuracoes',
        name: 'Configuracoes',
        component: () => import('@/modules/configuracoes/ConfiguracoesView.vue'),
        meta: {
          title: 'Configurações do Sistema',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE']
        }
      },
      {
        path: 'configuracoes/unidades-atendimento',
        name: 'UnidadesAtendimento',
        component: () => import('@/modules/configuracoes/UnidadesAtendimentoView.vue'),
        meta: {
          title: 'Unidades de Atendimento',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE']
        }
      },
      {
        path: 'configuracoes/unidades-producao',
        name: 'UnidadesProducao',
        component: () => import('@/modules/configuracoes/UnidadesProducaoView.vue'),
        meta: {
          title: 'Unidades de Produção',
          requiresAuth: true,
          roles: ['ADMIN', 'GERENTE']
        }
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: () => import('@/modules/auditoria/AuditoriaView.vue'),
        meta: {
          title: 'Auditoria do Sistema',
          requiresAuth: true,
          roles: ['ADMIN']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard para autenticação
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (!requiresAuth) {
    // Rota pública, permite acesso direto
    next()
    return
  }
  
  // Importar store dinâmico (aguarda Pinia estar pronto)
  const { useAuthStore } = await import('@/store/auth')
  const authStore = useAuthStore()
  
  // Verificar autenticação completa (valida expiração do token)
  const isAuthenticated = await authStore.checkAuth()
  
  if (!isAuthenticated) {
    // Token inválido ou expirado - redireciona para login
    console.warn('[Router] Sessão expirada - redirecionando para login')
    next('/login')
  } else {
    const userRoles = authStore.user?.roles || []
    const userRoleNames = userRoles.map(role => role.replace('ROLE_', ''))
    const allowedRoles = to.matched
      .flatMap(record => record.meta.roles || [])
      .filter(Boolean)

    if (allowedRoles.length > 0 && !allowedRoles.some(role => userRoleNames.includes(role))) {
      const fallback = userRoleNames.includes('COZINHA') ? '/admin/cozinha' : '/admin/dashboard'
      next(fallback)
      return
    }

    next()
  }
})

export default router
