# Documentação - Integração Backend Página Pedidos Balcão

**Data:** 20/02/2026  
**Componente:** `PedidosBalcaoView.vue`  
**Status:** ✅ Integrado com Backend

---

## 📋 Resumo

A página de gestão de pedidos no balcão foi **totalmente integrada com o backend**, substituindo dados mockados por chamadas reais à API REST.

## 🔗 Serviços Criados

### 1. **contasService.js**
Gerencia contas (mesas/comandas) abertas no sistema.

**Endpoints:**
- `GET /api/contas/abertas` - Lista contas abertas
- `GET /api/contas/{id}` - Busca conta por ID
- `POST /api/contas` - Cria nova conta
- `PUT /api/contas/{id}/fechar` - Fecha conta
- `GET /api/contas/{id}/resumo` - Resumo financeiro

### 2. **produtosService.js**
Gerencia catálogo de produtos disponíveis.

**Endpoints:**
- `GET /api/produtos` - Lista todos produtos
- `GET /api/produtos/disponiveis` - Apenas disponíveis
- `GET /api/produtos/{id}` - Por ID
- `GET /api/produtos/codigo/{codigo}` - Por código
- `POST /api/produtos` - Criar produto
- `PUT /api/produtos/{id}` - Atualizar produto
- `PATCH /api/produtos/{id}/disponibilidade` - Alterar disponibilidade

### 3. **pedidosBalcaoService.js**
Gerencia pedidos específicos para operação de balcão.

**Endpoints:**
- `POST /api/pedidos` - Criar pedido para conta
- `GET /api/pedidos/conta/{contaId}` - Pedidos de uma conta
- `POST /api/pedidos/{id}/pagar` - Pagar pedido
- `PUT /api/pedidos/{id}/cancelar` - Cancelar pedido
- `GET /api/pedidos/{id}` - Detalhes do pedido

---

## 🎯 Funcionalidades Integradas

### ✅ Carregamento Inicial
```javascript
onMounted(async () => {
  await Promise.all([
    carregarContas(),     // GET /api/contas/abertas
    carregarProdutos()    // GET /api/produtos/disponiveis
  ])
})
```

### ✅ Criar Pedido com Fundo
**Fluxo Automático:**
1. Verificar se conta tem fundo suficiente
2. `POST /api/pedidos` com `{ contaId, itens: [{produtoId, quantidade}] }`
3. Backend debita automaticamente do fundo
4. Recarrega dados da conta atualizada

**Código:**
```javascript
const criarPedidoComFundo = async () => {
  const dadosPedido = {
    contaId: contaSelecionada.value.id,
    itens: carrinhoItens.value.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade
    }))
  }
  
  const response = await pedidosBalcaoService.criar(dadosPedido)
  await carregarDetalhesConta(contaSelecionada.value.id)
}
```

### ✅ Criar Pedido e Pagar
**Fluxo Manual (sem fundo suficiente):**
1. `POST /api/pedidos` - Cria pedido
2. `POST /api/pedidos/{id}/pagar` - Processa pagamento
3. Métodos suportados: `GPO`, `REFERENCIA`, `MULTICAIXA`, `POS_PAGO`

**Código:**
```javascript
const pagarAgora = async (metodo) => {
  // Criar pedido
  const responsePedido = await pedidosBalcaoService.criar(dadosPedido)
  const pedidoCriado = responsePedido.data
  
  // Pagar (se não for pós-pago)
  if (metodo !== 'POS_PAGO') {
    const pagamento = {
      metodoPagamento: metodo,
      valor: totalCarrinho.value
    }
    await pedidosBalcaoService.pagar(pedidoCriado.id, pagamento)
  }
}
```

### ✅ Fechar Conta
**Validações:**
- ❌ Bloqueia se `totalPendente > 0`
- ⚠️ Avisa se existem pedidos não entregues
- ✅ Permite se tudo pago

**Código:**
```javascript
const confirmarFecharConta = async () => {
  await contasService.fechar(contaSelecionada.value.id)
  // Remove da lista local
  contas.value.splice(index, 1)
}
```

### ✅ Atualizar Dados
**Refresh manual:**
```javascript
const carregarContas = async () => {
  const response = await contasService.getAbertas()
  contas.value = response.data || []
}
```

**Atualização automática após ações:**
```javascript
const carregarDetalhesConta = async (contaId) => {
  const response = await contasService.getById(contaId)
  const contaAtualizada = response.data
  
  // Atualiza na lista e na seleção
  contas.value[index] = contaAtualizada
  if (contaSelecionada.value?.id === contaId) {
    contaSelecionada.value = contaAtualizada
  }
}
```

---

## 🔄 Estados de Loading

### Indicadores Implementados:
1. **Lista de Contas:** Spinner + mensagem durante carregamento
2. **Produtos no Modal:** Spinner pequeno enquanto busca catálogo
3. **Botão Finalizar Pedido:** Desabilitado + texto "Processando..."
4. **Botão Atualizar:** Desabilitado durante refresh

### Empty States:
- Nenhuma conta aberta
- Nenhum produto disponível
- Busca sem resultados
- Conta sem pedidos

---

## 🧪 Formato de Resposta Esperado

### Conta (GET /api/contas/abertas)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "identificador": "Mesa 10",
      "tipo": "MESA",
      "aberturaEm": "2026-02-20T18:30:00",
      "fundoConsumo": {
        "id": 1,
        "saldoAtual": 15000,
        "valorInicial": 20000
      },
      "totalConsumido": 5000,
      "totalPago": 5000,
      "totalPendente": 0,
      "statusFinanceiro": "PAGO",
      "pedidos": [...]
    }
  ]
}
```

### Produto (GET /api/produtos/disponiveis)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "PROD-001",
      "nome": "Hambúrguer Clássico",
      "preco": 2500,
      "disponivel": true
    }
  ]
}
```

### Pedido Criado (POST /api/pedidos)
```json
{
  "success": true,
  "data": {
    "id": 101,
    "numero": "PED-101",
    "contaId": 1,
    "criadoEm": "2026-02-20T19:30:00",
    "estadoOperacional": "CRIADO",
    "estadoFinanceiro": "PAGO",
    "total": 5000,
    "itens": [...]
  }
}
```

---

## 🛡️ Tratamento de Erros

### Por Função:

**carregarContas():**
- Catch: Exibe notificação erro
- Fallback: `contas.value = []`
- Console: Log detalhado do erro

**carregarProdutos():**
- Catch: Notificação erro
- Fallback: `produtosDisponiveis.value = []`

**criarPedidoComFundo():**
- Catch: Notificação com mensagem do backend
- Não limpa carrinho (permite correção)

**pagarAgora():**
- Catch: Notificação com erro específico
- Rollback: Não altera estado local

**confirmarFecharConta():**
- Catch: Notificação + mantém modal aberto
- Validação prévia de pendências

### Estrutura de Erro:
```javascript
try {
  const response = await service.metodo()
  // Sucesso
} catch (error) {
  console.error('[PedidosBalcao] Contexto:', error)
  notificationStore.erro(
    error.response?.data?.message || 'Mensagem genérica'
  )
} finally {
  loading.value = false
}
```

---

## 📦 Dependências

**Imports necessários:**
```javascript
import contasService from '@/services/contasService'
import produtosService from '@/services/produtosService'
import pedidosBalcaoService from '@/services/pedidosBalcaoService'
import fundoConsumoService from '@/services/fundoConsumoService'
```

**Stores:**
- `useNotificationStore` - Toast messages
- `useAuthStore` - Permissões (futuro)
- `useCurrency` - Formatação AOA

---

## 🔐 Autenticação

**Token JWT:**
- Gerenciado automaticamente por `api.js`
- Request interceptor adiciona `Authorization: Bearer {token}`
- Token obtido de `sessionStorage.getItem('auth_token')`

**Sem autenticação:**
- Todas as chamadas retornarão `401 Unauthorized`
- Usuário será redirecionado para login (via router guard)

---

## 🚀 Próximos Passos

### Backend Necessário:
1. ✅ **Implementar endpoints de contas** (`/api/contas/*`)
2. ✅ **Implementar gestão de fundo automático** (débito em `POST /api/pedidos`)
3. ✅ **Endpoint de produtos disponíveis**
4. ⏳ **WebSocket para updates em tempo real** (opcional)

### Frontend Futuro:
1. ⏳ Recarga de fundo integrada
2. ⏳ Histórico de transações
3. ⏳ Filtros avançados (por status, data)
4. ⏳ Impressão de comandas
5. ⏳ Notificações push de novos pedidos

---

## 📝 Notas Técnicas

### Performance:
- Carregamento paralelo de contas + produtos (`Promise.all`)
- Loading states evitam múltiplos cliques
- Atualizações locais após cada ação (evita reload desnecessário)

### UX:
- Validações bloqueiam ações inválidas (fundo insuficiente, conta com débito)
- Mensagens de erro contextualizadas
- Feedback visual de sucesso/erro
- Botão refresh manual disponível

### DDD:
- **UI não decide estados** - apenas lê estados derivados do backend
- **Regras de negócio no backend** - frontend apenas valida UX
- **Estados financeiros calculados** - `statusFinanceiro`, `totalPendente` vêm da API

---

## ✅ Checklist de Integração

- [x] Criar serviços de API (contas, produtos, pedidos)
- [x] Substituir dados mockados por chamadas reais
- [x] Adicionar estados de loading
- [x] Implementar tratamento de erros
- [x] Adicionar empty states
- [x] Validações de regras de negócio
- [x] Integração com sistema de notificações
- [x] Atualização automática após ações
- [x] Botão de refresh manual
- [x] Documentação completa

---

**Status Final:** ✅ **100% Integrado e Pronto para Testes com Backend Real**
