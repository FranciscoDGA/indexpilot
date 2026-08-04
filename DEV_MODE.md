# IndexPilot - Development Mode (Mock Data)

## Quick Start - Visualizar Dashboard

O projeto agora inclui um **modo de desenvolvimento com dados mock** para você testar a interface sem precisar configurar Supabase, Google Auth, ou APIs.

### Como usar:

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo development
npm run dev

# 3. Acessar http://localhost:3000
# Será redirecionado automaticamente para /dashboard
```

### ✅ O que funciona em modo mock:

- ✅ Dashboard com métricas de exemplo
- ✅ Visualizar sites cadastrados
- ✅ Ver publicações com diferentes status
- ✅ API Keys management
- ✅ Perfil e Settings
- ✅ Timeline de eventos
- ✅ Filtros e busca (funcionam com dados mock)

### ❌ O que NÃO funciona (implementar depois):

- ❌ Login/Signup (bypass automático)
- ❌ Criar sites (mock não salva)
- ❌ Deletar/editar (mock não persiste)
- ❌ Endpoint `/api/publish` (precisa Supabase real)

---

## Dados Mock Disponíveis

### Sites:
```json
{
  "Tech Blog": "techblog.com",
  "News Portal": "newscenter.io", 
  "E-commerce Store": "shop.example.com"
}
```

### Publicações:
- 5 publicações com diferentes status: `RECEIVED`, `PROCESSING`, `INDEXED`, `ERROR`
- Títulos e URLs de exemplo
- Timestamps variados

### API Keys:
- 2 chaves de exemplo (live/test)
- Last used tracking
- Publication counts

---

## Quando Configurar Supabase (depois)

Para sair do modo mock e conectar ao Supabase real:

1. **Criar projeto Supabase** em [supabase.com](https://supabase.com)
2. **Obter credenciais**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   
3. **Atualizar `.env.local`**:
```bash
# Desabilitar mock
NEXT_PUBLIC_USE_MOCK=false

# Adicionar credenciais reais
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

4. **Rodar migrations** (quando prontos)
```bash
psql -h [host] -U postgres -d postgres -f schema.sql
```

---

## Arquivo de Configuração

O arquivo `.env.local` controla o modo:

```bash
# Development (mock data)
NEXT_PUBLIC_USE_MOCK=true

# Production (real Supabase)
# NEXT_PUBLIC_USE_MOCK=false
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Estrutura do Mock

- `/lib/supabase/mock.ts` - Cliente Supabase fake com dados de exemplo
- `/lib/supabase/clientLazy.ts` - Carrega mock ou real baseado em env var
- `/middleware.ts` - Bypass de autenticação em modo mock

---

## Próximos Passos

Você pode agora:
1. ✅ Navegar por todas as páginas e testar UI/UX
2. ✅ Visualizar diferentes estados de dados
3. ✅ Testar responsividade em devices
4. ⏳ Depois: Configurar Supabase real
5. ⏳ Depois: Implementar Google Login
6. ⏳ Depois: Configurar APIs externas

Aproveite! 🚀
