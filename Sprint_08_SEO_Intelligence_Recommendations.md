# IndexPilot - Sprint 08
## SEO Intelligence & Recommendations Engine

---

## 📋 PRD - Product Requirements Document

### Visão Geral

O IndexPilot Sprint 08 transforma a plataforma de um **dashboard de monitoramento** para um **copiloto de SEO** orientado por dados. 

**Mudança paradigmática**: De "O que aconteceu?" para "O que devo fazer agora?"

**Problema**: Ferramentas tradicionais mostram muitos dados, mas ajudam pouco na tomada de decisão priorizada.

**Solução**: Motor de inteligência que cruza todos os dados coletados (Discovery, Crawl, SEO Inspector, Performance) e gera recomendações práticas, priorizadas por ROI (Impacto ÷ Esforço).

---

### Mudança de Paradigma

**Antes (Sprints 01-07)**: "Seus 42 artigos têm um score médio de SEO de 78."

**Depois (Sprint 08)**: "Bom dia, Francisco. Hoje existem 4 ações que podem gerar o maior impacto:

1. Atualize o artigo 'Concurso Prefeitura X' - está na posição 11 e precisa de poucos ajustes para entrar no Top 10.
2. Troque a imagem destacada de 'Calculadora IMC' - ela não atende às recomendações para Google Discover.
3. Adicione links internos para 5 páginas órfãs que ainda não receberam rastreamento.
4. Revise um conteúdo que perdeu 38% das impressões nos últimos 30 dias."

---

### Objetivos Principais

1. ✅ Inteligência artificial cruzando dados de múltiplas fontes
2. ✅ Detecção automática de oportunidades e problemas
3. ✅ Priorização por ROI SEO (Impacto vs Esforço)
4. ✅ Recomendações acionáveis com estimativas de impacto
5. ✅ Sistema de ações e tracking de conclusão
6. ✅ Timeline enriquecida com decisões e resultados
7. ✅ Múltiplos scores de saúde (Health, Growth, Index Velocity, Freshness)
8. ✅ Relatórios automáticos (diário, semanal, mensal)
9. ✅ Dashboard executivo para stakeholders

---

### Stack Técnico

**Backend**:
- Node.js + TypeScript
- Algoritmos de detecção e priorização
- Cálculo de correlação (CTR vs Ranking, Crawl vs Indexação)
- Análise de tendências e anomalias

**APIs Internas**:
- Google Search Console (dados de performance)
- SEO Scanner (dados técnicos)
- Discovery API (dados de indexação)

**Banco de Dados**:
- PostgreSQL (insights, recommendations, actions)
- RLS policies por publication/user

**Frontend**:
- React 19 + TypeScript
- TailwindCSS
- Recharts (tendências, comparações)
- Geração de PDFs (relatórios)

---

## 🏗️ Arquitetura

### Banco de Dados

#### Tabela: insights

```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- 'ranking', 'ctr', 'indexation', 'crawl', 'content', 'link', 'image'
  priority VARCHAR(20) NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  
  estimated_impact VARCHAR(20), -- 'VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'
  estimated_effort VARCHAR(20), -- '5_MIN', '15_MIN', '30_MIN', '2_HOURS'
  
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'dismissed'
  
  metrics JSONB, -- dados relevantes (ranking, CTR, impressions, etc)
  
  created_at TIMESTAMP DEFAULT now(),
  resolved_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  dismissed_reason TEXT
);

CREATE INDEX idx_insights_publication_id ON insights(publication_id);
CREATE INDEX idx_insights_priority ON insights(priority);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_status ON insights(status);
```

#### Tabela: recommendations

```sql
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  category VARCHAR(50) NOT NULL, -- 'ranking', 'discover', 'indexation', 'crawl_budget'
  
  title TEXT NOT NULL,
  description TEXT,
  
  score INTEGER NOT NULL, -- 0-100 ROI score
  estimated_impact VARCHAR(20), -- 'VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW'
  estimated_effort VARCHAR(20), -- '5_MIN', '15_MIN', '30_MIN', '2_HOURS'
  
  action_items TEXT[], -- array of specific steps
  
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'dismissed'
  
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_recommendations_publication_id ON recommendations(publication_id);
CREATE INDEX idx_recommendations_score ON recommendations(score DESC);
```

#### Tabela: actions

```sql
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publication_queue(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES insights(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  
  action TEXT NOT NULL, -- "Update meta description", etc
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  
  created_at TIMESTAMP DEFAULT now(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_actions_publication_id ON actions(publication_id);
CREATE INDEX idx_actions_status ON actions(status);
```

---

### Tipos e Interfaces

```typescript
// Tipos de insights
type InsightType = 
  | 'ranking_near_top10'
  | 'ranking_exit_top10'
  | 'ctr_very_low'
  | 'ctr_decreased'
  | 'indexation_delayed'
  | 'indexation_lost'
  | 'crawl_stopped'
  | 'crawl_increased'
  | 'content_outdated'
  | 'content_missing_links'
  | 'content_bad_image'
  | 'link_orphaned'
  | 'discover_eligible'
  | 'discover_ineligible';

type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type Impact = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
type Effort = '5_MIN' | '15_MIN' | '30_MIN' | '2_HOURS';

interface Insight {
  id: string;
  publication_id: string;
  type: InsightType;
  priority: Priority;
  title: string;
  description: string;
  recommendation: string;
  estimated_impact: Impact;
  estimated_effort: Effort;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  metrics: Record<string, any>;
  created_at: string;
}

interface Recommendation {
  id: string;
  publication_id: string;
  category: string;
  title: string;
  description: string;
  score: number; // ROI score
  estimated_impact: Impact;
  estimated_effort: Effort;
  action_items: string[];
  status: 'active' | 'completed' | 'dismissed';
}

interface Action {
  id: string;
  publication_id: string;
  insight_id?: string;
  recommendation_id?: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  created_at: string;
  completed_at?: string;
}

interface IntelligenceStats {
  total_insights: number;
  critical_count: number;
  high_priority_count: number;
  opportunities_count: number;
  actions_completed: number;
  avg_roi_score: number;
}

interface SeoHealthScore {
  overall_health: number; // 0-100
  growth_potential: number; // 0-100
  index_velocity: number; // 0-100
  content_freshness: number; // 0-100
}
```

---

### Serviços Backend

#### `/lib/intelligence/detectors/rankingDetector.ts`

Detecta oportunidades e problemas de ranking:

```typescript
export class RankingDetector {
  // Detecta páginas próximas do Top 10
  async detectNearTopTen(
    publicationId: string,
    threshold: number = 15
  ): Promise<Insight[]>
  
  // Detecta quedas de ranking
  async detectRankingDecline(
    publicationId: string,
    percentThreshold: number = 30
  ): Promise<Insight[]>
  
  // Detecta entradas no Top 3
  async detectTopThreeEntry(): Promise<Insight[]>
}
```

#### `/lib/intelligence/detectors/ctrDetector.ts`

Detecta problemas de CTR (Click-Through Rate):

```typescript
export class CtrDetector {
  // CTR muito baixo (< 1%)
  async detectVeryLowCtr(): Promise<Insight[]>
  
  // CTR em queda
  async detectCtrDecline(): Promise<Insight[]>
  
  // Oportunidades de melhoria (páginas altas sem clicks)
  async detectHighImpressionLowCtr(): Promise<Insight[]>
}
```

#### `/lib/intelligence/detectors/indexationDetector.ts`

Detecta problemas de indexação:

```typescript
export class IndexationDetector {
  // Página nunca indexou
  async detectNeverIndexed(): Promise<Insight[]>
  
  // Página perdeu indexação
  async detectLostIndexation(): Promise<Insight[]>
  
  // Indexação lenta
  async detectSlowIndexation(): Promise<Insight[]>
  
  // Indexação rápida (positivo)
  async detectFastIndexation(): Promise<Insight[]>
}
```

#### `/lib/intelligence/detectors/crawlDetector.ts`

Detecta mudanças em crawl frequency:

```typescript
export class CrawlDetector {
  // Google parou de visitar
  async detectCrawlStopped(): Promise<Insight[]>
  
  // Google aumentou frequency
  async detectCrawlIncreased(): Promise<Insight[]>
  
  // Erros recorrentes de crawl
  async detectRecurringCrawlErrors(): Promise<Insight[]>
}
```

#### `/lib/intelligence/detectors/contentDetector.ts`

Detecta problemas de conteúdo:

```typescript
export class ContentDetector {
  // Conteúdo sem atualização há X meses
  async detectOutdatedContent(monthsThreshold: number = 6): Promise<Insight[]>
  
  // Páginas sem links internos
  async detectOrphanPages(): Promise<Insight[]>
  
  // Schema incompleto ou ausente
  async detectMissingSchema(): Promise<Insight[]>
  
  // Imagem destacada fora das recomendações
  async detectBadFeaturedImage(): Promise<Insight[]>
}
```

#### `/lib/intelligence/intelligenceEngine.ts`

Orquestra todos os detectors:

```typescript
export class IntelligenceEngine {
  async generateInsights(publicationId: string): Promise<Insight[]>
  
  async prioritizeInsights(insights: Insight[]): Promise<Insight[]>
  
  async generateRecommendations(insights: Insight[]): Promise<Recommendation[]>
  
  async calculateRoiScore(impact: Impact, effort: Effort): number
  
  async calculateHealthScores(publicationId: string): Promise<SeoHealthScore>
}
```

#### `/lib/intelligence/reportGenerator.ts`

Gera relatórios automáticos:

```typescript
export class ReportGenerator {
  async generateDailyReport(publicationId: string): Promise<Report>
  
  async generateWeeklyReport(publicationId: string): Promise<Report>
  
  async generateMonthlyReport(publicationId: string): Promise<Report>
  
  async generatePdf(report: Report): Promise<Buffer>
}
```

---

### APIs

#### POST /api/intelligence/generate

Inicia geração de insights e recomendações.

```
Body: { publication_id }
Response: { insights_count, recommendations_count, status }
```

#### GET /api/intelligence/insights?publication_id=xxx

Retorna todos os insights de uma publicação.

```
Response: { insights: Insight[], stats: IntelligenceStats }
```

#### GET /api/intelligence/recommendations?publication_id=xxx

Retorna recomendações ordenadas por score.

```
Response: { recommendations: Recommendation[] }
```

#### POST /api/intelligence/actions/{id}/complete

Marca uma ação como concluída.

```
Body: { notes: string (optional) }
Response: { action: Action, updated }
```

#### GET /api/intelligence/reports?publication_id=xxx&type=daily|weekly|monthly

Retorna relatórios gerados.

```
Response: { report: Report }
```

---

## 📱 Interface (Frontend)

### Dashboard Principal

#### Cards Principais (topo)

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│     Insights    │  Alta Prioridade│ Oportunidades   │ Ações Concluídas│
│        42       │       7         │      18         │      132        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### Seção: "O que você deve fazer agora?"

Lista os 5-7 insights mais importantes:

```
🔴 CRÍTICA - Sua página "Concurso Prefeitura X" está na posição 11
   ⏱️ Esforço: 15 min | 📈 Impacto: Muito Alto | 🎯 ROI: ★★★★★
   Com uma melhoria de CTR ela pode entrar no Top 10.
   [Resolver]

🟡 MÉDIA - Esta página possui 3.200 impressões com CTR de apenas 1%
   ⏱️ Esforço: 5 min | 📈 Impacto: Alto | 🎯 ROI: ★★★★☆
   Reescreva o título e meta description.
   [Resolver]

🟢 BAIXA - Adicione mais 3 links internos
   ⏱️ Esforço: 30 min | 📈 Impacto: Médio | 🎯 ROI: ★★★☆☆
   [Resolver]
```

### Página: Centro de Inteligência

URLs: `/app/(app)/intelligence/page.tsx`

#### Filtros

- Tipo (ranking, ctr, indexation, crawl, content, link, image, discover)
- Prioridade (CRITICAL, HIGH, MEDIUM, LOW)
- Status (open, in_progress, resolved, dismissed)
- Impacto estimado (VERY_HIGH, HIGH, MEDIUM, LOW)
- Esforço (5_MIN, 15_MIN, 30_MIN, 2_HOURS)

#### Visualização

Tabela com colunas:
- Tipo (ícone + label)
- Título
- Prioridade (com cor)
- Impacto estimado
- Esforço estimado
- ROI Score (★★★★★)
- Status (botão de ação)
- Data

### Página: Oportunidades

URLs: `/app/(app)/opportunities/page.tsx`

Detecta automaticamente:

1. **Ranking**: Páginas posição 11-15 (próximas do Top 10)
2. **Ranking**: Páginas posição 4-9 (próximas do Top 3)
3. **Conteúdo**: Páginas sem atualização há 6+ meses
4. **Links**: Páginas órfãs sem links internos
5. **Discover**: Páginas elegíveis para Google Discover

### Página: Alertas

URLs: `/app/(app)/alerts/page.tsx`

Timeline enriquecida:

```
📅 15 ago - Publicado
   ↓
📅 20 ago - Indexado (5 dias)
   ↓
📅 22 ago - Primeira impressão no GSC
   ↓
📅 25 ago - CTR em 2.5%
   ↓
📅 30 ago - CTR caiu para 1.2% (-50%)
   ↓
⚠️  INSIGHT CRIADO: CTR muito baixo
   Recomendação: Reescreva título
   ↓
✅ 02 set - Usuário atualizou título
   ↓
📅 05 set - CTR subiu para 3.1% (+150%)
   ↓
✅ INSIGHT RESOLVIDO
```

### Dashboard Executivo

URLs: `/app/(app)/executive/page.tsx`

Resumo para stakeholders:

```
HOJE

📊 17 novos insights
   ├─ 5 críticos
   ├─ 9 oportunidades
   └─ 3 positivos

🏆 3 páginas entraram no Top 10
📉 2 perderam posições

📈 2 artigos aumentaram CTR >20%
⚠️  1 artigo perdeu indexação
```

### Scores de Saúde

Nova seção no dashboard mostrando 4 scores:

```
SEO Health         Growth Potential   Index Velocity    Content Freshness
    96                  84                91                  72
  ████████░         ████████░         █████████░         ███████░░
```

---

## ✅ Critérios de Aceitação

### Inteligência

- [ ] Detector de ranking (Top 10, Top 3, declines)
- [ ] Detector de CTR (baixo, em queda, oportunidades)
- [ ] Detector de indexação (nunca indexou, perdeu, lento, rápido)
- [ ] Detector de crawl (parou, aumentou, erros)
- [ ] Detector de conteúdo (outdated, orphan, schema, image)
- [ ] Cruzamento de dados de múltiplas fontes (GSC, crawler, SEO scanner)

### Priorização

- [ ] Algoritmo de ROI (Impacto ÷ Esforço)
- [ ] Cálculo automático de scores (0-100)
- [ ] Reordenação por impacto/esforço

### Interfaces

- [ ] Dashboard com cards de stats (insights, prioridade, oportunidades, ações)
- [ ] Centro de Inteligência com filtros e tabela
- [ ] Página de Oportunidades com detecção automática
- [ ] Página de Alertas com timeline enriquecida
- [ ] Dashboard Executivo para stakeholders
- [ ] 4 Health Scores (Health, Growth, Index Velocity, Freshness)

### Sistema de Ações

- [ ] Criar ações a partir de insights
- [ ] Marcar ações como concluídas
- [ ] Associar ações com insights/recomendações
- [ ] Timeline de ações

### Relatórios

- [ ] Geração automática de relatórios diários
- [ ] Geração de relatórios semanais
- [ ] Geração de relatórios mensais
- [ ] Exportação para PDF
- [ ] Comparação período anterior

### Qualidade

- [ ] TypeScript sem erros
- [ ] Validação com Zod
- [ ] Error handling completo
- [ ] Performance: geração de insights < 5s
- [ ] Responsive mobile
- [ ] Dark mode

---

## 🤖 Prompts para IA

### Prompt 1: Implementar Detectors

```
Você é um especialista em análise de dados SEO.

Implemente os 5 detector classes em `/lib/intelligence/detectors/`:

1. RankingDetector
   - Detectar páginas posição 11-15 (próximas Top 10)
   - Detectar quedas de ranking (>30%)
   - Detectar entradas no Top 3

2. CtrDetector
   - CTR muito baixo (< 1%)
   - CTR em queda (> 30%)
   - Páginas com muitas impressões mas baixo CTR

3. IndexationDetector
   - Página nunca indexou
   - Página perdeu indexação
   - Indexação lenta (> 7 dias)

4. CrawlDetector
   - Google parou de visitar
   - Erros recorrentes de crawl

5. ContentDetector
   - Conteúdo sem atualização há 6+ meses
   - Páginas órfãs (sem links internos)
   - Schema incompleto
   - Imagem destacada inadequada

Cada detector deve:
- Consultar dados do GSC, SEO Scanner, Discovery
- Retornar array de Insight[]
- Calcular priority/impact/effort
- Incluir métricas relevantes no objeto

Use o mock data quando NEXT_PUBLIC_USE_MOCK=true.
```

### Prompt 2: Intelligence Engine

```
Você é um especialista em orquestração e algoritmos.

Implemente `/lib/intelligence/intelligenceEngine.ts` que:

1. Orquestra todos os 5 detectors
2. Cruza dados de múltiplas fontes
3. Remove insights duplicados
4. Prioriza por importância
5. Gera recomendações
6. Calcula ROI scores
7. Calcula 4 Health Scores

Algoritmo de ROI Score:
- Impacto VERY_HIGH = 100 pontos
- Impacto HIGH = 75 pontos
- Impacto MEDIUM = 50 pontos
- Impacto LOW = 25 pontos

Depois divide por esforço:
- Esforço 5_MIN = ÷ 1
- Esforço 15_MIN = ÷ 1.5
- Esforço 30_MIN = ÷ 2
- Esforço 2_HOURS = ÷ 4

Health Scores (0-100):
- SEO Health: Baseado em auditoria técnica
- Growth Potential: Baseado em oportunidades
- Index Velocity: Baseado em indexação
- Content Freshness: Baseado em atualizações

Use mock data para demo.
```

### Prompt 3: Dashboard + Centro de Inteligência

```
Você é um expert em React + UX/UI.

Implemente:

1. `/app/(app)/page.tsx` - Adicione cards de inteligência ao dashboard principal
   - Card "Insights" mostrando total
   - Card "Alta Prioridade" mostrando count
   - Card "Oportunidades" mostrando count
   - Card "Ações Concluídas" mostrando total
   - Seção "O que você deve fazer agora?" com top 5 insights

2. `/app/(app)/intelligence/page.tsx` - Centro de Inteligência
   - Filtros: tipo, prioridade, status, impacto, esforço
   - Tabela com insights
   - Colunas: tipo, título, prioridade, impacto, esforço, ROI, status, data
   - Botões de ação: Resolver, Em progresso, Descartar
   - Expansível para ver detalhes e recomendações

3. `/components/InsightCard.tsx`
   - Mostra insight com título, descrição, prioridade
   - ROI score com ★
   - Botão de ação

Integração:
- Fetch de `/api/intelligence/insights`
- Mock data se NEXT_PUBLIC_USE_MOCK=true
- Responsive
- Dark mode
```

### Prompt 4: Oportunidades + Alertas

```
Você é um expert em React.

Implemente:

1. `/app/(app)/opportunities/page.tsx`
   - Seção: Páginas próximas do Top 10 (posição 11-15)
   - Seção: Páginas próximas do Top 3 (posição 4-9)
   - Seção: Conteúdo outdated (> 6 meses)
   - Seção: Páginas órfãs (sem links internos)
   - Seção: Elegíveis para Google Discover
   
   Para cada oportunidade:
   - Título da página
   - Métrica atual (posição, CTR, dias, count)
   - Impacto estimado
   - Ação recomendada
   - Botão "Ver detalhes"

2. `/app/(app)/alerts/page.tsx`
   - Timeline enriquecida mostrando jornada da página
   - Marcos: Publicado → Indexado → Primeira Impressão → CTR mudança → Insight → Ação → Resolução
   - Para cada evento mostra: data, tipo (evento/insight/ação), descrição, resultado se disponível
   - Filtro por tipo de evento
   - Cores: indexação (azul), insights (alarme), ações (verde)

Responsive, dark mode.
```

### Prompt 5: Relatórios + Dashboard Executivo

```
Você é um expert em relatórios e design de informação.

Implemente:

1. `/lib/intelligence/reportGenerator.ts`
   - generateDailyReport(publicationId)
   - generateWeeklyReport(publicationId)
   - generateMonthlyReport(publicationId)
   
   Cada relatório inclui:
   - Resumo executivo (3-5 pontos principais)
   - Melhor URL (maior ganho)
   - Pior URL (maior perda)
   - Novo insights criados
   - Ações completadas
   - Mudanças no ranking (entradas/saídas Top 10)
   - Comparação com período anterior
   - Recomendações top 5

2. `/app/(app)/executive/page.tsx` - Dashboard Executivo
   - Overview: total insights, críticos, oportunidades, positivos
   - Cards: "Hoje", "Esta Semana", "Este Mês"
   - Seção: Top 3 positivos (páginas que entraram Top 10)
   - Seção: Top 3 negativos (páginas que perderam ranking)
   - Últimos relatórios disponíveis para download
   - Comparação: mudanças de CTR > 20%

Formatação para PDF com:
- Logos
- Data geração
- Gráficos
- Tabelas

Responsive, dark mode.
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend - Detectors
- [ ] RankingDetector implementado
- [ ] CtrDetector implementado
- [ ] IndexationDetector implementado
- [ ] CrawlDetector implementado
- [ ] ContentDetector implementado
- [ ] Testes dos detectors

### Fase 2: Backend - Orquestração
- [ ] IntelligenceEngine implementada
- [ ] ROI Score calculator
- [ ] Health Scores calculator
- [ ] ReportGenerator implementada
- [ ] APIs de insights/recomendações/ações

### Fase 3: Frontend - Dashboard e Centro
- [ ] Cards de inteligência no dashboard principal
- [ ] Centro de Inteligência com filtros
- [ ] InsightCard component
- [ ] Integração com APIs

### Fase 4: Frontend - Oportunidades e Alertas
- [ ] Página de Oportunidades
- [ ] Página de Alertas com timeline
- [ ] Dashboard Executivo
- [ ] Geração de relatórios

### Fase 5: Polimento e Testes
- [ ] TypeScript strict
- [ ] Error handling
- [ ] Performance
- [ ] Responsivo mobile
- [ ] Dark mode
- [ ] Documentação

---

## 🎯 Definição de Pronto

- ✅ Build passa sem erros
- ✅ Inteligência funcionando com mock data
- ✅ Recomendações úteis e priorizadas
- ✅ Todos os 5 detectors implementados
- ✅ Dashboard com insights e oportunidades
- ✅ Relatórios automáticos gerados
- ✅ Responsive mobile
- ✅ Dark mode suportado
- ✅ Performance < 5s para gerar insights
- ✅ Documentação completa

---

## 📌 Notas Importantes

**Transformação de Paradigma**: Este é o momento em que IndexPilot deixa de ser um dashboard de dados para se tornar um verdadeiro consultor de SEO. A diferença não está apenas na quantidade de features, mas na mudança fundamental de como o usuário interage com a plataforma.

**Dados Necessários**: Sprint 08 depende de:
- Sprint 05 (SEO Scanner) - dados técnicos
- Sprint 07 (GSC Integration) - dados de performance, ranking, CTR

**Sequência**: Implementar nesta ordem:
1. Sprint 05 Phase 2 (Frontend)
2. Sprint 07 (GSC integration)
3. Sprint 08 (Intelligence Engine)

Desta forma, Sprint 08 terá todos os dados necessários para análise.
