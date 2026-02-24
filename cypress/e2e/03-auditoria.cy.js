/// <reference types="cypress" />

describe('Auditoria', () => {
  beforeEach(() => {
    cy.login('ADMIN')
    cy.visit('/admin/auditoria')
  })

  describe('Visualização de Logs', () => {
    it('deve exibir estatísticas de auditoria', () => {
      // Verificar cards de estatísticas
      cy.getByDataCy('stat-total-logs').should('be.visible')
      cy.getByDataCy('stat-logs-hoje').should('be.visible')
      cy.getByDataCy('stat-usuarios-ativos').should('be.visible')
      cy.getByDataCy('stat-ultima-acao').should('be.visible')
    })

    it('deve exibir lista de logs', () => {
      cy.get('[data-cy="log-card"]').should('have.length.greaterThan', 0)

      // Verificar informações do log
      cy.get('[data-cy="log-card"]').first().within(() => {
        cy.get('[data-cy="log-usuario"]').should('be.visible')
        cy.get('[data-cy="log-acao"]').should('be.visible')
        cy.get('[data-cy="log-modulo"]').should('be.visible')
        cy.get('[data-cy="log-data"]').should('be.visible')
      })
    })

    it('deve abrir detalhes do log ao clicar', () => {
      cy.get('[data-cy="log-card"]').first().click()

      // Verificar modal de detalhes
      cy.getByDataCy('modal-detalhes-log').should('be.visible')

      // Verificar informações detalhadas
      cy.contains('Informações do Usuário').should('be.visible')
      cy.contains('Detalhes da Ação').should('be.visible')
      cy.contains('Dados Adicionais').should('be.visible')
    })
  })

  describe('Filtros', () => {
    it('deve filtrar logs por módulo', () => {
      cy.getByDataCy('filtro-modulo').select('USUARIOS')

      cy.wait(500)

      cy.get('[data-cy="log-card"]').each(($card) => {
        cy.wrap($card).find('[data-cy="log-modulo"]').should('contain', 'USUARIOS')
      })
    })

    it('deve filtrar logs por ação', () => {
      cy.getByDataCy('filtro-acao').select('CRIAR')

      cy.wait(500)

      cy.get('[data-cy="log-card"]').each(($card) => {
        cy.wrap($card).find('[data-cy="log-acao"]').should('contain', 'CRIAR')
      })
    })

    it('deve filtrar logs por período', () => {
      const hoje = new Date().toISOString().split('T')[0]
      const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      cy.getByDataCy('filtro-data-inicio').type(ontem)
      cy.getByDataCy('filtro-data-fim').type(hoje)

      cy.getByDataCy('btn-aplicar-filtros').click()

      cy.wait(500)

      // Verificar que logs estão dentro do período
      cy.get('[data-cy="log-card"]').should('have.length.greaterThan', 0)
    })

    it('deve buscar logs por texto livre', () => {
      cy.getByDataCy('input-busca-log').type('admin')

      cy.wait(500)

      cy.get('[data-cy="log-card"]').should('have.length.greaterThan', 0)
      cy.contains('admin', { matchCase: false }).should('be.visible')
    })

    it('deve limpar filtros', () => {
      // Aplicar filtros
      cy.getByDataCy('filtro-modulo').select('USUARIOS')
      cy.getByDataCy('filtro-acao').select('CRIAR')

      // Limpar
      cy.getByDataCy('btn-limpar-filtros').click()

      // Verificar que filtros foram resetados
      cy.getByDataCy('filtro-modulo').should('have.value', '')
      cy.getByDataCy('filtro-acao').should('have.value', '')
    })
  })

  describe('Exportação', () => {
    it('deve exportar logs em CSV', () => {
      cy.getByDataCy('btn-exportar-csv').click()

      // Verificar toast de sucesso
      cy.checkToast('Exportando logs', 'info')

      // Verificar download (Cypress não baixa realmente o arquivo)
      cy.wait(1000)
    })

    it('deve exportar logs em PDF', () => {
      cy.getByDataCy('btn-exportar-pdf').click()

      cy.checkToast('Exportando logs', 'info')
      cy.wait(1000)
    })

    it('deve exportar apenas logs filtrados', () => {
      // Aplicar filtro
      cy.getByDataCy('filtro-modulo').select('USUARIOS')
      cy.wait(500)

      cy.getByDataCy('btn-exportar-csv').click()

      // Verificar que exportação foi solicitada
      cy.checkToast('Exportando logs', 'info')
    })
  })

  describe('Detalhes do Log', () => {
    it('deve exibir todas as informações do log', () => {
      cy.get('[data-cy="log-card"]').first().click()

      cy.getByDataCy('modal-detalhes-log').within(() => {
        // Informações do usuário
        cy.get('[data-cy="log-usuario-nome"]').should('be.visible')
        cy.get('[data-cy="log-usuario-role"]').should('be.visible')

        // Detalhes da ação
        cy.get('[data-cy="log-acao-badge"]').should('be.visible')
        cy.get('[data-cy="log-modulo-badge"]').should('be.visible')
        cy.get('[data-cy="log-data-hora"]').should('be.visible')

        // Informações técnicas
        cy.get('[data-cy="log-ip"]').should('be.visible')
        cy.get('[data-cy="log-user-agent"]').should('be.visible')

        // Dados adicionais (JSON)
        cy.get('[data-cy="log-dados-json"]').should('be.visible')
      })
    })

    it('deve fechar modal de detalhes', () => {
      cy.get('[data-cy="log-card"]').first().click()
      cy.getByDataCy('modal-detalhes-log').should('be.visible')

      cy.getByDataCy('btn-fechar-modal').click()
      cy.getByDataCy('modal-detalhes-log').should('not.exist')
    })
  })

  describe('Paginação', () => {
    it('deve carregar mais logs ao rolar a página', () => {
      const initialCount = Cypress.$('[data-cy="log-card"]').length

      // Rolar até o final
      cy.scrollTo('bottom')

      cy.wait(1000)

      // Verificar que mais logs foram carregados
      cy.get('[data-cy="log-card"]').should('have.length.greaterThan', initialCount)
    })
  })

  describe('Rastreabilidade', () => {
    it('deve rastrear ações de criação de usuário', () => {
      // Criar um usuário
      cy.visit('/admin/usuarios')
      cy.fixture('usuarios').then((usuarios) => {
        cy.getByDataCy('btn-novo-usuario').click()
        cy.fillForm({
          nome: usuarios.novoUsuario.nome,
          telefone: usuarios.novoUsuario.telefone,
          senha: usuarios.novoUsuario.senha,
          role: usuarios.novoUsuario.role,
        })
        cy.getByDataCy('btn-salvar').click()
      })

      // Voltar para auditoria
      cy.visit('/admin/auditoria')

      // Filtrar por USUARIOS e CRIAR
      cy.getByDataCy('filtro-modulo').select('USUARIOS')
      cy.getByDataCy('filtro-acao').select('CRIAR')

      cy.wait(500)

      // Verificar que log de criação aparece
      cy.get('[data-cy="log-card"]').first().should('contain', 'Novo Usuário')
    })
  })
})
