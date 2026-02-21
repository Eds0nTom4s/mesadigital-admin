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
        path: 'unidades-consumo',
        name: 'UnidadesConsumo',
        component: () => import('@/modules/unidades-consumo/UnidadesConsumoView.vue'),
        meta: {
          title: 'Gestão de Unidades de Consumo',
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
        component: () => import('@/views/FundoDetalheView.vue'),
        meta: {
          title: 'Detalhes do Fundo',
          requiresAuth: true
        }
      },
      {
        path: 'estoque',
        name: 'Estoque',
        component: () => import('@/views/EstoqueView.vue'),
        meta: {
          title: 'Gestão de Estoque',
          requiresAuth: true
        }
      },
      {
        path: 'configuracoes-financeiras',
        name: 'ConfiguracoesFinanceiras',
        component: () => import('@/views/ConfiguracoesFinanceirasView.vue'),
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
  
  // Verificar token no localStorage
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  if (requiresAuth && !isAuthenticated) {
    // Redireciona para login se não autenticado
    console.warn('[Router] Acesso negado - redirecionando para login')
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // Se já autenticado e tenta acessar login, redireciona para dashboard
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
