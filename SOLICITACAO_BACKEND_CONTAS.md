# SOLICITAÇÃO DE ESPECIFICAÇÃO - Gestão de Contas e Pagamentos

**Data:** 20/02/2026  
**De:** Equipe Frontend  
**Para:** Equipe Backend  
**Assunto:** Especificação da API de Contas para Página de Balcão/Gerência

---

## 📋 CONTEXTO

Implementamos a página de **Gestão de Pedidos - Balcão** conforme solicitação, focada em operação de balcão/gerência com gestão financeira de contas (mesas/comandas).

A página atual está **100% funcional com dados mockados** e preparada para integração, mas identificamos que o conceito de **Conta** (unidade de consumo) não está documentado na especificação atual de pedidos.

**Arquivos relacionados:**
- `/src/modules/pedidos/PedidosBalcaoView.vue` (componente implementado)
- `/src/services/contasService.js` (service criado, aguardando endpoints)
- `/src/services/pedidosBalcaoService.js` (service criado)
- `INTEGRACAO_PEDIDOS_BALCAO.md` (documentação da integração)

---

## ❓ DÚVIDAS E SOLICITAÇÕES

### 1. **ENTIDADE CONTA - EXISTE NO BACKEND?**

A especificação atual (`INSTRUCOES_FRONTEND_PAGINA_PEDIDOS.txt`) menciona apenas:
- **Pedido** (entidade principal)
- **SubPedido** (unidade operacional por cozinha)
- **unidadeConsumoId** (referência a uma mesa/comanda)

**PERGUNTA:**
- Existe a entidade `Conta` / `UnidadeConsumo` implementada no backend?
- Se sim, qual o nome correto da entidade?
- Se não, vocês planejam implementar ou devemos ajustar o conceito?

### 2. **ESTADOS FINANCEIROS - COMO SÃO GERENCIADOS?**

Implementamos os seguintes estados financeiros baseados na solicitação:
- `PAGO` - Todos os pedidos da conta estão pagos
- `EM_DEBITO` - Existem pedidos não pagos
- `PARCIAL` - Alguns pedidos pagos, outros não

**PERGUNTAS:**
- Esses estados existem no backend ou devemos usar outra nomenclatura?
- Os estados são calculados automaticamente ou armazenados?
- Qual o enum correto? `StatusFinanceiro`, `StatusConta`, outro?

### 3. **RELAÇÃO CONTA ↔ PEDIDO**

No frontend assumimos que:
- Uma **Conta** pode ter múltiplos **Pedidos**
- Cada **Pedido** pertence a uma única **Conta**
- A conta acumula totais financeiros (consumido, pago, pendente)

**PERGUNTAS:**
- Essa relação está correta?
- O relacionamento é `OneToMany` (Conta → Pedidos)?
- Como funciona o ciclo de vida da conta (abertura/fechamento)?

### 4. **FUNDO DE CONSUMO - INTEGRAÇÃO**

Já existe documentação do Fundo de Consumo (`INTEGRACAO_FRONTEND_FUNDO_CONSUMO.txt`), mas:

**PERGUNTAS:**
- O fundo está vinculado ao Cliente ou à Conta?
- Ao criar pedido com fundo suficiente, o débito é automático ou precisa chamar endpoint específico?
- Existe endpoint para consultar fundo disponível de uma conta específica?

### 5. **PAGAMENTO DE PEDIDOS - FLUXO CORRETO**

Implementamos dois fluxos:

**Fluxo A - Com Fundo Suficiente:**
```
1. POST /api/pedidos { contaId, itens[] }
2. Backend debita automaticamente do fundo
3. Retorna pedido com estadoFinanceiro = PAGO
```

**Fluxo B - Sem Fundo (Pagamento Manual):**
```
1. POST /api/pedidos { contaId, itens[] }
2. POST /api/pedidos/{id}/pagar { metodoPagamento, valor }
3. Backend processa pagamento via GPO/Referência/etc
```

**PERGUNTAS:**
- Esse fluxo está correto?
- Existe endpoint `/api/pedidos/{id}/pagar`?
- Quais métodos de pagamento são suportados? (GPO, REFERENCIA, MULTICAIXA, POS_PAGO?)
- O campo `estadoFinanceiro` existe em Pedido? (NAO_PAGO, PARCIAL, PAGO)

---

## 🔗 ENDPOINTS NECESSÁRIOS

Preparamos services para os seguintes endpoints. **Por favor, confirmar se existem ou como devem ser:**

### CONTAS

```
GET /api/contas/abertas
→ Lista todas as contas abertas (não fechadas)
→ Response: { success, data: Conta[] }

GET /api/contas/{id}
→ Detalhes completos de uma conta
→ Inclui: resumo financeiro, lista de pedidos, fundo (se houver)
→ Response: { success, data: Conta }

POST /api/contas
→ Criar nova conta (abrir mesa/comanda)
→ Request: { identificador, tipo, clienteId?, fundoConsumoId? }
→ Response: { success, data: Conta }

PUT /api/contas/{id}/fechar
→ Fechar conta (validação: não pode ter pendências)
→ Response: { success, data: Conta }

GET /api/contas/{id}/resumo
→ Resumo financeiro consolidado
→ Response: { totalConsumido, totalPago, totalPendente, statusFinanceiro }
```

**ALTERNATIVA:**
Se o conceito correto for **Mesa** ou **UnidadeConsumo**, ajustamos os endpoints.

### PEDIDOS (EXTENSÕES)

```
GET /api/pedidos/conta/{contaId}
→ Listar pedidos de uma conta específica
→ Response: { success, data: Pedido[] }

POST /api/pedidos/{id}/pagar
→ Processar pagamento de pedido
→ Request: { metodoPagamento, valor }
→ Response: { success, data: Pedido }
```

### PRODUTOS

```
GET /api/produtos/disponiveis
→ Lista apenas produtos com disponibilidade = true
→ Response: { success, data: Produto[] }
```

---

## 📊 ESTRUTURA DE DADOS ESPERADA

### Conta (ou nome correto no backend)

```json
{
  "id": 1,
  "identificador": "Mesa 10",
  "tipo": "MESA",  // ou COMANDA
  "aberturaEm": "2026-02-20T18:30:00",
  "fechamentoEm": null,
  "statusFinanceiro": "PAGO",  // ou EM_DEBITO, PARCIAL
  "clienteId": 123,  // opcional
  "fundoConsumo": {
    "id": 1,
    "saldoAtual": 15000,
    "valorInicial": 20000
  },
  "totalConsumido": 5000,
  "totalPago": 5000,
  "totalPendente": 0,
  "pedidos": [
    {
      "id": 101,
      "numero": "PED-101",
      "estadoOperacional": "ENTREGUE",
      "estadoFinanceiro": "PAGO",  // ← CAMPO EXISTE?
      "total": 5000,
      "itens": [...]
    }
  ]
}
```

**QUESTÕES SOBRE ESTA ESTRUTURA:**
- ✅ Campos corretos?
- ✅ Tipos de dados adequados (BigDecimal para valores monetários)?
- ❓ `statusFinanceiro` é calculado ou armazenado?
- ❓ `totalConsumido/totalPago/totalPendente` são campos reais ou calculados?
- ❓ `pedidos` vem sempre populado ou precisa endpoint separado?

### Pedido - Campos Financeiros

```json
{
  "id": 101,
  "numero": "PED-101",
  "estadoOperacional": "ENTREGUE",  // JÁ DOCUMENTADO
  "estadoFinanceiro": "PAGO",       // ← EXISTE?
  "metodoPagamento": "FUNDO",       // ← EXISTE? (FUNDO, GPO, REFERENCIA, POS_PAGO)
  "valorPago": 5000,                // ← EXISTE?
  "dataPagamento": "2026-02-20T18:35:00"  // ← EXISTE?
}
```

---

## 🔐 REGRAS DE NEGÓCIO - VALIDAÇÕES

**Por favor, confirmar as seguintes regras:**

### Criação de Pedido
- ✅ Conta deve estar aberta (não fechada)
- ✅ Se houver fundo suficiente → débito automático
- ✅ Se não houver fundo e pós-pago INATIVO → retornar erro 400
- ❓ Se não houver fundo e pós-pago ATIVO → criar pedido com estadoFinanceiro = NAO_PAGO?

### Fechamento de Conta
- ✅ Não permitir se `totalPendente > 0`
- ❓ Permitir se houver pedidos não entregues? (apenas avisar ou bloquear?)
- ❓ O que acontece com fundo restante? (devolver ao cliente?)

### Pagamento de Pedido
- ❓ Pode pagar pedido parcialmente?
- ❓ Pode pagar valor maior que o total (deixar crédito)?
- ❓ Após pagamento, atualiza `statusFinanceiro` da Conta automaticamente?

### Cancelamento
- ✅ Só GERENTE pode cancelar (já documentado)
- ❓ Pedido pago pode ser cancelado? (gera estorno?)

---

## 🚨 POLÍTICA PÓS-PAGO

No prompt foi mencionado:

> "Pós-pago só aparece se política global estiver ATIVA"

**PERGUNTAS:**
- Como consultar se pós-pago está ativo? (endpoint de configuração?)
- É por unidade, global, por tipo de cliente?
- Campo no backend: `ConfiguracaoGlobal.pospagoAtivo`?

**Sugestão:**
```
GET /api/config/pos-pago
→ Response: { "ativo": true }
```

Ou incluir na resposta de `/api/dashboard/stats`.

---

## 📝 RESUMO DAS DÚVIDAS CRÍTICAS

**Para prosseguir com integração, precisamos saber:**

1. ✅ **Nome correto da entidade:** `Conta`, `UnidadeConsumo`, `Mesa`?
2. ✅ **Endpoints existem:** Lista acima está correta?
3. ✅ **Estados financeiros:** Enum e valores corretos?
4. ✅ **Estrutura JSON:** Formato do response está adequado?
5. ✅ **Débito automático:** Funciona ao criar pedido com fundo?
6. ✅ **Pagamento manual:** Endpoint e fluxo correto?
7. ✅ **Pós-pago:** Como consultar configuração?
8. ✅ **Validações:** Regras de negócio confirmadas?

---

## 🎯 PRÓXIMOS PASSOS

**Após recebermos as respostas:**

1. Ajustaremos os services (`contasService.js`, `pedidosBalcaoService.js`)
2. Atualizaremos componente se necessário
3. Testaremos integração com backend real
4. Documentaremos casos de uso completos

**Arquivos que serão atualizados:**
- `/src/services/contasService.js`
- `/src/services/pedidosBalcaoService.js`
- `/src/modules/pedidos/PedidosBalcaoView.vue`
- `INTEGRACAO_PEDIDOS_BALCAO.md` (atualização)

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

**Já implementado no frontend:**
- ✅ INSTRUCOES_FRONTEND_PAGINA_PEDIDOS.txt (estados operacionais)
- ✅ INTEGRACAO_FRONTEND_FUNDO_CONSUMO.txt (fundo de consumo)
- ✅ INSTRUCOES_FRONTEND_PAGINA_PRODUTOS.txt (catálogo)

**Faltando:**
- ❌ Especificação de Contas/Unidades de Consumo
- ❌ Estados financeiros e pagamentos
- ❌ Regras de fechamento de conta

---

## 💬 OBSERVAÇÕES FINAIS

### Conceito Atual vs. Necessário

**Conceito Atual (Documentado):**
- Pedido → SubPedidos → Estados Operacionais
- Foco em **fluxo operacional** (cozinha, atendente, entrega)

**Conceito Necessário (Não Documentado):**
- Conta → Pedidos → Estados Financeiros
- Foco em **gestão financeira** (pagamento, débito, fechamento)

Esses dois conceitos são **complementares**, não excludentes:
- **PedidosView.vue** (já existente) → Operação de cozinha/atendente
- **PedidosBalcaoView.vue** (novo) → Operação de balcão/financeiro

Ambos usam a mesma entidade **Pedido**, mas com focos diferentes.

### Alternativa Simplificada

Se a entidade `Conta` não existe e não será implementada a curto prazo, podemos:

**Opção 1:** Usar diretamente `Pedido` com campos financeiros adicionados
**Opção 2:** Usar `Mesa` como agrupador lógico (se já existe)
**Opção 3:** Adiar página de balcão até backend estar pronto

**Preferimos Opção 1 ou 2 para não bloquear desenvolvimento.**

---

## ✅ AÇÕES SOLICITADAS

**Por favor, responder:**

- [ ] Confirmar se entidade Conta/UnidadeConsumo existe
- [ ] Fornecer estrutura JSON real (exemplo de response)
- [ ] Confirmar endpoints da lista acima
- [ ] Esclarecer estados financeiros (enum e valores)
- [ ] Explicar fluxo de débito automático de fundo
- [ ] Informar como consultar política pós-pago
- [ ] Validar regras de negócio listadas
- [ ] Sugerir alternativas se conceito divergir

**Prazo desejado:** 3-5 dias úteis  
**Prioridade:** Alta (página já implementada, aguardando backend)

---

## 📞 CONTATO

**Frontend Lead:** [Seu Nome]  
**Email/Slack:** [Contato]  
**Documentação Criada:** `/SOLICITACAO_BACKEND_CONTAS.md`

Aguardamos retorno para prosseguir com integração! 🚀

---

**Anexos:**
- `INTEGRACAO_PEDIDOS_BALCAO.md` - Documentação da integração frontend
- `PedidosBalcaoView.vue` - Componente implementado (1400+ linhas)
- `contasService.js` - Service preparado (54 linhas)
- `pedidosBalcaoService.js` - Service preparado (59 linhas)
