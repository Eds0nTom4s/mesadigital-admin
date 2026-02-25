# ANÁLISE DE GAPS - BACKEND vs FRONTEND
**Ref:** RESUMO_EXECUTIVO_FINALIZACAO.txt (Backend)  
**Data:** 25 de Fevereiro de 2026

---

## 📊 RESUMO EXECUTIVO

### Status Geral
| Área | Status | Criticidade | Ação Necessária |
|------|--------|-------------|-----------------|
| **1. Validação Cozinha Ativa** | ⚠️ Não Implementado | 🔴 ALTA | Implementar |
| **2. Limite Pós-Pago Dinâmico** | ⚠️ Parcial | 🟡 MÉDIA | Atualizar UI |
| **3. Valor Mínimo Operações** | ✅ Implementado | 🟢 BAIXA | OK |
| **4. Configurações Financeiras** | ⚠️ Parcial | 🟡 MÉDIA | Adicionar campos |
| **5. Tratamento de Erros** | ⚠️ Parcial | 🟡 MÉDIA | Mensagens específicas |

---

## 🔴 GAP #1 - VALIDAÇÃO DE COZINHA ATIVA (CRÍTICO)

### O que mudou no backend:
```java
// PedidoService.java - Nova validação (linhas ~138-143)
if (!cozinha.isAtiva()) {
    throw new BusinessException(
        "Cozinha " + cozinha.getNome() + " está inativa no momento"
    );
}
```

### Problema no Frontend:
❌ **Não há validação visual de cozinha inativa**
- Frontend mostra todos os produtos disponíveis
- Não verifica se a cozinha do produto está ativa
- Cliente pode adicionar produto ao carrinho
- Erro só aparece **DEPOIS** de tentar criar pedido

### Impacto:
- **UX Ruim:** Cliente adiciona produtos, preenche pedido, só descobre erro ao final
- **Confusão:** Mensagem de erro genérica não explica o problema
- **Suporte:** Aumento de chamados "por que não consigo fazer pedido?"

### Solução Necessária:

#### 1. Adicionar campo `cozinhaAtiva` no produto:

**Arquivo:** `src/services/produtosService.js`
```javascript
// Endpoint existente retorna produto com cozinha?
// Verificar se GET /api/produtos retorna:
{
  "id": 1,
  "nome": "Pizza Margherita",
  "preco": 4500,
  "disponivel": true,
  "ativo": true,
  "cozinha": {  // ← VERIFICAR SE EXISTE
    "id": 2,
    "nome": "Pizzaria",
    "ativa": true  // ← CAMPO CRÍTICO
  }
}
```

#### 2. Atualizar componentes de listagem de produtos:

**Arquivo:** `src/modules/produtos/ProdutosView.vue`
```vue
<template>
  <div v-for="produto in produtosFiltrados" :key="produto.id">
    <!-- Badge de indisponibilidade -->
    <div v-if="!produto.ativo" class="badge badge-error">
      Produto Inativo
    </div>
    <div v-else-if="!produto.cozinha?.ativa" class="badge badge-warning">
      ⚠️ Cozinha Temporariamente Fechada
    </div>
    
    <!-- Botão de adicionar -->
    <button 
      :disabled="!produto.ativo || !produto.cozinha?.ativa"
      @click="adicionarAoCarrinho(produto)"
    >
      Adicionar
    </button>
  </div>
</template>

<script setup>
const produtosFiltrados = computed(() => {
  return produtos.value.filter(p => 
    p.ativo && p.cozinha?.ativa // ← Filtro duplo
  )
})
</script>
```

#### 3. Adicionar validação no carrinho:

**Arquivo:** `src/components/pedidos/ModalNovoPedido.vue`
```javascript
const validarCozinhasAtivas = async () => {
  const cozinhasInativas = carrinho.value.filter(
    item => !item.produto.cozinha?.ativa
  )
  
  if (cozinhasInativas.length > 0) {
    const nomes = cozinhasInativas.map(i => i.produto.nome).join(', ')
    notificationStore.erro(
      `Cozinha temporariamente fechada. Remova os itens: ${nomes}`
    )
    return false
  }
  
  return true
}

const criarPedido = async () => {
  if (!await validarCozinhasAtivas()) return
  // ... resto do código
}
```

#### 4. Tratamento de erro específico:

**Arquivo:** `src/composables/usePedido.js`
```javascript
function handleError(err, context) {
  // ...
  if (err.response?.data?.message?.includes('Cozinha') && 
      err.response?.data?.message?.includes('inativa')) {
    message = '⚠️ Cozinha temporariamente fechada. Alguns produtos não estão disponíveis.'
    type = 'warning'
    
    // Sugerir recarregar produtos
    notificationStore.add({
      type: 'info',
      message: 'Recarregando lista de produtos...',
      duration: 2000
    })
    
    // Recarregar produtos após 2 segundos
    setTimeout(() => window.location.reload(), 2000)
  }
  // ...
}
```

---

## 🟡 GAP #2 - LIMITE PÓS-PAGO DINÂMICO

### O que mudou no backend:
```java
// ConfiguracaoFinanceiraSistema.java
@Column(name = "limite_pos_pago", nullable = false)
private BigDecimal limitePosPago; // Agora vem do banco, não hardcoded

// application.properties
financeiro.limite-pos-pago=500.00  // Bootstrap value
```

### Problema no Frontend:
⚠️ **Valor hardcoded no componente**

**Arquivo:** `src/components/pedidos/ModalNovoPedido.vue` (linha 306)
```javascript
const limitePosPago = ref(50000) // 500 AOA por padrão ← HARDCODED
```

**Arquivo:** `src/modules/configuracoes/ConfiguracoesView.vue` (linha 109)
```vue
<div class="limit-item">
  <span class="limit-label">Limite por Unidade de Consumo:</span>
  <span class="limit-value">500,00 AOA</span> ← HARDCODED
</div>
<p class="limit-note">
  <strong>Nota:</strong> Este limite é fixo no sistema. 
  Para alterá-lo, contate o suporte técnico. ← INFORMAÇÃO INCORRETA
</p>
```

### Solução Necessária:

#### 1. Adicionar campo na resposta de configuração:

**Backend deve retornar:**
```json
GET /api/configuracao-financeira
{
  "data": {
    "posPagoAtivo": true,
    "limitePosPago": 50000,  // ← ADICIONAR
    "valorMinimoOperacao": 1000,  // ← ADICIONAR
    "atualizadoEm": "2026-02-25T10:00:00",
    "atualizadoPorNome": "Admin",
    "atualizadoPorRole": "ADMIN"
  }
}
```

#### 2. Atualizar service para buscar valor:

**Arquivo:** `src/services/configuracaoFinanceiraService.js`
```javascript
/**
 * Buscar limite de pós-pago atual
 * GET /api/configuracao-financeira/limite-pos-pago
 */
async consultarLimitePosPago() {
  const response = await api.get('/configuracao-financeira/limite-pos-pago')
  return response.data?.data || response.data
}

/**
 * Atualizar limite de pós-pago (ADMIN apenas)
 * PUT /api/configuracao-financeira/limite-pos-pago
 */
async atualizarLimitePosPago(novoLimite) {
  const response = await api.put('/configuracao-financeira/limite-pos-pago', {
    limitePosPago: novoLimite
  })
  return response.data?.data || response.data
}
```

#### 3. Atualizar ConfiguracoesView.vue:

```vue
<template>
  <!-- Informações de Limite -->
  <div class="info-box">
    <div class="info-header">
      <span class="info-icon">💰</span>
      <h4>Limites Financeiros</h4>
    </div>
    <div class="info-content">
      <!-- Limite Pós-Pago -->
      <div class="limit-item">
        <span class="limit-label">Limite Pós-Pago por Unidade:</span>
        <span class="limit-value">{{ formatCurrency(configuracao.limitePosPago) }}</span>
        <button v-if="isAdmin" @click="editarLimitePosPago" class="btn-link">
          ✏️ Editar
        </button>
      </div>
      
      <!-- Valor Mínimo -->
      <div class="limit-item">
        <span class="limit-label">Valor Mínimo de Operações:</span>
        <span class="limit-value">{{ formatCurrency(configuracao.valorMinimoOperacao) }}</span>
        <button v-if="isAdmin" @click="editarValorMinimo" class="btn-link">
          ✏️ Editar
        </button>
      </div>
      
      <p class="limit-description">
        O limite de pós-pago define o valor máximo que uma mesa pode consumir 
        sem pagamento imediato. Após atingir este limite, será necessário 
        efetuar pagamento antes de novos pedidos.
      </p>
    </div>
  </div>
</template>

<script setup>
const editarLimitePosPago = () => {
  const novoLimite = prompt(
    'Novo limite de pós-pago (em centavos):',
    configuracao.value.limitePosPago
  )
  
  if (novoLimite && !isNaN(novoLimite)) {
    atualizarLimite(parseInt(novoLimite))
  }
}

const atualizarLimite = async (novoLimite) => {
  try {
    const response = await configuracaoFinanceiraService.atualizarLimitePosPago(novoLimite)
    configuracao.value.limitePosPago = response.limitePosPago
    notificationStore.sucesso('Limite atualizado com sucesso!')
  } catch (error) {
    notificationStore.erro('Erro ao atualizar limite')
  }
}
</script>
```

#### 4. Atualizar ModalNovoPedido.vue:

```javascript
// Buscar limite dinamicamente
const carregarLimitePosPago = async () => {
  try {
    const config = await configuracaoFinanceiraService.buscarConfiguracao()
    limitePosPago.value = config.data.limitePosPago
    console.log('[ModalNovoPedido] Limite pós-pago:', limitePosPago.value)
  } catch (error) {
    console.error('[ModalNovoPedido] Erro ao carregar limite:', error)
    // Manter valor padrão como fallback
  }
}

onMounted(() => {
  carregarLimitePosPago()
})
```

---

## 🟢 GAP #3 - VALOR MÍNIMO DE OPERAÇÕES (OK)

### Status: ✅ JÁ IMPLEMENTADO CORRETAMENTE

**Evidências:**
- `src/components/fundos/ModalCriarFundo.vue` - Consulta valor mínimo
- `src/components/fundos/ModalRecarregarFundo.vue` - Valida antes de recarga
- `src/modules/fundos/FundosView.vue` - Usa valor dinâmico

### Nenhuma ação necessária neste gap.

---

## 🟡 GAP #4 - CONFIGURAÇÕES FINANCEIRAS UI

### O que mudou no backend:
Backend agora persiste:
- `limitePosPago` (configurável)
- `valorMinimoOperacao` (configurável)
- Inicialização automática na primeira execução

### Problema no Frontend:
- Configurações exibem apenas **toggle pós-pago**
- Não exibem valor mínimo operações
- Não permitem edição de limites

### Solução Necessária:

Criar seção completa de configurações financeiras editáveis (já descrito no GAP #2).

---

## 🟡 GAP #5 - TRATAMENTO DE ERROS ESPECÍFICOS

### Erros do Backend que Frontend deve tratar especificamente:

| Erro Backend | Status HTTP | Tratamento Frontend Atual | Tratamento Necessário |
|--------------|-------------|---------------------------|----------------------|
| Cozinha inativa | 400 | ❌ Genérico | ⚠️ Mensagem específica + recarregar produtos |
| Limite pós-pago excedido | 400 | ✅ OK | ✅ OK |
| Valor abaixo do mínimo | 400 | ✅ OK | ✅ OK |
| Política pós-pago desativada | 403 | ✅ OK | ✅ OK |

### Código de exemplo para tratamento:

```javascript
// src/composables/usePedido.js
function handleError(err, context = '') {
  const message = err.response?.data?.message || ''
  
  // Cozinha inativa
  if (message.includes('Cozinha') && message.includes('inativa')) {
    notificationStore.erro(
      '⚠️ Cozinha temporariamente fechada',
      'Alguns produtos não estão disponíveis. Recarregando...'
    )
    setTimeout(() => window.location.reload(), 2000)
    return
  }
  
  // Limite pós-pago excedido
  if (message.includes('Limite de pós-pago atingido')) {
    notificationStore.erro(
      '💳 Limite de crédito atingido',
      'Efetue o pagamento antes de fazer novos pedidos'
    )
    return
  }
  
  // Valor mínimo não atingido
  if (message.includes('Valor mínimo') || message.includes('valorMinimo')) {
    const match = message.match(/(\d+[.,]\d+)/)
    const valorMinimo = match ? match[1] : '10,00'
    notificationStore.aviso(
      `Valor mínimo: ${valorMinimo} AOA`,
      'Adicione mais itens ao pedido'
    )
    return
  }
  
  // Erro genérico
  notificationStore.erro(message || 'Erro ao processar operação')
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Alta Prioridade (Fazer Primeiro)
- [ ] **GAP #1.1** - Verificar se API retorna `cozinha.ativa` nos produtos
- [ ] **GAP #1.2** - Adicionar filtro de cozinha ativa na listagem
- [ ] **GAP #1.3** - Desabilitar botão "Adicionar" se cozinha inativa
- [ ] **GAP #1.4** - Validar cozinhas ativas antes de criar pedido
- [ ] **GAP #1.5** - Adicionar mensagem específica para erro de cozinha inativa

### Média Prioridade
- [ ] **GAP #2.1** - Criar endpoint GET `/api/configuracao-financeira/limite-pos-pago`
- [ ] **GAP #2.2** - Atualizar `configuracaoFinanceiraService.js`
- [ ] **GAP #2.3** - Atualizar `ConfiguracoesView.vue` com campos editáveis
- [ ] **GAP #2.4** - Remover valores hardcoded de `ModalNovoPedido.vue`
- [ ] **GAP #2.5** - Adicionar modal de edição de limites financeiros

### Baixa Prioridade (Nice to Have)
- [ ] **GAP #4.1** - Adicionar histórico de alterações de configurações
- [ ] **GAP #4.2** - Adicionar confirmação com senha para alterações críticas
- [ ] **GAP #4.3** - Criar dashboard de configurações com gráficos

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### Fase 1: Validação e Planejamento (30min)
1. Verificar se `/api/produtos` retorna `cozinha.ativa`
2. Verificar se `/api/configuracao-financeira` retorna `limitePosPago` e `valorMinimoOperacao`
3. Se NÃO retornar, criar issues para backend implementar

### Fase 2: Implementação Frontend (2-3h)
1. Implementar GAP #1 (Cozinha Ativa) - 1h
2. Implementar GAP #2 (Limite Dinâmico) - 1h
3. Implementar GAP #5 (Tratamento Erros) - 30min
4. Testes manuais - 30min

### Fase 3: Validação Integrada (1h)
1. Testar com backend atualizado
2. Testar cenários de erro
3. Validar UX dos novos fluxos
4. Documentar mudanças

---

## 📊 IMPACTO ESTIMADO

| Gap | Impacto UX | Impacto Técnico | Esforço | Prioridade |
|-----|------------|-----------------|---------|------------|
| #1 Cozinha Ativa | 🔴 Alto | 🟡 Médio | 2h | 🔴 Crítico |
| #2 Limite Dinâmico | 🟡 Médio | 🟢 Baixo | 1h | 🟡 Importante |
| #3 Valor Mínimo | ✅ N/A | ✅ N/A | - | ✅ OK |
| #4 Config UI | 🟢 Baixo | 🟡 Médio | 2h | 🟢 Nice to Have |
| #5 Erros | 🟡 Médio | 🟢 Baixo | 30min | 🟡 Importante |

---

## 🚀 CONCLUSÃO

O frontend está **substancialmente alinhado** com o backend, mas precisa de **ajustes pontuais** para refletir as novas funcionalidades implementadas no backend.

**Prioridade Máxima:** GAP #1 (Validação Cozinha Ativa)  
**Próxima Ação:** Verificar APIs e iniciar implementação
