// URL Discovery Types
export interface DiscoveredURL {
  url: string;
  source: 'sitemap' | 'crawl' | 'gsc' | 'manual';
  title?: string;
  description?: string;
  lastModified?: string;
  httpStatus?: number;
  isRedirect?: boolean;
  redirectTo?: string;
}

export interface SitemapLocation {
  url: string;
  found: boolean;
  accessible: boolean;
  urlCount?: number;
}

export interface CrawlResult {
  urlsDiscovered: number;
  urlsProcessed: number;
  newUrls: number;
  orphanedUrls: string[];
  redirects: Array<{ from: string; to: string }>;
}

export interface GoogleIndexStatus {
  url: string;
  isIndexed: boolean;
  isDiscoveredNotIndexed: boolean;
  isBlockedByRobots: boolean;
  isBlockedByUserAgent: boolean;
  isNotFound: boolean;
  lastCrawled?: string;
  verdict?: 'PASS' | 'PARTIAL' | 'NEUTRAL' | 'FAIL';
}

export interface URLMetadata {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  canonical?: string;
  robotsIndex?: boolean;
  wordCount?: number;
  externalLinksCount?: number;
  internalLinksCount?: number;
  schemaTypes?: string[];
  twitterTitle?: string;
  twitterImage?: string;
  viewport?: string;
  mobileFriendly?: boolean;
  headingsCount?: number;
  robotsFollow?: boolean;
}

export interface SyncLog {
  id?: string;
  site_id: string;
  user_id: string;
  sync_type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  urls_found: number;
  urls_new: number;
  urls_removed: number;
  urls_updated: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface DiscoverySummary {
  total_urls: number;
  indexed_urls: number;
  not_indexed_urls: number;
  discovered_not_indexed: number;
  orphaned_urls: number;
  errors: number;
  seo_average: number;
  last_sync: string;
  next_sync: string;
}

export interface URLRecord {
  id?: string;
  site_id: string;
  publication_id?: string;
  user_id: string;
  url: string;
  slug?: string;
  title?: string;
  description?: string;
  last_modified?: string;
  source: 'sitemap' | 'crawl' | 'gsc' | 'manual';
  discovered_at: string;
  http_status?: number;
  is_redirect: boolean;
  redirect_to?: string;
  is_indexable: boolean;
  is_indexed: boolean;
  is_orphaned: boolean;
  last_checked?: string;
  sync_status: 'pending' | 'synced' | 'error';
  created_at?: string;
  updated_at?: string;
}
