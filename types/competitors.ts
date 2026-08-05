// ============================================================================
// SPRINT 14: COMPETITOR INTELLIGENCE TYPES
// ============================================================================

// --- Competitors ---
export type CompetitorCategory = 'direct' | 'indirect' | 'reference';
export type CompetitorPriority = 'high' | 'medium' | 'low';
export type CompetitorStatus = 'active' | 'paused' | 'archived';

export interface Competitor {
  id: string;
  workspace_id: string;
  name: string;
  domain: string;
  category: CompetitorCategory;
  country?: string;
  language?: string;
  priority: CompetitorPriority;
  status: CompetitorStatus;
  notes?: string;
  last_crawled_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Competitor Crawls ---
export type CrawlStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CompetitorCrawl {
  id: string;
  competitor_id: string;
  started_at: string;
  finished_at?: string;
  pages_found: number;
  status: CrawlStatus;
  error_message?: string;
  metadata: Record<string, any>;
}

// --- Competitor Pages ---
export type PageType = 'page' | 'article' | 'category' | 'product' | 'landing' | 'tool' | 'other';

export interface CompetitorPage {
  id: string;
  competitor_id: string;
  crawl_id?: string;
  url: string;
  type: PageType;
  depth: number;
  title?: string;
  meta_description?: string;
  canonical?: string;
  schema_type?: string;
  internal_links_count: number;
  external_links_count: number;
  images_count: number;
  word_count: number;
  has_faq: boolean;
  has_howto: boolean;
  has_breadcrumb: boolean;
  status_code?: number;
  response_time_ms?: number;
  content_hash?: string;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

// --- Competitor Categories ---
export interface CompetitorCategoryItem {
  id: string;
  competitor_id: string;
  name: string;
  slug: string;
  url?: string;
  parent_id?: string;
  pages_count: number;
  depth: number;
  discovered_at: string;
}

// --- Benchmarks ---
export type BenchmarkCategory = 'technical' | 'content' | 'authority' | 'structure';

export interface Benchmark {
  id: string;
  workspace_id: string;
  competitor_id: string;
  metric: string;
  my_value: any;
  competitor_value: any;
  category: BenchmarkCategory;
  calculated_at: string;
}

export interface BenchmarkComparison {
  metric: string;
  myValue: any;
  competitorValue: any;
  difference: number;
  percentage: number;
  trend: 'better' | 'worse' | 'equal';
}

// --- Content Gaps ---
export type GapPriority = 'high' | 'medium' | 'low';
export type GapStatus = 'identified' | 'in_progress' | 'completed' | 'ignored';

export interface ContentGap {
  id: string;
  workspace_id: string;
  topic: string;
  description?: string;
  competitor_id?: string;
  competitor_urls?: string[];
  priority: GapPriority;
  status: GapStatus;
  estimated_potential?: string;
  created_at: string;
  updated_at: string;
}

// --- Competitor Changes ---
export type CompetitorChangeType =
  | 'new_page'
  | 'removed_page'
  | 'updated_page'
  | 'new_category'
  | 'removed_category'
  | 'structure_change'
  | 'sitemap_change'
  | 'robots_change'
  | 'schema_change';

export interface CompetitorChange {
  id: string;
  competitor_id: string;
  change_type: CompetitorChangeType;
  url?: string;
  old_value?: string;
  new_value?: string;
  detected_at: string;
}

// --- Competitive Opportunities ---
export type OpportunityType = 'content_gap' | 'technical_improvement' | 'structure_change' | 'new_topic' | 'schema_adoption';
export type OpportunityImpact = 'high' | 'medium' | 'low';
export type OpportunityEffort = 'high' | 'medium' | 'low';

export interface CompetitiveOpportunity {
  id: string;
  workspace_id: string;
  type: OpportunityType;
  title: string;
  description?: string;
  competitor_id?: string;
  priority: GapPriority;
  impact: OpportunityImpact;
  effort: OpportunityEffort;
  status: GapStatus;
  supporting_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// --- Market Timeline ---
export interface MarketTimelineEvent {
  id: string;
  workspace_id: string;
  competitor_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  occurred_at: string;
}

// --- SEO Analysis Results ---
export interface SiteAnalysis {
  url: string;
  title?: string;
  meta_description?: string;
  canonical?: string;
  robots?: string;
  schema_types: string[];
  internal_links: number;
  external_links: number;
  images: number;
  word_count: number;
  depth: number;
  has_faq: boolean;
  has_howto: boolean;
  has_breadcrumb: boolean;
  status_code: number;
}

// --- Architecture Comparison ---
export interface ArchitectureComparison {
  mySite: SiteArchitecture;
  competitor: SiteArchitecture;
  differences: ArchitectureDifference[];
}

export interface SiteArchitecture {
  domain: string;
  total_pages: number;
  categories: CategoryStructure[];
  avg_depth: number;
  orphan_pages: number;
  max_depth: number;
}

export interface CategoryStructure {
  name: string;
  slug: string;
  pages_count: number;
  subcategories: CategoryStructure[];
}

export interface ArchitectureDifference {
  type: 'missing_category' | 'extra_category' | 'depth_issue' | 'structure_improvement';
  description: string;
  my_value?: any;
  competitor_value?: any;
  recommendation: string;
}

// --- Content Gap Analysis ---
export interface ContentGapAnalysis {
  topic: string;
  myArticles: number;
  competitorArticles: number;
  gap: number;
  priority: GapPriority;
  competitorUrls: string[];
  suggestedTopics: string[];
}

// --- SEO Strategy Pattern ---
export interface SEOPattern {
  pattern: string;
  description: string;
  frequency: number;
  examples: string[];
}

// --- Competitive Report ---
export interface CompetitiveReport {
  id: string;
  workspace_id: string;
  type: 'benchmark' | 'technical' | 'content_gap' | 'evolution' | 'recommendations';
  title: string;
  data: Record<string, any>;
  generated_at: string;
}

// --- AI Advisor Response ---
export interface AdvisorResponse {
  question: string;
  answer: string;
  supporting_data: Record<string, any>;
  recommendations: string[];
  confidence: number;
}