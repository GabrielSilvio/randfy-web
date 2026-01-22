# Tela de Atendimento - WhatsApp Clone

## Visão Geral

A tela de Atendimento é uma interface de chat em tempo real, inspirada no WhatsApp, que permite aos profissionais de saúde gerenciar conversas com pacientes através do WhatsApp integrado.

## Funcionalidades

### ✅ Implementadas

- **Lista de Conversas**: Visualização de todas as conversas ativas com pacientes
- **Chat em Tempo Real**: Interface de mensagens com atualização em tempo real via WebSocket
- **Busca de Conversas**: Buscar conversas por nome ou número de telefone
- **Indicadores de Status**: 
  - Indicador de mensagens não lidas
  - Status de conexão do WhatsApp
  - Indicador de mensagem enviada/entregue
- **Envio de Mensagens**: Envio de mensagens de texto para pacientes
- **Interface Responsiva**: Layout otimizado para diferentes tamanhos de tela
- **Scroll Automático**: Scroll automático para a última mensagem
- **Formatação de Data/Hora**: Exibição formatada de timestamps
- **Estado Vazio**: Estados visuais quando não há conversas ou mensagens

### 🚧 Planejadas para o Futuro

- Envio de arquivos e imagens
- Mensagens de áudio
- Respostas rápidas
- Tags e categorização de conversas
- Histórico de conversas
- Pesquisa dentro das mensagens

## Arquitetura

### Componentes Principais

1. **Lista de Conversas (Sidebar Esquerda)**
   - Exibe todas as conversas ordenadas por última mensagem
   - Mostra nome, última mensagem, timestamp e contador de não lidas
   - Busca em tempo real

2. **Área de Chat (Painel Principal)**
   - Exibe mensagens da conversa selecionada
   - Design inspirado no WhatsApp com bolhas de mensagem
   - Fundo com padrão característico

3. **Input de Mensagem (Rodapé)**
   - Campo de texto para digitação de mensagens
   - Botão de envio
   - Suporte para Enter para enviar

### WebSocket - Comunicação em Tempo Real

A tela utiliza WebSocket para receber atualizações em tempo real de novas mensagens.

#### Configuração

Defina a variável de ambiente no seu arquivo `.env.local`:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws/chat
```

#### Protocolo de Mensagens

O WebSocket espera e envia mensagens no formato JSON:

```typescript
// Mensagem recebida do servidor
{
  "type": "new_message",
  "message": {
    "id": "msg_123",
    "from": "5511999999999",
    "text": "Olá, doutor!",
    "timestamp": "2026-01-21T10:30:00Z",
    "from_me": false,
    "push_name": "João Silva"
  },
  "phone_number": "5511999999999"
}
```

#### Reconexão Automática

O WebSocket implementa reconexão automática com intervalo de 5 segundos em caso de desconexão.

## API Endpoints Utilizados

### GET `/api/tenants/{tenantId}/chat/conversations`
Lista todas as conversas do tenant.

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_123",
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

### GET `/api/tenants/{tenantId}/chat/conversations/{phoneNumber}/messages`
Obtém mensagens de uma conversa específica.

**Query Parameters:**
- `limit`: Número de mensagens (padrão: 50)
- `page`: Página de resultados (padrão: 1)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "from": "5511999999999",
      "text": "Olá, doutor!",
      "timestamp": "2026-01-21T10:30:00Z",
      "from_me": false,
      "push_name": "João Silva"
    }
  ]
}
```

### POST `/api/tenants/{tenantId}/chat/send`
Envia uma mensagem para um número de telefone.

**Request Body:**
```json
{
  "phone_number": "5511999999999",
  "text": "Olá! Como posso ajudar?"
}
```

**Response:**
```json
{
  "message_id": "msg_456",
  "timestamp": "2026-01-21T10:31:00Z",
  "success": true
}
```

## Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **WebSocket API** - Comunicação em tempo real
- **API Client** - Cliente HTTP customizado com retry e deduplicação

## Estrutura de Arquivos

```
app/(authenticated)/atendimento/
├── page.tsx           # Componente principal da tela
└── README.md          # Este arquivo

lib/hooks/
└── useWebSocket.ts    # Hook customizado para WebSocket
```

## Como Testar

1. Certifique-se de que o backend está rodando
2. Configure a variável de ambiente `NEXT_PUBLIC_WS_URL`
3. Faça login na aplicação
4. Navegue para `/atendimento`
5. Selecione uma conversa existente ou aguarde novas mensagens

## Notas de Desenvolvimento

### Performance

- As conversas são ordenadas por última mensagem automaticamente
- Scroll automático apenas quando novas mensagens chegam
- Deduplicação de requests na API
- Reconexão automática do WebSocket

### Acessibilidade

- Uso de elementos semânticos
- Aria labels onde necessário
- Suporte a navegação por teclado (Enter para enviar)

### UX

- Feedback visual para ações (loading, enviando)
- Estados vazios informativos
- Transições suaves
- Layout familiar (inspirado no WhatsApp)

## Troubleshooting

### WebSocket não conecta

1. Verifique se a variável `NEXT_PUBLIC_WS_URL` está configurada
2. Certifique-se de que o backend suporta WebSocket
3. Verifique os logs do console para erros

### Mensagens não aparecem

1. Verifique a conexão com o backend
2. Confirme que o tenant_id está correto
3. Verifique os logs do console

### Erro de autenticação

1. Faça logout e login novamente
2. Verifique se o token não expirou
3. Confirme que o usuário tem um tenant associado
