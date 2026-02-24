# ⚠️ ATENÇÃO: MÓDULOS AINDA NÃO IMPLEMENTADOS NO BACKEND

## Status Atual (24/02/2026)

### ❌ Endpoints que NÃO EXISTEM:

1. **Módulo de Usuários** - CRÍTICO
   ```
   ❌ GET    /api/usuarios
   ❌ GET    /api/usuarios/{id}
   ❌ POST   /api/usuarios
   ❌ PUT    /api/usuarios/{id}
   ❌ DELETE /api/usuarios/{id}
   ❌ PATCH  /api/usuarios/{id}/senha
   ```

2. **Módulo de Auditoria** - PARCIAL
   ```
   ❌ GET /api/auditoria/logs
   ❌ GET /api/auditoria/modulos
   ❌ GET /api/auditoria/acoes
   ❌ GET /api/auditoria/estatisticas
   ❌ GET /api/auditoria/logs/exportar/csv
   ❌ GET /api/auditoria/logs/exportar/pdf
   ```
   
   **Alternativa temporária:** `/api/event-logs` (apenas pedidos)

---

## ⚙️ Correções Implementadas no Frontend

### 1. ✅ Login Corrigido
**Antes:**
```javascript
POST /api/auth/login  // ❌ 404
```

**Agora:**
```javascript
POST /api/auth/jwt/login  // ✅
Body: {
  "username": "+244999999999",
  "password": "senha123"
}
```

### 2. ✅ Paginação Corrigida
**Antes:**
```javascript
GET /api/usuarios?pagina=1&tamanhoPagina=20  // ❌
```

**Agora:**
```javascript
GET /api/usuarios?page=0&size=20  // ✅ (0-based)
```

### 3. ✅ Fallback para Endpoints 404
- Mensagens informativas no console
- Retorno de dados vazios quando apropriado
- Referência ao documento de alinhamento

---

## 🎯 O Que Fazer Agora

### Para Testar o Frontend:

1. **Login funciona:**
   ```
   Usuário: +244999999999
   Senha: senha123
   ```

2. **Módulos funcionando:**
   - ✅ Dashboard
   - ✅ Produtos
   - ✅ Pedidos
   - ✅ Fundos de Consumo
   - ✅ Configurações Financeiras

3. **Módulos PENDENTES (backend):**
   - ❌ Usuários (retorna mensagem: "Módulo ainda não implementado")
   - ❌ Auditoria (retorna dados vazios)

### Para o Backend:

**Consultar documento completo:**
- [QUESTIONARIO_BACKEND_ALINHAMENTO.txt](QUESTIONARIO_BACKEND_ALINHAMENTO.txt)
- [ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md](ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md)

**Ação imediata:** Implementar `AtendenteController` conforme especificado

---

## 📝 Testes E2E

**Status:** ⚠️ Aguardando endpoints de backend

Os testes estão prontos mas só funcionarão quando:
1. `/api/usuarios` estiver implementado
2. `/api/auditoria/logs` estiver implementado

**Para rodar testes dos módulos funcionando:**
```bash
# Ajustar testes para focar em produtos/pedidos/fundos
npm run test:e2e
```

---

## 🔗 Documentação de Referência

- [ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md](ALINHAMENTO_FRONTEND_BACKEND_RESUMO.md) - Status completo
- [QUESTIONARIO_BACKEND_ALINHAMENTO.txt](QUESTIONARIO_BACKEND_ALINHAMENTO.txt) - Perguntas para backend
- [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md) - Guia de configuração
- [IMPLEMENTACAO_ALTA_PRIORIDADE.md](IMPLEMENTACAO_ALTA_PRIORIDADE.md) - O que foi implementado

---

**Última atualização:** 24/02/2026 às 16:30
