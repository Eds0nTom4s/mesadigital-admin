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
        component: () => import('@/modules/pedidos/PedidosView.vue'),
        meta: {
          title: 'Gestão de Pedidos',
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
        component: () => import('@/modules/mesas/MesasView.vue'),
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

// Navigation guard para autenticação (placeholder)
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // TODO: Implementar verificação real de autenticação
  const isAuthenticated = true // Mock
  
  if (requiresAuth && !isAuthenticated) {
    // Redirecionar para login quando implementado
    next('/login')
  } else {
    next()
  }
})

export default router
