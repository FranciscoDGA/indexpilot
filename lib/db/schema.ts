// OGE Database Schema Definitions
// Supabase migration file

export const OGE_SCHEMA = `

-- ============================================================================
-- ORGANIC GROWTH ENGINE (OGE) - DATABASE SCHEMA
-- ============================================================================

-- Phase 1: CTR Optimization Engine
CREATE TABLE IF NOT EXISTS ctr_analysis (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  keyword VARCHAR NOT NULL,
  position INT,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr FLOAT DEFAULT 0,
  expected_ctr FLOAT DEFAULT 0,
  gap FLOAT DEFAULT 0,
  suggested_title TEXT,
  suggested_description TEXT,
  ai_generated_titles JSONB DEFAULT '[]',
  ai_generated_descriptions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, keyword)
);

CREATE INDEX IF NOT EXISTS idx_ctr_gap ON ctr_analysis(gap DESC);
CREATE INDEX IF NOT EXISTS idx_ctr_publication ON ctr_analysis(publication_id);
CREATE INDEX IF NOT EXISTS idx_ctr_position ON ctr_analysis(position);

-- Phase 1: Internal Linking Engine
CREATE TABLE IF NOT EXISTS internal_links (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  link_text VARCHAR,
  anchor_type VARCHAR, -- 'exact', 'partial', 'branded', 'generic'
  relevance_score FLOAT DEFAULT 0,
  auto_suggested BOOLEAN DEFAULT FALSE,
  user_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, source_url, target_url)
);

CREATE INDEX IF NOT EXISTS idx_internal_links_source ON internal_links(source_url);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON internal_links(target_url);
CREATE INDEX IF NOT EXISTS idx_internal_links_publication ON internal_links(publication_id);

CREATE TABLE IF NOT EXISTS orphan_pages (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  inbound_links INT DEFAULT 0,
  traffic INT DEFAULT 0,
  potential_traffic INT DEFAULT 0,
  priority VARCHAR DEFAULT 'MEDIUM', -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  rescue_status VARCHAR DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, url)
);

CREATE INDEX IF NOT EXISTS idx_orphan_priority ON orphan_pages(priority DESC);
CREATE INDEX IF NOT EXISTS idx_orphan_publication ON orphan_pages(publication_id);

-- Phase 1: Topic Cluster Engine
CREATE TABLE IF NOT EXISTS topic_clusters (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  pillar_topic VARCHAR NOT NULL,
  cluster_type VARCHAR, -- 'industry', 'product', 'location'
  completeness_score FLOAT DEFAULT 0,
  target_articles INT DEFAULT 0,
  created_articles INT DEFAULT 0,
  priority VARCHAR DEFAULT 'MEDIUM',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, pillar_topic)
);

CREATE INDEX IF NOT EXISTS idx_clusters_publication ON topic_clusters(publication_id);
CREATE INDEX IF NOT EXISTS idx_clusters_score ON topic_clusters(completeness_score);

CREATE TABLE IF NOT EXISTS cluster_articles (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  cluster_id BIGINT NOT NULL REFERENCES topic_clusters(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  keyword VARCHAR NOT NULL,
  position INT DEFAULT 0,
  impressions INT DEFAULT 0,
  role VARCHAR, -- 'pillar', 'cluster'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cluster_id, url)
);

CREATE INDEX IF NOT EXISTS idx_cluster_articles_cluster ON cluster_articles(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_articles_keyword ON cluster_articles(keyword);

-- Phase 1: Freshness Engine
CREATE TABLE IF NOT EXISTS content_freshness (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  last_update DATE,
  days_since_update INT DEFAULT 0,
  freshness_score FLOAT DEFAULT 0,
  position INT DEFAULT 0,
  impressions INT DEFAULT 0,
  ctr_trend FLOAT DEFAULT 0,
  priority VARCHAR DEFAULT 'MEDIUM',
  update_recommended BOOLEAN DEFAULT FALSE,
  update_potential_gain INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, url)
);

CREATE INDEX IF NOT EXISTS idx_freshness_days ON content_freshness(days_since_update DESC);
CREATE INDEX IF NOT EXISTS idx_freshness_priority ON content_freshness(priority);
CREATE INDEX IF NOT EXISTS idx_freshness_publication ON content_freshness(publication_id);

-- Phase 1: Content Decay Engine
CREATE TABLE IF NOT EXISTS content_decay_tracking (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  metric_type VARCHAR NOT NULL, -- 'impressions', 'clicks', 'ctr', 'position'
  value_90d_ago INT,
  value_30d_ago INT,
  value_today INT,
  decay_percentage FLOAT DEFAULT 0,
  trend VARCHAR, -- 'improving', 'stable', 'declining'
  decay_start_date DATE,
  alert_level VARCHAR, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
  root_cause VARCHAR, -- analysis of why it's decaying
  recovery_recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, url, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_decay_alert_level ON content_decay_tracking(alert_level);
CREATE INDEX IF NOT EXISTS idx_decay_publication ON content_decay_tracking(publication_id);
CREATE INDEX IF NOT EXISTS idx_decay_percentage ON content_decay_tracking(decay_percentage DESC);

-- ============================================================================
-- Support tables for all phases
-- ============================================================================

CREATE TABLE IF NOT EXISTS oge_opportunities (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  opportunity_type VARCHAR NOT NULL, -- 'ctr_gap', 'orphan', 'cluster_gap', 'decay', 'discover', 'cannibalization', 'crawl_waste', 'serp_gap', 'competitor_gap', 'content_gap'
  url TEXT,
  keyword VARCHAR,
  priority VARCHAR,
  estimated_impact INT DEFAULT 0, -- estimated impressions gain
  estimated_effort VARCHAR, -- '5_MIN', '15_MIN', '30_MIN', '2_HOURS'
  action_required TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, opportunity_type, url, keyword)
);

CREATE INDEX IF NOT EXISTS idx_opportunities_priority ON oge_opportunities(priority DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_impact ON oge_opportunities(estimated_impact DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_publication ON oge_opportunities(publication_id);

CREATE TABLE IF NOT EXISTS oge_ai_suggestions (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT,
  suggestion_type VARCHAR, -- 'title', 'description', 'link_text', 'content_brief'
  original_content TEXT,
  suggested_content TEXT,
  ai_confidence FLOAT DEFAULT 0,
  user_feedback VARCHAR, -- 'helpful', 'not_helpful', null
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_publication ON oge_ai_suggestions(publication_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_used ON oge_ai_suggestions(used);

-- ============================================================================
-- Domain Trust Evolution (Phase 4) - Foundation
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_trust_metrics (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  crawl_trust_score FLOAT DEFAULT 0,
  discovery_speed_score FLOAT DEFAULT 0,
  index_velocity_score FLOAT DEFAULT 0,
  impression_velocity_score FLOAT DEFAULT 0,
  click_velocity_score FLOAT DEFAULT 0,
  growth_consistency_score FLOAT DEFAULT 0,
  content_freshness_score FLOAT DEFAULT 0,
  technical_health_score FLOAT DEFAULT 0,
  overall_domain_trust FLOAT DEFAULT 0,
  week_number INT NOT NULL,
  trend_direction VARCHAR, -- 'up', 'stable', 'down'
  trend_percentage FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_domain_trust_publication ON domain_trust_metrics(publication_id);
CREATE INDEX IF NOT EXISTS idx_domain_trust_overall ON domain_trust_metrics(overall_domain_trust DESC);
CREATE INDEX IF NOT EXISTS idx_domain_trust_week ON domain_trust_metrics(week_number DESC);

-- ============================================================================
-- Velocity Tracking (Phase 4) - For Growth Simulator
-- ============================================================================

CREATE TABLE IF NOT EXISTS velocity_tracking (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  publish_date TIMESTAMP,
  crawl_date TIMESTAMP,
  index_date TIMESTAMP,
  first_impression_date TIMESTAMP,
  first_click_date TIMESTAMP,
  publish_to_crawl_hours FLOAT,
  crawl_to_index_hours FLOAT,
  index_to_impression_hours FLOAT,
  impression_to_click_hours FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(publication_id, url)
);

CREATE INDEX IF NOT EXISTS idx_velocity_publication ON velocity_tracking(publication_id);
CREATE INDEX IF NOT EXISTS idx_velocity_crawl_hours ON velocity_tracking(publish_to_crawl_hours);

-- ============================================================================
-- OGE Logs & Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS oge_action_logs (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  action_type VARCHAR, -- 'title_update', 'link_added', 'content_updated'
  url TEXT,
  action_details JSONB,
  result_impressions_before INT,
  result_impressions_after INT,
  result_position_before INT,
  result_position_after INT,
  result_tracked_until TIMESTAMP,
  confidence_level FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_logs_publication ON oge_action_logs(publication_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_action_type ON oge_action_logs(action_type);

CREATE TABLE IF NOT EXISTS oge_simulator_predictions (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  publication_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  simulated_changes JSONB, -- What changes were simulated
  predicted_impressions_min INT,
  predicted_impressions_expected INT,
  predicted_impressions_max INT,
  predicted_clicks_min INT,
  predicted_clicks_expected INT,
  predicted_clicks_max INT,
  predicted_top10_probability FLOAT,
  predicted_top5_probability FLOAT,
  predicted_snippet_probability FLOAT,
  confidence_level FLOAT,
  actual_impressions INT, -- After changes were made
  actual_clicks INT,
  prediction_accuracy FLOAT, -- % of prediction that came true
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulator_publication ON oge_simulator_predictions(publication_id);
CREATE INDEX IF NOT EXISTS idx_simulator_accuracy ON oge_simulator_predictions(prediction_accuracy DESC);

`;

export default OGE_SCHEMA;
