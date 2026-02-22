# ✅ MIGRAÇÃO CONCLUÍDA: FUNDO_CONSUMO → PRE_PAGO

## 📋 Resumo da Mudança

**Backend reportou:** O enum de formas de pagamento foi refatorado:

### ❌ ANTIGO (Removido)
- `FUNDO_CONSUMO` - Pagamento via fundo de consumo

### ✅ NOVO (Implementado)
- `PRE_PAGO` - Débito automático do fundo de consumo
- `POS_PAGO` - Pagamento posterior (apenas GERENTE/ADMIN)

---

## 🔧 Arquivos Atualizados

### 1️⃣ **Tipos e Enums** (`src/utils/pedido.types.js`)
```javascript
// ANTES
FORMA_PAGAMENTO = {
  FUNDO_CONSUMO: 'FUNDO_CONSUMO',
  DINHEIRO: 'DINHEIRO',
  ...
}

// DEPOIS
FORMA_PAGAMENTO = {
  PRE_PAGO: 'PRE_PAGO',      // ✅ Novo
  POS_PAGO: 'POS_PAGO',      // ✅ Novo
  DINHEIRO: 'DINHEIRO',
  ...
}
```

**Labels atualizados:**
- `PRE_PAGO` → "Pré-Pago (Fundo)"
- `POS_PAGO` → "Pós-Pago"

**Ícones:**
- `PRE_PAGO` → 💳
- `POS_PAGO` → 📋

---

### 2️⃣ **API Layer** (`src/api/pedido.api.js`)
```javascript
// Documentação atualizada
@param {string} payload.formaPagamento - 'PRE_PAGO' | 'POS_PAGO' | 'DINHEIRO' | 'CARTAO' | 'PIX'
```

---

### 3️⃣ **Service Layer** (`src/services/pedido.service.js`)
```javascript
// ANTES
if (dados.formaPagamento === FORMA_PAGAMENTO.FUNDO_CONSUMO) {
  // valida saldo
}

// DEPOIS
if (dados.formaPagamento === FORMA_PAGAMENTO.PRE_PAGO) {
  // valida saldo
}
```

---

### 4️⃣ **Componentes**

#### `src/components/pedidos/ModalNovoPedido.vue`
```javascript
// Valor padrão
const tipoPagamento = ref('PRE_PAGO')  // ✅ Alterado

// Radio button
<input value="PRE_PAGO" />  // ✅ Alterado

// Validações
if (tipoPagamento.value === 'PRE_PAGO') {  // ✅ Alterado
  // valida saldo
}
```

#### `src/components/pedidos/PedidoEditor.vue`
```javascript
// Exemplo de uso
const formas = {
  '1': 'PRE_PAGO',  // ✅ Alterado
  '2': 'POS_PAGO',  // ✅ Novo
  '3': 'DINHEIRO',
  ...
}
```

---

## 🧪 Testes Necessários

### ✅ Cenários para Testar:

1. **Criar pedido com PRE_PAGO**
   ```json
   POST /api/pedidos
   {
     "unidadeConsumoId": 5,
     "tipoPagamento": "PRE_PAGO",
     "itens": [...]
   }
   ```
   - ✅ Deve debitar automaticamente do fundo
   - ✅ Deve validar saldo antes de criar

2. **Criar pedido com POS_PAGO**
   ```json
   POST /api/pedidos
   {
     "unidadeConsumoId": 5,
     "tipoPagamento": "POS_PAGO",
     "itens": [...]
   }
   ```
   - ✅ Deve criar sem debitar fundo
   - ✅ Apenas GERENTE/ADMIN deve ter permissão

3. **Validação de saldo insuficiente**
   - Cliente com saldo R$ 50,00
   - Pedido de R$ 100,00 com `PRE_PAGO`
   - ✅ Deve retornar erro 400

4. **Modal de criação de pedido**
   - ✅ Radio button "Pré-Pago (Fundo)" deve aparecer
   - ✅ Radio button "Pós-Pago" deve aparecer
   - ✅ Seleção padrão: PRE_PAGO (se tem fundo)

---

## 📊 Impacto

### Compatibilidade com Backend ✅
- Frontend agora envia `PRE_PAGO` nas requisições
- Backend espera `PRE_PAGO` e `POS_PAGO`
- **Compatível com a refatoração reportada**

### Breaking Changes ⚠️
- Código antigo usando `FUNDO_CONSUMO` não funcionará mais
- Cache do navegador pode ter valores antigos (limpar cache)

### Migração de Dados 🗄️
- **Não necessária no frontend** (apenas enums)
- Backend deve ter migrado registros antigos

---

## 🚀 Deploy

### Checklist Pré-Deploy:
- [x] Enum atualizado em `pedido.types.js`
- [x] Validações atualizadas em `pedido.service.js`
- [x] Componentes atualizados
- [x] Documentação atualizada
- [ ] Testes funcionais executados
- [ ] Validação com backend em ambiente de dev

### Comandos:
```bash
# Limpar cache de build
rm -rf node_modules/.vite
rm -rf dist

# Rebuild
npm run build

# Deploy
# (seu processo de deploy aqui)
```

---

## 📝 Notas Adicionais

### Labels Legíveis:
Para exibição ao usuário, use `FORMA_PAGAMENTO_LABEL`:
```javascript
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_LABEL } from '@/utils/pedido.types'

// Exibe: "Pré-Pago (Fundo)"
const label = FORMA_PAGAMENTO_LABEL[FORMA_PAGAMENTO.PRE_PAGO]
```

### Validação de Permissões:
`POS_PAGO` deve ser restrito a:
- ✅ GERENTE
- ✅ ADMIN

Implementar no componente:
```javascript
const canUsarPosPago = computed(() => {
  return authStore.isGerente || authStore.isAdmin
})
```

---

## 🐛 Troubleshooting

### Erro: "tipoPagamento inválido"
- **Causa:** Cache do navegador com valor antigo `FUNDO_CONSUMO`
- **Solução:** Ctrl + Shift + R (hard refresh) ou limpar localStorage

### Erro 400: "Forma de pagamento não suportada"
- **Causa:** Backend ainda não deployado com novos enums
- **Solução:** Aguardar deploy do backend ou reverter frontend

### Modal não exibe "Pré-Pago"
- **Causa:** Componente em cache
- **Solução:** Restartar servidor dev (`npm run dev`)

---

**Data da Migração:** 22/02/2026  
**Versão:** 1.0.0  
**Status:** ✅ CONCLUÍDA
