// User Types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

// Site Types
export type SiteStatus = 'active' | 'inactive';

export interface Site {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  description: string | null;
  status: SiteStatus;
  created_at: string;
  updated_at: string;
}

// API Key Types
export type ApiKeyType = 'live' | 'test';

export interface ApiKey {
  id: string;
  site_id: string;
  name: string;
  key_hash: string;
  key_type: ApiKeyType;
  last_used_at: string | null;
  last_used_ip: string | null;
  active: boolean;
  publications_count: number;
  created_at: string;
  updated_at: string;
}

// Publication Queue Types
export type PublicationStatus = 'RECEIVED' | 'PROCESSING' | 'INDEXED' | 'ERROR';
export type PublicationType = 'article' | 'page' | 'product' | 'other';
export type NextStep = 'GOOGLE_INDEX' | 'GOOGLE_DISCOVERY' | 'BING_INDEX' | 'INDEXNOW';

export interface PublicationQueue {
  id: string;
  site_id: string;
  url: string;
  title: string;
  slug: string;
  type: PublicationType;
  status: PublicationStatus;
  next_step: NextStep | null;
  priority: number;
  error_message: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
}

// Publication Log Types
export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface PublicationLog {
  id: string;
  publication_id: string;
  message: string;
  level: LogLevel;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Publication Event Types
export interface PublicationEvent {
  id: string;
  publication_id: string;
  event: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export interface PublishResponse {
  success: boolean;
  publicationId?: string;
  error?: string;
  code?: string;
  message?: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalSites: number;
  totalUrls: number;
  totalIndexed: number;
  totalErrors: number;
  urlsToday: number;
  urlsPending: number;
  lastPublication: PublicationQueue | null;
}

export interface SiteDashboardMetrics {
  totalPublications: number;
  publicationsToday: number;
  pendingPublications: number;
  processedPublications: number;
  successRate: number;
  lastPublicationAt: string | null;
}

// Re-export Sprint 11 Connector Types
export * from './connectors';
