# Ajustes Frontend - Pós Respostas do Backend

**Data:** 23 de fevereiro de 2026  
**Referência:** RESPOSTAS_BACKEND_CONFIG_FINANCEIRA.md

---

## ✅ Compatibilidade Verificada

O frontend já estava **99% compatível** com as respostas do backend. As seguintes configurações estão corretas:

1. ✅ **Formato de Data:** ISO 8601 (`LocalDateTime`) - O método `formatData()` já funciona corretamente
2. ✅ **Estrutura do Response:** O código já espera `posPagoAtivo`, `atualizadoEm`, `atualizadoPorNome`, `atualizadoPorRole`
3. ✅ **Códigos HTTP:** Já trata 200 (sucesso), 403 (sem permissão)
4. ✅ **Permissões:** Validação `isAdmin` já implementada
5. ✅ **Reversão do Switch:** Em caso de erro, o switch é revertido automaticamente

---

## 🔧 Ajustes Realizados

### 1. Documentação do Limite Fixo
**Arquivo:** `src/modules/configuracoes/ConfiguracoesView.vue`

**Alteração:** Adicionado aviso de que o limite de 500 AOA é fixo:

```html
<p class="limit-note">
  <strong>Nota:</strong> Este limite é fixo no sistema. 
  Para alterá-lo, contate o suporte técnico.
</p>
```

**Justificativa:** Backend respondeu que `limitePosPago` NÃO vem no response e é uma constante fixa (500.00 AOA).

---

### 2. Tratamento de Erro 401
**Arquivo:** `src/modules/configuracoes/ConfiguracoesView.vue`

**Alteração:** Adicionado tratamento para sessão expirada:

```javascript
} else if (error.response?.status === 401) {
  notificationStore.erro('Sessão expirada. Faça login novamente')
}
```

**Justificativa:** Backend pode retornar 401 se o token JWT expirar.

---

### 3. Tratamento de Erro 400
**Arquivo:** `src/modules/configuracoes/ConfiguracoesView.vue`

**Alteração:** Adicionado tratamento para erros de validação:

```javascript
} else if (error.response?.status === 400) {
  notificationStore.erro(error.response?.data?.message || 'Erro de validação ao alterar configuração')
}
```

**Justificativa:** Backend retorna 400 para `PosPagoDesabilitadoException` e `LimitePosPagoExcedidoException`.

---

### 4. Estilo para Nota de Limite
**Arquivo:** `src/modules/configuracoes/ConfiguracoesView.vue` (CSS)

**Alteração:** Adicionado estilo para `.limit-note`:

```css
.limit-note {
  margin: 12px 0 0 0;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-left: 3px solid #1976d2;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}
```

---

## 📋 Checklist de Compatibilidade

| Item | Status | Observação |
|------|--------|------------|
| GET /configuracao-financeira | ✅ | Response esperado: `{posPagoAtivo, atualizadoEm, atualizadoPorNome, atualizadoPorRole}` |
| POST /pos-pago/ativar | ✅ | Retorna 200 + ConfiguracaoFinanceiraResponse |
| POST /pos-pago/desativar | ✅ | Retorna 200 + ConfiguracaoFinanceiraResponse |
| Formato ISO 8601 | ✅ | `formatData()` já converte corretamente |
| Erro 403 (sem permissão) | ✅ | Tratado com mensagem específica |
| Erro 401 (não autenticado) | ✅ | **NOVO** - Tratado |
| Erro 400 (validação) | ✅ | **NOVO** - Tratado |
| Reversão do switch | ✅ | Automática em caso de erro |
| Limite fixo documentado | ✅ | **NOVO** - Nota adicionada |

---

## ⚠️ Pendências do Backend

Conforme RESPOSTAS_BACKEND_CONFIG_FINANCEIRA.md, o backend precisa:

1. **Corrigir Bug:** Passagem de `clienteId` ao invés de `unidadeConsumoId` na validação de limite
2. **Expor Limite no Response:** Adicionar `limitePosPago: 50000` (centavos) no `ConfiguracaoFinanceiraResponse`

**Quando o backend adicionar `limitePosPago`:**
- Podemos substituir o valor fixo "500,00 AOA" por `{{ formatCurrency(configuracao.limitePosPago) }}`
- Adicionar conversão de centavos: `configuracao.limitePosPago / 100`

---

## 🧪 Cenários de Teste

### Teste 1: Ativar Pós-Pago (ADMIN)
**Passos:**
1. Login como ADMIN (999999999 / admin123)
2. Ir para Configurações
3. Clicar no switch para ativar
4. Confirmar no dialog
5. Verificar mensagem de sucesso
6. Verificar badge "✅ ATIVADO"
7. Verificar metadados atualizados

**Resultado Esperado:** ✅ Pós-pago ativado, switch verde, metadados mostram ADMIN

---

### Teste 2: Desativar Pós-Pago (ADMIN)
**Passos:**
1. Login como ADMIN
2. Switch já ativado
3. Clicar para desativar
4. Confirmar aviso sobre bloqueio
5. Verificar mensagem de sucesso
6. Verificar badge "🚫 DESATIVADO"

**Resultado Esperado:** 🚫 Pós-pago desativado, switch cinza

---

### Teste 3: Tentativa por GERENTE
**Passos:**
1. Login como GERENTE (não ADMIN)
2. Ir para Configurações
3. Verificar que switch está desabilitado
4. Verificar aviso "Apenas visualização"

**Resultado Esperado:** ⚠️ Switch desabilitado, impossível alterar

---

### Teste 4: Sessão Expirada
**Passos:**
1. Login como ADMIN
2. Aguardar expiração do token (ou forçar no DevTools)
3. Tentar alterar configuração
4. Verificar erro 401

**Resultado Esperado:** ❌ "Sessão expirada. Faça login novamente"

---

### Teste 5: Criar Pedido Pós-Pago com Sistema Desativado
**Passos:**
1. Desativar pós-pago nas Configurações
2. Ir para Pedidos → Novo Pedido
3. Tentar selecionar "Pós-Pago"
4. Tentar criar pedido

**Resultado Esperado:** ❌ Erro 400 - "Consumo pós-pago temporariamente desabilitado"

---

## 📝 Notas de Desenvolvimento

### Data e Hora
- Backend retorna: `"2026-02-23T10:30:00"` (ISO 8601)
- Frontend formata: `new Date(isoDate).toLocaleString('pt-BR')`
- Resultado: `"23/02/2026, 10:30"`

### Role sem Prefixo
- Backend retorna: `"ADMIN"` (sem `ROLE_`)
- Frontend exibe: Direto, sem necessidade de tratamento

### Limite Fixo
- **Valor atual:** 500.00 AOA (50000 centavos)
- **Localização no backend:** `ConfiguracaoFinanceiraService.LIMITE_POS_PAGO_PADRAO`
- **Alteração:** Requer mudança de código + recompilação

### Cache
- Backend NÃO usa cache (consulta banco toda vez)
- Efeito do toggle é **IMEDIATO**
- Não há necessidade de polling ou delay no frontend

---

## ✅ Status Final

**Frontend está PRONTO** para integração com backend conforme especificação respondida.

**Próximo passo:** Testar com backend em execução.
