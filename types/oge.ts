// OGE Type Definitions

// ============================================================================
// CTR Optimization Engine
// ============================================================================

export interface CTRAnalysis {
  id: bigint;
  publication_id: string;
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  expected_ctr: number;
  gap: number;
  suggested_title?: string;
  suggested_description?: string;
  ai_generated_titles: string[];
  ai_generated_descriptions: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CTRGap {
  keyword: string;
  position: number;
  current_ctr: number;
  expected_ctr: number;
  gap_percentage: number;
  impressions: number;
  potential_clicks: number;
  suggested_titles: string[];
  suggested_descriptions: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// Internal Linking Engine
// ============================================================================

export interface InternalLink {
  id: bigint;
  publication_id: string;
  source_url: string;
  target_url: string;
  link_text?: string;
  anchor_type: 'exact' | 'partial' | 'branded' | 'generic';
  relevance_score: number;
  auto_suggested: boolean;
  user_approved: boolean;
  created_at: Date;
}

export interface OrphanPage {
  id: bigint;
  publication_id: string;
  url: string;
  inbound_links: number;
  traffic: number;
  potential_traffic: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  rescue_status: 'pending' | 'in_progress' | 'resolved';
  created_at: Date;
  updated_at: Date;
}

export interface LinkSuggestion {
  source_url: string;
  target_url: string;
  keyword: string;
  relevance_score: number;
  potential_impact: number;
  anchor_type: 'exact' | 'partial' | 'branded' | 'generic';
}

// ============================================================================
// Topic Cluster Engine
// ============================================================================

export interface TopicCluster {
  id: bigint;
  publication_id: string;
  pillar_topic: string;
  cluster_type?: 'industry' | 'product' | 'location';
  completeness_score: number;
  target_articles: number;
  created_articles: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  created_at: Date;
  updated_at: Date;
}

export interface ClusterArticle {
  id: bigint;
  cluster_id: bigint;
  url: string;
  keyword: string;
  position: number;
  impressions: number;
  role: 'pillar' | 'cluster';
  created_at: Date;
}

export interface ClusterGap {
  pillar_topic: string;
  completeness_score: number;
  missing_keywords: string[];
  target_count: number;
  current_count: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_traffic_potential: number;
}

// ============================================================================
// Freshness Engine
// ============================================================================

export interface ContentFreshness {
  id: bigint;
  publication_id: string;
  url: string;
  last_update?: Date;
  days_since_update: number;
  freshness_score: number;
  position: number;
  impressions: number;
  ctr_trend: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  update_recommended: boolean;
  update_potential_gain: number;
  created_at: Date;
  updated_at: Date;
}

export interface FreshnessOpportunity {
  url: string;
  days_since_update: number;
  freshness_score: number;
  position: number;
  impressions: number;
  ctr_trend: number;
  potential_impression_gain: number;
  confidence: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// Content Decay Engine
// ============================================================================

export interface ContentDecay {
  id: bigint;
  publication_id: string;
  url: string;
  metric_type: 'impressions' | 'clicks' | 'ctr' | 'position';
  value_90d_ago?: number;
  value_30d_ago?: number;
  value_today: number;
  decay_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
  decay_start_date?: Date;
  alert_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  root_cause?: string;
  recovery_recommendation?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DecayAlert {
  url: string;
  metric_type: 'impressions' | 'clicks' | 'ctr' | 'position';
  current_value: number;
  value_30d_ago: number;
  decay_percentage: number;
  alert_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  root_cause: string;
  recovery_recommendation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// Unified Opportunities Table
// ============================================================================

export type OpportunityType =
  | 'ctr_gap'
  | 'orphan'
  | 'cluster_gap'
  | 'decay'
  | 'discover'
  | 'cannibalization'
  | 'crawl_waste'
  | 'serp_gap'
  | 'competitor_gap'
  | 'content_gap';

export interface OGEOpportunity {
  id: bigint;
  publication_id: string;
  opportunity_type: OpportunityType;
  url?: string;
  keyword?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_impact: number;
  estimated_effort: '5_MIN' | '15_MIN' | '30_MIN' | '2_HOURS';
  action_required?: string;
  created_at: Date;
}

// ============================================================================
// AI Suggestions
// ============================================================================

export interface AISuggestion {
  id: bigint;
  publication_id: string;
  url?: string;
  suggestion_type: 'title' | 'description' | 'link_text' | 'content_brief';
  original_content: string;
  suggested_content: string;
  ai_confidence: number;
  user_feedback?: 'helpful' | 'not_helpful';
  used: boolean;
  created_at: Date;
}

// ============================================================================
// Phase 4 Features
// ============================================================================

export interface DomainTrustMetrics {
  id: bigint;
  publication_id: string;
  crawl_trust_score: number;
  discovery_speed_score: number;
  index_velocity_score: number;
  impression_velocity_score: number;
  click_velocity_score: number;
  growth_consistency_score: number;
  content_freshness_score: number;
  technical_health_score: number;
  overall_domain_trust: number;
  week_number: number;
  trend_direction: 'up' | 'stable' | 'down';
  trend_percentage: number;
  created_at: Date;
}

export interface VelocityTracking {
  id: bigint;
  publication_id: string;
  url: string;
  publish_date?: Date;
  crawl_date?: Date;
  index_date?: Date;
  first_impression_date?: Date;
  first_click_date?: Date;
  publish_to_crawl_hours?: number;
  crawl_to_index_hours?: number;
  index_to_impression_hours?: number;
  impression_to_click_hours?: number;
  created_at: Date;
}

export interface SimulatorPrediction {
  id: bigint;
  publication_id: string;
  url: string;
  simulated_changes: Record<string, unknown>;
  predicted_impressions_min: number;
  predicted_impressions_expected: number;
  predicted_impressions_max: number;
  predicted_clicks_min: number;
  predicted_clicks_expected: number;
  predicted_clicks_max: number;
  predicted_top10_probability: number;
  predicted_top5_probability: number;
  predicted_snippet_probability: number;
  confidence_level: number;
  actual_impressions?: number;
  actual_clicks?: number;
  prediction_accuracy?: number;
  created_at: Date;
  updated_at: Date;
}
