import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import authService from '@/services/authService'

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
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/modules/dashboard/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
          requiresAuth: true
        }
      },
      {
        path: 'pedidos',
        name: 'Pedidos',
        component: () => import('@/modules/pedidos/PedidosBalcaoView.vue'),
        meta: {
          title: 'Gestão de Pedidos - Balcão',
          requiresAuth: true
        }
      },
      {
        path: 'produtos',
        name: 'Produtos',
        component: () => import('@/modules/produtos/ProdutosView.vue'),
        meta: {
          title: 'Gestão de Produtos',
          requiresAuth: true
        }
      },
      {
        path: 'mesas',
        name: 'Mesas',
        component: () => import('@/modules/mesas/GestaoMesasView.vue'),
        meta: {
          title: 'Gestão de Mesas',
          requiresAuth: true
        }
      },
      {
        path: 'fundos',
        name: 'Fundos',
        component: () => import('@/modules/fundos/FundosView.vue'),
        meta: {
          title: 'Fundos de Consumo',
          requiresAuth: true
        }
      },
      {
        path: 'fundos/:id',
        name: 'fundo-detalhe',
        component: () => import('@/modules/fundos/FundoDetalheView.vue'),
        meta: {
          title: 'Detalhes do Fundo',
          requiresAuth: true
        }
      },
      {
        path: 'estoque',
        name: 'Estoque',
        component: () => import('@/modules/estoque/EstoqueView.vue'),
        meta: {
          title: 'Gestão de Estoque',
          requiresAuth: true
        }
      },
      {
        path: 'configuracoes-financeiras',
        name: 'ConfiguracoesFinanceiras',
        component: () => import('@/modules/configuracoes/ConfiguracoesFinanceirasView.vue'),
        meta: {
          title: 'Configurações Financeiras',
          requiresAuth: true
        }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/modules/usuarios/UsuariosView.vue'),
        meta: {
          title: 'Gestão de Usuários',
          requiresAuth: true
        }
      },
      {
        path: 'configuracoes',
        name: 'Configuracoes',
        component: () => import('@/modules/configuracoes/ConfiguracoesView.vue'),
        meta: {
          title: 'Configurações do Sistema',
          requiresAuth: true
        }
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: () => import('@/modules/auditoria/AuditoriaView.vue'),
        meta: {
          title: 'Auditoria do Sistema',
          requiresAuth: true
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
  } else if (to.path === '/login') {
    // Já autenticado, evita acessar login novamente
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
