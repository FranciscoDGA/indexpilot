# IndexPilot - Sprint 05
## SEO Inspector Engine

---

## 📋 PRD - Product Requirements Document

### Visão Geral

O IndexPilot Sprint 05 introduz o **SEO Inspector Engine** — um mecanismo de auditoria técnica que analisa automaticamente cada URL publicada, fornecendo diagnósticos completos antes, durante e após a indexação.

**Problema**: Muitos editores publicam conteúdo sem saber se ele atende aos critérios técnicos de indexação do Google.

**Solução**: Auditoria automática com score, recomendações inteligentes e histórico de melhorias.

---

### Objetivos

1. ✅ Auditoria técnica completa de cada URL
2. ✅ Score automático (0-100) com nota (A+ até D)
3. ✅ Recomendações acionáveis e explicadas
4. ✅ Histórico de auditorias para rastrear melhorias
5. ✅ Dashboard SEO com insights principais
6. ✅ Comparação entre URLs
7. ✅ Preparação para integração com Core Web Vitals

---

### Stack Técnico

**Backend**:
- Node.js + TypeScript
- Puppeteer/Playwright (crawler de URLs)
- jsdom (parsing HTML)
- Zod (validação)

**APIs Externas** (preparação):
- Google PageSpeed Insights (CWV)
- Google Search Console (status real)

**Banco de Dados**:
- PostgreSQL (seo_audits, seo_checks)
- RLS policies para segurança

**Frontend**:
- React 19 + TypeScript
- TailwindCSS
- Recharts (gráficos de evolução)

---

## 🏗️ Arquitetura

### Banco de Dados

#### Tabela: seo_audits

```sql
CREATE TABLE seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  
  score INTEGER NOT NULL DEFAULT 0, -- 0-100
  grade VARCHAR(2) NOT NULL DEFAULT 'D', -- A+, A, B, C, D
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, scanning, completed, error
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  scanned_at TIMESTAMP
);

CREATE INDEX idx_seo_audits_publication_id ON seo_audits(publication_id);
CREATE INDEX idx_seo_audits_site_id ON seo_audits(site_id);
CREATE INDEX idx_seo_audits_user_id ON seo_audits(user_id);
```

#### Tabela: seo_checks

```sql
CREATE TABLE seo_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES seo_audits(id) ON DELETE CASCADE,
  
  check_name VARCHAR(50) NOT NULL, -- e.g., "https", "meta_robots", "canonical"
  status VARCHAR(20) NOT NULL, -- PASS, WARNING, ERROR, INFO
  severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  
  message TEXT NOT NULL,
  recommendation TEXT,
  
  details JSONB, -- Dados adicionais (ex: valores encontrados, esperados)
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_seo_checks_audit_id ON seo_checks(audit_id);
CREATE INDEX idx_seo_checks_status ON seo_checks(status);
```

#### Tabela: seo_audit_history

```sql
CREATE TABLE seo_audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
  
  score_at_date TIMESTAMP NOT NULL,
  score INTEGER NOT NULL,
  grade VARCHAR(2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_seo_audit_history_publication ON seo_audit_history(publication_id);
```

---

### Tipos e Interfaces

```typescript
// Tipos de checks
type CheckType = 
  | 'https'
  | 'http_status'
  | 'redirect_chain'
  | 'response_time'
  | 'robots_txt'
  | 'meta_robots'
  | 'canonical'
  | 'sitemap'
  | 'og_tags'
  | 'twitter_card'
  | 'schema_org'
  | 'featured_image'
  | 'mobile_viewport'
  | 'mobile_usability'
  | 'internal_links'
  | 'external_links';

type CheckStatus = 'PASS' | 'WARNING' | 'ERROR' | 'INFO';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Grade = 'A+' | 'A' | 'B' | 'C' | 'D';

interface SeoAudit {
  id: string;
  publication_id: string;
  site_id: string;
  url: string;
  score: number; // 0-100
  grade: Grade;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  checks: SeoCheck[];
  scanned_at: string;
}

interface SeoCheck {
  id: string;
  check_name: CheckType;
  status: CheckStatus;
  severity: Severity;
  message: string;
  recommendation?: string;
  details?: Record<string, any>;
}
```

---

### Serviços Backend

#### `/lib/seo/scanner.ts`

Classe principal que executa 14 tipos de auditorias:

```typescript
export class SeoScanner {
  async scanUrl(url: string): Promise<ScanResult>
  
  // Auditorias
  private async checkHttps(url: string): Promise<SeoCheck>
  private async checkHttpStatus(url: string): Promise<SeoCheck>
  private async checkRedirectChain(url: string): Promise<SeoCheck>
  private async checkResponseTime(url: string): Promise<SeoCheck>
  private async checkRobotsTxt(url: string): Promise<SeoCheck>
  private async checkMetaRobots(html: string): Promise<SeoCheck>
  private async checkCanonical(html: string, url: string): Promise<SeoCheck>
  private async checkOgTags(html: string): Promise<SeoCheck>
  private async checkTwitterCard(html: string): Promise<SeoCheck>
  private async checkSchema(html: string): Promise<SeoCheck[]>
  private async checkFeaturedImage(html: string): Promise<SeoCheck>
  private async checkMobileViewport(html: string): Promise<SeoCheck>
  private async checkInternalLinks(html: string, url: string): Promise<SeoCheck>
  private async checkExternalLinks(html: string): Promise<SeoCheck>
  
  private calculateScore(checks: SeoCheck[]): number
  private getGrade(score: number): Grade
}
```

**Fórmula de Score**:
```
Score = 100 - (critical_count * 15 + high_count * 10 + medium_count * 5 + low_count * 2)
Grade = Score >= 90 ? 'A+' : Score >= 80 ? 'A' : Score >= 70 ? 'B' : Score >= 60 ? 'C' : 'D'
```

#### `/lib/seo/recommendationEngine.ts`

Gera recomendações claras e acionáveis:

```typescript
export class RecommendationEngine {
  getRecommendation(check: SeoCheck): string
}
```

#### `/app/api/audits/scan/route.ts`

API que inicia o scan:

```
POST /api/audits/scan
Body: { publication_id, url }
Response: { audit_id, status: 'pending' }
```

---

### Componentes Frontend

| Componente | Função |
|-----------|--------|
| `AuditCard.tsx` | Exibe score, grade, status |
| `ChecklistView.tsx` | Lista checks com ✅ ⚠️ ❌ |
| `RecommendationPanel.tsx` | Mostra recomendações |
| `ScoreGauge.tsx` | Visualização circular 0-100 |
| `HistoryChart.tsx` | Gráfico de evolução (Recharts) |
| `ComparisonTable.tsx` | Compara até 5 URLs |

---

### Páginas

#### `/app/(app)/seo/page.tsx` - Dashboard SEO
- 4 cards: SEO Médio, URLs Críticas, Erros Graves, Melhor URL
- Tabela: últimas auditorias com score, grade, problemas

#### `/app/(app)/publications/[id]/seo/page.tsx` - Detalhes do Audit
- Score com gauge circular
- Checklist com recomendações
- Histórico de auditorias
- Melhorias prioritárias

#### `/app/(app)/seo/compare/page.tsx` - Comparação
- Seletor de até 5 URLs
- Tabela comparativa
- Gráfico de evolução

---

## ✅ Critérios de Aceitação

### Funcionalidades Principais

- [ ] Sistema de auditoria completo para URLs
- [ ] Score automático (0-100) com fórmula clara
- [ ] Grades A+ até D baseadas em score
- [ ] Recomendações inteligentes para cada falha
- [ ] Histórico de auditorias (rastrear evolução)
- [ ] Dashboard SEO com 4+ cards principais
- [ ] Página de detalhes com checklist visual
- [ ] Comparação entre até 5 URLs
- [ ] Status de scan (pending → scanning → completed)

### Auditorias Implementadas

- [ ] HTTP (HTTPS, status code, redirects, response time)
- [ ] Robots.txt (bloqueio, user-agents, disallow)
- [ ] Meta Robots (index, noindex, follow, nofollow)
- [ ] Canonical (existe, aponta para si, quebrado)
- [ ] Open Graph (og:title, og:image, og:description, og:url)
- [ ] Twitter Card (twitter:card, twitter:title, twitter:image)
- [ ] Schema.org (detectar Article, BlogPosting, Organization, etc)
- [ ] Imagem Destacada (verificar largura, alt, formato, peso)
- [ ] Mobile (viewport, responsividade)
- [ ] Links (internos, externos, quebrados, nofollow)

### Banco de Dados

- [ ] Tabela seo_audits criada com todas as colunas
- [ ] Tabela seo_checks criada com status/severity
- [ ] Tabela seo_audit_history para rastreamento
- [ ] Índices criados para performance
- [ ] RLS policies configuradas por site/user

### Frontend

- [ ] Dashboard SEO renderiza corretamente
- [ ] Score gauge exibe 0-100 com cores
- [ ] Checklist mostra ✅ ⚠️ ❌ apropriadamente
- [ ] Recomendações são claras e acionáveis
- [ ] Histórico grafica evolução de scores
- [ ] Comparação mostra diferenças lado a lado
- [ ] Responsivo em mobile

### Qualidade

- [ ] TypeScript sem erros (strict mode)
- [ ] Validação com Zod em todas as entradas
- [ ] Error handling completo
- [ ] Performance: scan < 10s por URL
- [ ] Sem N+1 queries
- [ ] Testes unitários para scoring
- [ ] Documentação do código

---

## 🤖 Prompts para IA

### Prompt 1: Implementar Scanner Backend

```
Você é um especialista em SEO técnico e Node.js.

Implemente a classe SeoScanner em `/lib/seo/scanner.ts` que:

1. Faz download da URL usando Puppeteer/Playwright
2. Extrai HTML e metadata
3. Executa 14 tipos de auditorias técnicas:
   - HTTPS (status)
   - HTTP Status Code (200, 404, 500, etc)
   - Redirect Chain (detectar loops)
   - Response Time
   - Robots.txt (bloqueio)
   - Meta Robots Tag
   - Canonical Tag
   - Open Graph tags (mínimo 4)
   - Twitter Card tags
   - Schema.org (detectar tipos automáticos)
   - Featured Image (width, alt, format)
   - Mobile Viewport
   - Internal Links (count, broken)
   - External Links (count, nofollow)

4. Calcula score baseado em:
   - CRITICAL: -15 pontos cada
   - HIGH: -10 pontos cada
   - MEDIUM: -5 pontos cada
   - LOW: -2 pontos cada
   - Máximo de 100

5. Retorna SeoAudit com todos os checks

Cada método deve:
- Ser isolado e testável
- Retornar SeoCheck com status/severity/message
- Incluir detalhes técnicos em `details` JSON

Inclua tratamento de erro robusto.
```

### Prompt 2: Implementar Recommendation Engine

```
Você é um especialista em SEO e UX writing.

Implemente RecommendationEngine em `/lib/seo/recommendationEngine.ts` que:

1. Para cada tipo de SeoCheck, retorna recomendação clara
2. Explica POR QUÊ é importante (impacto em SEO)
3. Sugere FIX específico (como resolver)

Exemplo de recomendação:

Check: "Meta Robots Tag ausente"
Recommendation: "Adicione <meta name='robots' content='index, follow'> no <head> da página para permitir que o Google indexe este conteúdo."

Exemplo 2:

Check: "Imagem destacada muito pequena (600px, recomendado 1200px)"
Recommendation: "Aumente a imagem principal para pelo menos 1200×628 pixels para melhor elegibilidade no Google Discover."

Implemente para todos os 14 tipos de check.

Tone: Técnico mas acessível.
```

### Prompt 3: Dashboard SEO Frontend

```
Você é um expert em React + TailwindCSS + Recharts.

Implemente `/app/(app)/seo/page.tsx` (Dashboard SEO) que:

1. Exibe 4 cards principais:
   - SEO Médio (score médio de todas as URLs)
   - URLs Críticas (count de URLs com score < 60)
   - Erros Graves (count de checks CRITICAL)
   - Melhor URL (nome + score)

2. Tabela com últimas 10 auditorias:
   - Título (link para detalhes)
   - Score (com gauge mini)
   - Grade (A+, A, B, C, D)
   - Problemas (count WARNING + ERROR)
   - Última auditoria (formatted date)

3. Integração:
   - Fetch de `seo_audits` by site_id
   - Mock data se NEXT_PUBLIC_USE_MOCK=true
   - Dynamic import de supabase dentro do useEffect

4. Responsivo (grid 1-2 cols mobile/desktop)

Use cores consistentes:
- A+/A: verde
- B: amarelo
- C/D: vermelho
```

### Prompt 4: Página de Detalhes do Audit

```
Você é um expert em React + Design.

Implemente `/app/(app)/publications/[id]/seo/page.tsx` que:

1. Header com:
   - URL
   - Score com gauge circular (0-100)
   - Grade (A+, A, B, C, D)
   - Data do scan
   - Botão "Executar nova auditoria"

2. Checklist visual:
   - ✅ PASS (verde)
   - ⚠️ WARNING (amarelo)
   - ❌ ERROR (vermelho)
   - ℹ️ INFO (azul)

   Para cada check:
   - Ícone + status
   - Mensagem clara
   - Recomendação expansível
   - Detalhes técnicos (se aplicável)

3. Histórico de auditorias (gráfico + tabela)
   - Mostrar evolução do score
   - Últimas 10 auditorias com data/score/grade

4. Seção de melhorias prioritárias
   - Ordenar por severity/impacto
   - Top 5 recomendações

Responsive, acessível, dark mode.
```

### Prompt 5: API de Scan

```
Você é um expert em Next.js API routes.

Implemente `/app/api/audits/scan/route.ts` que:

1. POST /api/audits/scan
   - Body: { publication_id: string, url: string }
   - Auth: Validar session

2. Cria registro em seo_audits com status='pending'

3. Inicia scan assíncrono:
   - Atualiza status para 'scanning'
   - Executa SeoScanner.scanUrl()
   - Cria checks em seo_checks table
   - Calcula score final
   - Atualiza seo_audits com resultado

4. Response imediato: { audit_id, status: 'pending' }

5. Cliente pode fazer polling em /api/audits/[id] para status

Error handling:
- URL inválida
- Timeout
- Erro ao escanner
- Erro ao salvar
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Estrutura
- [ ] Adicionar tabelas ao schema.sql
- [ ] Criar types/seo.ts com interfaces
- [ ] Implementar SeoScanner com 14 tipos de auditorias
- [ ] Implementar RecommendationEngine
- [ ] Implementar API de scan

### Fase 2: Frontend Dashboard
- [ ] Dashboard SEO (/seo/page.tsx)
- [ ] Página de detalhes (/publications/[id]/seo)
- [ ] Componentes (AuditCard, ChecklistView, etc)
- [ ] Integração com supabase mock

### Fase 3: Comparação e Histórico
- [ ] Página de comparação (/seo/compare)
- [ ] Gráfico de evolução (Recharts)
- [ ] Tabela histórica

### Fase 4: Testes e Polimento
- [ ] Testes unitários para scoring
- [ ] Error handling completo
- [ ] Performance optimization
- [ ] Documentação
- [ ] Mobile responsiveness

---

## 🎯 Definição de Pronto

- ✅ Build passa sem erros
- ✅ Todas as funcionalidades implementadas
- ✅ Mock data funciona
- ✅ Responsive em mobile
- ✅ Dark mode suportado
- ✅ Recomendações são úteis
- ✅ Performance < 10s por scan
- ✅ Documentação completa
