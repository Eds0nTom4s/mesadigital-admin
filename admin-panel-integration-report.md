# Relatório de Integração — Painel Administrativo

**Projecto:** Sistema de Restauração MASPE  
**Componente:** `frontend/admin-panel` (Vue.js + Pinia + Tailwind)  
**Backend:** `Sistema de Restauração` (Spring Boot)  
**Data:** 2026-03-16  
**Engenheiro:** Principal Software Engineer (AI-assisted)

---

## 1. Fluxos Verificados

| Fluxo | Estado | Observações |
|-------|--------|-------------|
| Autenticação (`POST /auth/admin/login`) | ✅ Funcional | JWT armazenado em localStorage, interceptor configurado, logout automático em 401 |
| Dashboard (`/dashboard/stats`, `/activity`, `/top-products`) | ✅ Funcional | 3 endpoints alinhados, auto-refresh configurado (30s / 20s / 5min) |
| Gestão de Mesas (`/mesas`, `/mesas/disponiveis`, `/mesas/ocupadas`) | ✅ Funcional | Sessões enriquecidas via `GET /sessoes-consumo/abertas` |
| Sessões de Consumo (`/sessoes-consumo/abertas`, `/aguardando-pagamento`) | ✅ Funcional | Ciclo de vida ABERTA → AGUARDANDO_PAGAMENTO → ENCERRADA correcto |
| Gestão de Pedidos (`/pedidos`) | ✅ Corrigido | Ver IC-2, IC-3, IC-5, IC-6 |
| Operações de Cozinha (`/subpedidos/cozinha/{id}/ativos`) | ✅ Funcional | assumir / marcar-pronto / marcar-entregue alinhados |
| Gestão de Produtos (`/produtos`, `/produtos/admin`) | ✅ Corrigido | Ver IC-4 |
| Fundos de Consumo (`/fundos/{token}`, `/saldo`, `/historico`) | ✅ Corrigido | Ver IC-1 |

---

## 2. Endpoints Utilizados

### Autenticação
| Método | Endpoint | Role |
|--------|----------|------|
| POST | `/auth/admin/login` | público |

### Dashboard
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/dashboard/stats` | ATD, GER, ADM |
| GET | `/dashboard/activity` | ATD, GER, ADM |
| GET | `/dashboard/top-products` | GER, ADM |

### Mesas
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/mesas` | ATD, GER, ADM |
| GET | `/mesas/disponiveis` | ATD, GER, ADM |
| GET | `/mesas/ocupadas` | ATD, GER, ADM |
| GET | `/mesas/unidade-atendimento/{id}` | ATD, GER, ADM |
| POST | `/mesas` | ADM |
| PUT | `/mesas/{id}/ativar` | ADM |
| PUT | `/mesas/{id}/desativar` | ADM |

### Sessões de Consumo
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/sessoes-consumo/abertas` | ATD, GER, ADM |
| GET | `/sessoes-consumo/aguardando-pagamento` | ATD, GER, ADM |
| GET | `/sessoes-consumo/{id}` | autenticado |
| GET | `/sessoes-consumo/mesa/{mesaId}/ativa` | autenticado |
| POST | `/sessoes-consumo` | ATD, GER, ADM |
| PUT | `/sessoes-consumo/{id}/fechar` | ATD, GER, ADM |
| PUT | `/sessoes-consumo/{id}/aguardar-pagamento` | ATD, GER, ADM |

### Pedidos
| Método | Endpoint | Role |
|--------|----------|------|
| POST | `/pedidos` | ATD, GER, ADM |
| GET | `/pedidos/{id}` | autenticado |
| GET | `/pedidos/hoje` | ADM, ATD |
| GET | `/pedidos/ativos` | ADM, ATD |
| GET | `/pedidos/status/{status}` | ADM, ATD |
| GET | `/pedidos/sessao/{id}` | ADM, ATD |
| GET | `/pedidos/sessao/{id}/ativos` | ADM, ATD |
| GET | `/pedidos` | ADM, ATD |
| PUT | `/pedidos/{id}/confirmar` | ATD, GER, ADM |
| PUT | `/pedidos/{id}/cancelar?motivo=` | GER, ADM |
| PUT | `/pedidos/{id}/confirmar-pagamento` | GER, ADM |
| PUT | `/pedidos/{id}/fechar` | ATD, GER, ADM |

### SubPedidos (Cozinha)
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/subpedidos/cozinha/{cozinhaId}/ativos` | ATD, GER, ADM, COZ |
| PUT | `/subpedidos/{id}/assumir` | COZ, GER, ADM |
| PUT | `/subpedidos/{id}/marcar-pronto` | COZ, GER, ADM |
| PUT | `/subpedidos/{id}/marcar-entregue` | ATD, GER, ADM |

### Produtos
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/produtos` | todos autenticados |
| GET | `/produtos/admin` | GER, ADM |
| GET | `/produtos/categoria/{categoria}` | todos autenticados |
| GET | `/produtos/buscar?nome=` | todos autenticados |
| POST | `/produtos` | GER, ADM |
| PUT | `/produtos/{id}` | GER, ADM |
| PATCH | `/produtos/{id}/disponibilidade?disponivel=` | GER, ADM |
| DELETE | `/produtos/{id}` | GER, ADM |

### Fundos de Consumo
| Método | Endpoint | Role |
|--------|----------|------|
| GET | `/fundos` | GER, ADM |
| GET | `/fundos/{token}` | ATD, GER, ADM |
| GET | `/fundos/{token}/saldo` | ATD, GER, ADM |
| GET | `/fundos/{token}/historico` | GER, ADM |
| GET | `/fundos/sessao/{sessaoId}` | GER, ADM |
| POST | `/fundos/{token}/recarregar` | GER, ADM |
| DELETE | `/fundos/{token}` | ADM |

### WebSocket (STOMP/SockJS)
| Tópico | Uso |
|--------|-----|
| `/topic/subpedidos/cozinha/{id}` | Actualizações em tempo real da cozinha |
| `/topic/atendente/unidade/{id}` | Notificações para atendente |
| `/topic/subpedido/{id}` | Estado de um sub-pedido específico |
| `/topic/pedidos` | Pedidos globais |

---

## 3. Correcções de Integração Aplicadas

### IC-1 — `fundoConsumoService.js` — Endpoints inexistentes removidos

**Problema:** O service referenciava `POST/GET /fundos/cliente/{clienteId}` e `POST /fundos/anonimo/{token}` que não existem no backend.

**Correcção:**
- Removidos: `criarFundoParaCliente()`, `criarFundo()`, `criarFundoAnonimo()`, `buscarFundoPorCliente()`
- Adicionados: `listarTodos(page, size)` → `GET /fundos`, `buscarPorSessao(sessaoId)` → `GET /fundos/sessao/{sessaoId}`
- Documentação corrigida: identificador é `qrCodeSessao` (UUID da sessão), não `tokenPortador` ou `clienteId`

---

### IC-2 — `pedido.api.js` — Endpoints fantasma removidos

**Problema:** Métodos apontavam para endpoints inexistentes:
- `adicionarItem` → `POST /pedidos/{id}/itens`
- `atualizarQuantidadeItem` → `PUT /pedidos/{id}/itens/{itemId}/quantidade`
- `removerItem` → `DELETE /pedidos/{id}/itens/{itemId}`
- `getDelta` → `GET /pedidos/{id}/delta`
- `ping` → `POST /pedidos/{id}/ping`

**Correcção:** Todos os métodos acima removidos. Os itens do pedido são enviados em bloco na criação (`POST /pedidos` com array `itens`). Adicionados métodos alinhados com o backend real: `getHoje()`, `getAtivosBySessaoConsumo()`, `listarComFiltros()`.

---

### IC-3 — `pedido.api.js` — Endpoint de sessão corrigido

**Problema:** `getBySessaoConsumo` apontava para `/pedidos/sessao-consumo/{id}`.

**Correcção:** Endpoint corrigido para `/pedidos/sessao/{id}` (conforme `PedidoController.java`, linha 120).

---

### IC-4 — `ProdutosView.vue` — Endpoint admin para gestão completa

**Problema:** `GET /produtos` retorna apenas produtos disponíveis e activos — GERENTE/ADMIN não conseguia ver produtos inativos.

**Correcção:** GERENTE/ADMIN agora usam `GET /produtos/admin` que retorna todos os produtos incluindo inativos e indisponíveis. Resposta paginada (`.content`) tratada correctamente. Atendentes continuam a usar `GET /produtos`.

---

### IC-5 — `pedido.service.js` — Campo obrigatório corrigido

**Problema:** `validator` validava `unidadeConsumoId` e o payload enviava esse campo. O backend (`CriarPedidoRequest`) espera `sessaoConsumoId`.

**Correcção:** Validação e payload corrigidos para `sessaoConsumoId`.

---

### IC-6 — `pedido.service.js` + `pedido.api.js` — `fechar()` sem body

**Problema:** `fechar()` enviava body `{ formaPagamento, observacao }` que o backend não aceita. `PUT /pedidos/{id}/fechar` não tem parâmetros de entrada.

**Correcção:** `fechar(pedidoId)` agora chama `PUT /pedidos/{id}/fechar` sem body. Para confirmar pagamento POS_PAGO manualmente, usar `PUT /pedidos/{id}/confirmar-pagamento`.

---

### IC-7 (derivada) — `GestaoMesasView.vue` — Busca de fundo corrigida

**Problema:** Após IC-1, `abrirDetalhesMesa()` chamava `fundoConsumoService.buscarFundoPorCliente(clienteId)` que foi removido.

**Correcção:** Substituído por `fundoConsumoService.buscarPorSessao(sessaoId)` — alinhado com o backend que identifica fundos pela sessão, não pelo cliente.

---

## 4. Inconsistências do Backend Descobertas

> Nenhuma inconsistência crítica foi encontrada no backend. As discrepâncias eram todas do lado do frontend.

**Notas:**
- `PUT /pedidos/{id}/fechar` não devolve mensagem de erro clara quando tentado numa sessão já encerrada — recomendado adicionar erro 422 com mensagem específica.
- `GET /dashboard/top-products` requer role `GERENTE` ou `ADMIN` mas `GET /dashboard/activity` aceita `ATENDENTE`. O painel deve lidar com `403` no card de top-products quando um atendente acede — já está implementado no `DashboardView.vue`.

---

## 5. Recomendações para Hardening em Produção

### Segurança
- [ ] Configurar HTTPS obrigatório no backend (evitar token JWT em plain HTTP)
- [ ] Adicionar `SameSite=Strict; Secure` se migrar token para cookie HttpOnly
- [ ] Rate limiting nos endpoints de autenticação (`/auth/admin/login`)
- [ ] CORS restritivo — aceitar apenas origens do painel admin

### Resiliência
- [ ] Adicionar `fallback` UI para WebSocket desconectado (já tem badge de status, falta degradação graciosa)
- [ ] Implementar timeout visual nas operações críticas (fechar pedido pode demorar se o backend estiver sob carga)
- [ ] Paginação no `GET /mesas` — actualmente carrega todas as mesas em memória; adicionar paginação se o número de mesas crescer

### Observabilidade
- [ ] Remover logs de debug `console.log('[api.js]...')` antes de ir para produção — ou usar flag `VITE_DEBUG`
- [ ] Considerar integração com Sentry ou similar para captura de erros de produção
- [ ] Logging do circuit breaker deveria escrever para sistema de monitorização, não apenas para console

### UX/Operações
- [ ] `ProdutosView.vue` exibe linha de debug `Role: ... | isGerente: ...` visível ao utilizador — remover antes de produção (linha 231 do template)
- [ ] Confirmar `confirm()` nativo no browser para excluir produto — substituir por modal de confirmação customizado para consistência
- [ ] Implementar loading global para evitar duplo-clique em operações críticas (confirmar pedido, fechar mesa)
