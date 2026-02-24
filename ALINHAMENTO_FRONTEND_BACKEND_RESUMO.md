# ALINHAMENTO FRONTEND-BACKEND - RESUMO EXECUTIVO

## ✅ O QUE FUNCIONA

### Autenticação
- `POST /api/auth/jwt/login` - Login com username/password
- `POST /api/auth/admin/login` - Login admin (telefone/senha)
- Token JWT com 1h de expiração
- Roles: ADMIN, GERENTE, ATENDENTE, COZINHA, CLIENTE

### Produtos
- CRUD completo (`/api/produtos`)
- Upload de imagens com MinIO (`POST /api/produtos/{id}/imagem`)
- Filtros por categoria e nome
- Soft delete

### Pedidos
- CRUD completo (`/api/pedidos`)
- Adicionar itens
- Confirmar pagamento
- Estornar

### Configurações Financeiras
- `GET /api/configuracao-financeira` ✅
- `PUT /api/configuracao-financeira` ✅

### Fundos de Consumo
- CRUD completo (`/api/fundos`)
- Recarregar saldo
- Histórico de transações

### Dashboard
- Resumo geral
- Pedidos hoje
- Receita mensal

---

## ❌ O QUE NÃO EXISTE

### 🔴 CRÍTICO: CRUD de Usuários
**Não existe AtendenteController ou UserController!**

Endpoints faltando:
```
❌ GET    /api/usuarios                  → Listar
❌ GET    /api/usuarios/{id}             → Ver detalhes
❌ POST   /api/usuarios                  → Criar
❌ PUT    /api/usuarios/{id}             → Editar
❌ DELETE /api/usuarios/{id}             → Desativar
❌ PATCH  /api/usuarios/{id}/senha       → Alterar senha
```

**Impacto:** Frontend não consegue gerenciar equipe!

### 🟡 PARCIAL: Auditoria
**Existe `/api/event-logs` mas só para pedidos!**

Endpoints faltando:
```
❌ GET /api/auditoria/logs              → Logs gerais
❌ GET /api/auditoria/modulos           → Módulos auditados
❌ GET /api/auditoria/acoes             → Ações disponíveis
❌ GET /api/auditoria/logs/exportar/csv
```

**Workaround temporário:** Usar `/api/event-logs/pedidos/usuario/{usuario}`

---

## 🔧 CORREÇÕES NECESSÁRIAS NO FRONTEND

### 1. Endpoint de Login
**Atual (errado):**
```javascript
POST /api/auth/login  // ❌ 404
```

**Correto:**
```javascript
POST /api/auth/jwt/login  // ✅
Body: {
  "username": "+244999999999",  // telefone
  "password": "senha123"
}
```

**OU:**
```javascript
POST /api/auth/admin/login  // ✅
Body: {
  "telefone": "+244999999999",
  "senha": "senha123"
}
```

### 2. Paginação
**Backend usa índice 0:**
```javascript
// Frontend envia pagina=1
// Backend precisa de page=0

const page = paginaFrontend - 1;
fetch(`/api/usuarios?page=${page}&size=20`)
```

### 3. Estrutura de Resposta
**Sempre envolvido em `ApiResponse`:**
```json
{
  "message": "Sucesso",
  "data": { ... },
  "error": null
}
```

---

## 📋 AÇÃO IMEDIATA NECESSÁRIA

### Backend deve criar:

**1. AtendenteController.java**
```java
@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AtendenteController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AtendenteResponse>>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) TipoUsuario role,
        @RequestParam(required = false) Boolean ativo,
        @RequestParam(required = false) String busca
    ) { }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AtendenteResponse>> buscar(@PathVariable Long id) { }
    
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ApiResponse<AtendenteResponse>> criar(@Valid @RequestBody AtendenteRequest request) { }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AtendenteResponse>> atualizar(
        @PathVariable Long id, 
        @Valid @RequestBody AtendenteRequest request
    ) { }
    
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> desativar(@PathVariable Long id) { }
    
    @PatchMapping("/{id}/senha")
    public ResponseEntity<ApiResponse<Void>> alterarSenha(
        @PathVariable Long id,
        @RequestBody AlterarSenhaRequest request
    ) { }
}
```

**2. DTOs necessários:**
- `AtendenteResponse.java`
- `AtendenteRequest.java`
- `AlterarSenhaRequest.java`

---

## 🔐 CREDENCIAIS DE TESTE

**Usuário padrão (dev):**
```
Telefone: +244999999999
Senha: senha123
Role: ADMIN
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/jwt/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "+244999999999",
    "password": "senha123"
  }'
```

---

## 📊 ENDPOINTS DISPONÍVEIS (REFERÊNCIA RÁPIDA)

| Módulo | Endpoint Base | Status |
|--------|--------------|--------|
| Autenticação | `/api/auth/jwt` | ✅ Completo |
| Produtos | `/api/produtos` | ✅ Completo |
| Pedidos | `/api/pedidos` | ✅ Completo |
| Fundos | `/api/fundos` | ✅ Completo |
| Config Financeira | `/api/configuracao-financeira` | ✅ Completo |
| Dashboard | `/api/dashboard` | ✅ Completo |
| Unidades Consumo | `/api/unidades-consumo` | ✅ Completo |
| QR Codes | `/api/qrcodes` | ✅ Completo |
| SubPedidos | `/api/subpedidos` | ✅ Completo |
| Event Logs | `/api/event-logs` | ⚠️ Parcial |
| **Usuários** | `/api/usuarios` | ❌ **NÃO EXISTE** |
| **Auditoria** | `/api/auditoria` | ❌ **NÃO EXISTE** |

---

## 🎯 PRÓXIMOS PASSOS

### Backend (2-3 dias)
1. Criar `AtendenteController`
2. Criar DTOs (Request/Response)
3. Implementar validações
4. Testes unitários

### Frontend (Imediato)
1. Corrigir endpoint de login
2. Ajustar paginação (0-based)
3. Aguardar endpoint de usuários
4. Usar `/api/event-logs` temporariamente

### Documentação
1. Atualizar Swagger
2. Criar Postman Collection
3. Documentar validações

---

## 📞 CONTATO

**Dúvidas?** Verificar documentação completa em:
`RESPOSTA_QUESTIONARIO_BACKEND.md`

**Swagger UI:**
http://localhost:8080/swagger-ui.html

---

*Última atualização: 24/02/2026*
