// ***********************************************************
// Configuração global dos testes E2E
// ***********************************************************

// Importar comandos customizados
import './commands'

// Configurar comportamento global
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevenir falha de teste em erros não críticos
  if (err.message.includes('ResizeObserver')) {
    return false
  }
  if (err.message.includes('WebSocket')) {
    return false
  }
  return true
})

// Configurar antes de cada teste
beforeEach(() => {
  // Limpar localStorage
  cy.clearLocalStorage()
  
  // Limpar cookies
  cy.clearCookies()
  
  // Limpar sessionStorage
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

// Configurar após cada teste
afterEach(() => {
  // Capturar screenshot em caso de falha
  cy.screenshot({ capture: 'runner', onlyOnFailure: true })
})
