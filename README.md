# 🚀 IndexPilot

**Plataforma profissional para gerenciamento centralizado de sites, geração de API Keys e controle de indexação de conteúdo.**

## 📋 Visão Geral

IndexPilot é uma plataforma moderna e confiável que permite gerenciar a indexação dos seus sites de forma centralizada. Com um pipeline robusto de publicações, você tem total controle sobre o processo de indexação de cada URL.

### Principais Recursos

- ✅ **Autenticação Segura** - Login e cadastro com Supabase Auth
- ✅ **Gerenciamento de Sites** - CRUD completo de sites
- ✅ **API Keys** - Gerar e gerenciar chaves de acesso para cada site
- ✅ **Publisher Engine** - API robusta para receber notificações de novas publicações
- ✅ **Dashboard em Tempo Real** - Métricas e acompanhamento de publicações
- ✅ **Dark/Light Mode** - Interface adaptável ao tema do sistema
- ✅ **Responsivo** - Funciona perfeitamente em Desktop, Tablet e Mobile

## 🛠️ Stack Técnico

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Supabase (Auth + Database)
- **Database**: PostgreSQL
- **Deploy**: Vercel

## 📦 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/indexpilot.git
cd indexpilot
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=seu_jwt_secret_aleatorio
```

### 4. Configurar Supabase

#### 4.1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha os dados do projeto
4. Copie as chaves para o `.env.local`

#### 4.2. Criar Tabelas

Execute o SQL em `schema.sql` na console SQL do Supabase:

1. Vá para **SQL Editor**
2. Cole o conteúdo de `schema.sql`
3. Execute

Isso criará:
- `users` - Perfis de usuários
- `sites` - Sites cadastrados
- `api_keys` - Chaves de API
- `publication_queue` - Fila de publicações
- `publication_logs` - Logs de publicações
- `publication_events` - Eventos de publicações

#### 4.3. Configurar Row Level Security (RLS)

As políticas RLS já estão definidas no `schema.sql`. Elas garantem que:
- Cada usuário vê apenas seus próprios dados
- API Keys só funcionam com os sites correspondentes
- Publicações só podem ser acessadas via API Key válida

### 5. Rodar Localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy no Vercel

### 1. Preparar para Deploy

```bash
npm run build
```

### 2. Conectar Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione este repositório GitHub
4. Clique em "Deploy"

### 3. Configurar Variáveis de Ambiente

No dashboard do Vercel:

1. Vá para **Settings** → **Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (sua URL de produção)
   - `JWT_SECRET`

3. Clique em "Save"

### 4. Redeploy

Volta para a aba **Deployments** e clique em "Redeploy" para usar as novas variáveis.

## 📖 Documentação de Uso

### Criar um Site

1. Vá para **Sites**
2. Clique em **+ Novo Site**
3. Preencha:
   - Nome: Ex: "Meu Blog"
   - Domínio: Ex: "meu-blog.com"
   - Descrição (opcional)
   - Status: Ativo/Inativo

### Gerar API Keys

1. Vá para **API Keys**
2. Selecione um site
3. Clique em **+ Gerar Chave**
4. Preencha um nome (Ex: "Produção")
5. Selecione o tipo: **Produção** ou **Teste**
6. Copie a chave (será exibida uma única vez!)

### Publicar Conteúdo via API

Use a chave gerada para fazer POST no endpoint `/api/publish`:

```bash
curl -X POST https://seu-dominio.com/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_live_sua_chave_aqui" \
  -d '{
    "url": "https://meu-blog.com/novo-artigo",
    "title": "Novo Artigo",
    "slug": "novo-artigo",
    "type": "article"
  }'
```

## 🔐 Segurança

- ✅ API Keys geradas aleatoriamente e hasheadas (SHA-256)
- ✅ URL deve ser HTTPS obrigatoriamente
- ✅ Domínio deve corresponder ao site da API Key
- ✅ localhost e 127.0.0.1 são rejeitados
- ✅ Duplicatas de URL detectadas automaticamente
- ✅ Rate limit: 100 req/min por API Key
- ✅ Row Level Security (RLS) em todas as tabelas

## 📊 Database Schema

Veja `schema.sql` para detalhes completos das tabelas e políticas RLS.

## 🤖 Próximas Sprints

- **Sprint 03**: Integração com Google Search Console
- **Sprint 04**: Google Indexing API + IndexNow
- **Sprint 05**: Sitemap e Robots.txt
- **Sprint 06**: Analytics e Insights
- **Sprint 07**: Automação de Workflows
- **Sprint 08**: IA e Recomendações

## 📝 Estrutura do Projeto

```
indexPilot/
├── app/
│   ├── (auth)/              # Rotas de autenticação
│   ├── (app)/               # Rotas protegidas
│   │   ├── dashboard/
│   │   ├── sites/
│   │   ├── publications/
│   │   ├── api-keys/
│   │   ├── settings/
│   │   └── profile/
│   └── api/
│       └── publish/         # Endpoint POST /api/publish
├── components/              # Componentes reutilizáveis
├── lib/                     # Utilitários
├── types/                   # TypeScript types
├── schema.sql              # Schema do banco
└── README.md
```

## 🧪 Testes da API

### Request Válido
```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_live_xxx" \
  -d '{
    "url": "https://exemplo.com/artigo",
    "title": "Meu Artigo",
    "slug": "meu-artigo",
    "type": "article"
  }'
```

### Resposta de Sucesso (201)
```json
{
  "success": true,
  "publicationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Resposta de Erro (401)
```json
{
  "success": false,
  "error": "Invalid API Key",
  "code": "INVALID_API_KEY"
}
```

## 📄 Licença

MIT © 2025 IndexPilot

---

**Desenvolvido com ❤️ para otimizar a indexação dos seus sites.**
