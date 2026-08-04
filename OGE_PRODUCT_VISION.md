# Organic Growth Engine (OGE)

**Product Vision Document**  
**Version**: 1.0  
**Status**: Product Design  
**Author**: IndexPilot Product Team  

---

## Executive Summary

The Organic Growth Engine transforms IndexPilot from a **monitoring tool** into a **growth platform**.

**Current State** (IndexPilot Core):
- ✅ Did Google find it?
- ✅ Did Google crawl it?
- ✅ Did Google index it?
- ✅ Did Google show it?

**New State** (Organic Growth Engine):
- 🚀 How do I turn impressions into clicks?
- 🚀 How do I build topical authority?
- 🚀 How do I maintain consistent growth?
- 🚀 Where should I invest my time for maximum ROI?

---

## Core Philosophy

**Slogan**: "Não basta indexar. É preciso crescer."

> Every metric has two truths:
> 1. What IS (monitoring)
> 2. What COULD BE (opportunity)

OGE focuses on the second truth.

---

## Architecture

```
INDEXPILOT CORE
       ↓
    ┌──┴──────────────────────────┐
    │   Google Search Console      │
    │   Crawl Engine               │
    │   Intelligence Engine        │
    └──┬──────────────────────────┘
       ↓
ORGANIC GROWTH ENGINE (OGE)
       │
    ┌──┴────────────────────────────────────────────┐
    │                                               │
    ├─ CTR Optimization Engine                      │
    ├─ Internal Linking Engine                      │
    ├─ Topic Cluster Engine                         │
    ├─ Freshness Engine                             │
    ├─ Content Decay Engine                         │
    ├─ Discover Readiness Engine                    │
    ├─ Cannibalization Engine                       │
    ├─ Orphan Page Engine                           │
    ├─ Crawl Budget Analyzer                        │
    ├─ SERP Intelligence Engine                     │
    ├─ Competitor Watch Engine                      │
    ├─ Content Opportunity Finder                   │
    └─ Domain Trust Evolution Engine                │
       │
       └─ GROWTH SIMULATOR (AI-powered scenario planning)
```

---

## Module Specifications

### Module 01: CTR Optimization Engine

**Purpose**: Transform impressions into clicks.

**Data Model**:
```sql
ctr_analysis (
  id, publication_id, keyword, position,
  impressions, clicks, ctr, expected_ctr, gap,
  suggested_title, suggested_description,
  created_at, updated_at
)
```

**Key Metrics**:
- Current CTR vs. Expected CTR (by position)
- CTR Gap (opportunity quantification)
- Title/Description effectiveness

**Features**:
- AI-generated 5 alternative titles
- AI-generated 5 meta descriptions
- SERP snippet preview
- A/B testing recommendations
- Real-time CTR monitoring

**Database Events**:
```
ON new_keyword → Calculate expected_ctr
ON title_change → Track CTR impact
ON position_change → Recalculate gap
```

---

### Module 02: Internal Linking Engine

**Purpose**: Create intelligent internal link mesh.

**Data Model**:
```sql
internal_links (
  id, source_url, target_url, publication_id,
  link_text, anchor_type, relevance_score,
  created_at, auto_suggested
)

orphan_pages (
  id, publication_id, url, inbound_links,
  recommended_links, priority,
  created_at
)
```

**Algorithm**:
```
1. Detect new article/page
2. Find topically related content
3. Suggest linking opportunities
4. Calculate link mesh strength
5. Track anchor text diversity
6. Monitor link equity flow
```

**Features**:
- Automatic orphan page detection
- Suggested link map visualization
- Link anchor text recommendations
- Link equity calculator
- Broken link detection

**Dashboard**:
- Orphan pages: ranked by priority
- Link mesh score (0-100)
- Recommended new links
- Visual link graph

---

### Module 03: Topic Cluster Engine

**Purpose**: Build topical authority.

**Data Model**:
```sql
topic_clusters (
  id, publication_id, pillar_topic, cluster_type,
  completeness_score, priority, created_at
)

cluster_articles (
  id, cluster_id, url, keyword, position,
  impressions, role (pillar|cluster)
)
```

**Example Hierarchy**:
```
Seguros (Pillar)
├── Seguro Auto
├── Seguro Moto
├── Seguro Caminhão
├── Seguro Empresa
├── Seguro Viagem
├── Seguro Celular
└── Seguro Residencial
```

**Features**:
- Cluster completeness detection (%)
- Missing content identification
- AI-generated briefings for gaps
- Authority score by topic
- Related keywords cross-link

**Dashboard**:
- Cluster completeness (by %)
- Missing articles (ranked by potential)
- Authority trend over time
- Keyword coverage heatmap

---

### Module 04: Freshness Engine

**Purpose**: Detect and prioritize outdated content.

**Data Model**:
```sql
content_age_analysis (
  id, publication_id, url, last_update,
  days_since_update, freshness_score,
  position, impressions, ctr_trend,
  priority, created_at
)
```

**Freshness Score Calculation**:
```
Base: 100 - (days_since_update / max_age) * 100

Modifiers:
- If position improved: +20
- If position declined: -30
- If impressions increasing: +15
- If impressions decreasing: -25
- If competitors updated: -40
```

**Features**:
- Update recommendations ranked by impact
- Competitor freshness comparison
- SERP position correlation analysis
- Content decay prediction
- Automatic update alerts

**Dashboard**:
- Distribution chart (days since update)
- High-priority updates (by potential)
- Freshness score trend
- Update impact tracking

---

### Module 05: Content Decay Engine

**Purpose**: Detect gradual content decline.

**Data Model**:
```sql
decay_tracking (
  id, publication_id, url, metric_type,
  value_90_days_ago, value_30_days_ago,
  value_today, decay_percentage, trend,
  decay_start_date, alert_level, created_at
)
```

**Decay Detection**:
```
Metrics monitored:
- Impressions (week-over-week)
- Clicks (week-over-week)
- CTR (week-over-week)
- Average position (week-over-week)
- Crawl frequency (week-over-week)

Alert Trigger:
IF (decay_percentage > 15% AND duration > 3_weeks)
  THEN alert = CRITICAL
```

**Features**:
- Gradual decline detection
- Root cause analysis (position drop vs. CTR drop)
- Recovery recommendations
- Competitor comparison
- Decay timeline visualization

**Dashboard**:
- Decay leaderboard (top declining pages)
- Time-series charts for each page
- Recovery action recommendations
- Alert timeline

---

### Module 06: Discover Readiness Engine ⭐

**Purpose**: Optimize for Google Discover.

**Data Model**:
```sql
discover_readiness (
  id, publication_id, url,
  image_size_check, og_tags_check, update_check,
  content_quality_check, mobile_check, cwv_check,
  author_check, date_check,
  readiness_score, discover_impressions,
  discover_traffic_potential, created_at
)
```

**Checklist**:
- [ ] Image ≥ 1200px width
- [ ] Open Graph tags complete
- [ ] Updated within 6 months
- [ ] Content quality score ≥ 7/10
- [ ] Mobile-friendly (Core Web Vitals pass)
- [ ] Author info present
- [ ] Publication date present

**Features**:
- Automated readiness audit
- One-click fixes for common issues
- Discover traffic potential estimation
- Traffic source attribution
- A/B testing for image optimization

**Dashboard**:
- Readiness score (0-100)
- Discover potential (Low/Medium/High)
- Quick fixes available
- Traffic earned vs. potential

---

### Module 07: Cannibalization Engine

**Purpose**: Detect and resolve keyword cannibalization.

**Data Model**:
```sql
cannibalization_groups (
  id, publication_id, keyword_cluster,
  urls_competing, total_impressions,
  total_clicks, lost_visibility_estimate,
  resolution_status, created_at
)

cannibalization_analysis (
  id, group_id, url, keyword, position,
  impressions, ctr, suggested_action
)
```

**Detection Algorithm**:
```
1. Group keywords by semantic similarity
2. For each group, find ranking URLs
3. If > 1 URL ranks for same keyword:
   - Calculate visibility loss
   - Suggest merge, redirect, or intent change
   - Recommend anchor text adjustment
```

**Features**:
- Automatic cannibalization detection
- Visual URL conflict map
- Resolution recommendation engine
- Impact quantification
- Implementation tracking

**Dashboard**:
- Cannibalization leaderboard (by lost impressions)
- Keyword conflict map
- Suggested resolutions
- Implementation status

---

### Module 08: Orphan Page Engine

**Purpose**: Find and rescue isolated pages.

**Data Model**:
```sql
orphan_pages (
  id, publication_id, url, inbound_links_internal,
  traffic, potential_traffic, priority,
  rescue_suggestions, created_at
)
```

**Orphan Detection**:
```
Page is orphaned if:
- Zero internal links pointing to it
- No navigation path exists
- Not in sitemap
- Low crawl frequency
- Declining impressions
```

**Features**:
- Automatic orphan detection
- Link rescue suggestions
- One-click link creation
- Priority ranking (by potential impact)
- Rescue success tracking

**Dashboard**:
- Orphan pages ranked by traffic potential
- Quick "Create Links" button
- Link suggestions with anchor text
- Before/after traffic comparison

---

### Module 09: Crawl Budget Analyzer

**Purpose**: Optimize crawling efficiency.

**Data Model**:
```sql
crawl_budget_analysis (
  id, publication_id,
  total_urls_crawled, useful_crawls, wasted_crawls,
  crawl_efficiency_percentage,
  issues_found, savings_potential,
  created_at
)

crawl_waste_categories (
  category, count, percentage, impact
  -- Categories: 404, Soft404, Redirect, Duplicate, Robot.txt Excluded
)
```

**Crawl Waste Calculation**:
```
Wasted crawls include:
- 404 responses
- Soft 404 (200 with no content)
- Redirect chains (>1 hop)
- Canonical duplicates
- Robot.txt blocked (crawlable)
- Crawler traps
```

**Features**:
- Crawl efficiency scoring (%)
- Waste category breakdown
- Savings potential estimation
- Automatic recommendations
- Robot.txt optimization

**Dashboard**:
- Efficiency metric (useful vs. wasted)
- Waste categories (pie chart)
- Savings potential ($$ value)
- Quick fixes (blockable URLs)

---

### Module 10: SERP Intelligence Engine

**Purpose**: Monitor competitive landscape.

**Data Model**:
```sql
serp_tracking (
  id, publication_id, keyword, position,
  ranking_url, title, description, date,
  featured_snippet, faq, video, ai_overview,
  created_at
)

serp_changes (
  id, keyword, change_type (entry|exit|position_change|feature_change),
  url_before, url_after, position_before, position_after,
  winner_url, winner_domain,
  date_detected, created_at
)
```

**Feature Tracking**:
```
Detect and track:
- Featured Snippet ownership
- FAQ section appearance
- Video carousel results
- AI Overview presence
- Knowledge panel changes
- Image pack changes
```

**Features**:
- Real-time SERP change detection
- Competitor title/description comparison
- Feature attribution (who won snippet)
- Schema effectiveness tracking
- SERP volatility analysis

**Dashboard**:
- SERP winners this week
- SERP losers this week
- Feature changes (snippet, FAQ, video)
- Competitive gap analysis

---

### Module 11: Competitor Watch Engine

**Purpose**: Monitor competitor activity.

**Data Model**:
```sql
tracked_competitors (
  id, publication_id, competitor_domain,
  monitoring_active, created_at
)

competitor_activity (
  id, competitor_id, activity_type,
  new_content_count, new_keywords_count,
  new_categories, structural_changes,
  domain_authority_change,
  detected_date, created_at
)

competitor_content (
  id, competitor_id, url, keyword,
  position, publish_date, update_date,
  estimated_traffic, structure,
  created_at
)
```

**Activity Types**:
- New article published
- Content updated
- New keyword targeting
- Domain restructure
- New category added
- Backlink surge detected

**Features**:
- Track up to 20 competitors
- New content detection
- Topic expansion tracking
- Structural change detection
- Growth rate comparison
- Content strategy analysis

**Dashboard**:
- Competitor activity timeline
- New articles (by competitor)
- Growth comparison (your site vs. theirs)
- Content gap identification
- Market trend alerts

---

### Module 12: Content Opportunity Finder

**Purpose**: Identify high-potential content gaps.

**Data Model**:
```sql
content_opportunities (
  id, publication_id, gap_type,
  keyword, impressions, position,
  current_coverage, missing_content,
  estimated_traffic_gain,
  priority, created_at
)
```

**Opportunity Detection**:
```
Search Console data:
├─ High impressions, zero clicks
│  └─ Need content for this intent
│
├─ Impressions from keywords
│  └─ No dedicated article
│
├─ Weak position (11-20)
│  └─ Fixable with update
│
└─ Zero impressions (competitor ranking)
   └─ Market demand proven
```

**Features**:
- Cross-reference GSC + SERP data
- Opportunity scoring (by potential)
- One-click content brief generation
- Competitor content analysis
- Traffic potential estimation

**Dashboard**:
- Opportunity leaderboard
- Potential traffic gains (by article)
- Content type recommendation
- Quick "Create Content" button
- ROI estimation

---

### Module 13: Domain Trust Evolution Engine ⭐

**Purpose**: Track and improve domain authority.

**This is IndexPilot's competitive advantage.**

**Data Model**:
```sql
domain_trust_metrics (
  id, publication_id,
  crawl_trust_score,
  discovery_speed_score,
  index_velocity_score,
  impression_velocity_score,
  click_velocity_score,
  growth_consistency_score,
  content_freshness_score,
  technical_health_score,
  overall_domain_trust,
  week_number, created_at
)

velocity_tracking (
  id, publication_id, url,
  publish_date, crawl_date, index_date,
  first_impression_date, first_click_date,
  publish_to_crawl_hours,
  crawl_to_index_hours,
  index_to_impression_hours,
  impression_to_click_hours,
  created_at
)
```

**Domain Trust Components**:

1. **Crawl Trust** (0-100)
   ```
   = (crawl_frequency_trend + crawler_response_time + crawl_consistency) / 3
   
   Crawl frequency trend: How often Google bot visits
   Signals:
   - Increased crawl frequency = +20
   - Stable crawl frequency = 0
   - Decreased crawl frequency = -30
   ```

2. **Discovery Speed** (0-100)
   ```
   = 100 - (median_hours_to_first_crawl / 72) * 100
   
   Faster discovery = higher score
   Typical: 1-24 hours for good sites
   ```

3. **Index Velocity** (0-100)
   ```
   = 100 - (median_hours_crawled_to_indexed / 24) * 100
   
   Crawl → Index time
   Target: < 6 hours for important content
   ```

4. **Impression Velocity** (0-100)
   ```
   = 100 - (median_hours_indexed_to_impression / 168) * 100
   
   Index → First SERP appearance
   Target: < 48 hours
   ```

5. **Click Velocity** (0-100)
   ```
   = 100 - (median_hours_impression_to_click / 720) * 100
   
   SERP appearance → First click
   Shows if content resonates immediately
   ```

6. **Growth Consistency** (0-100)
   ```
   = (weeks_with_positive_growth / total_weeks) * 100
   
   Consecutive weeks of improvement
   >70% = very healthy
   <40% = inconsistent
   ```

7. **Content Freshness** (0-100)
   ```
   = (recently_updated_pages / total_pages) * 100
   
   Where "recently" = updated in last 3 months
   Penalizes stagnant content
   ```

8. **Technical Health** (0-100)
   ```
   = (ctr_of_technical_score + cwv_passrate + 
      crawl_success_rate + availability_percentage) / 4
   
   Overall site health
   ```

**Overall Domain Trust**:
```
Domain_Trust = (
  Crawl_Trust × 0.15 +
  Discovery_Speed × 0.12 +
  Index_Velocity × 0.18 +
  Impression_Velocity × 0.12 +
  Click_Velocity × 0.10 +
  Growth_Consistency × 0.18 +
  Content_Freshness × 0.10 +
  Technical_Health × 0.05
) / 100
```

**Features**:
- Weekly Domain Trust score (0-100)
- Component breakdown
- Trend line (improvement tracking)
- Velocity analytics for each page
- Benchmarking against industry
- Predictive scoring (where will trust be in 90 days?)

**Dashboard**:
- Domain Trust card (big number + trend arrow)
- Component scorecards (8 submetrics)
- Weekly trend line
- Velocity heatmap
- Improvement actions (ranked by impact)
- Benchmark against similar sites

---

## Growth Simulator

**The Differentiator**

The Growth Simulator answers the question every SEO asks:

> "If I do X, how much will my traffic grow?"

**User Scenario**:
1. User selects an article
2. Applies simulated changes:
   - Update content (+350 words)
   - New title (optimize for CTR)
   - Add 8 internal links
   - New featured image
   - Complete topic cluster
   - Fix technical SEO issues
3. System predicts outcomes

**Prediction Model**:
```
Uses historical data from the website itself:

1. Historical Impact Analysis
   When this site updated articles before:
   - Average impression increase: +18% to +35%
   - Average click increase: +22% to +40%
   - Typical position change: +1.2 to +3 places

2. Velocity Correlation
   Fast sites see gains faster (7-14 days)
   Slower sites see gains slower (21-45 days)

3. Cluster Effect
   Completing a cluster increases all related articles
   Estimates: +8% to +15% per cluster article

4. SERP Competition
   Analyzes current SERP gap
   Estimates: X% chance of Top 10
```

**Output**:
```
Impact Estimate (based on your site's history):

Impressions:   +18% to +35%  (average: +27%)
Clicks:        +22% to +40%  (average: +31%)
Average Position: +2.1 places

Success Probability:
├─ Top 10: 76%
├─ Top 5: 34%
└─ Featured Snippet: 12%

Discover:
├─ Current: Low
└─ Predicted: Moderate → High

Timeline:
├─ First changes visible: 3-7 days
├─ Full impact: 21-35 days
└─ Peak: 45-60 days

Confidence Level: 82% (based on 47 similar updates)

Action Priority: ⭐⭐⭐⭐⭐ (VERY HIGH)
```

**Technical Implementation**:
```
Algorithm:
1. Identify similar historical articles
2. Extract features from update actions
3. Calculate weighted impact coefficients
4. Apply SERP competition adjustment
5. Generate confidence intervals
6. Return prediction with timeline
```

---

## Executive Dashboard

**"Bom dia, Francisco."**

```
┌─────────────────────────────────────────────────┐
│ Rede: 18 Sites                                  │
│ Health: 96                                      │
│ Domain Trust: 78 (+4 this week) ↑              │
│ Googlebot: ↑ 28% (visits increased)             │
│                                                 │
│ Indexação:                                      │
│ ├─ 8 dias → 1 dia → 6 horas                    │
│ │  (Publication → Index time improving)        │
│                                                 │
│ CTR Médio: ↑ 1.9% (up from 3.1% two weeks ago) │
│                                                 │
│ Top 10: +17 novas páginas (this month)         │
│ Discover: +8 novas URLs                         │
│                                                 │
│ Ações Necessárias:                              │
│ ├─ Conteúdos em decadência: 11                 │
│ ├─ Páginas órfãs: 24                           │
│ ├─ Canibalizações: 7                           │
│ └─ Clusters incompletos: 18                    │
│                                                 │
│ Maior oportunidade:                             │
│ "Atualizar 5 artigos = +12.000 impressões/mês" │
│                                                 │
│ Prioridade nº 1:                                │
│ "Concluir cluster 'Seguro Auto'"                │
│ Impacto: Alto                                   │
└─────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Modules 1-5)
**Estimated**: 4-5 weeks
- CTR Optimization
- Internal Linking
- Topic Clusters
- Freshness Tracking
- Content Decay Detection

**Deliverable**: 
- Executive Dashboard (basic)
- Growth tracking begins

### Phase 2: Intelligence (Modules 6-9)
**Estimated**: 3-4 weeks
- Discover Readiness
- Cannibalization Detection
- Orphan Page Rescue
- Crawl Budget Analyzer

**Deliverable**:
- Advanced analytics
- Automated recommendations

### Phase 3: Competitive (Modules 10-12)
**Estimated**: 3-4 weeks
- SERP Intelligence
- Competitor Watching
- Opportunity Finding

**Deliverable**:
- Market intelligence
- Content gap identification

### Phase 4: Trust & Simulation (Module 13 + Simulator)
**Estimated**: 4-5 weeks
- Domain Trust Evolution Engine
- Growth Simulator (AI-powered)

**Deliverable**:
- Predictive analytics
- Strategic planning tool

### Phase 5: Polish & Integration
**Estimated**: 2-3 weeks
- Performance optimization
- Mobile refinement
- API integrations

---

## Technology Stack

**Reuse from IndexPilot Core**:
- Next.js 16 (API routes, UI)
- TypeScript (strict mode)
- Supabase (database + RLS)
- TailwindCSS (UI)
- Recharts (visualizations)

**New Dependencies**:
- `ml-regression`: For impact prediction
- `date-fns`: Timeline calculations
- `numeral.js`: Number formatting
- `chart.js` (optional): Advanced charts

**No Breaking Changes**: OGE extends IndexPilot, doesn't replace it.

---

## Success Metrics

**Product Success**:
- ✅ Help customers increase traffic by 25%+ within 90 days
- ✅ Reduce time to action from discovery to implementation
- ✅ Improve precision of growth predictions (>80% accuracy)

**Technical Success**:
- ✅ <500ms dashboard load time
- ✅ 85%+ test coverage
- ✅ Zero database N+1 queries
- ✅ Mobile-first responsive design

---

## Competitive Advantage

| Feature | IndexPilot OGE | SEMrush | Ahrefs | Others |
|---------|---|---|---|---|
| Domain Trust Evolution | ✅ Unique | ❌ | ❌ | ❌ |
| Growth Simulator | ✅ Unique | ❌ | ❌ | ❌ |
| Velocity Tracking | ✅ Detailed | Partial | Partial | ❌ |
| Orphan Rescue | ✅ Automated | Manual | Manual | Manual |
| Topic Clusters | ✅ Full | ✅ | ✅ | ✅ |
| CTR Optimization | ✅ | ✅ | ✅ | ✅ |
| Competitor Watch | ✅ | ✅ | ✅ | ✅ |

**Two unique features set OGE apart:**
1. Domain Trust Evolution (not elsewhere)
2. Growth Simulator (not elsewhere)

---

## Financial Impact

**For a 5-website customer**:
- Potential monthly traffic increase: 15,000 - 50,000 impressions
- Potential monthly click increase: 300 - 1,500 clicks
- Estimated revenue impact: Depends on conversion, but easily $5K-$50K/month

**For IndexPilot**:
- Premium tier feature (higher pricing)
- Justifies enterprise tier ($500-$2000/month)
- Customer stickiness increases dramatically

---

## Conclusion

The Organic Growth Engine closes the loop on IndexPilot.

It's not just data. It's **strategy**.

It's not just monitoring. It's **growth**.

**Next Step**: Build Phase 1 (Modules 1-5) and release to beta.

---

**Status**: Ready for Implementation  
**Approval Required**: Product & Engineering Teams  
**Timeline**: 16-19 weeks for full feature set  
**Target Release**: Q1 2027
