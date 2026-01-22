# 🔌 Guia de Integração Backend - WebSocket

## Para o Desenvolvedor Backend

Este guia explica exatamente o que o frontend espera do backend para a tela de Atendimento funcionar completamente.

---

## 📡 WebSocket Connection

### URL de Conexão

```
ws://localhost:8080/ws/chat?tenant_id={tenant_id}
```

ou em produção:

```
wss://api.randfy.com.br/ws/chat?tenant_id={tenant_id}
```

### Autenticação

**Opção 1: Query Parameter**
```
ws://localhost:8080/ws/chat?tenant_id={tenant_id}&token={jwt_token}
```

**Opção 2: Header (Recomendado)**
```javascript
new WebSocket(url, {
  headers: {
    'Authorization': 'Bearer {jwt_token}'
  }
});
```

**Opção 3: Primeiro Mensagem**
```javascript
// Após conectar, enviar
{
  "type": "auth",
  "token": "jwt_token_here"
}
```

---

## 📥 Mensagens do Cliente → Servidor

### 1. Enviar Mensagem

```json
{
  "type": "send_message",
  "phone_number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}
```

**Resposta esperada:**
```json
{
  "type": "message_sent",
  "message_id": "msg_abc123",
  "timestamp": "2026-01-21T10:30:00Z",
  "success": true
}
```

### 2. Marcar como Lido (Futuro)

```json
{
  "type": "mark_as_read",
  "phone_number": "5511999999999"
}
```

### 3. Ping/Pong (Keepalive)

```json
{
  "type": "ping"
}
```

**Resposta:**
```json
{
  "type": "pong",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

---

## 📤 Mensagens do Servidor → Cliente

### 1. Nova Mensagem (Mais Importante!)

```json
{
  "type": "new_message",
  "phone_number": "5511999999999",
  "message": {
    "id": "msg_xyz789",
    "from": "5511999999999",
    "text": "Olá, doutor! Preciso remarcar minha consulta.",
    "timestamp": "2026-01-21T10:30:00Z",
    "from_me": false,
    "push_name": "João Silva"
  }
}
```

**Campos obrigatórios:**
- `type`: "new_message"
- `phone_number`: Número de telefone do remetente
- `message.id`: ID único da mensagem
- `message.from`: Número do remetente
- `message.text`: Conteúdo da mensagem
- `message.timestamp`: ISO 8601 format
- `message.from_me`: boolean (false para mensagens recebidas)

**Campos opcionais:**
- `message.push_name`: Nome do contato no WhatsApp

### 2. Mensagem Enviada (Confirmação)

Quando o servidor processa com sucesso uma mensagem enviada:

```json
{
  "type": "message_delivered",
  "message_id": "msg_abc123",
  "phone_number": "5511999999999",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 3. Erro

```json
{
  "type": "error",
  "error_code": "MESSAGE_SEND_FAILED",
  "message": "Falha ao enviar mensagem. Número bloqueado.",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

**Códigos de erro comuns:**
- `MESSAGE_SEND_FAILED`: Falha ao enviar
- `UNAUTHORIZED`: Token inválido ou expirado
- `RATE_LIMIT_EXCEEDED`: Muitas mensagens
- `WHATSAPP_DISCONNECTED`: WhatsApp desconectado
- `INVALID_PHONE_NUMBER`: Número inválido

### 4. Status de Conexão

```json
{
  "type": "connection_status",
  "whatsapp_connected": true,
  "instance_id": "inst_123",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 5. Typing Indicator (Futuro)

```json
{
  "type": "typing",
  "phone_number": "5511999999999",
  "is_typing": true
}
```

---

## 🔄 Fluxo de Conexão

### 1. Cliente Conecta

```javascript
// Frontend
const ws = new WebSocket('ws://localhost:8080/ws/chat?tenant_id=123');
```

### 2. Servidor Autentica

```javascript
// Backend deve verificar:
// - tenant_id é válido
// - Usuário tem permissão para acessar esse tenant
// - Token JWT é válido
```

### 3. Servidor Envia Status Inicial

```json
{
  "type": "connected",
  "client_id": "client_abc123",
  "whatsapp_connected": true,
  "unread_count": 5,
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 4. Cliente Subscreve Eventos

Automaticamente após conexão, cliente deve receber:
- Novas mensagens em tempo real
- Mudanças de status
- Confirmações de envio

### 5. Heartbeat (Recomendado)

**Cliente envia a cada 30s:**
```json
{
  "type": "ping"
}
```

**Servidor responde:**
```json
{
  "type": "pong",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 6. Desconexão

```json
{
  "type": "disconnect",
  "reason": "client_request"
}
```

---

## 📊 REST API Endpoints

### 1. Listar Conversas

```http
GET /api/tenants/{tenant_id}/chat/conversations
Authorization: Bearer {token}
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "phone_number": "5511999999999",
      "name": "João Silva",
      "unread_count": 2,
      "last_message": "Olá, doutor!",
      "last_message_time": "2026-01-21T10:30:00Z",
      "profile_picture_url": "https://..."
    }
  ]
}
```

**Status Codes:**
- `200`: Sucesso
- `401`: Não autenticado
- `403`: Sem permissão
- `500`: Erro interno

### 2. Buscar Mensagens

```http
GET /api/tenants/{tenant_id}/chat/conversations/{phone_number}/messages?limit=50&page=1
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit`: Número de mensagens (padrão: 50, max: 100)
- `page`: Página de resultados (padrão: 1)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_xyz789",
      "from": "5511999999999",
      "text": "Olá, doutor!",
      "timestamp": "2026-01-21T10:30:00Z",
      "from_me": false,
      "push_name": "João Silva"
    },
    {
      "id": "msg_abc456",
      "from": "me",
      "text": "Olá! Como posso ajudar?",
      "timestamp": "2026-01-21T10:31:00Z",
      "from_me": true
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 3
}
```

**Ordenação:** Mais antigas primeiro (ordem cronológica)

### 3. Enviar Mensagem

```http
POST /api/tenants/{tenant_id}/chat/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone_number": "5511999999999",
  "text": "Olá! Sua consulta está confirmada."
}
```

**Response:**
```json
{
  "message_id": "msg_new123",
  "timestamp": "2026-01-21T10:35:00Z",
  "success": true
}
```

**Status Codes:**
- `200`: Mensagem enviada
- `400`: Dados inválidos
- `401`: Não autenticado
- `403`: Sem permissão
- `429`: Rate limit excedido
- `503`: WhatsApp desconectado

---

## 🔐 Segurança

### Validações Obrigatórias

1. **Autenticação**
   - Verificar JWT em cada requisição
   - Validar tenant_id pertence ao usuário
   - Rejeitar tokens expirados

2. **Autorização**
   - Usuário pode acessar apenas conversas do seu tenant
   - Validar permissões de acesso

3. **Rate Limiting**
   - Máximo 100 mensagens por minuto por tenant
   - Máximo 1000 mensagens por hora por tenant

4. **Sanitização**
   - Validar formato de phone_number
   - Limitar tamanho de mensagem (max 4096 caracteres)
   - Sanitizar HTML/scripts

5. **WebSocket**
   - Timeout de inatividade: 5 minutos
   - Máximo 3 conexões simultâneas por tenant
   - Validar origem da conexão

---

## 🛠️ Implementação Recomendada

### Tecnologias Sugeridas

**Go (Backend Atual):**
```go
// gorilla/websocket
import "github.com/gorilla/websocket"

// handler
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println(err)
        return
    }
    defer conn.Close()
    
    // Handle messages...
}
```

**Node.js (Alternativa):**
```javascript
// ws library
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Handle message
  });
});
```

### Estrutura de Dados (Redis)

**Armazenar conexões ativas:**
```redis
# Key: ws:tenant:{tenant_id}:connections
# Value: Set of connection IDs
SADD ws:tenant:123:connections "conn_abc123"
SADD ws:tenant:123:connections "conn_xyz789"
```

**Armazenar mensagens não lidas:**
```redis
# Key: unread:{tenant_id}:{phone_number}
# Value: Count
INCR unread:123:5511999999999
```

**Pub/Sub para múltiplas instâncias:**
```redis
# Channel: chat:tenant:{tenant_id}
PUBLISH chat:tenant:123 '{"type":"new_message","data":{...}}'
```

---

## 🧪 Como Testar

### 1. Ferramenta de Teste WebSocket

**wscat (Node.js):**
```bash
npm install -g wscat
wscat -c "ws://localhost:8080/ws/chat?tenant_id=123"
```

**Enviar mensagem:**
```json
{"type":"send_message","phone_number":"5511999999999","text":"teste"}
```

### 2. Postman

- Suporta WebSocket
- Pode salvar coleções de testes
- Visualização JSON formatada

### 3. Script de Teste

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ws/chat?tenant_id=123');

ws.on('open', () => {
  console.log('Connected!');
  
  // Enviar mensagem
  ws.send(JSON.stringify({
    type: 'send_message',
    phone_number: '5511999999999',
    text: 'Hello!'
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data));
});

ws.on('error', (error) => {
  console.error('Error:', error);
});
```

---

## 📝 Checklist de Implementação

### Backend WebSocket

- [ ] Endpoint de conexão (`/ws/chat`)
- [ ] Autenticação via query param ou header
- [ ] Validação de tenant_id
- [ ] Handler de `send_message`
- [ ] Broadcast de `new_message`
- [ ] Confirmação de `message_sent`
- [ ] Error handling
- [ ] Ping/Pong keepalive
- [ ] Desconexão graciosa
- [ ] Rate limiting
- [ ] Logging de eventos

### REST API

- [ ] `GET /chat/conversations`
- [ ] `GET /chat/conversations/{phone}/messages`
- [ ] `POST /chat/send`
- [ ] Paginação de mensagens
- [ ] Autenticação JWT
- [ ] Validações de input
- [ ] Error responses padronizados

### Integração WhatsApp

- [ ] Conexão com Evolution API ou similar
- [ ] Receber webhooks de novas mensagens
- [ ] Enviar mensagens via API
- [ ] Status de conexão
- [ ] Sincronização de conversas

---

## 🚨 Casos de Erro

### 1. WhatsApp Desconectado

**Backend deve:**
- Retornar erro nas APIs
- Enviar evento via WebSocket:

```json
{
  "type": "connection_status",
  "whatsapp_connected": false,
  "error": "WhatsApp disconnected. Please reconnect.",
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 2. Mensagem Não Enviada

```json
{
  "type": "error",
  "error_code": "MESSAGE_SEND_FAILED",
  "message": "Failed to send message",
  "details": {
    "phone_number": "5511999999999",
    "reason": "Number blocked"
  },
  "timestamp": "2026-01-21T10:30:00Z"
}
```

### 3. Rate Limit Excedido

```json
{
  "type": "error",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many messages. Please wait.",
  "retry_after": 60,
  "timestamp": "2026-01-21T10:30:00Z"
}
```

---

## 📈 Monitoramento

### Métricas Importantes

1. **WebSocket**
   - Conexões ativas
   - Taxa de reconexão
   - Latência média
   - Mensagens/segundo

2. **API**
   - Taxa de erro
   - Tempo de resposta
   - Throughput

3. **WhatsApp**
   - Status de conexão
   - Taxa de falha de envio
   - Fila de mensagens

### Logs Recomendados

```
[2026-01-21 10:30:00] [WS] Client connected: conn_abc123, tenant: 123
[2026-01-21 10:30:05] [WS] Message sent: msg_xyz789, phone: 5511999999999
[2026-01-21 10:30:10] [WS] New message received: msg_abc456, from: 5511999999999
[2026-01-21 10:30:15] [ERROR] Send failed: Number blocked
[2026-01-21 10:30:20] [WS] Client disconnected: conn_abc123, reason: timeout
```

---

## 🔗 Referências

### Bibliotecas Recomendadas

**Go:**
- [gorilla/websocket](https://github.com/gorilla/websocket)
- [gin-gonic/gin](https://github.com/gin-gonic/gin)

**Node.js:**
- [ws](https://github.com/websockets/ws)
- [socket.io](https://socket.io/)

**Python:**
- [websockets](https://websockets.readthedocs.io/)
- [FastAPI](https://fastapi.tiangolo.com/)

### Integrações WhatsApp

- [Evolution API](https://evolution-api.com/)
- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [WPPConnect](https://wppconnect.io/)

---

## 💬 Contato

Dúvidas sobre a integração?

- **Frontend Dev:** [Seu contato]
- **Backend Dev:** [Contato backend]
- **DevOps:** [Contato devops]

---

## ✅ Validação de Integração

### Teste Manual

1. ✅ Conectar WebSocket com token válido
2. ✅ Receber mensagem de "connected"
3. ✅ Enviar mensagem de teste
4. ✅ Receber confirmação
5. ✅ Simular mensagem externa (webhook)
6. ✅ Verificar recebimento no frontend
7. ✅ Desconectar e reconectar
8. ✅ Testar com token inválido
9. ✅ Testar rate limiting
10. ✅ Testar WhatsApp desconectado

---

**Backend Integration Guide v1.0.0**  
**Última atualização:** 21 de Janeiro de 2026

---

Bom desenvolvimento! 🚀
