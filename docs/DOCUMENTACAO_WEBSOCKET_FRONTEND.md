# 📡 Documentação WebSocket - Notificações em Tempo Real

**Data:** 19 de Fevereiro de 2026  
**Versão:** 1.0  
**Sistema:** Sistema de Restauração - WebSocket Notifications

---

## 1. VISÃO GERAL

O sistema agora suporta notificações em tempo real via WebSocket usando protocolo STOMP. Isso permite que cozinhas, atendentes e clientes recebam atualizações instantâneas sobre mudanças de status de SubPedidos.

### Benefícios
- ✅ Atualizações em tempo real (sem polling)
- ✅ Baixa latência (~50-100ms)
- ✅ Eficiência de rede (conexão persistente)
- ✅ Suporte a múltiplos clientes simultâneos

---

## 2. CONEXÃO WEBSOCKET

### Endpoint
```
ws://localhost:8080/api/ws
```

### Protocolo
- **STOMP** (Simple Text Oriented Messaging Protocol)
- **Fallback:** SockJS (para navegadores sem suporte nativo a WebSocket)

### Bibliotecas Recomendadas

#### JavaScript/TypeScript
```bash
npm install sockjs-client @stomp/stompjs
```

#### React Example
```bash
npm install react-use-websocket
```

---

## 3. TÓPICOS DISPONÍVEIS

### 3.1 `/topic/cozinha/{cozinhaId}`
**Descrição:** Notificações para cozinha específica  
**Usado por:** Aplicação da Cozinha (Tela de Preparo)  
**Eventos:**
- Novo SubPedido criado (PENDENTE)
- SubPedido assumido (EM_PREPARACAO)
- SubPedido marcado como PRONTO
- SubPedido cancelado

**Exemplo:**
```javascript
stompClient.subscribe('/topic/cozinha/1', (message) => {
    const notificacao = JSON.parse(message.body);
    console.log('SubPedido atualizado:', notificacao);
});
```

---

### 3.2 `/topic/atendente/unidade/{unidadeId}`
**Descrição:** Notificações para atendentes de uma unidade  
**Usado por:** POS Android / Painel de Atendimento  
**Eventos:**
- SubPedido PRONTO (prioridade alta - buscar na cozinha)
- SubPedido ENTREGUE
- SubPedido cancelado

**Exemplo:**
```javascript
stompClient.subscribe('/topic/atendente/unidade/5', (message) => {
    const notificacao = JSON.parse(message.body);
    if (notificacao.statusNovo === 'PRONTO') {
        mostrarAlerta('SubPedido pronto!', notificacao.numero);
    }
});
```

---

### 3.3 `/topic/subpedido/{id}`
**Descrição:** Atualizações de SubPedido específico  
**Usado por:** Tela de detalhes de SubPedido  
**Eventos:** Todas as mudanças de status

**Exemplo:**
```javascript
stompClient.subscribe('/topic/subpedido/123', (message) => {
    const notificacao = JSON.parse(message.body);
    atualizarStatusNaTela(notificacao);
});
```

---

### 3.4 `/topic/pedido/{pedidoId}`
**Descrição:** Atualizações de todos os SubPedidos de um Pedido  
**Usado por:** Cliente (acompanhamento) / Atendente (visão geral)  
**Eventos:** Mudanças em qualquer SubPedido do Pedido

**Exemplo:**
```javascript
stompClient.subscribe('/topic/pedido/456', (message) => {
    const notificacao = JSON.parse(message.body);
    atualizarProgressoPedido(notificacao);
});
```

---

## 4. FORMATO DE MENSAGEM

### Estrutura JSON (NotificacaoSubPedidoDTO)

```json
{
  "id": 123,
  "numero": "PED-001-1",
  "pedidoId": 456,
  "numeroPedido": "PED-001",
  "statusAnterior": "PENDENTE",
  "statusNovo": "EM_PREPARACAO",
  "cozinhaId": 1,
  "nomeCozinha": "Cozinha Central",
  "unidadeAtendimentoId": 5,
  "nomeUnidadeAtendimento": "Restaurante Principal",
  "usuario": "chef.joao",
  "timestamp": "2026-02-19T14:30:00",
  "observacoes": "Assumido pela cozinha",
  "tipoAcao": "MUDANCA_STATUS"
}
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Long | ID do SubPedido |
| `numero` | String | Número do SubPedido (ex: PED-001-1) |
| `pedidoId` | Long | ID do Pedido pai |
| `numeroPedido` | String | Número do Pedido (ex: PED-001) |
| `statusAnterior` | Enum | Status anterior (pode ser null) |
| `statusNovo` | Enum | Status atual |
| `cozinhaId` | Long | ID da Cozinha responsável |
| `nomeCozinha` | String | Nome da Cozinha |
| `unidadeAtendimentoId` | Long | ID da Unidade de Atendimento |
| `nomeUnidadeAtendimento` | String | Nome da Unidade |
| `usuario` | String | Usuário que fez a alteração |
| `timestamp` | DateTime | Data/hora da mudança |
| `observacoes` | String | Observações sobre a mudança |
| `tipoAcao` | Enum | Tipo de ação (ver abaixo) |

### Valores de `tipoAcao`
- `CRIACAO` - SubPedido criado
- `MUDANCA_STATUS` - Status alterado
- `CANCELAMENTO` - SubPedido cancelado
- `OBSERVACAO_ADICIONADA` - Observação adicionada

### Valores de `statusNovo` (StatusSubPedido)
- `CRIADO` - Registrado, aguardando confirmação
- `PENDENTE` - Confirmado, aguardando preparo
- `EM_PREPARACAO` - Sendo preparado
- `PRONTO` - Preparado, aguardando entrega
- `ENTREGUE` - Entregue ao cliente
- `CANCELADO` - Cancelado

---

## 5. IMPLEMENTAÇÃO - JAVASCRIPT VANILLA

### 5.1 Conexão Básica

```javascript
// Importar bibliotecas
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// Criar cliente STOMP
const socket = new SockJS('http://localhost:8080/api/ws');
const stompClient = new Client({
    webSocketFactory: () => socket,
    debug: (str) => console.log(str),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000
});

// Conectar
stompClient.onConnect = (frame) => {
    console.log('Conectado ao WebSocket:', frame);
    
    // Inscrever-se em tópico
    stompClient.subscribe('/topic/cozinha/1', (message) => {
        const notificacao = JSON.parse(message.body);
        console.log('Nova notificação:', notificacao);
        tratarNotificacao(notificacao);
    });
};

stompClient.onStompError = (frame) => {
    console.error('Erro STOMP:', frame.headers['message'], frame.body);
};

stompClient.activate();

// Função para tratar notificações
function tratarNotificacao(notificacao) {
    switch (notificacao.tipoAcao) {
        case 'CRIACAO':
            adicionarNovoSubPedido(notificacao);
            break;
        case 'MUDANCA_STATUS':
            atualizarStatus(notificacao);
            break;
        case 'CANCELAMENTO':
            removerSubPedido(notificacao);
            mostrarAlerta('SubPedido cancelado: ' + notificacao.numero);
            break;
    }
}
```

---

## 6. IMPLEMENTAÇÃO - REACT

### 6.1 Hook Customizado

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

interface NotificacaoSubPedido {
    id: number;
    numero: string;
    statusAnterior: string | null;
    statusNovo: string;
    timestamp: string;
    tipoAcao: string;
    // ... outros campos
}

export function useWebSocket(topicos: string[]) {
    const [conectado, setConectado] = useState(false);
    const [notificacoes, setNotificacoes] = useState<NotificacaoSubPedido[]>([]);
    const clienteRef = useRef<Client | null>(null);

    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/api/ws');
        const cliente = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            
            onConnect: () => {
                console.log('WebSocket conectado');
                setConectado(true);
                
                // Inscrever em todos os tópicos
                topicos.forEach(topico => {
                    cliente.subscribe(topico, (message: IMessage) => {
                        const notificacao = JSON.parse(message.body) as NotificacaoSubPedido;
                        setNotificacoes(prev => [...prev, notificacao]);
                    });
                });
            },
            
            onDisconnect: () => {
                console.log('WebSocket desconectado');
                setConectado(false);
            },
            
            onStompError: (frame) => {
                console.error('Erro STOMP:', frame);
            }
        });

        cliente.activate();
        clienteRef.current = cliente;

        return () => {
            cliente.deactivate();
        };
    }, [topicos]);

    return { conectado, notificacoes };
}
```

### 6.2 Componente de Exemplo

```typescript
// components/PainelCozinha.tsx
import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function PainelCozinha({ cozinhaId }: { cozinhaId: number }) {
    const { conectado, notificacoes } = useWebSocket([
        `/topic/cozinha/${cozinhaId}`
    ]);

    useEffect(() => {
        notificacoes.forEach(notificacao => {
            if (notificacao.tipoAcao === 'CRIACAO') {
                // Tocar som de alerta
                new Audio('/sons/novo-pedido.mp3').play();
                
                // Mostrar notificação
                mostrarNotificacao('Novo SubPedido!', notificacao.numero);
            }
        });
    }, [notificacoes]);

    return (
        <div>
            <header>
                <h1>Painel da Cozinha</h1>
                <StatusIndicator conectado={conectado} />
            </header>
            
            {/* Lista de SubPedidos ativos */}
        </div>
    );
}
```

---

## 7. IMPLEMENTAÇÃO - ANDROID (KOTLIN)

### 7.1 Dependências (build.gradle)

```gradle
dependencies {
    implementation 'org.java-websocket:Java-WebSocket:1.5.3'
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

### 7.2 Cliente WebSocket

```kotlin
import org.java_websocket.client.WebSocketClient
import org.java_websocket.handshake.ServerHandshake
import com.google.gson.Gson
import java.net.URI

class WebSocketManager(private val cozinhaId: Long) {
    
    private var client: WebSocketClient? = null
    private val gson = Gson()
    
    fun conectar(onNotificacao: (NotificacaoSubPedido) -> Unit) {
        val uri = URI("ws://localhost:8080/api/ws")
        
        client = object : WebSocketClient(uri) {
            override fun onOpen(handshake: ServerHandshake?) {
                Log.d("WebSocket", "Conectado")
                
                // Inscrever em tópico
                val subscribeFrame = """
                    SUBSCRIBE
                    id:sub-0
                    destination:/topic/cozinha/$cozinhaId
                    
                    ^@
                """.trimIndent()
                
                send(subscribeFrame)
            }
            
            override fun onMessage(message: String?) {
                message?.let {
                    val notificacao = gson.fromJson(it, NotificacaoSubPedido::class.java)
                    onNotificacao(notificacao)
                }
            }
            
            override fun onClose(code: Int, reason: String?, remote: Boolean) {
                Log.d("WebSocket", "Desconectado: $reason")
            }
            
            override fun onError(ex: Exception?) {
                Log.e("WebSocket", "Erro", ex)
            }
        }
        
        client?.connect()
    }
    
    fun desconectar() {
        client?.close()
    }
}
```

---

## 8. CASOS DE USO

### 8.1 Cozinha - Novos Pedidos

```javascript
// Cozinha se inscreve para receber novos pedidos
stompClient.subscribe('/topic/cozinha/1', (message) => {
    const notificacao = JSON.parse(message.body);
    
    if (notificacao.tipoAcao === 'CRIACAO' && notificacao.statusNovo === 'PENDENTE') {
        // Novo pedido chegou
        tocarAlertaSonoro();
        adicionarPedidoNaFila(notificacao);
        mostrarNotificacao('Novo pedido!', notificacao.numero);
    }
});
```

### 8.2 Atendente - Pedidos Prontos

```javascript
// Atendente se inscreve para ser notificado quando pedido fica pronto
stompClient.subscribe('/topic/atendente/unidade/5', (message) => {
    const notificacao = JSON.parse(message.body);
    
    if (notificacao.statusNovo === 'PRONTO') {
        // Pedido pronto para buscar
        vibrarDispositivo();
        adicionarNaFilaDeEntrega(notificacao);
        mostrarAlertaPrioridade(`Buscar: ${notificacao.numero}`);
    }
});
```

### 8.3 Cliente - Acompanhamento do Pedido

```javascript
// Cliente acompanha todos os SubPedidos do seu pedido
stompClient.subscribe(`/topic/pedido/${pedidoId}`, (message) => {
    const notificacao = JSON.parse(message.body);
    
    // Atualizar barra de progresso
    atualizarProgressoVisual(notificacao);
    
    // Notificar quando tudo estiver pronto
    if (todosProntos()) {
        mostrarNotificacao('Seu pedido está pronto!', 'Dirija-se ao balcão');
    }
});
```

---

## 9. TRATAMENTO DE ERROS

### 9.1 Reconexão Automática

```javascript
stompClient.reconnectDelay = 5000; // Tentar reconectar a cada 5s

stompClient.onDisconnect = () => {
    console.log('Desconectado. Tentando reconectar...');
    mostrarIndicadorDesconectado();
};

stompClient.onConnect = () => {
    console.log('Reconectado!');
    ocultarIndicadorDesconectado();
    reinscreverTopicos();
};
```

### 9.2 Heartbeat

```javascript
stompClient.heartbeatIncoming = 4000; // Esperar heartbeat do servidor a cada 4s
stompClient.heartbeatOutgoing = 4000; // Enviar heartbeat ao servidor a cada 4s
```

---

## 10. BOAS PRÁTICAS

### ✅ RECOMENDADO

1. **Sempre implementar reconexão automática**
2. **Usar heartbeat para detectar conexões mortas**
3. **Desinscrever de tópicos quando componente desmontar**
4. **Validar estrutura da mensagem antes de processar**
5. **Logar eventos importantes para debug**
6. **Implementar indicador visual de conexão**
7. **Tratar falhas de conexão graciosamente**

### ❌ EVITAR

1. **Não bloquear UI thread ao processar notificações**
2. **Não inscrever múltiplas vezes no mesmo tópico**
3. **Não ignorar erros de conexão**
4. **Não fazer polling quando WebSocket estiver ativo**
5. **Não enviar dados sensíveis via WebSocket sem HTTPS**

---

## 11. SEGURANÇA

### 11.1 Produção (HTTPS/WSS)

```javascript
// Usar WSS em produção
const socket = new SockJS('https://api.seusistema.com/ws');
```

### 11.2 Autenticação (Futuro)

O WebSocket atualmente não exige autenticação. Para produção, recomenda-se:

1. Enviar token JWT no handshake inicial
2. Validar token no servidor antes de aceitar conexão
3. Filtrar notificações por permissões do usuário

---

## 12. TESTES

### 12.1 Testar Conexão

```javascript
// Teste simples de conexão
const testarWebSocket = () => {
    const socket = new SockJS('http://localhost:8080/api/ws');
    const cliente = new Client({ webSocketFactory: () => socket });
    
    cliente.onConnect = () => {
        console.log('✅ Conexão estabelecida');
        cliente.publish({ destination: '/app/test', body: 'ping' });
    };
    
    cliente.activate();
};
```

---

## 13. MONITORAMENTO

### Métricas Recomendadas

- ✅ Número de conexões ativas
- ✅ Taxa de reconexões
- ✅ Latência média de mensagens
- ✅ Taxa de erros de conexão

---

## 14. SUPORTE

Para dúvidas ou problemas:
- 📧 Email: suporte@sistemarestauracao.com
- 📚 Documentação completa: `/docs`
- 🐛 Reportar bugs: Issue Tracker

---

**Última atualização:** 19/02/2026  
**Versão do Sistema:** 1.0.0
