# Guia de Testes End-to-End (E2E)
## Painel Administrativo - Fluxos Críticos

**Data:** 23 de Fevereiro de 2026  
**Versão:** 1.0.0  
**Framework Recomendado:** Cypress ou Playwright

---

## 📋 Índice

1. [Setup do Ambiente de Testes](#setup)
2. [Fluxo 1: Autenticação](#fluxo-1-autenticacao)
3. [Fluxo 2: Gestão de Pedidos](#fluxo-2-gestao-de-pedidos)
4. [Fluxo 3: Fundos de Consumo](#fluxo-3-fundos-de-consumo)
5. [Fluxo 4: WebSocket em Tempo Real](#fluxo-4-websocket-em-tempo-real)
6. [Fluxo 5: Gestão de Usuários](#fluxo-5-gestao-de-usuarios)
7. [Fluxo 6: Auditoria](#fluxo-6-auditoria)
8. [Cenários de Erro](#cenarios-de-erro)

---

## Setup do Ambiente de Testes {#setup}

### Instalação (Cypress)

```bash
npm install --save-dev cypress @testing-library/cypress

# Configurar Cypress
npx cypress open
```

### Configuração `cypress.config.js`

```javascript
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    env: {
      apiUrl: 'http://localhost:8080/api',
      wsUrl: 'ws://localhost:8080/ws'
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  }
})
```

### Dados de Teste

```javascript
// cypress/fixtures/usuarios.json
{
  "admin": {
    "telefone": "+244900000001",
    "senha": "admin123"
  },
  "gerente": {
    "telefone": "+244900000002",
    "senha": "gerente123"
  },
  "atendente": {
    "telefone": "+244900000003",
    "senha": "atendente123"
  }
}
```

---

## Fluxo 1: Autenticação {#fluxo-1-autenticacao}

### Teste: Login com Sucesso

```javascript
describe('Autenticação', () => {
  it('Deve fazer login como ADMIN', () => {
    cy.visit('/login')
    
    // Preencher formulário
    cy.get('input[type="tel"]').type('+244900000001')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    // Verificar redirecionamento
    cy.url().should('include', '/admin/dashboard')
    
    // Verificar token no localStorage
    cy.window().its('localStorage.token').should('exist')
    
    // Verificar dados do usuário
    cy.contains('Admin').should('be.visible')
  })

  it('Deve rejeitar credenciais inválidas', () => {
    cy.visit('/login')
    
    cy.get('input[type="tel"]').type('+244900000000')
    cy.get('input[type="password"]').type('senhaerrada')
    cy.get('button[type="submit"]').click()
    
    // Verificar mensagem de erro
    cy.contains('Credenciais inválidas').should('be.visible')
    
    // Não deve redirecionar
    cy.url().should('include', '/login')
  })

  it('Deve fazer logout', () => {
    cy.login('admin') // Custom command
    
    cy.get('[data-cy="topbar-menu"]').click()
    cy.get('[data-cy="logout-button"]').click()
    
    // Verificar redirecionamento
    cy.url().should('include', '/login')
    
    // Token deve ser removido
    cy.window().its('localStorage.token').should('not.exist')
  })
})
```

---

## Fluxo 2: Gestão de Pedidos {#fluxo-2-gestao-de-pedidos}

### Teste: Criar Pedido com Fundo (PRE_PAGO)

```javascript
describe('Gestão de Pedidos', () => {
  beforeEach(() => {
    cy.login('gerente')
    cy.visit('/admin/pedidos')
  })

  it('Deve criar pedido PRE_PAGO com saldo suficiente', () => {
    // Selecionar unidade com fundo
    cy.get('[data-cy="card-unidade"]').first().click()
    
    // Verificar saldo do fundo
    cy.get('[data-cy="saldo-fundo"]').invoke('text').then((saldo) => {
      const saldoNumero = parseFloat(saldo.replace(/[^0-9,]/g, '').replace(',', '.'))
      expect(saldoNumero).to.be.greaterThan(0)
    })
    
    // Abrir modal de novo pedido
    cy.get('[data-cy="btn-novo-pedido"]').click()
    
    // Adicionar produtos
    cy.get('[data-cy="produto-item"]').first().click()
    cy.get('[data-cy="quantidade-input"]').clear().type('2')
    cy.get('[data-cy="btn-adicionar-produto"]').click()
    
    // Selecionar forma de pagamento PRE_PAGO
    cy.get('input[value="PRE_PAGO"]').check()
    
    // Confirmar pedido
    cy.get('[data-cy="btn-confirmar-pedido"]').click()
    
    // Verificar notificação de sucesso
    cy.contains('Pedido criado com sucesso').should('be.visible')
    
    // Verificar atualização do saldo
    cy.get('[data-cy="saldo-fundo"]').should('not.contain', saldo)
  })

  it('Deve bloquear pedido PRE_PAGO com saldo insuficiente', () => {
    // Simular unidade com saldo baixo
    cy.intercept('GET', '/api/unidades-consumo/*/fundo', {
      statusCode: 200,
      body: {
        data: {
          saldo: 500 // 5 AOA apenas
        }
      }
    })
    
    cy.reload()
    
    cy.get('[data-cy="card-unidade"]').first().click()
    cy.get('[data-cy="btn-novo-pedido"]').click()
    
    // Adicionar produto caro
    cy.get('[data-cy="produto-item"]').first().click()
    cy.get('[data-cy="quantidade-input"]').clear().type('10')
    cy.get('[data-cy="btn-adicionar-produto"]').click()
    
    cy.get('input[value="PRE_PAGO"]').check()
    cy.get('[data-cy="btn-confirmar-pedido"]').click()
    
    // Verificar mensagem de erro
    cy.contains('Saldo insuficiente').should('be.visible')
  })

  it('Deve criar pedido POS_PAGO (apenas GERENTE/ADMIN)', () => {
    cy.get('[data-cy="card-unidade"]').first().click()
    cy.get('[data-cy="btn-novo-pedido"]').click()
    
    cy.get('[data-cy="produto-item"]').first().click()
    cy.get('[data-cy="btn-adicionar-produto"]').click()
    
    // POS_PAGO deve estar disponível
    cy.get('input[value="POS_PAGO"]').should('exist').check()
    
    cy.get('[data-cy="btn-confirmar-pedido"]').click()
    
    cy.contains('Pedido criado com sucesso').should('be.visible')
  })
})
```

---

## Fluxo 3: Fundos de Consumo {#fluxo-3-fundos-de-consumo}

### Teste: Criar e Recarregar Fundo

```javascript
describe('Fundos de Consumo', () => {
  beforeEach(() => {
    cy.login('gerente')
    cy.visit('/admin/fundos')
  })

  it('Deve criar novo fundo para cliente', () => {
    cy.get('[data-cy="btn-criar-fundo"]').click()
    
    // Preencher dados do cliente
    cy.get('input[name="nomeCliente"]').type('João Silva')
    cy.get('input[name="telefoneCliente"]').type('+244900123456')
    cy.get('input[name="valorInicial"]').type('10000') // 100 AOA
    
    cy.get('[data-cy="btn-confirmar-criar-fundo"]').click()
    
    // Verificar notificação
    cy.contains('Fundo criado com sucesso').should('be.visible')
    
    // Verificar na listagem
    cy.contains('João Silva').should('be.visible')
    cy.contains('100,00 AOA').should('be.visible')
  })

  it('Deve recarregar fundo existente', () => {
    // Selecionar fundo
    cy.get('[data-cy="card-fundo"]').first().click()
    
    // Abrir modal de recarga
    cy.get('[data-cy="btn-recarregar"]').click()
    
    cy.get('input[name="valorRecarga"]').type('5000') // 50 AOA
    cy.get('[data-cy="btn-confirmar-recarga"]').click()
    
    cy.contains('Recarga realizada com sucesso').should('be.visible')
    
    // Verificar atualização do saldo
    cy.get('[data-cy="saldo-atual"]').should('contain', '+50,00')
  })

  it('Deve validar valor mínimo ao criar fundo', () => {
    cy.get('[data-cy="btn-criar-fundo"]').click()
    
    cy.get('input[name="nomeCliente"]').type('Teste')
    cy.get('input[name="telefoneCliente"]').type('+244900000000')
    cy.get('input[name="valorInicial"]').type('100') // 1 AOA (abaixo do mínimo)
    
    cy.get('[data-cy="btn-confirmar-criar-fundo"]').click()
    
    cy.contains('Valor mínimo não atingido').should('be.visible')
  })
})
```

---

## Fluxo 4: WebSocket em Tempo Real {#fluxo-4-websocket-em-tempo-real}

### Teste: Notificação de SubPedido Pronto

```javascript
describe('WebSocket Tempo Real', () => {
  it('Deve receber notificação quando SubPedido fica PRONTO', () => {
    cy.login('atendente')
    cy.visit('/admin/pedidos')
    
    // Verificar status de conexão WebSocket
    cy.get('[data-cy="ws-status"]').should('have.class', 'conectado')
    
    // Simular atualização do backend via WebSocket
    cy.window().then((win) => {
      const wsStore = win.$pinia.state.value.websocket
      
      // Emitir evento de SubPedido PRONTO
      wsStore.handleMessage({
        tipo: 'SUBPEDIDO_ATUALIZADO',
        dados: {
          subPedidoId: 123,
          status: 'PRONTO',
          cozinhaNome: 'Cozinha Principal'
        }
      })
    })
    
    // Verificar notificação visual
    cy.contains('SubPedido #123 está pronto').should('be.visible')
    
    // Verificar som (mock)
    cy.window().its('Audio').should('have.been.called')
  })

  it('Deve reconectar WebSocket após queda de conexão', () => {
    cy.login('gerente')
    cy.visit('/admin/dashboard')
    
    // Verificar conexão inicial
    cy.get('[data-cy="ws-status"]').should('have.class', 'conectado')
    
    // Simular queda de conexão
    cy.window().then((win) => {
      win.$pinia.state.value.websocket.desconectar()
    })
    
    cy.get('[data-cy="ws-status"]').should('have.class', 'reconectando')
    
    // Aguardar reconexão automática (max 10s)
    cy.get('[data-cy="ws-status"]', { timeout: 10000 })
      .should('have.class', 'conectado')
  })
})
```

---

## Fluxo 5: Gestão de Usuários {#fluxo-5-gestao-de-usuarios}

### Teste: CRUD de Usuários

```javascript
describe('Gestão de Usuários', () => {
  beforeEach(() => {
    cy.login('admin')
    cy.visit('/admin/usuarios')
  })

  it('Deve criar novo usuário ATENDENTE', () => {
    cy.get('[data-cy="btn-adicionar-usuario"]').click()
    
    cy.get('input[name="nome"]').type('Maria Santos')
    cy.get('input[name="telefone"]').type('+244900111222')
    cy.get('input[name="email"]').type('maria@exemplo.com')
    cy.get('input[name="senha"]').type('senha123')
    cy.get('select[name="role"]').select('ATENDENTE')
    
    cy.get('[data-cy="btn-salvar-usuario"]').click()
    
    cy.contains('Usuário criado com sucesso').should('be.visible')
    cy.contains('Maria Santos').should('be.visible')
  })

  it('Deve desativar usuário', () => {
    cy.contains('tr', 'João Teste')
      .find('[data-cy="btn-desativar"]')
      .click()
    
    cy.get('[data-cy="dialog-confirmar"]').within(() => {
      cy.contains('Tem certeza').should('be.visible')
      cy.get('[data-cy="btn-confirmar"]').click()
    })
    
    cy.contains('Usuário desativado com sucesso').should('be.visible')
    cy.contains('tr', 'João Teste').should('contain', 'Inativo')
  })

  it('Deve alterar senha de usuário', () => {
    cy.contains('tr', 'Maria Santos')
      .find('[data-cy="btn-alterar-senha"]')
      .click()
    
    cy.get('input[name="novaSenha"]').type('novaSenha456')
    cy.get('input[name="confirmarSenha"]').type('novaSenha456')
    cy.get('[data-cy="btn-salvar-senha"]').click()
    
    cy.contains('Senha alterada com sucesso').should('be.visible')
  })
})
```

---

## Fluxo 6: Auditoria {#fluxo-6-auditoria}

### Teste: Visualização de Logs

```javascript
describe('Auditoria', () => {
  beforeEach(() => {
    cy.login('admin')
    cy.visit('/admin/auditoria')
  })

  it('Deve listar logs com filtros', () => {
    // Aplicar filtro de módulo
    cy.get('select[name="modulo"]').select('PEDIDOS')
    
    // Verificar resultados filtrados
    cy.get('[data-cy="log-item"]').should('have.length.at.least', 1)
    cy.get('[data-cy="log-item"]').each(($log) => {
      cy.wrap($log).should('contain', 'PEDIDOS')
    })
    
    // Aplicar filtro de ação
    cy.get('select[name="acao"]').select('CRIAR')
    
    cy.get('[data-cy="log-item"]').should('contain', 'CRIAR')
  })

  it('Deve exportar logs para CSV', () => {
    cy.get('[data-cy="btn-exportar-csv"]').click()
    
    // Verificar download
    cy.readFile('cypress/downloads/auditoria_*.csv').should('exist')
  })

  it('Deve visualizar detalhes de um log', () => {
    cy.get('[data-cy="log-item"]').first().click()
    
    cy.get('[data-cy="modal-detalhes"]').should('be.visible')
    cy.get('[data-cy="modal-detalhes"]').within(() => {
      cy.contains('ID do Log').should('be.visible')
      cy.contains('Usuário').should('be.visible')
      cy.contains('Endereço IP').should('be.visible')
    })
  })
})
```

---

## Cenários de Erro {#cenarios-de-erro}

### Teste: Tratamento de Erros de Rede

```javascript
describe('Tratamento de Erros', () => {
  it('Deve exibir mensagem amigável para erro 500', () => {
    cy.intercept('GET', '/api/pedidos', {
      statusCode: 500,
      body: { message: 'Erro interno do servidor' }
    })
    
    cy.login('gerente')
    cy.visit('/admin/pedidos')
    
    cy.contains('Erro interno do servidor').should('be.visible')
    cy.contains('Nossa equipe foi notificada').should('be.visible')
  })

  it('Deve fazer retry automático em falha de rede', () => {
    let requestCount = 0
    
    cy.intercept('GET', '/api/dashboard/stats', (req) => {
      requestCount++
      if (requestCount < 3) {
        req.destroy() // Simular falha de rede
      } else {
        req.reply({ statusCode: 200, body: { data: {} } })
      }
    })
    
    cy.login('admin')
    cy.visit('/admin/dashboard')
    
    // Deve ter feito 3 tentativas
    cy.wrap(requestCount).should('equal', 3)
  })

  it('Deve redirecionar para login em erro 401', () => {
    cy.login('gerente')
    cy.visit('/admin/pedidos')
    
    // Simular token expirado
    cy.intercept('GET', '/api/pedidos', {
      statusCode: 401,
      body: { message: 'Token expirado' }
    })
    
    cy.reload()
    
    // Deve redirecionar para login
    cy.url({ timeout: 3000 }).should('include', '/login')
  })
})
```

---

## 🚀 Execução dos Testes

### Modo Interativo (UI)
```bash
npm run test:e2e
# ou
npx cypress open
```

### Modo Headless (CI/CD)
```bash
npm run test:e2e:ci
# ou
npx cypress run
```

### Executar teste específico
```bash
npx cypress run --spec "cypress/e2e/pedidos.cy.js"
```

---

## 📊 Cobertura de Testes Esperada

- **Autenticação:** 100%
- **Pedidos (PRE_PAGO):** 90%
- **Pedidos (POS_PAGO):** 85%
- **Fundos:** 95%
- **WebSocket:** 80%
- **Usuários:** 90%
- **Auditoria:** 85%
- **Tratamento de Erros:** 90%

---

## 🔧 Custom Commands (cypress/support/commands.js)

```javascript
// Login helper
Cypress.Commands.add('login', (role) => {
  cy.fixture('usuarios').then((usuarios) => {
    const user = usuarios[role]
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/admin/login`, {
      telefone: user.telefone,
      senha: user.senha
    }).then((response) => {
      window.localStorage.setItem('token', response.body.data.token)
      window.localStorage.setItem('user', JSON.stringify(response.body.data.usuario))
    })
  })
})

// Limpar dados de teste
Cypress.Commands.add('cleanDatabase', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`)
})
```

---

**Responsável:** Equipe de QA  
**Última atualização:** 23/02/2026
