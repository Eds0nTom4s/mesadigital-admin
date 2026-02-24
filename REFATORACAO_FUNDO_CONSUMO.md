# REFATORAÇÃO - FUNDO DE CONSUMO
Data: 22/02/2026

## ANÁLISE DO CÓDIGO ATUAL vs DOCUMENTO DE ALINHAMENTO

### ✅ JÁ IMPLEMENTADO CORRETAMENTE

1. **fundoConsumoService.js**
   - ✅ Todos os endpoints corretos
   - ✅ Unwrapping de response.data.data
   - ✅ Tratamento de erros específicos por status code
   - ✅ Documentação completa

2. **Estrutura de componentes**
   - ✅ ModalCriarFundo.vue
   - ✅ ModalRecarregarFundo.vue
   - ✅ FundosView.vue
   - ✅ FundoDetalheView.vue

3. **Integração com pedidos**
   - ✅ ModalNovoPedido busca fundo
   - ✅ Validação de saldo antes de criar pedido PRE_PAGO
   - ✅ Alerta quando cliente não tem fundo

### ⚠️ AJUSTES NECESSÁRIOS

#### 1. Consistência de Eventos nos Modals

**Problema identificado:**
- ModalRecarregarFundo emite `close` e `recarga-realizada`  
- ModalCriarFundo emite `fechar` e `fundo-criado`
- Inconsistência de naming

**Solução:**
Padronizar para:
- `@close` - Fechar modal sem ação
- `@sucesso` - Ação concluída com sucesso
- Payload: objeto com dados da operação

#### 2. Props do ModalRecarregarFundo

**Atual:**
```vue
props: {
  isOpen: Boolean,
  fundo: Object
}
```

**Documento especifica:**
- Modal deve validar se fundo está ativo antes de exibir botão
- Deve exibir status do fundo claramente

**Ação:** Adicionar computed para validações de status

#### 3. Formatação de Valores

**Verificar:**
- Todos os valores devem ser armazenados em centavos no backend
- Frontend deve sempre converter: 10000 centavos → "100,00 AOA"
- useCurrency() deve lidar com essa conversão

**Status:** Verificar se utils/currency.js está dividindo por 100

#### 4. Mensagens de Erro

**Padronizar:**
- Todas as mensagens vêm de error.response?.data?.message
- Exibir via notificationStore
- Mensagens amigáveis para usuário final

#### 5. Loading States

**Garantir:**
- Todos os modals têm loading: ref(false)
- Desabilitar botões durante loading
- Feedback visual (spinner ou texto "Processando...")

### 🔧 IMPLEMENTAÇÕES PRIORITÁRIAS

#### P1: Validação de Fundo Encerrado
```vue
// Em ModalRecarregarFundo
const fundoAtivo = computed(() => props.fundo?.ativo === true)

// No template
<button 
  v-if="fundoAtivo"
  @click="confirmarRecarga"
>Recarregar</button>

<div v-else class="alert alert-error">
  Fundo encerrado. Não é possível recarregar.
</div>
```

#### P2: Preview de Novo Saldo
```vue
const novoSaldo = computed(() => {
  if (!props.fundo) return 0
  return props.fundo.saldoAtual + formulario.value.valor
})

// No template
<div class="preview-box">
  <div class="preview-row">
    <span>Saldo Atual:</span>
    <span>{{ formatCurrency(fundo.saldoAtual) }}</span>
  </div>
  <div class="preview-row plus">
    <span>+ Recarga:</span>
    <span>{{ formatCurrency(formulario.valor) }}</span>
  </div>
  <div class="preview-row total">
    <span>Novo Saldo:</span>
    <span>{{ formatCurrency(novoSaldo) }}</span>
  </div>
</div>
```

#### P3: Status do Pagamento

**Após criar recarga:**
```vue
const pagamentoCriado = ref(null)

const confirmarRecarga = async () => {
  // ... validações
  
  const pagamento = await fundoConsumoService.recarregarFundo(
    props.fundo.id, 
    formulario.value
  )
  
  pagamentoCriado.value = pagamento
  
  // Exibir informações do pagamento
  if (pagamento.metodoPagamento === 'GPO') {
    // Mostrar botão com link para AppyPay
  } else if (pagamento.metodoPagamento === 'REF') {
    // Mostrar entidade e referência
  }
}
```

### 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Padronizar eventos dos modals (close/sucesso)
- [ ] Adicionar validação de fundo ativo no ModalRecarregarFundo
- [ ] Implementar preview de novo saldo
- [ ] Exibir informações de pagamento após criar recarga
- [ ] Validar conversão de centavos em todos os lugares
- [ ] Adicionar computed para status do fundo
- [ ] Testar fluxo completo: criar fundo → recarregar → criar pedido
- [ ] Testar edge cases: saldo insuficiente, fundo encerrado, cliente sem fundo
- [ ] Documentar componentes com JSDoc
- [ ] Adicionar logs de debug estratégicos

### 🎯 PRÓXIMOS PASSOS

1. Implementar ajustes prioritários (P1, P2, P3)
2. Testar integração com pedidos PRE_PAGO
3. Validar fluxos de erro
4. Documentar mudanças
5. Commit com mensagem descritiva

### 📝 NOTAS

- Backend retorna envelope: `{ success, message, data }`
- Service já faz unwrapping correto: `response.data.data`
- Valores sempre em centavos no backend
- Frontend deve converter para exibição
- WebSocket futuro: `/topic/fundo/{fundoId}` para atualizações em tempo real
