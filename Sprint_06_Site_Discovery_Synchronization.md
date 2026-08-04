# IndexPilot - Sprint 06
## Site Discovery & Synchronization Engine

---

## 📋 PRD - Product Requirements Document

### Visão Geral

O **Site Discovery & Synchronization Engine** é o módulo fundamental que torna o IndexPilot verdadeiramente autônomo. Quando um novo site é adicionado, este motor descobre automaticamente TODAS as URLs, sincroniza metadados continuamente e dispara inteligentemente as demais engines.

**Problema**: Usuários precisam cadastrar URLs manualmente ou aguardar indexação manual no Google.

**Solução**: Descoberta automática de 100% das URLs + sincronização contínua sem intervenção manual.

---

### Mudança Paradigmática

**Antes**: "Adicione site" → Tela vazia → Aguarde...

**Depois**: "Adicione site" → 2 minutos → Dashboard completo com:
- 2.432 URLs descobertas
- 2.118 indexadas
- 314 não indexadas
- 87 descobertas mas não indexadas
- SEO médio: 92
- Últimas atualizações, erros, oportunidades

---

### Objetivos

1. ✅ Descobrir automaticamente 100% das URLs
2. ✅ Sincronizar metadados continuamente
3. ✅ Detectar novas URLs em tempo real
4. ✅ Identificar URLs removidas ou com erro
5. ✅ Verificar status de indexação Google
6. ✅ Importar dados do Search Console
7. ✅ Executar SEO Inspector automaticamente
8. ✅ Disparar indexação via IndexNow/Google
9. ✅ Encontrar páginas órfãs
10. ✅ Criar dashboard rico no onboarding

---

### Stack Técnico

**Backend**:
- Node.js + TypeScript
- XML/Sitemap parsing
- Headless browser crawling
- Google API Client
- IndexNow protocol

**APIs Externas**:
- Google Search Console (OAuth)
- Google Indexing API
- Google Safe Browsing
- IndexNow API
- CommonCrawl (opcional)

**Banco de Dados**:
- PostgreSQL (urls, url_metadata, sync_logs)
- Full-text search para URLs
- Indexes para performance

**Frontend**:
- React 19 + TypeScript
- Progress indicators
- Real-time sync status
- URL management interface

---

## 🏗️ Arquitetura

### 8 Sub-Módulos

```
Site Adicionado
    ↓
1. Sitemap Discoverer (busca sitemaps.xml)
    ↓
2. URL Parser (lê XML de sitemaps)
    ↓
3. Crawler (descobre URLs não no sitemap)
    ↓
4. Google Indexer (verifica status Google)
    ↓
5. Search Console Sync (importa dados GSC)
    ↓
6. Metadata Extractor (títulos, datas, etc)
    ↓
7. Orphan Detector (encontra páginas órfãs)
    ↓
8. Continuous Monitor (sincroniza continuamente)
```

---

### Banco de Dados

#### Tabela: urls

```sql
CREATE TABLE IF NOT EXISTS urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    publication_id UUID REFERENCES publication_queue(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    url VARCHAR(2000) NOT NULL,
    slug VARCHAR(500),
    
    title VARCHAR(255),
    description TEXT,
    last_modified TIMESTAMP WITH TIME ZONE,
    
    source VARCHAR(20) NOT NULL CHECK (source IN ('sitemap', 'crawl', 'gsc', 'manual')),
    discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    http_status INTEGER,
    is_redirect BOOLEAN DEFAULT FALSE,
    redirect_to VARCHAR(2000),
    
    is_indexable BOOLEAN DEFAULT TRUE,
    is_indexed BOOLEAN DEFAULT FALSE,
    is_orphaned BOOLEAN DEFAULT FALSE,
    
    last_checked TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(site_id, url)
);

CREATE INDEX idx_urls_site_id ON urls(site_id);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_indexed ON urls(site_id, is_indexed);
CREATE INDEX idx_urls_orphaned ON urls(site_id, is_orphaned);
CREATE INDEX idx_urls_status ON urls(site_id, sync_status);
CREATE INDEX idx_urls_created_at ON urls(site_id, created_at DESC);
CREATE INDEX idx_urls_last_checked ON urls(site_id, last_checked DESC);
```

#### Tabela: url_metadata

```sql
CREATE TABLE IF NOT EXISTS url_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(2000),
    
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(2000),
    
    canonical VARCHAR(2000),
    robots_index BOOLEAN,
    robots_follow BOOLEAN,
    
    viewport VARCHAR(255),
    mobile_friendly BOOLEAN,
    
    word_count INTEGER,
    headings_count INTEGER,
    
    external_links_count INTEGER,
    internal_links_count INTEGER,
    
    schema_types TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_url_metadata_url_id ON url_metadata(url_id);
```

#### Tabela: sync_logs

```sql
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    urls_found INTEGER DEFAULT 0,
    urls_new INTEGER DEFAULT 0,
    urls_removed INTEGER DEFAULT 0,
    urls_updated INTEGER DEFAULT 0,
    
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_site_id ON sync_logs(site_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(site_id, status);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(site_id, created_at DESC);
```

---

### Tipos e Interfaces

```typescript
// URL Discovery Types
export interface DiscoveredURL {
  url: string;
  source: 'sitemap' | 'crawl' | 'gsc' | 'manual';
  title?: string;
  description?: string;
  lastModified?: string;
  httpStatus?: number;
  isRedirect?: boolean;
  redirectTo?: string;
}

export interface SitemapLocation {
  url: string;
  found: boolean;
  accessible: boolean;
  urlCount?: number;
}

export interface CrawlResult {
  urlsDiscovered: number;
  urlsProcessed: number;
  newUrls: number;
  orphanedUrls: string[];
  redirects: Array<{ from: string; to: string }>;
}

export interface GoogleIndexStatus {
  url: string;
  isIndexed: boolean;
  isDiscoveredNotIndexed: boolean;
  isBlockedByRobots: boolean;
  isBlockedByUserAgent: boolean;
  isNotFound: boolean;
  lastCrawled?: string;
  verdict?: 'PASS' | 'PARTIAL' | 'NEUTRAL' | 'FAIL';
}

export interface URLMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  canonical?: string;
  robotsIndex?: boolean;
  wordCount?: number;
  externalLinksCount?: number;
  internalLinksCount?: number;
  schemaTypes?: string[];
}

export interface SyncLog {
  site_id: string;
  user_id: string;
  sync_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  urls_found: number;
  urls_new: number;
  urls_removed: number;
  urls_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface DiscoverySummary {
  total_urls: number;
  indexed_urls: number;
  not_indexed_urls: number;
  discovered_not_indexed: number;
  orphaned_urls: number;
  errors: number;
  seo_average: number;
  last_sync: string;
  next_sync: string;
}
```

---

### Serviços Backend

#### 1. SitemapDiscoverer

```typescript
export class SitemapDiscoverer {
  async discoverSitemaps(domainUrl: string): Promise<SitemapLocation[]>
  async parseSitemapXml(sitemapUrl: string): Promise<DiscoveredURL[]>
  async handleSitemapIndex(indexUrl: string): Promise<DiscoveredURL[]>
  async validateSitemap(sitemapUrl: string): Promise<boolean>
}
```

**Descobre automaticamente**:
- /sitemap.xml
- /sitemap_index.xml
- /post-sitemap.xml
- /page-sitemap.xml
- /news-sitemap.xml
- /category-sitemap.xml
- /tag-sitemap.xml
- /product-sitemap.xml
- robots.txt (Sitemap: referências)

#### 2. URLCrawler

```typescript
export class URLCrawler {
  async crawlSite(domainUrl: string, maxDepth: number): Promise<CrawlResult>
  async crawlPage(url: string): Promise<string[]>
  async detectOrphanPages(sitemapUrls: string[], crawledUrls: string[]): Promise<string[]>
  async checkUrlStatus(url: string): Promise<number>
}
```

**Funcionalidades**:
- BFS (breadth-first search) para evitar loops
- Respeita robots.txt
- Respeita rate limiting
- Timeout handling
- Detecção de páginas órfãs

#### 3. GoogleIndexer

```typescript
export class GoogleIndexer {
  async checkIndexStatus(url: string): Promise<GoogleIndexStatus>
  async checkBatchIndexStatus(urls: string[]): Promise<GoogleIndexStatus[]>
  async requestIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED'): Promise<boolean>
  async validateRobotsTxt(domainUrl: string): Promise<boolean>
}
```

**Usa Google URL Inspection API**:
- Verifica se URL está indexada
- Detecta bloqueios por robots.txt
- Detecta user-agent issues
- Retorna últimas datas de crawl

#### 4. SearchConsoleSyncer

```typescript
export class SearchConsoleSyncer {
  async syncCoverageData(siteUrl: string): Promise<DiscoveredURL[]>
  async importNotIndexedUrls(siteUrl: string): Promise<string[]>
  async fetchCrawlErrors(siteUrl: string): Promise<Array<{url: string; error: string}>>
  async syncEnhancements(siteUrl: string): Promise<any>
}
```

**Sincroniza com GSC**:
- URLs descobertas mas não indexadas
- Erros de cobertura
- Mobile usability issues
- Enhancements (Rich snippets, AMP, etc)

#### 5. MetadataExtractor

```typescript
export class MetadataExtractor {
  async extractFromUrl(url: string): Promise<URLMetadata>
  async extractBatch(urls: string[]): Promise<Map<string, URLMetadata>>
  async extractOpenGraph(html: string): Promise<Record<string, string>>
  async extractSchema(html: string): Promise<string[]>
}
```

**Extrai**:
- Title, description, canonical
- OpenGraph tags
- Schema.org markup
- Word count
- Links (internos/externos)
- Mobile viewport
- Robots directives

#### 6. URLSynchronizer

```typescript
export class URLSynchronizer {
  async fullSync(siteId: string): Promise<SyncLog>
  async incrementalSync(siteId: string): Promise<SyncLog>
  async compareAndUpdate(siteId: string, discoveredUrls: DiscoveredURL[]): Promise<{
    new: number;
    updated: number;
    removed: number;
  }>
  async markMissing(siteId: string, urlsNotFound: string[]): Promise<number>
}
```

**Sincronização**:
- Detecta URLs novas
- Atualiza URLs existentes
- Detecta URLs removidas
- Marca como órfã
- Executa automáticamente:
  - SEO Inspector (Sprint 05)
  - Google Indexing API
  - IndexNow API

#### 7. ContinuousMonitor

```typescript
export class ContinuousMonitor {
  scheduleSync(siteId: string, interval: number): void
  async monitorIndexStatus(siteId: string): Promise<void>
  async detectNewUrls(siteId: string): Promise<number>
  async checkIndexProgress(siteId: string): Promise<DiscoverySummary>
}
```

**Monitoramento contínuo**:
- Roda a cada noite (00:00, 02:00, 04:00 UTC)
- Detecta novas URLs
- Verifica status de indexação
- Dispara re-verificações automáticas

---

## ✅ Critérios de Aceitação

### Discovery
- [ ] Descobre automaticamente todos os sitemaps
- [ ] Parseia XML corretamente (múltiplos namespaces)
- [ ] Fallback para crawl se sem sitemap
- [ ] Detecta páginas órfãs (sitemap vs crawl)
- [ ] Respeita robots.txt
- [ ] Trata redirects e errors

### Google Integration
- [ ] Verifica indexação via URL Inspection API
- [ ] Importa dados do Search Console
- [ ] Detecta erros de cobertura
- [ ] Envia IndexNow requests
- [ ] Trata OAuth token refresh

### Metadata
- [ ] Extrai title, description, canonical
- [ ] Extrai Open Graph tags
- [ ] Detecta Schema.org markup
- [ ] Conta palavras e links
- [ ] Detecta mobile-friendliness

### Database
- [ ] 3 tabelas criadas com RLS
- [ ] Índices em colunas críticas
- [ ] Triggers para updated_at
- [ ] Unique constraints funcionando

### Frontend
- [ ] Dashboard onboarding rico
- [ ] URL management table
- [ ] Sync progress indicator
- [ ] Orphaned pages finder
- [ ] Real-time status updates

### Automação
- [ ] Executa SEO Scanner automaticamente
- [ ] Dispara Indexing API
- [ ] Dispara IndexNow
- [ ] Scheduled sync (00:00 UTC)
- [ ] Detect new URLs daily

---

## 🤖 Prompts para IA

### Prompt 1: Sitemap & Crawler

```
Você é especialista em web crawling e SEO automation.

Implemente dois serviços em `/lib/discovery/`:

1. SitemapDiscoverer (/lib/discovery/sitemapDiscoverer.ts)
   - discoverSitemaps(domainUrl): Encontra todos os sitemaps
   - Tenta: /sitemap.xml, /sitemap_index.xml, robots.txt Sitemap:
   - parseSitemapXml(url): Parse XML, trata namespaces
   - Retorna array de DiscoveredURL

2. URLCrawler (/lib/discovery/crawler.ts)
   - crawlSite(domainUrl, maxDepth): BFS crawler
   - Respeita robots.txt (user-agent: *)
   - Rate limiting: 1 request/100ms
   - Timeout: 5s por URL
   - detectOrphanPages(sitemapUrls, crawledUrls): Compara arrays
   - Retorna CrawlResult com estatísticas

Ambos precisam:
- Validação de URLs
- Error handling completo
- Logging de progress
- Suportar HTTPS + HTTP
- Trato de redirects (max 5)
```

### Prompt 2: Google Integration

```
Você é especialista em Google APIs e SEO.

Implemente dois serviços em `/lib/discovery/`:

1. GoogleIndexer (/lib/discovery/googleIndexer.ts)
   - checkIndexStatus(url): Usa URL Inspection API
   - Retorna: isIndexed, isDiscoveredNotIndexed, isBlocked...
   - requestIndexing(url, type): Dispara Indexing API
   - Suporta 'URL_UPDATED' e 'URL_DELETED'

2. SearchConsoleSyncer (/lib/discovery/gscSync.ts)
   - syncCoverageData(siteUrl): Importa URLs do GSC
   - importNotIndexedUrls(siteUrl): URLs descobertas mas não indexadas
   - fetchCrawlErrors(siteUrl): Erros de cobertura
   - Usa Google API Client com OAuth

Ambos precisam:
- OAuth token management
- Batch request handling
- Rate limiting
- Error handling com retry
- Logging detalhado
```

### Prompt 3: Metadata & Sync

```
Você é especialista em web scraping e data extraction.

Implemente dois serviços:

1. MetadataExtractor (/lib/discovery/metadataExtractor.ts)
   - extractFromUrl(url): Parse HTML e extrai metadata
   - Extrai: title, description, canonical, OG tags, schema, word count, links
   - extractBatch(urls): Processa múltiplas URLs em paralelo
   - Timeout 3s por URL, caching

2. URLSynchronizer (/lib/discovery/synchronizer.ts)
   - fullSync(siteId): Descobre tudo de novo (Sitemap + Crawler + Google)
   - incrementalSync(siteId): Atualiza URLs conhecidas
   - compareAndUpdate(siteId, discoveredUrls): Calcula diff, atualiza DB
   - markMissing(siteId, urlsNotFound): URLs removidas/404
   - Retorna SyncLog com estatísticas

Ambos precisam:
- JSDOM para parsing HTML
- Parallel processing com limits
- Database transactions
- Error handling e rollback
- Logging estruturado
```

### Prompt 4: Continuous Monitoring

```
Você é especialista em automation e scheduling.

Implemente ContinuousMonitor em `/lib/discovery/monitor.ts`:

- scheduleSync(siteId, interval): Agenda sincronização
- monitorIndexStatus(siteId): Verifica progresso de indexação
- detectNewUrls(siteId): Encontra URLs novas diariamente
- checkIndexProgress(siteId): Retorna DiscoverySummary

Funcionalidades:
- Usa node-cron para scheduling
- Roda a cada 00:00, 02:00, 04:00 UTC
- Executa em background (fire-and-forget)
- Dispara SEO Scanner (Sprint 05) automaticamente
- Dispara IndexNow para URLs novas
- Logging de cada sync
- Retry logic para falhas

Sistema de fila:
- Bull queue para processar sites
- Deduplica jobs
- Suporta priority
```

### Prompt 5: Dashboard & Components

```
Você é expert em React + UX.

Implemente:

1. DiscoveryDashboard (/app/(app)/discovery/page.tsx)
   - Durante descoberta: progress bar, URLs encontradas, ETA
   - Após conclusão: DiscoverySummary cards
   - 6 stat cards: Total URLs, Indexadas, Não indexadas, Descobertas, Órfãs, Erros
   - URL management table com filtros
   - Sync history timeline
   
2. URLManagementTable (/components/discovery/URLTable.tsx)
   - Tabela com: URL, Status, Indexado, Última verificação, Ações
   - Filtros: indexado/não indexado, órfã, com erro
   - Busca por URL
   - Ações: Reindexar, Remover, Ver detalhes
   
3. OrphanFinder (/app/(app)/discovery/orphans/page.tsx)
   - Lista páginas órfãs
   - Mostrar por quê (não no sitemap, 404, etc)
   - Ação: Adicionar ao sitemap
   
4. SyncStatus (/components/discovery/SyncStatus.tsx)
   - Progress: encontradas, processadas, sincronizadas
   - Tempo estimado
   - Logs de progresso
   - Botão de parar

Integração:
- Fetch de /api/discovery
- Real-time updates com polling
- Mock data para testes
- Dark mode
- Responsive
```

---

## 📋 Checklist de Implementação

### Fase 1: Backend Core
- [ ] Sitemap Discoverer implementado
- [ ] URL Crawler com BFS
- [ ] Google Indexer (URL Inspection API)
- [ ] Search Console Syncer
- [ ] Metadata Extractor
- [ ] Database schema criado

### Fase 2: Synchronization
- [ ] URL Synchronizer
- [ ] Continuous Monitor
- [ ] Scheduling com cron
- [ ] Queue system (Bull)
- [ ] Auto-trigger de SEO Scanner

### Fase 3: Frontend
- [ ] Discovery Dashboard
- [ ] URL Management Table
- [ ] Orphan Finder
- [ ] Sync Status Component
- [ ] Real-time updates

### Fase 4: Integration
- [ ] API endpoints (/api/discovery)
- [ ] Integração com Sprint 05 (SEO Scanner)
- [ ] Integração com Sprint 07 (GSC)
- [ ] IndexNow API dispatch
- [ ] Google Indexing API dispatch

### Fase 5: Testes & Polish
- [ ] Error handling completo
- [ ] Performance optimization
- [ ] Logging estruturado
- [ ] Mobile responsive
- [ ] Dark mode
- [ ] Documentação

---

## 🎯 Definição de Pronto

- ✅ Build passa sem erros
- ✅ Sitemap discovery funciona (testa com 5+ sites reais)
- ✅ Crawler descobre URLs orphaned
- ✅ Google Indexer verifica status (mock ou real)
- ✅ Metadata extraído corretamente
- ✅ Sync atualiza database
- ✅ Dashboard mostra discovery summary
- ✅ Automação dispara SEO Scanner
- ✅ Responsive mobile
- ✅ Dark mode

---

## 📌 Notas Importantes

**Ordem Correta de Execução**:
1. Sitemap Discoverer
2. URL Crawler
3. Google Indexer (mock first)
4. Search Console Syncer (mock first)
5. Metadata Extractor
6. URL Synchronizer
7. Continuous Monitor
8. Frontend Dashboard
9. Integration com Sprint 05

**Mock Mode**: Todas as APIs têm fallback para mock data para desenvolvimento.

**Performance**: Implementar rate limiting, caching, e batch processing para suportar sites com 100k+ URLs.

**Segurança**: Respeitar robots.txt, usar rate limiting, validar todas as URLs.
