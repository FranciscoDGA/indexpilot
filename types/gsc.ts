// Google Search Console Integration Types (Sprint 07)

export type MilestoneType =
  | 'first_impression'
  | 'first_click'
  | 'entered_top_10'
  | 'exited_top_10'
  | 'entered_top_3'
  | 'reached_position_1'
  | 'ctr_increased'
  | 'ctr_decreased'
  | 'impressions_spike'
  | 'impressions_drop';

export type ImportStatus = 'pending' | 'in_progress' | 'completed' | 'error';
export type ImportType = 'search_performance' | 'keyword_performance' | 'full_sync';

export interface SearchPerformance {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_position: number;
  created_at: string;
  updated_at: string;
}

export interface KeywordPerformance {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  keyword: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  created_at: string;
}

export interface PerformanceMilestone {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  milestone_type: MilestoneType;
  milestone_date: string;
  keyword?: string;
  previous_value?: number;
  new_value?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GscImport {
  id: string;
  site_id: string;
  user_id: string;
  import_type: ImportType;
  status: ImportStatus;
  start_date?: string;
  end_date?: string;
  records_imported: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface PerformanceStats {
  total_impressions: number;
  total_clicks: number;
  avg_ctr: number;
  avg_position: number;
  trending_up_count: number;
  trending_down_count: number;
}

export interface GscQueryResponse {
  rows: Array<{
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    keys: string[];
  }>;
}

export interface GscCredentials {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}
