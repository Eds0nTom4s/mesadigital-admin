# Painel Administrativo - Sistema de Gestão de Consumo

## 📋 Descrição

Painel administrativo para gestão de restaurantes, bares, discotecas e cafés. Sistema robusto e escalável construído com Vue 3, focado em operações financeiras e operacionais sensíveis.

## 🚀 Stack Tecnológica

- **Vue 3** - Framework JavaScript progressivo
- **Composition API** - Padrão moderno de componentes Vue
- **Vue Router** - Roteamento oficial do Vue
- **Pinia** - Gestão de estado oficial do Vue
- **Axios** - Cliente HTTP para integração com API
- **Tailwind CSS** - Framework CSS utilitário
- **Vite** - Build tool rápida e moderna

## 📁 Estrutura do Projeto

```
src/
├── assets/              # Recursos estáticos (CSS, imagens)
├── components/          # Componentes Vue
│   ├── layout/          # Componentes de layout (Sidebar, Topbar)
│   ├── ui/              # Componentes de UI reutilizáveis
│   └── shared/          # Componentes compartilhados
├── modules/             # Módulos por domínio
│   ├── dashboard/       # Visão geral do sistema
│   ├── pedidos/         # Gestão de pedidos
│   ├── produtos/        # Catálogo de produtos
│   ├── mesas/           # Gestão de mesas
│   ├── fundos/          # Fundos de consumo
│   ├── usuarios/        # Gestão de usuários
│   └── auditoria/       # Auditoria do sistema
├── router/              # Configuração de rotas
├── store/               # Stores Pinia
├── services/            # Camada de integração com API
└── views/               # Views principais
```

## 🎨 Identidade Visual

### Cores Principais
- **Primária (ações)**: `#F2994A`
- **Fundo**: `#F7F7F7`
- **Card**: `#FFFFFF`
- **Texto principal**: `#333333`
- **Texto secundário**: `#555555`
- **Bordas**: `#E0E0E0`

### Estados
- **Sucesso**: `#27AE60`
- **Alerta**: `#F2C94C`
- **Erro**: `#EB5757`
- **Info**: `#2F80ED`

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
```

3. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

O painel estará disponível em `http://localhost:3001`

## 📦 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Gera build de produção
npm run preview  # Preview da build de produção
```

## 🔐 Autenticação

O sistema utiliza autenticação via token JWT. Atualmente configurado com dados mock para desenvolvimento.

Para integrar com backend real:
1. Configurar `VITE_API_URL` no `.env`
2. Implementar lógica real em `src/store/auth.js`
3. Ajustar serviços em `src/services/api.js`

## 🗺️ Rotas Principais

- `/admin/dashboard` - Dashboard principal
- `/admin/pedidos` - Gestão de pedidos
- `/admin/produtos` - Gestão de produtos
- `/admin/mesas` - Gestão de mesas
- `/admin/fundos` - Fundos de consumo
- `/admin/usuarios` - Gestão de usuários
- `/admin/auditoria` - Auditoria do sistema

## 🧩 Módulos

Cada módulo é independente e contém suas próprias views, componentes e lógica. Estrutura modular facilita manutenção e escalabilidade.

## 🔒 Permissões

O sistema possui controle de permissões baseado em roles. Implementação preparada na store de autenticação (`src/store/auth.js`).

## 📱 Responsividade

Layout totalmente responsivo com:
- Sidebar recolhível
- Grid adaptativo
- Design mobile-first

## 🎯 Próximos Passos

- [ ] Integração real com backend
- [ ] Implementação de testes
- [ ] Sistema de notificações em tempo real
- [ ] Relatórios e analytics avançados
- [ ] Modo escuro
- [ ] Internacionalização (i18n)

## 👥 Equipe

Desenvolvido por CentralTec para Eng. Margarida

## 📄 Licença

Propriedade privada - Todos os direitos reservados
