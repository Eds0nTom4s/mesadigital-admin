# Respostas para Backend - Configurações Financeiras

**Data:** 23 de fevereiro de 2026
**Status:** ✅ Respondido

---

## 1. ENDPOINTS E ESTRUTURA DE DADOS

### 1.1 Endpoint de Busca
`GET /api/configuracao-financeira`

**Respostas:**
- ✅ **Implementado:** Sim.
- ✅ **Estrutura de Resposta:** O objeto retornado é `ConfiguracaoFinanceiraResponse`.
- ❓ **Campos adicionais:** Não existem campos além dos citados (`posPagoAtivo`, `atualizadoEm`, `atualizadoPorNome`, `atualizadoPorRole`).
- ❓ **Campo `limitePosPago`:** **NÃO** é retornado neste endpoint atualmente. O limite é uma constante fixa no backend (`500.00`).
- ❓ **Formato `atualizadoEm`:** ISO 8601 (padrão `LocalDateTime` do Java/Jackson), ex: `"2026-02-23T10:30:00"`.
- ❓ **Valor `atualizadoPorRole`:** Retorna o nome da role sem o prefixo `ROLE_` (ex: "ADMIN") ou com o prefixo dependendo de como foi salvo. O código atual salva o que vem do token (ex: "ADMIN").

**Exemplo real atual:**
```json
{
  "posPagoAtivo": true,
  "atualizadoPorNome": "Admin Sistema",
  "atualizadoEm": "2026-02-23T10:30:00",
  "atualizadoPorRole": "ADMIN"
}
```
> **Nota:** O campo `limitePosPago` precisa ser adicionado ao DTO se o frontend precisar dele. Atualmente é fixo em **500.00 AOA**.

### 1.2 Endpoint de Ativação
`POST /api/configuracao-financeira/pos-pago/ativar`

**Respostas:**
- ✅ **Implementado:** Sim.
- ❓ **Corpo:** Não requer corpo. Apenas autenticação.
- ❓ **Código de Sucesso:** `200 OK`.
- ❓ **Retorno:** Retorna o objeto `ConfiguracaoFinanceiraResponse` atualizado.
- ❓ **Erros:**
  - `403 Forbidden`: Se usuário não for ADMIN.
  - `401 Unauthorized`: Se não autenticado.

### 1.3 Endpoint de Desativação
`POST /api/configuracao-financeira/pos-pago/desativar`

**Respostas:**
- ✅ **Implementado:** Sim.
- ❓ **Corpo:** Não requer corpo.
- ❓ **Código de Sucesso:** `200 OK`.
- ❓ **Retorno:** Retorna o objeto `ConfiguracaoFinanceiraResponse` atualizado.

---

## 2. PERMISSÕES E SEGURANÇA

### 2.1 Controle de Acesso
**Respostas:**
- ❓ **Quem ativa/desativa:** Apenas **ADMIN**. (`@PreAuthorize("hasRole('ADMIN')")`).
- ❓ **Quem consulta:** **ADMIN** ou **GERENTE**. (`@PreAuthorize("hasAnyRole('ADMIN', 'GERENTE')")`).
- ❓ **Validação:** Por role via Spring Security (`@PreAuthorize`).
- ❓ **Erro para Gerente (ativar/desativar):** Retorna `403 Forbidden` (Access Denied).

### 2.2 Auditoria
**Respostas:**
- ❓ **Log:** O código possui `TODO: Gerar EventLog ALTERACAO_POLITICA_POS_PAGO`, mas atualmente salva o nome/role de quem alterou na própria tabela de configuração (`atualizado_por_nome`, `atualizado_por_role`).

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Limite de Pós-Pago
**Respostas:**
- ❓ **Configurável?** **NÃO**. É uma constante fixa no código (`ConfiguracaoFinanceiraService.LIMITE_POS_PAGO_PADRAO = 500.00`).
- ❓ **Endpoint para alterar:** Não existe.
- ❓ **Escopo:** O código indica intenção de ser por **UnidadeDeConsumo** (Mesa/Comanda), validando o total de pedidos `NAO_PAGO` naquela unidade.
  - ⚠️ **Alerta:** Encontrada inconsistência no código. O serviço está passando `clienteId` onde deveria ser `unidadeConsumoId`. Isso será corrigido.
- ❓ **Considera:** Pedidos com status financeiro `NAO_PAGO` (inclui abertos e fechados ainda não pagos).

### 3.2 Validação de Pedidos
**Respostas:**
- ❓ **Pós-pago DESATIVADO:**
  - A validação ocorre na criação (`validarCriacaoPosPago`). Pedidos existentes provavelmente não são afetados a menos que tentem adicionar novos itens/subpedidos que disparem nova validação financeira.
- ❓ **Limite excedido:**
  - **Exception:** `LimitePosPagoExcedidoException` (extende `BusinessException`).
  - **Código:** `400 Bad Request`.
  - **Mensagem:** "Limite de pós-pago excedido".
- ❓ **Sistema desativado (tentativa de criação):**
  - **Exception:** `PosPagoDesabilitadoException` (extende `BusinessException`).
  - **Código:** `400 Bad Request`.
  - **Mensagem:** "Consumo pós-pago temporariamente desabilitado. Contacte o administrador.".

### 3.3 Comportamento do Toggle
**Respostas:**
- ❓ **Efeito:** Imediato para novas requisições.
- ❓ **Cache:** Não há cache explícito (consulta banco a cada requisição).

---

## 4. INICIALIZAÇÃO E ESTADO PADRÃO

### 4.1 Primeira Execução
**Respostas:**
- ❓ **Valor padrão:** `true` (Ativo).
- ❓ **Criação:** Automática via código (`buscarOuCriarConfiguracao`) na primeira execução se não existir.

### 4.2 Tabela no Banco
**Respostas:**
- ❓ **Nome:** `configuracao_financeira_sistema`.
- ❓ **Linhas:** Singleton (apenas 1 linha ativa considerada).

---

## 5. INTEGRAÇÃO COM PEDIDOS

### 5.1 Validação
**Respostas:**
- ❓ **Onde:** `PedidoFinanceiroService.validarCriacaoPedido` chama `ConfiguracaoFinanceiraService`.
- ❓ **Quando:** Ao criar o pedido (`POST /pedidos`).

### 5.2 Cálculo do Saldo
**Respostas:**
- ❓ **Fórmula:** Soma do `total` de todos os pedidos da Unidade de Consumo com `tipoPagamento=POS_PAGO` e `statusFinanceiro=NAO_PAGO`.

---

## 9. AÇÕES IMEDIATAS (BACKEND)

1. **Correção de Bug:** Corrigir a passagem de `clienteId` em vez de `unidadeConsumoId` na validação de limite.
2. **Expor Limite:** Adicionar `limitePosPago` (50000 centavos / 500.00 decimal) no `ConfiguracaoFinanceiraResponse`.
