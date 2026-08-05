// ============================================================================
// SPRINT 13: REAL-TIME MONITORING TYPES
// ============================================================================

// --- Monitoring Events ---
export type EventSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type MonitoringEventType =
  | 'content.changed'
  | 'content.added'
  | 'content.removed'
  | 'technical.robots_changed'
  | 'technical.sitemap_changed'
  | 'technical.canonical_changed'
  | 'technical.schema_changed'
  | 'technical.title_changed'
  | 'technical.meta_changed'
  | 'technical.headings_changed'
  | 'technical.links_changed'
  | 'technical.status_changed'
  | 'availability.site_down'
  | 'availability.slow_response'
  | 'availability.ssl_error'
  | 'availability.error_burst'
  | 'availability.redirect_unexpected'
  | 'indexation.drift_detected'
  | 'indexation.coverage_drop'
  | 'indexation.new_untracked'
  | 'incident.opened'
  | 'incident.resolved'
  | 'alert.triggered'
  | 'audit.started'
  | 'audit.completed'
  | 'automation.executed';

export interface MonitoringEvent {
  id: string;
  site_id: string;
  event_type: MonitoringEventType;
  severity: EventSeverity;
  source: string;
  payload: Record<string, any>;
  detected_at: string;
  processed_at?: string;
  acknowledged_at?: string;
  created_at: string;
}

// --- Change History ---
export type ChangeType = 'added' | 'modified' | 'removed';

export interface ChangeRecord {
  id: string;
  site_id: string;
  url?: string;
  field: string;
  old_value?: string;
  new_value?: string;
  change_type: ChangeType;
  detected_at: string;
}

// --- Incidents ---
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  site_id: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source?: string;
  metadata: Record<string, any>;
  opened_at: string;
  resolved_at?: string;
  created_at: string;
}

// --- Monitoring Rules ---
export interface MonitoringRule {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  enabled: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Notification Preferences ---
export type NotificationChannel = 'email' | 'slack' | 'discord' | 'telegram' | 'webhook' | 'push';

export interface NotificationPreference {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  minimum_severity: EventSeverity;
  enabled: boolean;
  config: Record<string, any>;
  created_at: string;
}

// --- Monitoring Snapshots ---
export interface MonitoringSnapshot {
  id: string;
  site_id: string;
  url: string;
  status_code?: number;
  response_time_ms?: number;
  content_hash?: string;
  title?: string;
  meta_description?: string;
  canonical?: string;
  robots?: string;
  h1?: string;
  schema_type?: string;
  internal_links_count?: number;
  external_links_count?: number;
  images_count?: number;
  word_count?: number;
  snapshot: Record<string, any>;
  captured_at: string;
}

// --- Content Change Score ---
export interface ContentChangeScore {
  url: string;
  score: number;
  factors: {
    title_changed: boolean;
    content_changed: boolean;
    slug_changed: boolean;
    headings_changed: boolean;
    images_changed: boolean;
    schema_changed: boolean;
    links_changed: boolean;
  };
  recommendation: 'index' | 'audit' | 'ignore';
}

// --- Availability Check ---
export interface AvailabilityCheck {
  site_id: string;
  url: string;
  is_online: boolean;
  status_code?: number;
  response_time_ms?: number;
  ssl_valid?: boolean;
  ssl_expires_at?: string;
  error?: string;
  checked_at: string;
}

// --- Indexation Drift ---
export interface IndexationDrift {
  site_id: string;
  published_count: number;
  discovered_count: number;
  sitemap_count: number;
  crawled_count: number;
  indexed_count: number;
  drift_score: number;
  issues: string[];
  detected_at: string;
}

// --- Timeline Event ---
export interface TimelineEvent {
  id: string;
  site_id: string;
  category: 'content' | 'technical' | 'availability' | 'indexation' | 'alert' | 'audit' | 'automation' | 'deploy';
  title: string;
  description?: string;
  severity: EventSeverity;
  metadata: Record<string, any>;
  timestamp: string;
}

// --- Correlation Rule ---
export interface CorrelationPattern {
  id: string;
  name: string;
  steps: Array<{
    event_type: MonitoringEventType;
    within_minutes?: number;
  }>;
  conclusion: string;
  severity: EventSeverity;
}
