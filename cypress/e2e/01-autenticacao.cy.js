/// <reference types="cypress" />

describe('Autenticação', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  describe('Login', () => {
    it('deve fazer login com sucesso como ADMIN', () => {
      cy.fixture('usuarios').then((usuarios) => {
        const { telefone, senha } = usuarios.admin

        cy.getByDataCy('input-telefone').type(telefone)
        cy.getByDataCy('input-senha').type(senha)
        cy.getByDataCy('btn-entrar').click()

        // Verificar redirecionamento
        cy.url().should('include', '/admin/dashboard')

        // Verificar token no localStorage
        cy.window().then((win) => {
          const token = win.localStorage.getItem('token')
          expect(token).to.exist
          expect(token).to.be.a('string')
        })

        // Verificar nome do usuário no header
        cy.contains(usuarios.admin.nome).should('be.visible')
      })
    })

    it('deve exibir erro com credenciais inválidas', () => {
      cy.getByDataCy('input-telefone').type('999999999')
      cy.getByDataCy('input-senha').type('senhaerrada')
      cy.getByDataCy('btn-entrar').click()

      // Verificar mensagem de erro
      cy.checkToast('Credenciais inválidas', 'error')

      // Verificar que não foi redirecionado
      cy.url().should('include', '/login')

      // Verificar que não há token
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
      })
    })

    it('deve validar campos obrigatórios', () => {
      cy.getByDataCy('btn-entrar').click()

      // Verificar mensagens de validação
      cy.contains('Telefone é obrigatório').should('be.visible')
      cy.contains('Senha é obrigatória').should('be.visible')
    })

    it('deve toggle visibilidade da senha', () => {
      cy.getByDataCy('input-senha').type('senha123')

      // Verificar que senha está oculta
      cy.getByDataCy('input-senha').should('have.attr', 'type', 'password')

      // Clicar no botão de mostrar/ocultar
      cy.getByDataCy('btn-toggle-senha').click()

      // Verificar que senha está visível
      cy.getByDataCy('input-senha').should('have.attr', 'type', 'text')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      cy.login('ADMIN')
      cy.visit('/admin/dashboard')
    })

    it('deve fazer logout com sucesso', () => {
      cy.logout()

      // Verificar redirecionamento
      cy.url().should('include', '/login')

      // Verificar que token foi removido
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
      })
    })

    it('deve redirecionar para login ao acessar rota protegida após logout', () => {
      cy.logout()

      // Tentar acessar rota protegida
      cy.visit('/admin/usuarios')

      // Verificar redirecionamento
      cy.url().should('include', '/login')
    })
  })

  describe('Sessão Expirada', () => {
    it('deve redirecionar para login quando token expirar', () => {
      cy.login('ADMIN')
      cy.visit('/admin/dashboard')

      // Simular token expirado
      cy.interceptAPI('GET', '/usuarios/me', {}, 401)

      // Fazer uma requisição que vai retornar 401
      cy.visit('/admin/usuarios')

      // Verificar redirecionamento
      cy.url().should('include', '/login')

      // Verificar mensagem
      cy.checkToast('Sessão expirada', 'warning')
    })
  })

  describe('Permissões por Role', () => {
    it('ADMIN deve acessar todas as páginas', () => {
      cy.login('ADMIN')

      const routes = ['/admin/dashboard', '/admin/usuarios', '/admin/auditoria', '/admin/produtos', '/admin/pedidos']

      routes.forEach((route) => {
        cy.visit(route)
        cy.url().should('include', route)
      })
    })

    it('GERENTE não deve acessar página de usuários', () => {
      cy.login('GERENTE')

      cy.visit('/admin/usuarios')

      // Verificar redirecionamento ou mensagem de erro
      cy.url().should('not.include', '/usuarios')
      cy.checkToast('Acesso negado', 'error')
    })

    it('ATENDENTE deve acessar apenas pedidos e produtos', () => {
      cy.login('ATENDENTE')

      // Deve acessar
      cy.visit('/admin/pedidos')
      cy.url().should('include', '/pedidos')

      cy.visit('/admin/produtos')
      cy.url().should('include', '/produtos')

      // Não deve acessar
      cy.visit('/admin/usuarios')
      cy.url().should('not.include', '/usuarios')
    })
  })
})
