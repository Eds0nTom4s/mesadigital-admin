// ***********************************************
// Custom Commands para Testes E2E
// ***********************************************

/**
 * Comando: cy.login
 * Faz login na aplicação e armazena o token
 */
Cypress.Commands.add('login', (role = 'ADMIN') => {
  const usuarios = {
    ADMIN: {
      telefone: '+244999999999',
      senha: 'senha123',
    },
    GERENTE: {
      telefone: '+244923000002',
      senha: 'senha123',
    },
    ATENDENTE: {
      telefone: '+244923000003',
      senha: 'senha123',
    },
    COZINHA: {
      telefone: '+244923000004',
      senha: 'senha123',
    },
  }

  const user = usuarios[role]
  
  cy.visit('/login')
  cy.get('[data-cy="input-telefone"]').type(user.telefone)
  cy.get('[data-cy="input-senha"]').type(user.senha)
  cy.get('[data-cy="btn-entrar"]').click()
  
  // Aguardar redirecionamento
  cy.url().should('not.include', '/login')
  cy.url().should('include', '/admin')
  
  // Verificar que o token foi salvo
  cy.window().then((win) => {
    expect(win.localStorage.getItem('token')).to.exist
  })
})

/**
 * Comando: cy.logout
 * Faz logout da aplicação
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="btn-perfil"]').click()
  cy.get('[data-cy="btn-sair"]').click()
  cy.url().should('include', '/login')
})

/**
 * Comando: cy.cleanDatabase
 * Limpa dados de teste do banco (via API)
 */
Cypress.Commands.add('cleanDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/clean-database`,
    failOnStatusCode: false,
  })
})

/**
 * Comando: cy.seedDatabase
 * Popula banco com dados de teste
 */
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed-database`,
    failOnStatusCode: false,
  })
})

/**
 * Comando: cy.getByDataCy
 * Atalho para selecionar elementos por data-cy
 */
Cypress.Commands.add('getByDataCy', (selector) => {
  return cy.get(`[data-cy="${selector}"]`)
})

/**
 * Comando: cy.checkToast
 * Verifica se um toast foi exibido
 */
Cypress.Commands.add('checkToast', (message, type = 'success') => {
  cy.get('.toast')
    .should('be.visible')
    .and('contain', message)
    .and('have.class', `toast-${type}`)
})

/**
 * Comando: cy.waitForWebSocket
 * Aguarda conexão WebSocket ser estabelecida
 */
Cypress.Commands.add('waitForWebSocket', () => {
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const checkConnection = () => {
        const wsStore = win.$pinia?.state.value.websocket
        if (wsStore?.connected) {
          resolve()
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      checkConnection()
    })
  })
})

/**
 * Comando: cy.interceptAPI
 * Intercepta chamadas à API com resposta customizada
 */
Cypress.Commands.add('interceptAPI', (method, path, response, statusCode = 200) => {
  cy.intercept(method, `${Cypress.env('apiUrl')}${path}`, {
    statusCode,
    body: response,
  }).as(`api${method}${path.replace(/\//g, '-')}`)
})

/**
 * Comando: cy.fillForm
 * Preenche formulário automaticamente
 */
Cypress.Commands.add('fillForm', (fields) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) {
        cy.getByDataCy(`input-${key}`).check()
      }
    } else {
      cy.getByDataCy(`input-${key}`).clear().type(value)
    }
  })
})

/**
 * Comando: cy.checkTableRow
 * Verifica conteúdo de uma linha de tabela
 */
Cypress.Commands.add('checkTableRow', (rowIndex, expectedData) => {
  cy.get('table tbody tr')
    .eq(rowIndex)
    .within(() => {
      Object.values(expectedData).forEach((value, index) => {
        cy.get('td').eq(index).should('contain', value)
      })
    })
})
