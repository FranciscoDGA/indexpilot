# Documentação da API IndexPilot

## Visão Geral

IndexPilot é uma plataforma de indexação de URLs pronta para produção que se integra com múltiplos mecanismos de busca e serviços de indexação. A API segue convenções RESTful e usa autenticação JWT.

## Authentication

### Authorization Header
All API endpoints require authentication via JWT token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### API Keys
Alternatively, use API keys for programmatic access:

```bash
Authorization: Bearer sk_live_xxxxx
```

## Base URL

```
https://api.indexpilot.com/v1
```

## Endpoints

### Sites Management

#### Create Site
```
POST /api/v1/sites
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "My Blog",
  "domain": "example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "site_123",
    "name": "My Blog",
    "domain": "example.com",
    "status": "active",
    "createdAt": "2026-08-04T10:00:00Z"
  }
}
```

#### List Sites
```
GET /api/v1/sites
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "site_123",
        "name": "My Blog",
        "domain": "example.com",
        "status": "active",
        "createdAt": "2026-08-04T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

#### Get Site Details
```
GET /api/v1/sites/{id}
Authorization: Bearer YOUR_TOKEN
```

#### Delete Site
```
DELETE /api/v1/sites/{id}
Authorization: Bearer YOUR_TOKEN
```

### URL Indexing

#### Submit URL for Indexing
```
POST /api/v1/index
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "site": "site_123",
  "url": "https://example.com/article",
  "type": "article"
}
```

Request Parameters:
- `site` (required): Site ID
- `url` (required): Full URL to index
- `type` (optional): Content type - `article`, `page`, `category`, `tag` (default: `article`)

Response:
```json
{
  "success": true,
  "data": {
    "urlId": "url_456",
    "status": "queued",
    "priority": 100,
    "queuePosition": 1,
    "message": "URL queued for indexing"
  }
}
```

#### Get Indexing Status
```
GET /api/v1/status?site=site_123
Authorization: Bearer YOUR_TOKEN
```

Response:
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

#### Get Indexing Statistics
```
GET /api/v1/index
Authorization: Bearer YOUR_TOKEN
```

### Logs

#### Get Activity Logs
```
GET /api/v1/logs?site=site_123&action=index_received&limit=20&offset=0
Authorization: Bearer YOUR_TOKEN
```

Query Parameters:
- `site` (optional): Filter by site ID
- `action` (optional): Filter by action type
- `provider` (optional): Filter by provider
- `limit` (optional): Items per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

Response:
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

#### Create Webhook
```
POST /api/v1/webhook
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "siteId": "site_123"
}
```

Response:
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

#### Receive URLs via Webhook
```
PUT /api/v1/webhook
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 of request body with webhook secret>

{
  "webhookId": "webhook_123",
  "url": "https://example.com/new-article",
  "type": "article",
  "contentHash": "abc123def456"
}
```

#### Test Webhook
```
POST /api/v1/webhook/{id}/test
Authorization: Bearer YOUR_TOKEN
```

### Integrations

#### Google Search Console

##### Authenticate with Google
```
POST /api/v1/integrations/google/auth
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "code": "authorization_code_from_oauth",
  "credentialType": "oauth"
}
```

Or using Service Account:
```
POST /api/v1/integrations/google/auth
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "credentialType": "service_account",
  "serviceAccountEmail": "service@project.iam.gserviceaccount.com",
  "projectId": "my-project",
  "clientId": "xxxxx"
}
```

##### List Properties
```
GET /api/v1/integrations/google/properties
Authorization: Bearer YOUR_TOKEN
```

##### Sync Properties
```
POST /api/v1/integrations/google/properties
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "accountId": "gacct_123"
}
```

##### Disconnect
```
POST /api/v1/integrations/google/disconnect
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "accountId": "gacct_123"
}
```

#### IndexNow

##### Setup IndexNow
```
POST /api/v1/integrations/indexnow/setup
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "siteId": "site_123",
  "siteUrl": "https://example.com",
  "generateKey": true
}
```

Response:
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
      "step1": "Place file at: https://example.com/.well-known/IndexNow.txt",
      "step2": "File content: 5A9FA38D8C8F4E7D9B1C2E3F4A5B6C7D",
      "step3": "Call verify endpoint after file is accessible",
      "bingEndpoint": "https://www.bing.com/indexnow",
      "yandexEndpoint": "https://yandex.com/indexnow"
    }
  }
}
```

##### Verify Key
```
POST /api/v1/integrations/indexnow/verify
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "credentialId": "inow_123"
}
```

## Response Format

All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2026-08-04T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2026-08-04T10:00:00Z"
}
```

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (permission denied)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited:
- 100 requests per minute for authenticated requests
- 10 requests per minute for unauthenticated requests

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691145600
```

## Priority Calculation

Content type priorities:
- Article: 100
- Page: 60
- Category: 40
- Tag: 30

Modifiers:
- New content: +50
- Updated content: +30
- Landing page: +40

## URL Validation

Before indexing, URLs are validated for:
- Valid URL format
- HTTPS enabled
- HTTP 200 status code
- Canonical tag presence
- Robots.txt compliance
- No noindex tag
- Sitemap presence

## Retry Strategy

Failed indexing attempts use exponential backoff:
- 1st retry: 5 minutes
- 2nd retry: 30 minutes
- 3rd retry: 2 hours
- 4th retry: 12 hours
- 5th retry: 24 hours

Maximum attempts: 5

## Dispatch Strategy

IndexPilot intelligently decides which providers receive each URL:

1. **IndexNow** (always): Fast, simple protocol supporting Bing & Yandex
2. **Google Indexing API** (conditional): For structured content types
3. **Google Search Console** (fallback): For general discovery

## Webhook Signature Verification

When receiving URLs via webhook, verify the signature:

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

## Examples

### Python
```python
import requests
import json

API_KEY = "sk_live_xxxxx"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Submit URL
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

## Support

For issues and support:
- Documentation: https://docs.indexpilot.com
- Support Email: support@indexpilot.com
- GitHub Issues: https://github.com/indexpilot/indexpilot/issues
