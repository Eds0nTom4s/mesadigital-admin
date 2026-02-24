/// <reference types="cypress" />

describe('Gestão de Usuários', () => {
  beforeEach(() => {
    cy.login('ADMIN')
    cy.visit('/admin/usuarios')
  })

  describe('Listagem de Usuários', () => {
    it('deve exibir lista de usuários', () => {
      cy.get('table tbody tr').should('have.length.greaterThan', 0)

      // Verificar colunas
      cy.get('table thead th').should('contain', 'Nome')
      cy.get('table thead th').should('contain', 'Telefone')
      cy.get('table thead th').should('contain', 'Role')
      cy.get('table thead th').should('contain', 'Status')
      cy.get('table thead th').should('contain', 'Ações')
    })

    it('deve filtrar usuários por role', () => {
      cy.getByDataCy('filtro-role').select('ADMIN')

      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).find('[data-cy="badge-role"]').should('contain', 'ADMIN')
      })
    })

    it('deve filtrar usuários por status', () => {
      cy.getByDataCy('filtro-status').select('true')

      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).find('[data-cy="badge-status"]').should('contain', 'Ativo')
      })
    })

    it('deve buscar usuário por nome', () => {
      cy.fixture('usuarios').then((usuarios) => {
        cy.getByDataCy('input-busca').type(usuarios.admin.nome)

        // Aguardar debounce
        cy.wait(500)

        cy.get('table tbody tr').should('have.length.lte', 3)
        cy.get('table tbody tr').first().should('contain', usuarios.admin.nome)
      })
    })

    it('deve exibir empty state quando não houver resultados', () => {
      cy.getByDataCy('input-busca').type('USUÁRIO INEXISTENTE XYZ')
      cy.wait(500)

      cy.contains('Nenhum usuário encontrado').should('be.visible')
    })
  })

  describe('Criar Usuário', () => {
    it('deve criar novo usuário com sucesso', () => {
      cy.fixture('usuarios').then((usuarios) => {
        const novo = usuarios.novoUsuario

        cy.getByDataCy('btn-novo-usuario').click()

        // Verificar modal aberto
        cy.getByDataCy('modal-usuario').should('be.visible')

        // Preencher formulário
        cy.fillForm({
          nome: novo.nome,
          telefone: novo.telefone,
          email: novo.email,
          senha: novo.senha,
          role: novo.role,
        })

        // Selecionar unidade se não for ADMIN
        if (novo.role !== 'ADMIN') {
          cy.getByDataCy('select-unidade').select('1')
        }

        // Salvar
        cy.getByDataCy('btn-salvar').click()

        // Verificar sucesso
        cy.checkToast('Usuário criado com sucesso', 'success')

        // Verificar que modal fechou
        cy.getByDataCy('modal-usuario').should('not.exist')

        // Verificar que usuário aparece na lista
        cy.contains(novo.nome).should('be.visible')
      })
    })

    it('deve validar campos obrigatórios ao criar', () => {
      cy.getByDataCy('btn-novo-usuario').click()
      cy.getByDataCy('btn-salvar').click()

      // Verificar mensagens de validação
      cy.contains('Nome é obrigatório').should('be.visible')
      cy.contains('Telefone é obrigatório').should('be.visible')
      cy.contains('Senha é obrigatória').should('be.visible')
      cy.contains('Role é obrigatório').should('be.visible')
    })

    it('deve validar telefone único', () => {
      cy.fixture('usuarios').then((usuarios) => {
        cy.getByDataCy('btn-novo-usuario').click()

        cy.fillForm({
          nome: 'Usuário Teste',
          telefone: usuarios.admin.telefone, // Telefone já existente
          email: 'novo@teste.com',
          senha: 'senha123',
          role: 'ATENDENTE',
        })

        cy.getByDataCy('btn-salvar').click()

        cy.checkToast('Telefone já está em uso', 'error')
      })
    })

    it('deve exibir indicador de força da senha', () => {
      cy.getByDataCy('btn-novo-usuario').click()

      // Senha fraca
      cy.getByDataCy('input-senha').type('123')
      cy.contains('Fraca').should('be.visible')

      // Senha média
      cy.getByDataCy('input-senha').clear().type('senha123')
      cy.contains('Média').should('be.visible')

      // Senha forte
      cy.getByDataCy('input-senha').clear().type('Senh@123!')
      cy.contains('Forte').should('be.visible')
    })
  })

  describe('Editar Usuário', () => {
    it('deve editar usuário existente', () => {
      // Clicar no primeiro usuário
      cy.get('table tbody tr').first().find('[data-cy="btn-editar"]').click()

      // Verificar modal aberto
      cy.getByDataCy('modal-usuario').should('be.visible')

      // Editar nome
      cy.getByDataCy('input-nome').clear().type('Nome Editado')

      // Salvar
      cy.getByDataCy('btn-salvar').click()

      // Verificar sucesso
      cy.checkToast('Usuário atualizado com sucesso', 'success')

      // Verificar atualização na lista
      cy.contains('Nome Editado').should('be.visible')
    })

    it('não deve permitir editar telefone', () => {
      cy.get('table tbody tr').first().find('[data-cy="btn-editar"]').click()

      cy.getByDataCy('input-telefone').should('be.disabled')
    })
  })

  describe('Alterar Senha', () => {
    it('deve alterar senha do usuário', () => {
      cy.get('table tbody tr').first().find('[data-cy="btn-senha"]').click()

      // Verificar modal aberto
      cy.getByDataCy('modal-alterar-senha').should('be.visible')

      // Preencher nova senha
      cy.getByDataCy('input-nova-senha').type('NovaSenha123!')
      cy.getByDataCy('input-confirmar-senha').type('NovaSenha123!')

      // Salvar
      cy.getByDataCy('btn-salvar').click()

      // Verificar sucesso
      cy.checkToast('Senha alterada com sucesso', 'success')
    })

    it('deve validar confirmação de senha', () => {
      cy.get('table tbody tr').first().find('[data-cy="btn-senha"]').click()

      cy.getByDataCy('input-nova-senha').type('Senha123!')
      cy.getByDataCy('input-confirmar-senha').type('SenhaDiferente')

      cy.getByDataCy('btn-salvar').click()

      cy.contains('As senhas não coincidem').should('be.visible')
    })
  })

  describe('Ativar/Desativar Usuário', () => {
    it('deve desativar usuário ativo', () => {
      // Encontrar usuário ativo
      cy.get('table tbody tr')
        .contains('[data-cy="badge-status"]', 'Ativo')
        .parents('tr')
        .find('[data-cy="btn-desativar"]')
        .click()

      // Confirmar
      cy.getByDataCy('btn-confirmar').click()

      // Verificar sucesso
      cy.checkToast('Usuário desativado com sucesso', 'success')
    })

    it('deve ativar usuário inativo', () => {
      // Filtrar por inativos
      cy.getByDataCy('filtro-status').select('false')

      // Encontrar usuário inativo
      cy.get('table tbody tr')
        .contains('[data-cy="badge-status"]', 'Inativo')
        .parents('tr')
        .find('[data-cy="btn-ativar"]')
        .click()

      // Confirmar
      cy.getByDataCy('btn-confirmar').click()

      // Verificar sucesso
      cy.checkToast('Usuário ativado com sucesso', 'success')
    })
  })

  describe('Excluir Usuário', () => {
    it('deve excluir usuário com confirmação', () => {
      cy.get('table tbody tr').first().find('[data-cy="btn-excluir"]').click()

      // Verificar diálogo de confirmação
      cy.getByDataCy('dialog-confirmacao').should('be.visible')
      cy.contains('Tem certeza que deseja excluir').should('be.visible')

      // Confirmar
      cy.getByDataCy('btn-confirmar').click()

      // Verificar sucesso
      cy.checkToast('Usuário excluído com sucesso', 'success')
    })

    it('deve cancelar exclusão', () => {
      const primeiraLinha = cy.get('table tbody tr').first()
      primeiraLinha.find('[data-cy="btn-excluir"]').click()

      cy.getByDataCy('btn-cancelar').click()

      // Verificar que diálogo fechou
      cy.getByDataCy('dialog-confirmacao').should('not.exist')

      // Verificar que usuário ainda está na lista
      primeiraLinha.should('exist')
    })
  })

  describe('Paginação', () => {
    it('deve navegar entre páginas', () => {
      // Verificar que há paginação (se houver mais de 10 usuários)
      cy.get('[data-cy="paginacao"]').then(($paginacao) => {
        if ($paginacao.length > 0) {
          cy.getByDataCy('btn-proxima-pagina').click()
          cy.getByDataCy('pagina-atual').should('contain', '2')

          cy.getByDataCy('btn-pagina-anterior').click()
          cy.getByDataCy('pagina-atual').should('contain', '1')
        }
      })
    })
  })
})
