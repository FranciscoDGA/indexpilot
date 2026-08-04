# IndexPilot - Plataforma de Indexação de URLs

Uma plataforma pronta para produção e escalável de indexação de URLs que se integra com múltiplos mecanismos de busca e serviços de indexação. Construída com Next.js 16, TypeScript e Prisma.

## Características

### Sprint 01: Núcleo da Fundação
- **Gerenciamento Multi-Site de URLs**: Lidar com múltiplos sites com dados isolados
- **Sistema de Fila Inteligente**: Processamento de URLs baseado em prioridade com backoff exponencial
- **Validação de URL**: Validação abrangente incluindo HTTPS, códigos de status, robots.txt, tags noindex
- **Pontuação de Prioridade**: Cálculo de prioridade dinâmica baseado em tipo de conteúdo e atualização
- **Log de Atividades**: Rastreamento completo de todos os eventos de indexação
- **Suporte a Webhooks**: Receber URLs de plataformas externas
- **Dashboard**: Monitoramento em tempo real e envio de URLs

### Sprint 02: Integração com Mecanismos de Busca
- **Google Search Console**: Integração OAuth com sincronização automática de propriedades
- **API de Indexação Google**: Indexação direta para conteúdo estruturado (JobPosting, BroadcastEvent, Event)
- **Protocolo IndexNow**: Enviar URLs para Bing e Yandex via IndexNow
- **Despacho Inteligente**: Roteamento inteligente baseado em tipo de conteúdo e capacidades do provedor
- **Sincronização do Provedor**: Atualizações periódicas de status de serviços externos
- **Normalização de Respostas**: Relatório de status consistente em todos os provedores

### Arquitetura Principal
- **Pronto para SaaS**: Suporte multi-tenant com isolamento baseado em publicação
- **Primeira API**: API RESTful com autenticação JWT e chaves de API
- **Trabalhos em Segundo Plano**: Processamento agendado com padrões semelhantes a cron
- **Estratégia de Retry**: Backoff exponencial com jitter para evitar thundering herd
- **Extensível**: Arquitetura de plugin para adicionar novos mecanismos de busca e serviços de indexação

## Stack de Tecnologia

- **Runtime**: Node.js com Next.js 16.3
- **Linguagem**: TypeScript (modo strict)
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Fila de Trabalhos**: Upstash Redis (produção) / Em memória (desenvolvimento)
- **Autenticação**: Supabase JWT ou implementação JWT customizada
- **UI**: React 19 com TailwindCSS
- **Testes**: Jest e Playwright (para E2E)

## Estrutura do Projeto

```
indexpilot/
├── app/
│   ├── api/v1/                    # Endpoints da API
│   │   ├── index/                 # Envio de URLs
│   │   ├── status/                # Consultas de status
│   │   ├── logs/                  # Logs de atividade
│   │   ├── sites/                 # Gerenciamento de sites
│   │   ├── webhook/               # Manipulação de webhooks
│   │   └── integrations/          # Integrações de provedores
│   └── dashboard/                 # Páginas frontend
│       ├── page.tsx               # Dashboard principal
│       ├── sites/                 # Páginas de sites
│       ├── settings/              # Configurações do usuário
│       └── api/                   # Gerenciamento de chaves API
├── lib/
│   ├── services/indexPilot/       # Lógica de negócio principal
│   │   ├── validationEngine.ts    # Validação de URL
│   │   ├── priorityEngine.ts      # Cálculo de prioridade
│   │   ├── queueEngine.ts         # Gerenciamento de fila
│   │   ├── dispatchEngine.ts      # Roteamento inteligente
│   │   ├── retryEngine.ts         # Gerenciamento de retry
│   │   ├── loggerService.ts       # Log de atividades
│   │   ├── scheduler.ts           # Tarefas em segundo plano
│   │   ├── syncEngine.ts          # Sincronização de provedor
│   │   └── responseNormalizer.ts  # Normalização de status
│   ├── connectors/                # Integrações de provedores
│   │   ├── baseConnector.ts       # Classe base abstrata
│   │   ├── googleConnector.ts     # Implementação Google
│   │   └── indexNowConnector.ts   # Implementação IndexNow
│   ├── supabase/                  # Autenticação
│   │   └── auth.ts
│   ├── utils/                     # Utilitários
│   │   ├── url.ts
│   │   └── crypto.ts
│   └── constants.ts               # Constantes da aplicação
├── prisma/
│   └── schema.prisma              # Schema do banco de dados
├── types/
│   └── indexPilot.ts              # Tipos TypeScript
├── API_PT.md                      # Documentação da API
└── README_PT.md                   # Este arquivo
```

## Primeiros Passos

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Redis (para produção)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/indexpilot/indexpilot.git
cd indexpilot

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Inicializar banco de dados
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# Autenticação
JWT_SECRET=sua-chave-secreta-aqui
ENCRYPTION_KEY=sua-chave-de-encriptação-aqui

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/indexpilot

# Redis (opcional, para produção)
REDIS_URL=redis://localhost:6379

# Integração Google
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/integrations/google/callback

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# Email (opcional)
SMTP_FROM=noreply@indexpilot.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=seu-email
SMTP_PASSWORD=sua-senha
```

## Configuração do Banco de Dados

### Criar Migração
```bash
npx prisma migrate dev --name adicionar_feature
```

### Aplicar Migrações
```bash
npx prisma migrate deploy
```

### Visualizar Schema
```bash
npx prisma studio
```

## Uso da API

### Enviar URL
```bash
curl -X POST http://localhost:3000/api/v1/index \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site": "site_123",
    "url": "https://example.com/article",
    "type": "article"
  }'
```

### Obter Status do Site
```bash
curl http://localhost:3000/api/v1/status?site=site_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Visualizar Logs de Atividade
```bash
curl "http://localhost:3000/api/v1/logs?site=site_123&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Veja [API_PT.md](./API_PT.md) para documentação completa da API.

## Arquitetura

### Fluxo de Requisição

```
Requisição do Cliente
    ↓
Autenticação (JWT/Chave de API)
    ↓
Mecanismo de Validação (Verificações de URL)
    ↓
Mecanismo de Prioridade (Cálculo de Pontuação)
    ↓
Mecanismo de Fila (Criação de Trabalho)
    ↓
Serviço de Log (Rastreamento de Auditoria)
    ↓
Agendador (Processamento em Segundo Plano)
    ↓
Mecanismo de Despacho (Seleção de Provedor)
    ↓
Conectores (Google/IndexNow)
    ↓
Normalizador de Resposta (Conversão de Status)
    ↓
Mecanismo de Sincronização (Atualizações Periódicas)
    ↓
Dashboard (Status em Tempo Real)
```

### Cálculo de Prioridade

As pontuações são calculadas com base em:
- **Tipo de Conteúdo** (base): Artigo (100), Página (60), Categoria (40), Tag (30)
- **Atualização**: Conteúdo novo (+50), Conteúdo atualizado (+30)
- **Importância**: Página de destino (+40)
- **Espera na Fila**: Aumenta com o tempo para evitar inanição

Exemplo: Novo artigo em página de destino = 100 + 50 + 40 = 190

### Estratégia de Retry

Envios falhados usam backoff exponencial:
1. Tentativa 1: Imediata
2. Tentativa 2: 5 minutos depois
3. Tentativa 3: 30 minutos depois
4. Tentativa 4: 2 horas depois
5. Tentativa 5: 12 horas depois
6. Final: 24 horas depois

Cada atraso inclui 10% de jitter aleatório para evitar thundering herd.

### Lógica de Despacho

**Estratégia Condicional** (Recomendado):
- Sempre enviar para IndexNow (simples, amplo suporte)
- Enviar para Google se:
  - Tipo de conteúdo for suportado (JobPosting, BroadcastEvent, Event)
  - OU URL for nova e ainda não indexada
- Retornar para Google Search Console para descoberta

**Estratégia Todos**:
- Enviar para todos os provedores habilitados independentemente do tipo

**Estratégia Primária**:
- Enviar apenas para o provedor primário do usuário

## Considerações de Desempenho

### Índices de Banco de Dados
- URLs indexadas por status, prioridade, site, data_criação
- Logs indexados por usuário, site, ação, data_criação
- Trabalhos de fila indexados por status, prioridade, data_agendada

### Cache
- Propriedades do provedor armazenadas em memória
- Credenciais armazenadas em cache com TTL
- Estatísticas de fila armazenadas em cache por 60 segundos

### Limite de Taxa
- 100 requisições/minuto para usuários autenticados
- 10 requisições/minuto para não autenticados
- Manipulação de limite de taxa por provedor (respostas 429)

## Segurança

### Proteção de Dados
- Armazenamento de credenciais encriptado (AES-256-GCM)
- Gerenciamento seguro de chaves via variáveis de ambiente
- Apenas URLs HTTPS aceitas
- Verificação de assinatura de webhook (HMAC-SHA256)

### Autenticação
- Validação de token JWT em todos os endpoints
- Suporte a chave de API para acesso programático
- Controle de acesso baseado em função (usuário/admin)
- Autenticação baseada em sessão para dashboard

### Prevenção de Injeção SQL
- Consultas parametrizadas do Prisma
- Validação de entrada em todos os endpoints
- Sem construção dinâmica de SQL

## Monitoramento

### Health Checks
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Ver logs da aplicação
npm run logs

# Ver estatísticas da fila
curl http://localhost:3000/api/v1/index -H "Authorization: Bearer YOUR_TOKEN"
```

### Métricas
- Profundidade da fila
- Tempo de processamento por URL
- Taxas de sucesso/falha por provedor
- Status de limite de taxa do provedor
- Distribuição de tentativas de retry

## Testes

### Testes Unitários
```bash
npm run test
```

### Testes de Integração
```bash
npm run test:integration
```

### Testes E2E
```bash
npm run test:e2e
```

## Implementação

### Pré-requisitos
- Docker & Docker Compose
- Banco de dados PostgreSQL
- Instância Redis (opcional)

### Implementar em Produção
```bash
# Build
npm run build

# Iniciar servidor de produção
npm run start

# Com Docker
docker build -t indexpilot .
docker run -p 3000:3000 --env-file .env.production indexpilot
```

### Configuração de Ambiente (Produção)
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.indexpilot.com
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/indexpilot
JWT_SECRET=chave-secreta-aleatoria-muito-longa
ENCRYPTION_KEY=outra-chave-aleatoria-muito-longa
```

## Contribuindo

1. Criar branch de feature: `git checkout -b feature/minha-feature`
2. Fazer commit das mudanças: `git commit -am 'Adicionar minha feature'`
3. Push para o branch: `git push origin feature/minha-feature`
4. Submeter Pull Request

## Roadmap

- [ ] Integração com Bing Webmaster Tools
- [ ] Integração com Yandex Webmaster
- [ ] Integração com Baidu
- [ ] Suporte multi-idioma
- [ ] Regras de agendamento customizadas
- [ ] Import em lote de URLs
- [ ] Dashboard de análise avançada
- [ ] Gerenciamento de retry de webhook
- [ ] Análise de uso da API
- [ ] SDK de provedor customizado

## Licença

Licença MIT - veja arquivo LICENSE para detalhes

## Suporte

- **Documentação**: https://docs.indexpilot.com
- **Issues**: https://github.com/indexpilot/indexpilot/issues
- **Email**: support@indexpilot.com
- **Discord**: https://discord.gg/indexpilot

## Autores

- Francisco DGA (@franciscodga)
- Time IndexPilot

## Reconhecimentos

- Google Search Console API
- Protocolo IndexNow
- Comunidade Next.js
- Prisma ORM
