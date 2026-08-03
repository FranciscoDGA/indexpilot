# 🚀 Guia de Setup IndexPilot

Este guia passo a passo te orientará na configuração completa do IndexPilot.

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta GitHub
- Conta Vercel (opcional, para deployment)

## Passo 1: Preparar o Repositório

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/indexpilot.git
cd indexpilot

# Instale as dependências
npm install

# Crie o arquivo de ambiente
cp .env.example .env.local
```

## Passo 2: Configurar Supabase

### 2.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Preencha:
   - **Project name**: `indexpilot` (ou outro nome)
   - **Database password**: Crie uma senha segura (min 8 caracteres)
   - **Region**: Escolha a região mais próxima (ex: `America/Sao_Paulo`)
4. Clique em **"Create new project"**

⏳ Aguarde de 3-5 minutos enquanto o projeto é criado.

### 2.2 Obter as Chaves

1. Na página do projeto, vá para **Settings** → **API**
2. Copie essas chaves:
   - **Project URL**: Cole em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: Cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret**: Cole em `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Executar o Schema SQL

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **"New Query"**
3. Cole todo o conteúdo do arquivo `schema.sql`
4. Clique em **"Run"**

✅ As tabelas foram criadas com sucesso!

## Passo 3: Configurar Variáveis de Ambiente

Abra `.env.local` e preencha:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
JWT_SECRET=seu_secret_aleatorio_min_32_caracteres
```

Para gerar um JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Passo 4: Testar Localmente

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Criar Conta de Teste

1. Clique em **"Criar conta"**
2. Preencha os dados:
   - Email: `teste@exemplo.com`
   - Senha: `Senha123!`
   - Nome: `Teste`
3. Clique em **"Criar conta"**

### Testar Fluxo Completo

1. ✅ Faça login
2. ✅ Vá para **Sites** e crie um novo site
3. ✅ Vá para **API Keys** e gere uma chave
4. ✅ Copie a chave gerada
5. ✅ Vá para **Publicações** (ainda vazio)
6. ✅ Use curl para testar o endpoint:

```bash
curl -X POST http://localhost:3000/api/publish \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pk_live_sua_chave" \
  -d '{
    "url": "https://seu-dominio.com/artigo-1",
    "title": "Primeiro Artigo",
    "slug": "primeiro-artigo",
    "type": "article"
  }'
```

7. ✅ Volte para **Publicações** e veja a URL criada!

## Passo 5: Deploy no Vercel (Opcional)

### 5.1 Preparar para Produção

```bash
# Teste o build
npm run build

# Verifique se tudo passou
npm run lint
```

### 5.2 Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Busque `indexpilot` e clique em **"Import"**

### 5.3 Configurar Ambiente

Na tela de configuração do Vercel:

1. Clique em **"Environment Variables"**
2. Adicione as mesmas variáveis do `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL (sua URL de produção)
   JWT_SECRET
   ```
3. Clique em **"Deploy"**

⏳ Aguarde 2-3 minutos enquanto o app faz deploy.

### 5.4 Testar em Produção

1. Acesse sua URL do Vercel
2. Crie uma nova conta
3. Teste o fluxo completo novamente

## Passo 6: Configurar Domínio Customizado (Opcional)

Se você tem um domínio:

1. No Vercel, vá para **Settings** → **Domains**
2. Clique em **"Add Domain"**
3. Coloque seu domínio
4. Configure os DNS records conforme instruído

## 🧪 Checklist de Verificação

- [ ] Projeto Supabase criado
- [ ] Tabelas criadas com schema.sql
- [ ] `.env.local` preenchido corretamente
- [ ] `npm run dev` funcionando
- [ ] Login/Signup funcionando
- [ ] Site criado com sucesso
- [ ] API Key gerada com sucesso
- [ ] POST /api/publish funcionando
- [ ] Publicação visível em /publications
- [ ] Build passa sem erros (`npm run build`)
- [ ] Deploy no Vercel funcionando (se escolheu)

## 🐛 Troubleshooting

### Erro: "Cannot find Supabase"
**Solução:** Verifique se `NEXT_PUBLIC_SUPABASE_URL` está correto em `.env.local`

### Erro: "Invalid API Key" ao fazer POST
**Solução:** Verifique se a chave foi copiada completamente (começa com `pk_live_` ou `pk_test_`)

### Erro: "HTTPS obrigatório"
**Solução:** A URL deve começar com `https://`, não `http://`

### Página branca após login
**Solução:** 
1. Abra DevTools (F12)
2. Vá para **Console** e procure por erros
3. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto

### Build falha no Vercel
**Solução:**
1. No Vercel, vá para **Deployments**
2. Clique na build que falhou
3. Veja os logs completos
4. Verifique se todas as variáveis de ambiente estão setadas

## 📱 Próximos Passos

Agora que você tem o IndexPilot rodando:

1. **Integrar com seu site**: Use a API de `/api/publish` para notificar sobre novas publicações
2. **Configurar Alertas**: Monitore publicações que não indexam
3. **Preparar Sprint 03**: Google Search Console Integration

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Vercel](https://vercel.com/docs)

## 💬 Suporte

Se tiver dúvidas durante o setup:
1. Verifique este guia novamente
2. Abra uma issue no GitHub
3. Verifique a aba "Issues" para problemas conhecidos

---

**Parabéns! Você completou o setup do IndexPilot! 🎉**
