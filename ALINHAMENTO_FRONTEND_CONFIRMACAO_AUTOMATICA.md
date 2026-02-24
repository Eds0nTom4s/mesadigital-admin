# ALINHAMENTO FRONTEND - Confirmação Automática de Pedidos

**Data:** 24 de Fevereiro de 2026  
**Referência:** [IMPLEMENTACAO_CONFIRMACAO_AUTOMATICA_PEDIDOS.md](IMPLEMENTACAO_CONFIRMACAO_AUTOMATICA_PEDIDOS.md)

---

## ✅ ALTERAÇÕES IMPLEMENTADAS NO FRONTEND

### 1. **Novos Eventos WebSocket**

#### Adicionados em `usePedidoWebSocket.js`:

**a) `PEDIDO_LIBERADO_AUTOMATICAMENTE`**
- **Quando:** Backend confirma pedido automaticamente (dentro do limite)
- **Destinatários:** Cozinha + Gerente
- **Payload:**
```javascript
{
  tipo: "PEDIDO_LIBERADO_AUTOMATICAMENTE",
  pedidoNumero: "PED-20260224-001",
  pedidoId: 123,
  subPedidoNumero: "PED-20260224-001-1",
  subPedidoId: 456,
  status: "PENDENTE",
  totalItens: 3,
  timestamp: "2026-02-24T20:15:00"
}
```

**b) `PEDIDO_BLOQUEADO_POR_LIMITE`**
- **Quando:** Pedido excede limite de pós-pago
- **Destinatários:** Gerente (alerta crítico)
- **Payload:**
```javascript
{
  tipo: "PEDIDO_BLOQUEADO_POR_LIMITE",
  severidade: "ALTA",
  pedidoNumero: "PED-20260224-002",
  pedidoId: 124,
  total: 150.00,
  tipoPagamento: "POS_PAGO",
  unidadeConsumoReferencia: "MESA-05",
  mensagem: "Limite de pós-pago atingido...",
  timestamp: "2026-02-24T20:16:00"
}
```

---

### 2. **Nova Função: `inscreverGerente()`**

```javascript
// Uso no componente de gerente/dashboard
const { inscreverGerente } = usePedidoWebSocket({
  onPedidoLiberado: (notificacao) => {
    // Pedido confirmado automaticamente
    console.log('✅ Pedido liberado:', notificacao.pedidoNumero)
    // Atualizar lista de pedidos
  },
  onPedidoBloqueado: (notificacao) => {
    // ALERTA: Pedido bloqueado por limite
    console.warn('⚠️ Pedido bloqueado:', notificacao.pedidoNumero)
    // Mostrar modal de confirmação de pagamento
  }
})

onMounted(() => {
  inscreverGerente()
})
```

---

### 3. **Atualização: `inscreverCozinha()`**

Agora detecta pedidos liberados automaticamente:

```javascript
const { inscreverCozinha } = usePedidoWebSocket({
  onPedidoLiberado: (notificacao) => {
    // Novo pedido chegou (liberado automaticamente)
    tocarSomNovoP pedido()
    adicionarPedidoNaFila(notificacao)
  }
})
```

---

### 4. **Arquivo de Constantes: `statusPedidos.js`**

Criado para centralizar:
- ✅ Status de Pedido e SubPedido
- ✅ Cores e ícones para badges
- ✅ Labels amigáveis
- ✅ Helpers de validação

**Exemplo de uso:**
```javascript
import { STATUS_SUBPEDIDO, CORES_STATUS_SUBPEDIDO, pedidoBloqueado } from '@/constants/statusPedidos'

// Badge de status
const cor = CORES_STATUS_SUBPEDIDO[subPedido.status]
<span :class="`${cor.bg} ${cor.text}`">
  {{ cor.icon }} {{ subPedido.status }}
</span>

// Verificar se pedido está bloqueado
if (pedidoBloqueado(pedido)) {
  mostrarAvisoLimiteExcedido()
}
```

---

### 5. **Notificações do Navegador**

Implementadas 3 tipos:

**a) Pedido Liberado:**
```
✅ Pedido Confirmado Automaticamente
PED-20260224-001 liberado para produção
```

**b) Limite Excedido:**
```
⚠️ Pedido Bloqueado - Limite Excedido
PED-20260224-002 - Total: 150.00
Aguarda confirmação de pagamento.
[requireInteraction: true - não desaparece]
```

**c) SubPedido Pronto:**
```
🍽️ SubPedido Pronto!
PED-20260224-001-1 pronto para retirada na Cozinha A
```

---

## 🔄 FLUXO COMPLETO NO FRONTEND

### Cenário 1: Pedido PRÉ-PAGO

```
Cliente → Cria pedido
↓
Backend → Valida saldo + Confirma automaticamente
↓
WebSocket → PEDIDO_LIBERADO_AUTOMATICAMENTE
↓
Frontend Cozinha → 🔔 Novo pedido! (som + notificação)
Frontend Gerente → 📊 Pedido #X confirmado
```

### Cenário 2: Pedido PÓS-PAGO (Dentro do Limite)

```
Gerente → Cria pedido pós-pago
↓
Backend → Calcula limite + Confirma automaticamente
↓
WebSocket → PEDIDO_LIBERADO_AUTOMATICAMENTE
↓
Frontend Cozinha → 🔔 Novo pedido!
Frontend Gerente → ✅ Pedido confirmado (sem ação manual)
```

### Cenário 3: Pedido PÓS-PAGO (Limite Excedido)

```
Gerente → Cria pedido pós-pago
↓
Backend → Limite excedido! Bloqueia em CRIADO
↓
WebSocket → PEDIDO_BLOQUEADO_POR_LIMITE
↓
Frontend Gerente → ⚠️ ALERTA CRÍTICO
                   "Pedido aguarda confirmação de pagamento"
                   [Modal com opções: Confirmar Pagamento | Cancelar]
↓
Gerente → Confirma pagamento manualmente
↓
Backend → Libera pedido → PENDENTE
↓
Frontend Cozinha → 🔔 Pedido liberado!
```

---

## 🎯 COMPONENTES QUE DEVEM USAR OS NOVOS EVENTOS

### 1. **DashboardView.vue** (Painel Gerente)
```javascript
const { inscreverGerente } = usePedidoWebSocket({
  onPedidoBloqueado: (notificacao) => {
    // Mostrar badge vermelho com contador de bloqueados
    pedidosBloqueados.value.push(notificacao)
    mostrarModalConfirmarPagamento(notificacao.pedidoId)
  }
})
```

### 2. **PedidosBalcaoView.vue** (Tela de Cozinha)
```javascript
const { inscreverCozinha } = usePedidoWebSocket({
  onPedidoLiberado: (notificacao) => {
    // Som de alerta + adicionar na fila
    tocarSom()
    carregarPedidos()
  }
})
```

### 3. **ModalDetalhesPedido.vue**
```javascript
// Exibir status correto
import { STATUS_SUBPEDIDO, LABELS_STATUS_SUBPEDIDO } from '@/constants/statusPedidos'

// Badge amarelo para CRIADO (aguardando validação)
if (subPedido.status === STATUS_SUBPEDIDO.CRIADO) {
  <span class="badge-amarelo">
    ⏳ Aguardando Validação
  </span>
}
```

---

## 📋 CHECKLIST DE INTEGRAÇÃO

- [x] `usePedidoWebSocket.js` atualizado com novos eventos
- [x] `inscreverGerente()` implementado
- [x] `inscreverCozinha()` atualizado
- [x] Notificações do navegador implementadas
- [x] Constantes de status criadas (`statusPedidos.js`)
- [ ] DashboardView.vue usando `inscreverGerente()`
- [ ] PedidosBalcaoView.vue usando eventos de confirmação
- [ ] Modal de confirmação de pagamento (pedidos bloqueados)
- [ ] Badge visual para pedidos em CRIADO (aguardando)
- [ ] Sons de alerta diferenciados (liberado vs bloqueado)
- [ ] Testes E2E do fluxo completo

---

## 🚀 PRÓXIMOS PASSOS

1. **Atualizar DashboardView.vue:**
   - Adicionar seção "Pedidos Aguardando Confirmação"
   - Mostrar contador de pedidos bloqueados
   - Modal para confirmar pagamento

2. **Atualizar PedidosBalcaoView.vue:**
   - Detectar pedidos liberados automaticamente
   - Tocar som diferenciado

3. **Criar ModalConfirmarPagamento.vue:**
   - Exibir detalhes do pedido bloqueado
   - Opções: Confirmar Pagamento | Cancelar Pedido
   - Chamar `POST /api/pedidos/{id}/confirmar-pagamento`

4. **Testar Fluxo Completo:**
   - Criar pedido pré-pago → Verificar confirmação automática
   - Criar pedido pós-pago (dentro limite) → Verificar confirmação automática
   - Criar pedido pós-pago (fora limite) → Verificar bloqueio + alerta

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [IMPLEMENTACAO_CONFIRMACAO_AUTOMATICA_PEDIDOS.md](IMPLEMENTACAO_CONFIRMACAO_AUTOMATICA_PEDIDOS.md) - Backend
- [usePedidoWebSocket.js](src/composables/usePedidoWebSocket.js) - WebSocket composable
- [statusPedidos.js](src/constants/statusPedidos.js) - Constantes e helpers

---

**Implementado em:** 24/02/2026  
**Próxima revisão:** Após testes E2E
