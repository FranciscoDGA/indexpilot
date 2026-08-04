# IndexPilot - Sprint 07
## Search Performance Intelligence

---

## 📋 PRD - Product Requirements Document

### Visão Geral

A Sprint 07 introduz o **Search Performance Engine** — uma integração profunda com o Google Search Console que transforma dados de indexação em inteligência estratégica de desempenho.

**Problema**: As ferramentas de indexação param na pergunta "indexou?". Os profissionais de SEO precisam saber: "Valeu a pena indexar essa página?"

**Solução**: Conectar indexação com desempenho real - impressões, cliques, posições, tendências.

---

### Transformação de Mentalidade

**Antes** (ferramentas convencionais):
- ✅ Página indexou?
- ❌ Recebeu tráfego?
- ❌ Qual posição?
- ❌ Está crescendo?

**Depois** (IndexPilot com Sprint 07):
- ✅ Página indexou?
- ✅ Primeira impressão quando?
- ✅ Primeiro clique quando?
- ✅ Posição inicial vs atual?
- ✅ CTR acima/abaixo da média?
- ✅ Está crescendo ou caindo?
- ✅ Vale a pena atualizar?

---

### Objetivos

1. ✅ Integração automática com Google Search Console
2. ✅ Importação diária de dados (impressões, cliques, posições)
3. ✅ Histórico completo do ciclo de vida de cada URL
4. ✅ Dashboard de performance com KPIs principais
5. ✅ Análise de palavras-chave por URL
6. ✅ Alertas inteligentes (crescimento, queda, novidades)
7. ✅ Comparação entre sites
8. ✅ Painel executivo com tendências

---

### Stack Técnico

**Backend**:
- Node.js + TypeScript
- Google Search Console API
- Agenda.js ou BullMQ (importação diária agendada)
- Zod (validação)

**Frontend**:
- React 19 + TypeScript
- TailwindCSS
- Recharts (gráficos de evolução)
- Lucide Icons

**Integração Externa**:
- Google Search Console API
- OAuth2 (autenticação com Google)

---

## 🏗️ Arquitetura

### Banco de Dados

#### Tabela: search_performance

```sql
CREATE TABLE IF NOT EXISTS search_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr NUMERIC(5, 2) DEFAULT 0, -- 0-100
    average_position NUMERIC(5, 2) DEFAULT 0, -- position on SERP

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(publication_id, date)
);

CREATE INDEX idx_search_performance_publication ON search_performance(publication_id, date DESC);
CREATE INDEX idx_search_performance_site ON search_performance(site_id, date DESC);
CREATE INDEX idx_search_performance_user ON search_performance(user_id, date DESC);
```

#### Tabela: keyword_performance

```sql
CREATE TABLE IF NOT EXISTS keyword_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr NUMERIC(5, 2) DEFAULT 0,
    position NUMERIC(5, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(publication_id, keyword, date)
);

CREATE INDEX idx_keyword_performance_publication ON keyword_performance(publication_id, date DESC);
CREATE INDEX idx_keyword_performance_keyword ON keyword_performance(site_id, keyword);
```

#### Tabela: performance_milestones

```sql
CREATE TABLE IF NOT EXISTS performance_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    milestone_type VARCHAR(50) NOT NULL, -- 'first_impression', 'first_click', 'top_100', 'top_10', '100_impressions', '1000_impressions', '100_clicks'
    achieved_at TIMESTAMP WITH TIME ZONE,
    metric_value INTEGER, -- e.g., clicks count, impressions count
    position_at_milestone NUMERIC(5, 2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_milestones_publication ON performance_milestones(publication_id, achieved_at DESC);
```

#### Tabela: gsc_imports

```sql
CREATE TABLE IF NOT EXISTS gsc_imports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    import_date DATE NOT NULL,
    rows_imported INTEGER,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, error
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_gsc_imports_site ON gsc_imports(site_id, import_date DESC);
```

---

### Tipos e Interfaces

```typescript
// Performance types
type Milestone = 
  | 'first_impression'
  | 'first_click'
  | 'top_100'
  | 'top_10'
  | 'top_3'
  | '100_impressions'
  | '1000_impressions'
  | '100_clicks';

interface SearchPerformance {
  id: string;
  publication_id: string;
  site_id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number; // 0-100
  average_position: number;
  created_at: string;
}

interface KeywordPerformance {
  id: string;
  publication_id: string;
  keyword: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  created_at: string;
}

interface PerformanceMilestone {
  id: string;
  publication_id: string;
  milestone_type: Milestone;
  achieved_at: string;
  metric_value?: number;
  position_at_milestone?: number;
}

interface PerformanceStats {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averagePosition: number;
  impressionsTrend: number; // % change
  clicksTrend: number; // % change
  milestones: PerformanceMilestone[];
}

interface KeywordData {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
}
```

---

### Serviços Backend

#### `/lib/gsc/client.ts`

Cliente para Google Search Console API:

```typescript
export class GSCClient {
  async authenticate(userId: string, refreshToken: string)
  
  async getSearchAnalytics(
    siteUrl: string,
    startDate: string,
    endDate: string,
    dimensions?: string[]
  ): Promise<SearchAnalyticsRow[]>
  
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<QueryData[]>
}
```

#### `/lib/gsc/importer.ts`

Importação diária de dados:

```typescript
export class GSCImporter {
  async importDailyData(userId: string, siteId: string): Promise<void>
  
  private async fetchAndStore(
    siteUrl: string,
    date: string
  ): Promise<void>
  
  private async detectMilestones(
    publicationId: string,
    performance: SearchPerformance
  ): Promise<void>
}
```

#### `/lib/gsc/analyzer.ts`

Análise de tendências e insights:

```typescript
export class PerformanceAnalyzer {
  async generateInsights(publicationId: string): Promise<Insight[]>
  
  async detectAnomalies(
    performance: SearchPerformance[]
  ): Promise<Alert[]>
  
  async calculateTrends(
    performance: SearchPerformance[]
  ): Promise<TrendData>
}
```

#### `/app/api/gsc/auth/route.ts`

OAuth2 callback para Google:

```
GET /api/gsc/auth?code=...&state=...
```

#### `/app/api/performance/route.ts`

API para obter dados de performance:

```
GET /api/performance?siteId=...&days=30
GET /api/performance/[publicationId]
GET /api/keywords?siteId=...
```

---

### Componentes Frontend

| Componente | Função |
|-----------|--------|
| `PerformanceCard.tsx` | Métrica principal (impressões, cliques, CTR, posição) |
| `PerformanceChart.tsx` | Gráfico de evolução (Recharts) |
| `KeywordTable.tsx` | Tabela de palavras-chave com ordenação |
| `MilestoneTimeline.tsx` | Timeline completa da URL |
| `PerformanceGauge.tsx` | Gauge visual para CTR/posição |
| `InsightAlert.tsx` | Alerta inteligente (crescimento, queda, etc) |
| `SiteComparison.tsx` | Comparação lado a lado entre sites |
| `RankingTable.tsx` | Top URLs ordenadas por métrica |

---

### Páginas

#### `/app/(app)/performance/page.tsx`
Dashboard principal de performance com 4 cards (impressões, cliques, CTR, posição) e gráficos

#### `/app/(app)/performance/keywords/page.tsx`
Análise de palavras-chave com tabela paginada, filtros, gráficos de evolução

#### `/app/(app)/performance/ranking/page.tsx`
Ranking de URLs (top performers) ordenadas por impressões, cliques, CTR, crescimento

#### `/app/(app)/publications/[id]/performance/page.tsx`
Página de detalhes com:
- KPIs principais
- Timeline completa (publicado → primeira impressão → primeiro clique → milestones)
- Palavras-chave associadas
- Gráficos de evolução
- Insights automáticos

#### `/app/(app)/performance/sites-comparison/page.tsx`
Comparação entre múltiplos sites com:
- Tabela comparativa
- Gráficos lado a lado
- CTR, posição, impressões

#### `/app/(app)/settings/gsc-integration/page.tsx`
Configuração da integração com Google Search Console:
- Botão "Conectar com Google"
- Status de sincronização
- Última importação
- Histórico de imports

---

## ✅ Critérios de Aceitação

### Funcionalidades Principais

- [ ] Integração OAuth2 com Google Search Console
- [ ] Importação diária automática de dados
- [ ] Histórico completo de performance por URL
- [ ] Dashboard com 4 KPIs principais
- [ ] Análise de palavras-chave
- [ ] Timeline completa do ciclo de vida
- [ ] Alertas automáticos (crescimento, queda, milestones)
- [ ] Ranking de URLs
- [ ] Comparação entre sites
- [ ] Milestones (primeira impressão, primeiro clique, top 10, etc)

### Banco de Dados

- [ ] 4 tabelas criadas (search_performance, keyword_performance, performance_milestones, gsc_imports)
- [ ] Índices criados para performance
- [ ] RLS policies configuradas
- [ ] Triggers para updated_at

### Frontend

- [ ] Dashboard renderiza corretamente
- [ ] Gráficos mostram evolução (Recharts)
- [ ] Tabelas de keywords com paginação
- [ ] Timeline renderiza milestones
- [ ] Comparação entre sites funciona
- [ ] Alertas exibem corretamente
- [ ] Responsivo em mobile
- [ ] Dark mode suportado

### Integração

- [ ] OAuth2 com Google funciona
- [ ] Importação diária agenda
- [ ] Dados salvos corretamente
- [ ] Milestones detectados automaticamente
- [ ] Insights gerados

### Qualidade

- [ ] TypeScript sem erros
- [ ] Validação Zod em todas as entradas
- [ ] Error handling completo
- [ ] Performance: importação < 5 min
- [ ] Testes unitários para analyzer
- [ ] Documentação do código

---

## 🤖 Prompts para IA

### Prompt 1: Google Search Console Integration

```
Você é especialista em Google APIs e SEO.

Implemente o GSCClient em `/lib/gsc/client.ts` que:

1. Autentica com Google Search Console API usando OAuth2
2. Busca dados de search analytics:
   - Impressions, clicks, CTR, average position
   - Por data (diária, semanal, mensal)
   - Filtrado por site URL

3. Busca top queries/keywords:
   - Ordenadas por impressions/clicks
   - Com posição média
   - CTR para cada keyword

4. Methods principais:
   - authenticate(userId, refreshToken)
   - getSearchAnalytics(siteUrl, startDate, endDate, dimensions?)
   - getTopQueries(siteUrl, startDate, endDate, limit?)

5. Error handling:
   - Token expirado (refresh)
   - Site não verificado
   - Quota excedida
   - Rate limiting

Use a biblioteca @google/cloud/search-console ou google-auth-library.
```

### Prompt 2: Daily Importer Service

```
Você é especialista em importação de dados e processamento em lote.

Implemente GSCImporter em `/lib/gsc/importer.ts` que:

1. Agenda importação diária (21h)
2. Para cada site do usuário:
   - Busca dados dos últimos 90 dias
   - Salva em search_performance
   - Salva keywords em keyword_performance

3. Detecta milestones automaticamente:
   - first_impression: primeiro dia com impressões
   - first_click: primeiro dia com clicks
   - top_100, top_10, top_3: baseado em average_position
   - 100_impressions, 1000_impressions: baseado em cumulative
   - 100_clicks, 1000_clicks

4. Features:
   - Retentativas automáticas
   - Logging de importação
   - Status tracking (pending → processing → completed)
   - Tratamento de erros

Use Agenda.js ou BullMQ para scheduling.
```

### Prompt 3: Performance Analytics Dashboard

```
Você é expert em React + Recharts + TailwindCSS.

Implemente `/app/(app)/performance/page.tsx` (Dashboard Principal) que:

1. Exibe 4 cards KPI:
   - Impressões (total últimos 30 dias, % trend)
   - Cliques (total, % trend)
   - CTR Médio (0-100%, com gauge)
   - Posição Média (indicador)

2. Gráficos (últimos 30 dias):
   - Impressions line chart
   - Clicks line chart
   - CTR line chart
   - Position average chart

3. Tabela: Top 10 URLs
   - Título/URL
   - Impressions
   - Clicks
   - CTR
   - Avg Position
   - Trend indicator (↑ ↓ →)

4. Integração:
   - Fetch de search_performance
   - Mock data se NEXT_PUBLIC_USE_MOCK=true
   - Dynamic import de supabase

5. Responsivo, dark mode, cores consistentes
```

### Prompt 4: Keywords Analysis Page

```
Você é expert em análise de SEO.

Implemente `/app/(app)/performance/keywords/page.tsx` que:

1. Tabela de keywords (últimos 90 dias agregados):
   - Keyword (text, searchable)
   - Position (numeric, sortable)
   - Impressions (numeric, sortable)
   - Clicks (numeric, sortable)
   - CTR (numeric, sortable)
   - Trend (↑ ↓ →, baseado em 7-30 dias)

2. Paginação: 50 keywords por página

3. Filtros:
   - Por site
   - Por período (7, 30, 90 days)
   - Position range (1-10, 11-100, 101+)

4. Busca: em tempo real por keyword

5. Ordenação: por qualquer coluna

6. Detalhes: click em keyword → mostra:
   - URLs ranking para essa keyword
   - Evolution graph
   - Position over time

7. Responsivo, dark mode
```

### Prompt 5: Publication Performance Page

```
Você é expert em storytelling de dados.

Implemente `/app/(app)/publications/[id]/performance/page.tsx` que:

1. Header com:
   - URL / título
   - Status de indexação
   - Data de publicação

2. KPIs principais (4 cards):
   - Total de impressões
   - Total de cliques
   - CTR médio
   - Posição média

3. Timeline interativa (publicado → hoje):
   - 📅 Publicado
   - 🔍 Descoberto (first_impression data)
   - ✅ Indexado
   - 👁️ Primeira impressão (data/hora)
   - 🖱️ Primeiro clique (data/hora)
   - 🎯 100 impressões (se atingido)
   - 🏆 Top 10 (se atingido)
   - Milestones customizados

4. Gráficos (30 dias):
   - Impressions line
   - Clicks line
   - Position line
   - CTR line

5. Keywords ranking para essa URL:
   - Tabela com position, impressions, clicks, ctr
   - Links para cada keyword

6. Insights:
   - "Esta URL está crescendo" (↑ impressions)
   - "CTR abaixo da média" (compara com site)
   - "Primeira impressão há X dias"
   - "Recebe impressões mas zero cliques"

7. Dark mode, responsivo
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Estrutura
- [ ] Adicionar 4 tabelas ao schema.sql
- [ ] Criar types/gsc.ts com interfaces
- [ ] Implementar GSCClient (API do Google)
- [ ] Implementar GSCImporter (importação diária)
- [ ] Implementar PerformanceAnalyzer (insights)
- [ ] API de auth OAuth2
- [ ] API de performance endpoints

### Fase 2: Frontend Dashboard
- [ ] Dashboard principal (/performance)
- [ ] Keywords page (/performance/keywords)
- [ ] Ranking page (/performance/ranking)
- [ ] Detalhes da URL (/publications/[id]/performance)
- [ ] Comparação entre sites (/performance/sites-comparison)
- [ ] Settings de integração GSC
- [ ] Componentes (cards, charts, tables, timeline)

### Fase 3: Inteligência
- [ ] Detector de milestones
- [ ] Gerador de insights
- [ ] Detector de anomalias
- [ ] Sistema de alertas

### Fase 4: Testes e Polimento
- [ ] Mock data para development
- [ ] Testes unitários
- [ ] Error handling
- [ ] Performance optimization
- [ ] Documentação
- [ ] Mobile responsiveness

---

## 🎯 Definição de Pronto

- ✅ Build passa sem erros
- ✅ Integração OAuth2 funciona
- ✅ Importação diária agenda
- ✅ Dashboard renderiza
- ✅ Gráficos mostram dados
- ✅ Keywords análise funciona
- ✅ Timeline renderiza milestones
- ✅ Alertas disparam
- ✅ Responsive mobile
- ✅ Dark mode suportado
- ✅ Mock data funciona
- ✅ Documentação completa

---

## 🌟 O Diferencial desta Sprint

Essa Sprint transforma o IndexPilot de uma ferramenta de indexação para uma plataforma estratégica de SEO que responde:

1. **Quanto tempo levou da publicação até primeira impressão?**
2. **Quanto tempo levou da impressão até o primeiro clique?**
3. **Quais conteúdos indexam rápido mas nunca recebem tráfego?**
4. **Quais conteúdos demoram para indexar mas depois explodem em tráfego?**
5. **Quais palavras-chave realmente trazem usuários?**
6. **Como está o crescimento / queda de cada URL?**
7. **Qual site performa melhor no Google?**

A conexão completa: **Publicação → Descoberta → Rastreamento → Indexação → Impressões → Cliques** cria um histórico único que nenhuma outra ferramenta oferece. Isso é o que torna IndexPilot diferente.

Este é o ponto onde você deixa de competir com ferramentas de indexação e começa a competir com plataformas Enterprise de SEO como SE Ranking, Semrush, Ahrefs — mas com um foco único em conteúdo multi-site e automação.
