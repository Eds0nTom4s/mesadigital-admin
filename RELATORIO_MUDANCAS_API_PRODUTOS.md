# 🔄 Relatório de Mudanças na API - Produtos
**Data**: 21 de fevereiro de 2026  
**Destinatário**: Equipa Frontend - Painel Administrativo  
**Prioridade**: ALTA - Breaking Changes

---

## 📋 Sumário Executivo

A API de **Produtos** sofreu alterações arquiteturais importantes para alinhar o backend com princípios de Domain-Driven Design (DDD). As mudanças afetam **diretamente** o painel administrativo.

### ⚠️ BREAKING CHANGES

| Campo Removido | Campo Adicionado | Impacto |
|----------------|------------------|---------|
| `disponivel` (Boolean) | `tipoPreparo` (Enum String) | **ALTO** - Requer atualização de forms e listagens |

---

## 🎯 O Que Mudou

### 1. Campo `disponivel` REMOVIDO ❌

**Antes:**
```json
{
  "id": 1,
  "codigo": "PRATO001",
  "nome": "Muamba de Galinha",
  "disponivel": true,  // ❌ REMOVIDO
  "ativo": true
}
```

**Agora:**
```json
{
  "id": 1,
  "codigo": "PRATO001",
  "nome": "Muamba de Galinha",
  "tipoPreparo": "QUENTE",  // ✅ NOVO CAMPO OBRIGATÓRIO
  "ativo": true
}
```

#### 🤔 Porquê?

A **disponibilidade** agora é um **estado derivado** (calculado dinamicamente), não um campo persistido. A disponibilidade real depende de:
- `ativo === true` (produto ativo no sistema)
- Existência de unidades de produção (cozinhas/bar) operacionais para o `tipoPreparo`

**Para o painel administrativo**: Continuem a mostrar se o produto está `ativo`, mas não persistam mais o campo `disponivel`.

---

### 2. Campo `tipoPreparo` ADICIONADO ✅

Novo campo **obrigatório** que classifica **COMO** o produto é preparado.

#### Valores Possíveis:

| Valor | Descrição | Exemplo de Produtos |
|-------|-----------|---------------------|
| `QUENTE` | Requer cozinha quente | Muamba de Galinha, Pizzas, Grelhados |
| `FRIO` | Preparação fria | Saladas, Entradas frias |
| `BAR` | Preparado no bar | Cervejas, Caipirinhas, Vinhos |
| `BEBIDA` | Bebidas sem preparo | Refrigerantes, Águas, Sumos naturais |
| `SOBREMESA` | Sobremesas | Cocada, Mousse, Bolos |
| `ENTREGA` | Produtos para delivery | (Futuro módulo de entregas) |

#### 💡 Regra de Negócio:

- **Se não informado na criação**: Backend assume `QUENTE` por padrão
- **Obrigatório para atualização**: Deve ser enviado explicitamente

---

## 🔧 Como Atualizar o Frontend

### 1. **Formulário de Criação de Produto**

#### ❌ Remover:
```html
<!-- NÃO USAR MAIS -->
<label>
  <input type="checkbox" name="disponivel" />
  Produto Disponível
</label>
```

#### ✅ Adicionar:
```html
<label for="tipoPreparo">Tipo de Preparo *</label>
<select name="tipoPreparo" id="tipoPreparo" required>
  <option value="QUENTE">🔥 Quente (Cozinha)</option>
  <option value="FRIO">❄️ Frio (Preparação Fria)</option>
  <option value="BAR">🍹 Bar (Bebidas Alcoólicas)</option>
  <option value="BEBIDA">🥤 Bebida (Sem Preparo)</option>
  <option value="SOBREMESA">🍰 Sobremesa</option>
  <option value="ENTREGA">🚚 Entrega (Delivery)</option>
</select>
```

---

### 2. **Request Payload - Criar Produto**

**Antes:**
```javascript
const payload = {
  codigo: "PRATO001",
  nome: "Muamba de Galinha",
  descricao: "Galinha refogada com quiabo e dendê",
  preco: 8500.00,
  categoria: "PRATO_PRINCIPAL",
  disponivel: true,  // ❌ NÃO ENVIAR MAIS
  tempoPreparoMinutos: 35
};
```

**Agora:**
```javascript
const payload = {
  codigo: "PRATO001",
  nome: "Muamba de Galinha",
  descricao: "Galinha refogada com quiabo e dendê",
  preco: 8500.00,
  categoria: "PRATO_PRINCIPAL",
  tipoPreparo: "QUENTE",  // ✅ OBRIGATÓRIO
  tempoPreparoMinutos: 35
};
```

---

### 3. **Request Payload - Atualizar Produto**

```javascript
// PUT /api/produtos/{id}
const payload = {
  codigo: "PRATO001",
  nome: "Muamba de Galinha (Atualizado)",
  descricao: "Nova descrição",
  preco: 9000.00,
  categoria: "PRATO_PRINCIPAL",
  tipoPreparo: "QUENTE",  // ✅ DEVE SER ENVIADO
  tempoPreparoMinutos: 40
};
```

---

### 4. **Response Payload - Listar Produtos**

**Resposta da API (`GET /api/produtos`):**

```json
{
  "content": [
    {
      "id": 1,
      "codigo": "PRATO001",
      "nome": "Muamba de Galinha",
      "descricao": "Galinha refogada com quiabo e dendê",
      "preco": 8500.00,
      "categoria": "PRATO_PRINCIPAL",
      "urlImagem": null,
      "tempoPreparoMinutos": 35,
      "tipoPreparo": "QUENTE",    // ✅ NOVO
      "ativo": true,               // ✅ USAR ESTE PARA MOSTRAR STATUS
      "createdAt": "2026-02-21T10:30:00",
      "updatedAt": "2026-02-21T10:30:00"
    }
  ]
}
```

---

### 5. **Tabela de Listagem**

#### ❌ Coluna Antiga:
```html
<th>Disponível</th>
<!-- ... -->
<td>
  {{ produto.disponivel ? 'Sim' : 'Não' }}  <!-- ❌ CAMPO NÃO EXISTE MAIS -->
</td>
```

#### ✅ Colunas Novas:
```html
<th>Tipo Preparo</th>
<th>Status</th>
<!-- ... -->
<td>
  <span class="badge badge-{{ getBadgeColor(produto.tipoPreparo) }}">
    {{ getPreparoLabel(produto.tipoPreparo) }}
  </span>
</td>
<td>
  <span class="badge badge-{{ produto.ativo ? 'success' : 'secondary' }}">
    {{ produto.ativo ? 'Ativo' : 'Inativo' }}
  </span>
</td>
```

---

### 6. **Funções Auxiliares (Exemplo Vue.js/React)**

```javascript
// Função para obter label amigável do tipoPreparo
function getPreparoLabel(tipo) {
  const labels = {
    'QUENTE': '🔥 Quente',
    'FRIO': '❄️ Frio',
    'BAR': '🍹 Bar',
    'BEBIDA': '🥤 Bebida',
    'SOBREMESA': '🍰 Sobremesa',
    'ENTREGA': '🚚 Delivery'
  };
  return labels[tipo] || tipo;
}

// Função para obter cor do badge
function getBadgeColor(tipo) {
  const colors = {
    'QUENTE': 'danger',
    'FRIO': 'info',
    'BAR': 'warning',
    'BEBIDA': 'primary',
    'SOBREMESA': 'success',
    'ENTREGA': 'dark'
  };
  return colors[tipo] || 'secondary';
}
```

---

## 🔄 Endpoints Afetados

| Endpoint | Método | Mudança |
|----------|--------|---------|
| `/api/produtos` | GET | Response não inclui mais `disponivel`, inclui `tipoPreparo` |
| `/api/produtos/{id}` | GET | Response não inclui mais `disponivel`, inclui `tipoPreparo` |
| `/api/produtos` | POST | Request não aceita mais `disponivel`, requer `tipoPreparo` |
| `/api/produtos/{id}` | PUT | Request não aceita mais `disponivel`, requer `tipoPreparo` |
| `/api/produtos/disponiveis` | GET | **Funciona igual**, mas retorna produtos ativos |
| `/api/produtos/categoria/{categoria}` | GET | Response não inclui mais `disponivel`, inclui `tipoPreparo` |
| `/api/produtos/buscar?nome={nome}` | GET | Response não inclui mais `disponivel`, inclui `tipoPreparo` |
| `/api/produtos/{id}/disponibilidade` | PATCH | **Mudou**: Agora altera campo `ativo` (não `disponivel`) |

---

## ⚡ Endpoint Alterado - Disponibilidade

**Antes:**
```http
PATCH /api/produtos/{id}/disponibilidade
Content-Type: application/json

{
  "disponivel": false
}
```

**Agora:**
```http
PATCH /api/produtos/{id}/disponibilidade
Content-Type: application/json

{
  "ativo": false  // ✅ Mudou o campo
}
```

**Nota**: O endpoint continua a existir, mas agora altera o campo `ativo` em vez de `disponivel`.

---

## 🧪 Exemplos de Requisições Completas

### Criar Produto - Prato Quente

```http
POST /api/produtos
Content-Type: application/json
Authorization: Bearer {token}

{
  "codigo": "PRATO005",
  "nome": "Feijoada Completa",
  "descricao": "Feijoada tradicional com acompanhamentos",
  "preco": 11500.00,
  "categoria": "PRATO_PRINCIPAL",
  "tipoPreparo": "QUENTE",
  "tempoPreparoMinutos": 45,
  "urlImagem": "https://example.com/feijoada.jpg"
}
```

### Criar Produto - Bebida

```http
POST /api/produtos
Content-Type: application/json
Authorization: Bearer {token}

{
  "codigo": "BEB005",
  "nome": "Sumo de Laranja Natural",
  "descricao": "Sumo fresco de laranja (500ml)",
  "preco": 1800.00,
  "categoria": "BEBIDA_NAO_ALCOOLICA",
  "tipoPreparo": "BEBIDA"
}
```

### Criar Produto - Bar (Alcoólica)

```http
POST /api/produtos
Content-Type: application/json
Authorization: Bearer {token}

{
  "codigo": "ALC005",
  "nome": "Mojito",
  "descricao": "Rum branco, hortelã, limão e açúcar",
  "preco": 2800.00,
  "categoria": "BEBIDA_ALCOOLICA",
  "tipoPreparo": "BAR"
}
```

---

## 🚨 Checklist de Atualização

### Componentes a Atualizar:

- [ ] **Form de Criação**: Remover checkbox `disponivel`, adicionar select `tipoPreparo`
- [ ] **Form de Edição**: Remover checkbox `disponivel`, adicionar select `tipoPreparo`
- [ ] **Tabela de Listagem**: Substituir coluna `Disponível` por `Tipo Preparo` + `Status (Ativo)`
- [ ] **Detalhes do Produto**: Mostrar `tipoPreparo` com ícone/badge
- [ ] **Filtros**: Adicionar filtro por `tipoPreparo` (opcional)
- [ ] **Validações**: Garantir que `tipoPreparo` é obrigatório nos forms
- [ ] **Chamadas API**: Remover `disponivel` de todos os payloads
- [ ] **TypeScript/Interfaces**: Atualizar interfaces `Produto`, `ProdutoRequest`, `ProdutoResponse`

---

## 📚 Interfaces TypeScript (Exemplo)

```typescript
// ANTES ❌
interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: CategoriaProduto;
  urlImagem?: string;
  tempoPreparoMinutos?: number;
  disponivel: boolean;  // ❌ REMOVER
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// AGORA ✅
interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: CategoriaProduto;
  urlImagem?: string;
  tempoPreparoMinutos?: number;
  tipoPreparo: TipoPreparo;  // ✅ ADICIONAR
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Novo enum
enum TipoPreparo {
  QUENTE = 'QUENTE',
  FRIO = 'FRIO',
  BAR = 'BAR',
  BEBIDA = 'BEBIDA',
  SOBREMESA = 'SOBREMESA',
  ENTREGA = 'ENTREGA'
}

// Request DTOs
interface ProdutoRequest {
  codigo: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: CategoriaProduto;
  urlImagem?: string;
  tempoPreparoMinutos?: number;
  tipoPreparo?: TipoPreparo;  // Opcional no request (default: QUENTE)
}
```

---

## 🎨 Sugestões de UX

### 1. Badge Visual para `tipoPreparo`

```html
<!-- Exemplo de badge colorido -->
<span class="badge-preparo badge-quente">🔥 Quente</span>
<span class="badge-preparo badge-frio">❄️ Frio</span>
<span class="badge-preparo badge-bar">🍹 Bar</span>
<span class="badge-preparo badge-bebida">🥤 Bebida</span>
<span class="badge-preparo badge-sobremesa">🍰 Sobremesa</span>
```

### 2. Agrupamento na Listagem

Permitir filtrar/agrupar produtos por `tipoPreparo`:
```
📦 Produtos Quentes (12)
📦 Produtos Frios (3)
📦 Bar (8)
📦 Bebidas (6)
📦 Sobremesas (5)
```

---

## 🔍 Como Testar

### 1. Criar Produto Sem `tipoPreparo`
```javascript
// Backend assume QUENTE por padrão
POST /api/produtos
{ "codigo": "TEST001", "nome": "Teste", ... }
// Response: { ... "tipoPreparo": "QUENTE" }
```

### 2. Criar Produto Com `tipoPreparo`
```javascript
POST /api/produtos
{ "codigo": "TEST002", "nome": "Teste Bar", "tipoPreparo": "BAR", ... }
// Response: { ... "tipoPreparo": "BAR" }
```

### 3. Listar Produtos Ativos
```javascript
GET /api/produtos/disponiveis
// Retorna todos com ativo=true (não há mais filtro por disponivel)
```

---

## ⏱️ Prazo de Migração

**Recomendação**: Atualizar painel administrativo **antes de subir para produção**.

### Plano de Rollout:
1. ✅ Backend já atualizado (21/02/2026)
2. ⏳ Frontend em atualização (vocês)
3. ⏳ Testes integrados
4. ⏳ Deploy coordenado (backend + frontend juntos)

---

## 🆘 Suporte

### Dúvidas Técnicas:
- **Backend**: [Equipa Backend]
- **Arquitetura**: Ver documento `ALINHAMENTO_CONCEITOS_HIERARQUIA.txt`

### Exemplos de API:
- Ver arquivo `API_EXAMPLES.md`
- Insomnia Collection: `Insomnia_Collection.json`
- Testes HTTP: `api-tests.http`

---

## 📝 Notas Finais

### Por que esta mudança?

Esta refatoração prepara o sistema para:
1. **Módulo de Delivery** (TipoPreparo.ENTREGA já existe)
2. **Cálculo dinâmico de disponibilidade** baseado em unidades de produção ativas
3. **Roteamento inteligente** de pedidos para cozinhas/bar corretos
4. **Escalabilidade** para múltiplos canais de venda

### Impacto no Cliente Final:

**NENHUM**. O cliente não vê estas mudanças - são internas ao painel administrativo.

---

**Bom trabalho! 🚀**  
Em caso de dúvidas, consultem este documento ou contactem a equipa backend.
