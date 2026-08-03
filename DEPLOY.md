# 🚀 Guia de Deploy - IndexPilot

## Status da Construção

✅ **Build Local** - Todos os erros foram corrigidos:
- ✅ Importações Supabase ajustadas para API routes
- ✅ Metadata removido de componente 'use client'
- ✅ Middleware simplificado sem dependências problemáticas
- ✅ TypeScript errors resolvidos

## 1️⃣ Deploy Local (Teste)

### Executar em Desenvolvimento

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Acesso: Use credenciais de teste ou crie uma nova conta

### Verificar Build

```bash
npm run build
npm run start
```

Deve completar sem erros.

## 2️⃣ Deploy no Vercel

### Passo 1: Preparar Código

```bash
# Ensure everything is committed
git status
git add -A
git commit -m "Ready for Vercel deployment"
git push origin claude/projeto-passo-a-passo-113ybg
```

### Passo 2: Conectar Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Escolha seu repositório `indexpilot`
5. Clique em **"Import"**

### Passo 3: Configurar Ambiente

**Adicione essas Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=seu_valor
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_valor
SUPABASE_SERVICE_ROLE_KEY=seu_valor
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
JWT_SECRET=seu_valor
```

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde 3-5 minutos
3. Acesse sua URL quando completar

## 3️⃣ Verificação Pós-Deploy

### ✅ Checklist

- [ ] Página carrega sem erros
- [ ] Login funciona
- [ ] Signup funciona
- [ ] Dashboard exibe corretamente
- [ ] Sites CRUD funciona
- [ ] API Keys geradas
- [ ] API `/api/publish` funciona

### Teste a API em Produção

```bash
curl -X POST https://seu-projeto.vercel.app/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_live_sua_chave" \
  -d '{
    "url": "https://seu-site.com/teste",
    "title": "Teste",
    "slug": "teste",
    "type": "article"
  }'
```

## 🔧 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se a chave foi copiada completa
- Verifique se a chave está ativa

### Erro: "Internal Server Error" no /api/publish
1. Verifique os logs no Vercel
2. Confirme que SUPABASE_SERVICE_ROLE_KEY está correto
3. Verifique se as tabelas existem no Supabase

### Erro: "CORS" em requisições
- Adicion `NEXT_PUBLIC_APP_URL` correto
- Configure CORS no Supabase se necessário

### Página em branco
1. Abra DevTools (F12)
2. Veja erros no Console
3. Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto

## 📊 Monitoramento

### Logs do Vercel

1. Dashboard do Vercel
2. Acesse seu projeto
3. **Deployments** → Clique no deploy
4. **Logs** → Veja erros em tempo real

### Logs do Supabase

1. Dashboard do Supabase
2. **SQL Editor** → Execute queries
3. **Logs** → Monitore erros de banco

## 🔄 Fazer Update (Redeploy)

Após fazer mudanças:

```bash
git add -A
git commit -m "fix: descrição do fix"
git push origin claude/projeto-passo-a-passo-113ybg
```

Vercel fará redeploy automaticamente!

## 📱 Deploy em Produção (Domínio Customizado)

1. No Vercel: **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruído
4. Aguarde propagação (5-48h)

## 💡 Dicas

- ✅ Sempre teste localmente antes de fazer deploy
- ✅ Use `npm run build` para testar build local
- ✅ Verifique all environment variables
- ✅ Mantenha SUPABASE_SERVICE_ROLE_KEY privado

## 📝 Checklist Pré-Deploy

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa
- [ ] `.env.local` tem todas as variáveis
- [ ] `git push` foi executado
- [ ] Vercel conectado ao repositório
- [ ] Environment variables no Vercel configuradas
- [ ] RLS policies ativas no Supabase
- [ ] Tabelas criadas no Supabase

---

**Parabéns! Seu IndexPilot está pronto para produção! 🎉**
