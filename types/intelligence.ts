// Sprint 08: Intelligence & Recommendations Engine

export type InsightType =
  | 'ranking_near_top10'
  | 'ranking_exit_top10'
  | 'ranking_top3_entry'
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

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Impact = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Effort = '5_MIN' | '15_MIN' | '30_MIN' | '2_HOURS';
export type InsightStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type RecommendationStatus = 'active' | 'completed' | 'dismissed';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface Insight {
  id?: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  type: InsightType;
  priority: Priority;
  title: string;
  description: string;
  recommendation: string;
  estimated_impact: Impact;
  estimated_effort: Effort;
  status: InsightStatus;
  metrics?: Record<string, any>;
  created_at?: string;
  resolved_at?: string;
  dismissed_at?: string;
  dismissed_reason?: string;
}

export interface Recommendation {
  id?: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  category: string;
  title: string;
  description?: string;
  score: number; // 0-100 ROI score
  estimated_impact: Impact;
  estimated_effort: Effort;
  action_items: string[];
  status: RecommendationStatus;
  created_at?: string;
  completed_at?: string;
}

export interface Action {
  id?: string;
  publication_id: string;
  user_id: string;
  insight_id?: string;
  recommendation_id?: string;
  action: string;
  status: ActionStatus;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface IntelligenceStats {
  total_insights: number;
  critical_count: number;
  high_priority_count: number;
  opportunities_count: number;
  actions_completed: number;
  avg_roi_score: number;
}

export interface SeoHealthScore {
  overall_health: number; // 0-100
  growth_potential: number; // 0-100
  index_velocity: number; // 0-100
  content_freshness: number; // 0-100
}

export interface Report {
  id?: string;
  publication_id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'monthly';
  insights: Insight[];
  recommendations: Recommendation[];
  health_scores: SeoHealthScore;
  summary: string;
  created_at?: string;
}
