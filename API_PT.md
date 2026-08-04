# Documentação da API IndexPilot

## Visão Geral

IndexPilot é uma plataforma de indexação de URLs pronta para produção que se integra com múltiplos mecanismos de busca e serviços de indexação. A API segue convenções RESTful e usa autenticação JWT.

## Autenticação

### Cabeçalho de Autorização
Todos os endpoints da API requerem autenticação via token JWT no cabeçalho Authorization:

```bash
Authorization: Bearer SEU_TOKEN_JWT
```

### Chaves de API
Alternativamente, use chaves de API para acesso programático:

```bash
Authorization: Bearer sk_live_xxxxx
```

## URL Base

```
https://api.indexpilot.com/v1
```

## Endpoints

### Gerenciamento de Sites

#### Criar Site
```
POST /api/v1/sites
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "name": "Meu Blog",
  "domain": "example.com"
}
```

Resposta:
```json
{
  "success": true,
  "data": {
    "id": "site_123",
    "name": "Meu Blog",
    "domain": "example.com",
    "status": "active",
    "createdAt": "2026-08-04T10:00:00Z"
  }
}
```

#### Listar Sites
```
GET /api/v1/sites
Authorization: Bearer SEU_TOKEN
```

Resposta:
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "site_123",
        "name": "Meu Blog",
        "domain": "example.com",
        "status": "active",
        "createdAt": "2026-08-04T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

#### Obter Detalhes do Site
```
GET /api/v1/sites/{id}
Authorization: Bearer SEU_TOKEN
```

#### Deletar Site
```
DELETE /api/v1/sites/{id}
Authorization: Bearer SEU_TOKEN
```

### Indexação de URLs

#### Enviar URL para Indexação
```
POST /api/v1/index
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "site": "site_123",
  "url": "https://example.com/article",
  "type": "article"
}
```

Parâmetros da Requisição:
- `site` (obrigatório): ID do site
- `url` (obrigatório): URL completa a indexar
- `type` (opcional): Tipo de conteúdo - `article`, `page`, `category`, `tag` (padrão: `article`)

Resposta:
```json
{
  "success": true,
  "data": {
    "urlId": "url_456",
    "status": "queued",
    "priority": 100,
    "queuePosition": 1,
    "message": "URL adicionada à fila para indexação"
  }
}
```

#### Obter Status de Indexação
```
GET /api/v1/status?site=site_123
Authorization: Bearer SEU_TOKEN
```

Resposta:
```json
{
  "success": true,
  "data": {
    "site": "site_123",
    "totalUrls": 150,
    "pending": 5,
    "queued": 10,
    "processing": 2,
    "indexed": 120,
    "failed": 13,
    "averageProcessingTime": 2500,
    "lastSync": "2026-08-04T10:30:00Z"
  }
}
```

#### Obter Estatísticas de Indexação
```
GET /api/v1/index
Authorization: Bearer SEU_TOKEN
```

### Logs

#### Obter Logs de Atividade
```
GET /api/v1/logs?site=site_123&action=index_received&limit=20&offset=0
Authorization: Bearer SEU_TOKEN
```

Parâmetros de Consulta:
- `site` (opcional): Filtrar por ID do site
- `action` (opcional): Filtrar por tipo de ação
- `provider` (opcional): Filtrar por provedor
- `limit` (opcional): Itens por página (padrão: 50, máx: 100)
- `offset` (opcional): Offset de paginação (padrão: 0)

Resposta:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_789",
        "userId": "user_123",
        "siteId": "site_123",
        "action": "index_received",
        "provider": null,
        "status": "success",
        "duration": 150,
        "createdAt": "2026-08-04T10:00:00Z"
      }
    ],
    "total": 150,
    "page": 0,
    "pageSize": 20
  }
}
```

### Webhooks

#### Criar Webhook
```
POST /api/v1/webhook
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "siteId": "site_123"
}
```

Resposta:
```json
{
  "success": true,
  "data": {
    "id": "webhook_123",
    "siteId": "site_123",
    "secret": "whsec_xxxxx",
    "active": true,
    "createdAt": "2026-08-04T10:00:00Z"
  }
}
```

#### Receber URLs via Webhook
```
PUT /api/v1/webhook
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 do corpo da requisição com segredo do webhook>

{
  "webhookId": "webhook_123",
  "url": "https://example.com/novo-artigo",
  "type": "article",
  "contentHash": "abc123def456"
}
```

#### Testar Webhook
```
POST /api/v1/webhook/{id}/test
Authorization: Bearer SEU_TOKEN
```

### Integrações

#### Google Search Console

##### Autenticar com Google
```
POST /api/v1/integrations/google/auth
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "code": "authorization_code_from_oauth",
  "credentialType": "oauth"
}
```

Ou usando Service Account:
```
POST /api/v1/integrations/google/auth
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "credentialType": "service_account",
  "serviceAccountEmail": "service@project.iam.gserviceaccount.com",
  "projectId": "my-project",
  "clientId": "xxxxx"
}
```

##### Listar Propriedades
```
GET /api/v1/integrations/google/properties
Authorization: Bearer SEU_TOKEN
```

##### Sincronizar Propriedades
```
POST /api/v1/integrations/google/properties
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "accountId": "gacct_123"
}
```

##### Desconectar
```
POST /api/v1/integrations/google/disconnect
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "accountId": "gacct_123"
}
```

#### IndexNow

##### Configurar IndexNow
```
POST /api/v1/integrations/indexnow/setup
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "siteId": "site_123",
  "siteUrl": "https://example.com",
  "generateKey": true
}
```

Resposta:
```json
{
  "success": true,
  "data": {
    "id": "inow_123",
    "siteId": "site_123",
    "siteUrl": "https://example.com",
    "apiKey": "5A9FA38D8C8F4E7D9B1C2E3F4A5B6C7D",
    "status": "pending",
    "instructions": {
      "step1": "Coloque o arquivo em: https://example.com/.well-known/IndexNow.txt",
      "step2": "Conteúdo do arquivo: 5A9FA38D8C8F4E7D9B1C2E3F4A5B6C7D",
      "step3": "Chame o endpoint de verificação após o arquivo ficar acessível",
      "bingEndpoint": "https://www.bing.com/indexnow",
      "yandexEndpoint": "https://yandex.com/indexnow"
    }
  }
}
```

##### Verificar Chave
```
POST /api/v1/integrations/indexnow/verify
Content-Type: application/json
Authorization: Bearer SEU_TOKEN

{
  "credentialId": "inow_123"
}
```

## Formato de Resposta

Todas as respostas seguem um formato consistente:

### Resposta de Sucesso
```json
{
  "success": true,
  "data": { /* dados da resposta */ },
  "timestamp": "2026-08-04T10:00:00Z"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "timestamp": "2026-08-04T10:00:00Z"
}
```

## Códigos de Erro

- `400` - Requisição Inválida (erro de validação)
- `401` - Não Autorizado (token ausente/inválido)
- `403` - Proibido (permissão negada)
- `404` - Não Encontrado (recurso não existe)
- `409` - Conflito (recurso duplicado)
- `500` - Erro Interno do Servidor

## Limite de Taxa

As requisições da API são limitadas:
- 100 requisições por minuto para requisições autenticadas
- 10 requisições por minuto para requisições não autenticadas

Cabeçalhos de limite de taxa:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691145600
```

## Cálculo de Prioridade

Prioridades por tipo de conteúdo:
- Artigo: 100
- Página: 60
- Categoria: 40
- Tag: 30

Modificadores:
- Conteúdo novo: +50
- Conteúdo atualizado: +30
- Página de destino: +40

## Validação de URL

Antes de indexar, URLs são validadas para:
- Formato de URL válido
- HTTPS habilitado
- Status HTTP 200
- Presença de tag canônica
- Conformidade com robots.txt
- Ausência de tag noindex
- Presença de sitemap

## Estratégia de Retry

Tentativas de indexação falhadas usam backoff exponencial:
- 1ª tentativa: 5 minutos
- 2ª tentativa: 30 minutos
- 3ª tentativa: 2 horas
- 4ª tentativa: 12 horas
- 5ª tentativa: 24 horas

Máximo de tentativas: 5

## Estratégia de Despacho

IndexPilot decide inteligentemente quais provedores recebem cada URL:

1. **IndexNow** (sempre): Protocolo rápido e simples suportando Bing & Yandex
2. **API de Indexação Google** (condicional): Para tipos de conteúdo estruturado
3. **Google Search Console** (fallback): Para descoberta geral

## Verificação de Assinatura de Webhook

Ao receber URLs via webhook, verifique a assinatura:

```javascript
const crypto = require('crypto');

function verifySignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

## Exemplos

### Python
```python
import requests
import json

API_KEY = "sk_live_xxxxx"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Enviar URL
response = requests.post(
    "https://api.indexpilot.com/v1/index",
    headers=headers,
    json={
        "site": "site_123",
        "url": "https://example.com/article",
        "type": "article"
    }
)

print(response.json())
```

### JavaScript
```javascript
const API_KEY = "sk_live_xxxxx";

async function submitUrl(siteId, url, type = "article") {
  const response = await fetch("https://api.indexpilot.com/v1/index", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      site: siteId,
      url: url,
      type: type
    })
  });

  return response.json();
}
```

### cURL
```bash
curl -X POST https://api.indexpilot.com/v1/index \
  -H "Authorization: Bearer sk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "site": "site_123",
    "url": "https://example.com/article",
    "type": "article"
  }'
```

## Suporte

Para problemas e suporte:
- Documentação: https://docs.indexpilot.com
- Email de Suporte: support@indexpilot.com
- Issues no GitHub: https://github.com/indexpilot/indexpilot/issues
