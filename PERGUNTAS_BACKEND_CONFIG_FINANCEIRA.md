# Perguntas para Backend - Configurações Financeiras

**Data:** 23 de fevereiro de 2026  
**Contexto:** Implementação do módulo de Configurações do Sistema (toggle pós-pago/pré-pago)  
**Referência:** CONTROLE_POS_PAGO.md

---

## 1. ENDPOINTS E ESTRUTURA DE DADOS

### 1.1 Endpoint de Busca
```
GET /api/configuracao-financeira
```

**Perguntas:**
- ✅ O endpoint está implementado?
- ✅ Qual é a estrutura COMPLETA do objeto de resposta?
- ❓ Existem campos além de `posPagoAtivo`, `limitePosPago`, `atualizadoPorNome`, `atualizadoEm`, `atualizadoPorRole`?
- ❓ O campo `limitePosPago` vem em centavos ou decimal?
- ❓ O campo `atualizadoEm` vem em qual formato? ISO 8601? Timestamp?
- ❓ O campo `atualizadoPorRole` retorna qual valor? ROLE_ADMIN, ADMIN, ou outro?

**Exemplo esperado:**
```json
{
  "posPagoAtivo": true,
  "limitePosPago": 50000,
  "atualizadoPorNome": "João Silva",
  "atualizadoEm": "2026-02-23T10:30:00",
  "atualizadoPorRole": "ADMIN"
}
```

### 1.2 Endpoint de Ativação
```
POST /api/configuracao-financeira/pos-pago/ativar
```

**Perguntas:**
- ✅ O endpoint está implementado?
- ❓ Requer corpo na requisição ou apenas autenticação?
- ❓ Qual o código de resposta em caso de sucesso? 200 ou 204?
- ❓ Retorna algum objeto na resposta? Se sim, qual estrutura?
- ❓ Quais são os possíveis códigos de erro e mensagens?
  - 403 - Usuário sem permissão?
  - 401 - Não autenticado?
  - Outros?

### 1.3 Endpoint de Desativação
```
POST /api/configuracao-financeira/pos-pago/desativar
```

**Perguntas:**
- ✅ O endpoint está implementado?
- ❓ Requer corpo na requisição ou apenas autenticação?
- ❓ Qual o código de resposta em caso de sucesso? 200 ou 204?
- ❓ Retorna algum objeto na resposta? Se sim, qual estrutura?
- ❓ Quais são os possíveis códigos de erro e mensagens?

---

## 2. PERMISSÕES E SEGURANÇA

### 2.1 Controle de Acesso
**Perguntas:**
- ❓ Apenas ADMIN pode ativar/desativar pós-pago ou GERENTE também?
- ❓ Qualquer usuário autenticado pode CONSULTAR a configuração ou requer permissão?
- ❓ Como o backend valida a permissão? Por role? Por authority?
- ❓ Se um GERENTE tentar ativar/desativar, qual mensagem de erro é retornada?

### 2.2 Auditoria
**Perguntas:**
- ❓ As alterações são registradas em log de auditoria (EventLog)?
- ❓ Se sim, qual é o tipo do evento? CONFIGURACAO_ALTERADA?
- ❓ Onde podemos consultar esses logs? Há endpoint de auditoria?

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Limite de Pós-Pago
**Perguntas:**
- ❓ O limite de 500 AOA (50000 centavos) por UnidadeDeConsumo é fixo ou configurável?
- ❓ Se configurável, existe endpoint para alterar o limite?
- ❓ O limite é por UnidadeDeConsumo ou por Cliente?
- ❓ O limite considera apenas pedidos ABERTOS ou também FINALIZADOS?

### 3.2 Validação de Pedidos
**Perguntas:**
- ❓ Quando pós-pago está DESATIVADO:
  - Pedidos pós-pago existentes podem ser finalizados?
  - Pedidos pós-pago existentes podem receber novos itens?
  - Apenas NOVOS pedidos são bloqueados?

- ❓ Quando um pedido pós-pago excede o limite:
  - Qual exception é lançada? LimitePosPagoExcedidoException?
  - Qual código HTTP? 400?
  - Qual mensagem é retornada?

- ❓ Quando tentam criar pedido pós-pago com sistema desativado:
  - Qual exception é lançada? PosPagoDesabilitadoException?
  - Qual código HTTP? 403?
  - Qual mensagem é retornada?

### 3.3 Comportamento do Toggle
**Perguntas:**
- ❓ Desativar pós-pago afeta IMEDIATAMENTE ou após algum tempo?
- ❓ Existe cache de configuração no backend?
- ❓ Se sim, qual o TTL do cache?
- ❓ Como o frontend deve lidar com isso? Recarregar após X segundos?

---

## 4. INICIALIZAÇÃO E ESTADO PADRÃO

### 4.1 Primeira Execução
**Perguntas:**
- ❓ Na primeira execução do sistema, qual é o valor padrão de `posPagoAtivo`?
- ❓ Existe um script SQL de inicialização (data.sql/schema.sql)?
- ❓ Ou a configuração é criada automaticamente via código?

### 4.2 Tabela no Banco
**Perguntas:**
- ❓ Qual é o nome da tabela? `configuracao_financeira`?
- ❓ A tabela tem apenas 1 linha (singleton) ou pode ter múltiplas?
- ❓ Quais são TODAS as colunas da tabela?
- ❓ Existe campo `id`? Se sim, qual valor fixo?

---

## 5. INTEGRAÇÃO COM PEDIDOS

### 5.1 Validação no PedidoFinanceiroService
**Perguntas:**
- ❓ O serviço `PedidoFinanceiroService` verifica a configuração em qual método?
- ❓ A verificação acontece:
  - Ao criar pedido (POST /pedidos)?
  - Ao adicionar item (POST /subpedidos)?
  - Ao finalizar pedido?
  - Todos os acima?

### 5.2 Cálculo do Saldo em Aberto
**Perguntas:**
- ❓ Como é calculado o saldo em aberto pós-pago de uma UnidadeDeConsumo?
- ❓ Existe endpoint específico? Ex: GET /unidades-consumo/{id}/saldo-pos-pago
- ❓ O cálculo considera:
  - Apenas pedidos ABERTOS?
  - Pedidos AGUARDANDO_PAGAMENTO também?
  - Apenas itens pós-pago ou total do pedido?

---

## 6. CASOS DE BORDA E EDGE CASES

### 6.1 Cenário: Toggle Durante Criação de Pedido
**Pergunta:**
- ❓ Se admin desativa pós-pago DURANTE a criação de um pedido por outro usuário:
  - O pedido em criação falha?
  - Há algum mecanismo de lock/transação?
  - Como lidar com esse race condition?

### 6.2 Cenário: Pedidos Órfãos
**Pergunta:**
- ❓ Se desativarem pós-pago e houver pedidos pós-pago abertos:
  - Como o cliente paga esses pedidos?
  - O sistema força finalização?
  - Ou permite manter abertos?

### 6.3 Cenário: Mudança de Limite Durante Pedido
**Pergunta:**
- ❓ Se alterarem o limite de 500 para 300 AOA e já houver pedido de 400 AOA aberto:
  - O que acontece com esse pedido?
  - Pode adicionar mais itens?

---

## 7. TESTES E AMBIENTE

### 7.1 Endpoints de Teste
**Perguntas:**
- ❓ Os endpoints estão funcionais em DEV?
- ❓ Há dados de teste pré-carregados?
- ❓ Como podemos testar todos os cenários de erro?

### 7.2 Documentação
**Perguntas:**
- ❓ Existe documentação Swagger/OpenAPI disponível?
- ❓ Se sim, qual URL? Ex: http://localhost:8080/swagger-ui.html
- ❓ Os endpoints estão documentados com exemplos de request/response?

---

## 8. FRONTEND - SOLICITAÇÕES

### 8.1 Campos Necessários
**Solicitação:**
Para exibir corretamente na UI, precisamos que a resposta de GET contenha:
```json
{
  "posPagoAtivo": boolean,
  "limitePosPago": number (em centavos),
  "atualizadoPorNome": string,
  "atualizadoEm": string (ISO 8601),
  "atualizadoPorRole": string,
  "atualizadoPorId": number (opcional, para referência)
}
```

### 8.2 Mensagens de Erro Padronizadas
**Solicitação:**
Gostaríamos que os erros seguissem este formato:
```json
{
  "timestamp": "2026-02-23T10:30:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Apenas administradores podem alterar configurações financeiras",
  "path": "/api/configuracao-financeira/pos-pago/ativar"
}
```

---

## 9. PRIORIDADE DAS PERGUNTAS

### 🔴 CRÍTICAS (Impedem implementação):
1. Estrutura completa do objeto de resposta GET
2. Formato do campo `atualizadoEm`
3. Escala do campo `limitePosPago` (centavos ou decimal)
4. Códigos HTTP de sucesso (200 ou 204)

### 🟡 IMPORTANTES (Afetam UX):
5. Mensagens de erro específicas
6. Permissões (ADMIN only ou GERENTE também)
7. Comportamento com pedidos existentes

### 🟢 DESEJÁVEIS (Melhorias):
8. Auditoria de alterações
9. Cache e TTL
10. Endpoints de consulta de saldo pós-pago

---

## 10. PRÓXIMOS PASSOS

Após recebermos as respostas:
1. ✅ Ajustar service `configuracaoFinanceiraService.js`
2. ✅ Ajustar componente `ConfiguracoesView.vue`
3. ✅ Adicionar tratamento de erros específicos
4. ✅ Implementar testes E2E
5. ⏳ Documentar no README

---

**Enviado por:** Equipe Frontend  
**Aguardando resposta de:** Equipe Backend  
**Prazo desejado:** Até 25/02/2026
