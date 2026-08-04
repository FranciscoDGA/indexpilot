// SEO Inspector Types (Sprint 05)

export type CheckType =
  | 'https'
  | 'http_status'
  | 'redirect_chain'
  | 'response_time'
  | 'robots_txt'
  | 'meta_robots'
  | 'canonical'
  | 'sitemap'
  | 'og_tags'
  | 'twitter_card'
  | 'schema_org'
  | 'featured_image'
  | 'mobile_viewport'
  | 'mobile_usability'
  | 'internal_links'
  | 'external_links';

export type CheckStatus = 'PASS' | 'WARNING' | 'ERROR' | 'INFO';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D';
export type AuditStatus = 'pending' | 'scanning' | 'completed' | 'error';

export interface SeoCheck {
  id: string;
  audit_id: string;
  check_name: CheckType;
  status: CheckStatus;
  severity: Severity;
  message: string;
  recommendation?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SeoAudit {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  url: string;
  title?: string;
  description?: string;
  score: number;
  grade: Grade;
  status: AuditStatus;
  error_message?: string;
  seo_checks?: SeoCheck[];
  checks?: SeoCheck[];
  scanned_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SeoAuditHistory {
  id: string;
  publication_id: string;
  site_id: string;
  user_id: string;
  score_at_date: string;
  score: number;
  grade: Grade;
  created_at: string;
}

export interface ScanResult {
  checks: SeoCheck[];
  score: number;
  grade: Grade;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface UrlMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  ogDescription?: string;
  twitterCard?: string;
  twitterImage?: string;
  canonical?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  viewport?: string;
  schema?: Record<string, any>[];
}

export interface HttpMetadata {
  statusCode: number;
  redirectChain: Array<{ url: string; status: number }>;
  responseTime: number;
  https: boolean;
}

export interface ImageMetadata {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
  format?: string;
}

export interface LinkMetadata {
  url: string;
  text?: string;
  nofollow: boolean;
  internal: boolean;
  broken?: boolean;
}

export interface SchemaType {
  type: string;
  properties?: Record<string, any>;
}

export interface ScanOptions {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
}
