# Documentação Técnica - Painel Administrativo

## 🏗️ Arquitetura

### Princípios de Design

1. **Separação de Responsabilidades**
   - Components: UI pura, sem lógica de negócio
   - Services: Integração com API
   - Stores: Estado global da aplicação
   - Modules: Organização por domínio

2. **Arquitetura Modular**
   - Cada módulo é independente
   - Facilita manutenção e escalabilidade
   - Permite desenvolvimento paralelo

3. **Single Source of Truth**
   - Estado centralizado no Pinia
   - Dados sempre sincronizados

## 🔧 Componentes de Layout

### AdminLayout
Wrapper principal que contém:
- Sidebar (fixa à esquerda)
- Topbar (fixa no topo)
- Área de conteúdo com `<router-view />`

### Sidebar
- Menu de navegação com ícones
- Estado ativo baseado na rota atual
- Recolhível (preparado para toggle)
- Estrutura pronta para controle de permissões

### Topbar
- Informações do usuário logado
- Contexto da unidade/empresa
- Menu dropdown (placeholder)

## 🗂️ Sistema de Módulos

Cada módulo segue a estrutura:
```
modules/
└── nome-modulo/
    ├── NomeModuloView.vue    # View principal
    ├── components/            # Componentes específicos (futuro)
    └── composables/           # Lógica reutilizável (futuro)
```

### Módulos Implementados

1. **Dashboard** - Visão geral com KPIs
2. **Pedidos** - Gestão completa de pedidos
3. **Produtos** - Catálogo e estoque
4. **Mesas** - Status e ocupação
5. **Fundos** - Fundos de consumo
6. **Usuários** - Gestão de acesso
7. **Auditoria** - Registro de operações

## 🔄 Fluxo de Dados

```
Component → Store (Pinia) → Service (Axios) → API
                ↓
          State Update
                ↓
          UI Reactivity
```

## 🎨 Sistema de Estilos

### Tailwind CSS
Classes utilitárias com tema customizado no `tailwind.config.js`

### Classes Personalizadas (src/assets/styles.css)
- `.btn-primary` - Botão primário
- `.btn-secondary` - Botão secundário
- `.card` - Card padrão
- `.input-field` - Campo de entrada
- `.badge-*` - Badges de status

### Convenções
- Usar classes Tailwind sempre que possível
- Classes customizadas apenas para padrões repetidos
- Evitar CSS inline

## 🛣️ Roteamento

### Estrutura
- Rotas aninhadas sob `/admin`
- Lazy loading de componentes
- Meta tags para título e autenticação

### Guards
Navigation guard configurado em `router/index.js`:
- Verifica autenticação
- Redireciona para login se necessário
- Preparado para validação de permissões

## 💾 Gestão de Estado (Pinia)

### Store de Autenticação (store/auth.js)

**Estado:**
- `user` - Dados do usuário
- `isAuthenticated` - Status de autenticação
- `token` - Token JWT

**Getters:**
- `userInitials` - Iniciais do nome
- `hasPermission()` - Verifica permissão específica

**Actions:**
- `login()` - Autenticação
- `logout()` - Logout
- `updateUser()` - Atualiza dados
- `checkAuth()` - Valida sessão

### Expandindo Stores

Para criar nova store:
```javascript
// store/nome.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNomeStore = defineStore('nome', () => {
  const estado = ref(null)
  
  const action = async () => {
    // lógica
  }
  
  return { estado, action }
})
```

## 🌐 Serviços de API

### Estrutura (services/api.js)

**Instância Axios:**
- Base URL configurável
- Timeout de 30s
- Headers padrão

**Interceptors:**
- Request: Adiciona token automaticamente
- Response: Trata erros globalmente

### Serviços por Módulo

Cada domínio tem seu service:
- `authService`
- `pedidosService`
- `produtosService`
- `mesasService`
- `fundosService`
- `usuariosService`
- `auditoriaService`
- `dashboardService`

### Uso nos Componentes

```javascript
import { pedidosService } from '@/services/api'

const carregarPedidos = async () => {
  try {
    const { data } = await pedidosService.getAll()
    pedidos.value = data
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error)
  }
}
```

## 🔐 Sistema de Permissões

### Preparação Atual
- Store `auth.js` contém array de permissões
- Método `hasPermission()` disponível
- Estrutura pronta para integração

### Implementação Futura

**No componente:**
```javascript
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const canEdit = authStore.hasPermission('pedidos.edit')
```

**No template:**
```vue
<button v-if="authStore.hasPermission('pedidos.create')">
  + Novo Pedido
</button>
```

## 🎯 Boas Práticas

### Componentes
- Manter componentes pequenos e focados
- Props tipadas com PropTypes
- Emits documentados
- Comentários claros

### Estado
- Sempre usar Pinia para estado compartilhado
- Evitar prop drilling
- Estado local com `ref` ou `reactive`

### API
- Nunca fazer chamadas diretas de componentes
- Sempre usar serviços
- Tratamento de erros consistente
- Loading states

### Estilo
- Mobile-first
- Acessibilidade (ARIA labels)
- Semântica HTML
- Performance (lazy loading)

## 📱 Responsividade

### Breakpoints Tailwind
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Padrão
- Design mobile-first
- Grid adaptativo
- Sidebar recolhível em mobile
- Tabelas com scroll horizontal

## 🚀 Performance

### Otimizações Implementadas
- Lazy loading de rotas
- Code splitting por módulo
- Assets otimizados com Vite

### Próximas Otimizações
- Virtual scrolling para listas grandes
- Debounce em buscas
- Cache de requests
- Service Worker / PWA

## 🧪 Testes (Roadmap)

### Planejamento
- Unit tests com Vitest
- Component tests com Testing Library
- E2E tests com Cypress

## 📚 Recursos Úteis

- [Vue 3 Docs](https://vuejs.org/)
- [Pinia Docs](https://pinia.vuejs.org/)
- [Vue Router Docs](https://router.vuejs.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Axios Docs](https://axios-http.com/)

## 🆘 Troubleshooting

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: Port already in use
```bash
# Alterar porta no vite.config.js
server: { port: 3002 }
```

### Erro: API não responde
- Verificar `.env` com `VITE_API_URL` correto
- Confirmar que backend está rodando
- Verificar CORS no backend
