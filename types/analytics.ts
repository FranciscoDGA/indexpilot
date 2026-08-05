// ============================================================================
// SPRINT 19: DATA WAREHOUSE, BI & EXECUTIVE ANALYTICS TYPES
// ============================================================================

// --- Dimensions ---
export interface DimDate {
  id: string;
  date: string;
  day: number;
  day_of_week: number;
  day_name: string;
  month: number;
  month_name: string;
  quarter: number;
  year: number;
  week_of_year: number;
  is_weekend: boolean;
  is_holiday: boolean;
  fiscal_year?: number;
  fiscal_quarter?: number;
  created_at: string;
}

export interface DimSite {
  id: string;
  site_id: string;
  tenant_id: string;
  workspace_id?: string;
  name: string;
  domain: string;
  country?: string;
  language?: string;
  category?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DimTenant {
  id: string;
  tenant_id: string;
  name: string;
  plan?: string;
  industry?: string;
  country?: string;
  region?: string;
  employee_count?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// --- Fact Tables ---
export interface FactSEO {
  id: string;
  date_id: string;
  site_id: string;
  tenant_id: string;
  seo_score: number;
  indexed_urls: number;
  total_urls: number;
  indexation_rate: number;
  crawl_errors: number;
  broken_links: number;
  redirect_chains: number;
  missing_meta: number;
  duplicate_content: number;
  slow_pages: number;
  mobile_issues: number;
  core_web_vitals: number;
  page_speed_score: number;
  authority_score: number;
  backlinks_count: number;
  referring_domains: number;
  organic_traffic: number;
  organic_keywords: number;
  top_10_keywords: number;
  impressions: number;
  clicks: number;
  avg_ctr: number;
  avg_position: number;
  created_at: string;
}

export interface FactCrawl {
  id: string;
  date_id: string;
  site_id: string;
  tenant_id: string;
  pages_crawled: number;
  pages_discovered: number;
  crawl_duration_ms: number;
  avg_page_duration_ms: number;
  max_depth: number;
  avg_depth: number;
  internal_links: number;
  external_links: number;
  orphan_pages: number;
  redirect_pages: number;
  error_pages: number;
  pages_with_canonical: number;
  pages_with_sitemap: number;
  pages_with_schema: number;
  unique_content_ratio: number;
  avg_word_count: number;
  avg_readability_score: number;
  created_at: string;
}

export interface FactContent {
  id: string;
  date_id: string;
  site_id: string;
  tenant_id: string;
  total_articles: number;
  new_articles: number;
  updated_articles: number;
  archived_articles: number;
  avg_content_quality: number;
  avg_freshness_score: number;
  semantic_coverage: number;
  topic_clusters: number;
  avg_cluster_size: number;
  entities_detected: number;
  avg_entity_relevance: number;
  internal_links_added: number;
  cannibalization_issues: number;
  content_gaps_found: number;
  editorial_calendar_compliance: number;
  avg_reading_time_min: number;
  readability_score: number;
  created_at: string;
}

export interface FactCompetitor {
  id: string;
  date_id: string;
  site_id: string;
  tenant_id: string;
  competitor_id: string;
  competitor_name: string;
  competitor_domain: string;
  competitor_pages: number;
  page_growth_30d: number;
  page_growth_pct: number;
  estimated_traffic: number;
  traffic_growth_pct: number;
  keyword_overlap_pct: number;
  content_gap_count: number;
  backlink_count: number;
  domain_authority: number;
  tech_stack: string[];
  new_features_detected: string[];
  market_share_pct: number;
  created_at: string;
}

export interface FactAIUsage {
  id: string;
  date_id: string;
  tenant_id: string;
  queries_total: number;
  queries_by_type: Record<string, number>;
  recommendations_made: number;
  recommendations_accepted: number;
  acceptance_rate: number;
  automations_executed: number;
  automations_successful: number;
  time_saved_minutes: number;
  tokens_consumed: number;
  cost_usd: number;
  avg_response_time_ms: number;
  most_used_features: string[];
  created_at: string;
}

export interface FactBilling {
  id: string;
  date_id: string;
  tenant_id: string;
  mrr: number;
  arr: number;
  revenue: number;
  new_revenue: number;
  expansion_revenue: number;
  churned_revenue: number;
  net_revenue: number;
  active_subscriptions: number;
  new_subscriptions: number;
  cancelled_subscriptions: number;
  trial_starts: number;
  trial_conversions: number;
  churn_rate: number;
  ltv: number;
  arpu: number;
  invoices_pending: number;
  invoices_overdue: number;
  payments_failed: number;
  created_at: string;
}

export interface FactMonitoring {
  id: string;
  date_id: string;
  site_id: string;
  tenant_id: string;
  uptime_pct: number;
  downtime_minutes: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  p99_response_time_ms: number;
  ssl_expiry_days?: number;
  certificate_valid: boolean;
  dns_resolution_ms: number;
  incidents_count: number;
  incidents_resolved: number;
  avg_resolution_time_min: number;
  alerts_fired: number;
  alerts_acknowledged: number;
  status_checks_passed: number;
  status_checks_failed: number;
  created_at: string;
}

export interface FactAutomation {
  id: string;
  date_id: string;
  tenant_id: string;
  workflows_total: number;
  workflows_active: number;
  workflows_executed: number;
  workflows_successful: number;
  workflows_failed: number;
  avg_execution_time_ms: number;
  connectors_active: number;
  api_calls_made: number;
  webhooks_triggered: number;
  tasks_automated: number;
  time_saved_hours: number;
  error_rate: number;
  created_at: string;
}

// --- Executive ---
export type TrendDirection = 'up' | 'down' | 'stable' | 'new';

export interface ExecutiveMetric {
  id: string;
  tenant_id: string;
  metric_key: string;
  metric_value: number;
  metric_unit?: string;
  trend: TrendDirection;
  trend_pct: number;
  period: string;
  comparison_period?: string;
  previous_value?: number;
  target_value?: number;
  metadata: Record<string, any>;
  computed_at: string;
  expires_at?: string;
  created_at: string;
}

// --- KPIs ---
export type KPIDirection = 'higher_is_better' | 'lower_is_better' | 'target';

export interface KPIDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  formula?: string;
  unit?: string;
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;
  direction: KPIDirection;
  data_sources: string[];
  update_frequency: string;
  is_active: boolean;
  is_custom: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KPIValue {
  id: string;
  kpi_id: string;
  tenant_id: string;
  date_id: string;
  value: number;
  target_met?: boolean;
  notes?: string;
  created_at: string;
}

export interface KPIWithLatest extends KPIDefinition {
  latest_value?: number;
  previous_value?: number;
  trend?: TrendDirection;
  trend_pct?: number;
  target_met?: boolean;
}

// --- Forecasts ---
export type ForecastType = 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'arima';

export interface PredictiveForecast {
  id: string;
  tenant_id: string;
  metric_key: string;
  forecast_type: ForecastType;
  target_date: string;
  predicted_value: number;
  confidence_lower?: number;
  confidence_upper?: number;
  confidence_level: number;
  model_version?: string;
  actual_value?: number;
  accuracy_pct?: number;
  data_points_used?: number;
  factors: string[];
  generated_at: string;
  created_at: string;
}

// --- Executive Alerts ---
export type AnalyticsAlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'trend_anomaly' | 'threshold_breach' | 'forecast_divergence' | 'data_gap' | 'performance_drop';

export interface ExecutiveAlert {
  id: string;
  tenant_id: string;
  alert_type: AlertType;
  severity: AnalyticsAlertSeverity;
  title: string;
  description?: string;
  metric_key?: string;
  current_value?: number;
  previous_value?: number;
  change_pct?: number;
  anomaly_score: number;
  root_cause?: string;
  recommended_actions: string[];
  affected_sites: string[];
  is_read: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  metadata: Record<string, any>;
  created_at: string;
}

// --- Reports ---
export type ReportType = 'executive' | 'seo' | 'content' | 'competitor' | 'billing' | 'monitoring' | 'automation' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'html';

export interface ReportDefinition {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  report_type: ReportType;
  config: Record<string, any>;
  widgets: ReportWidget[];
  filters: Record<string, any>;
  schedule_cron?: string;
  schedule_timezone: string;
  recipients: string[];
  export_format: ExportFormat;
  last_generated_at?: string;
  next_generation_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export type ReportRunStatus = 'running' | 'completed' | 'failed';

export interface ReportRun {
  id: string;
  report_id: string;
  tenant_id: string;
  status: ReportRunStatus;
  file_url?: string;
  file_size_bytes?: number;
  file_format?: string;
  execution_time_ms?: number;
  error_message?: string;
  requested_by?: string;
  created_at: string;
  completed_at?: string;
}

// --- Data Explorer ---
export type VisualizationType = 'table' | 'line_chart' | 'bar_chart' | 'area_chart' | 'pie_chart' | 'scatter' | 'heatmap';

export interface DataExplorerQuery {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  description?: string;
  query_config: Record<string, any>;
  columns: DataExplorerColumn[];
  filters: Record<string, any>;
  sort_config: Record<string, any>;
  visualization_type: VisualizationType;
  is_starred: boolean;
  run_count: number;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataExplorerColumn {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  visible: boolean;
}

// --- ETL ---
export type ETLPipelineStatus = 'running' | 'completed' | 'failed' | 'partial';

export interface ETLPipelineRun {
  id: string;
  pipeline_name: string;
  source_module: string;
  status: ETLPipelineStatus;
  records_extracted: number;
  records_transformed: number;
  records_loaded: number;
  records_failed: number;
  errors: ETLError[];
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface ETLError {
  message: string;
  record_id?: string;
  field?: string;
  timestamp: string;
}

// --- Aggregated Dashboard Data ---
export interface ExecutiveDashboard {
  period: string;
  metrics: ExecutiveMetric[];
  kpis: KPIWithLatest[];
  alerts: ExecutiveAlert[];
  site_health: SiteHealthSummary;
  seo_summary: SEOSummary;
  content_summary: ContentSummary;
  competitor_summary: CompetitorSummary;
  ai_summary: AISummary;
  billing_summary: BillingSummary;
}

export interface SiteHealthSummary {
  total_sites: number;
  healthy_sites: number;
  warning_sites: number;
  critical_sites: number;
  avg_uptime_pct: number;
  avg_response_time_ms: number;
}

export interface SEOSummary {
  total_indexed_urls: number;
  avg_seo_score: number;
  total_errors: number;
  indexation_trend: TrendDirection;
  organic_traffic_trend: TrendDirection;
}

export interface ContentSummary {
  total_articles: number;
  new_this_period: number;
  avg_quality_score: number;
  semantic_coverage: number;
  topic_clusters: number;
}

export interface CompetitorSummary {
  tracked_competitors: number;
  avg_market_share: number;
  biggest_grower?: { name: string; growth_pct: number };
  biggest_decliner?: { name: string; growth_pct: number };
}

export interface AISummary {
  total_queries: number;
  acceptance_rate: number;
  time_saved_minutes: number;
  automations_executed: number;
  cost_usd: number;
}

export interface BillingSummary {
  mrr: number;
  arr: number;
  active_subscriptions: number;
  churn_rate: number;
  net_revenue: number;
}

// --- Query Builder ---
export interface AnalyticsQuery {
  module: 'seo' | 'crawl' | 'content' | 'competitor' | 'ai' | 'billing' | 'monitoring' | 'automation';
  date_range: { start: string; end: string };
  site_ids?: string[];
  tenant_id?: string;
  group_by?: string[];
  metrics: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResult {
  data: Record<string, any>[];
  total: number;
  query_time_ms: number;
  cached: boolean;
}
