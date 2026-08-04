// ============================================================================
// SPRINT 01: FOUNDATION CORE TYPES
// ============================================================================

export type UrlStatus = 'pending' | 'queued' | 'processing' | 'indexed' | 'failed' | 'retry';
export type UrlType = 'article' | 'page' | 'category' | 'tag';
export type ValidationStatus = 'pending' | 'passed' | 'failed';
export type UrlPriority = number; // 0-100

export interface Site {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive';
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndexUrl {
  id: string;
  siteId: string;
  url: string;
  type: UrlType;
  priority: UrlPriority;
  status: UrlStatus;
  validationStatus: ValidationStatus;
  validationError?: string;
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Webhook {
  id: string;
  siteId: string;
  secret: string;
  active: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Log {
  id: string;
  userId: string;
  siteId: string;
  urlId?: string;
  action: string;
  provider?: string;
  status: 'success' | 'failed' | 'pending';
  response?: string;
  duration?: number;
  error?: string;
  metadata?: string;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  token: string;
  name: string;
  active: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueJob {
  id: string;
  urlId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface IndexRequest {
  site: string;
  url: string;
  type?: UrlType;
}

export interface IndexResponse {
  success: boolean;
  urlId: string;
  status: UrlStatus;
  priority: number;
  queuePosition: number;
  message: string;
}

export interface StatusResponse {
  site: string;
  totalUrls: number;
  pending: number;
  queued: number;
  processing: number;
  indexed: number;
  failed: number;
  averageProcessingTime: number;
  lastSync: Date;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SitesResponse {
  sites: Site[];
  total: number;
}

// ============================================================================
// VALIDATION ENGINE TYPES
// ============================================================================

export interface ValidationRule {
  name: string;
  check: (url: string) => Promise<{ passed: boolean; error?: string }>;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    validUrl: boolean;
    httpsEnabled: boolean;
    statusCode200: boolean;
    canonicalPresent: boolean;
    robotsTxtOkay: boolean;
    noindexAbsent: boolean;
    sitemapPresent: boolean;
  };
}

// ============================================================================
// PRIORITY ENGINE TYPES
// ============================================================================

export interface PriorityScoreRequest {
  type: UrlType;
  isNew: boolean;
  isUpdated: boolean;
  isLanding: boolean;
}

export interface PriorityScore {
  score: number;
  breakdown: {
    typeScore: number;
    ageScore: number;
    updateScore: number;
  };
}

// ============================================================================
// QUEUE ENGINE TYPES
// ============================================================================

export interface QueueConfig {
  maxConcurrent: number;
  retryStrategy: RetryStrategy;
  timeouts: {
    processing: number;
    validation: number;
  };
}

export interface RetryStrategy {
  delays: number[]; // milliseconds: [5min, 30min, 2h, 12h, 24h]
  maxAttempts: number;
  backoffMultiplier: number;
}

// ============================================================================
// SPRINT 02: SEARCH ENGINE INTEGRATION TYPES
// ============================================================================

export type ProviderType = 'google' | 'indexnow' | 'bing' | 'yandex';
export type DispatchStatus = 'pending' | 'sent' | 'success' | 'failed';
export type SyncJobType = 'property_sync' | 'status_sync' | 'error_sync';

export interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  type: 'search_engine' | 'indexing_service';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderCredential {
  id: string;
  providerId: string;
  userId: string;
  encryptedData: string; // Decrypt to get actual credentials
  status: 'active' | 'inactive' | 'expired';
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleAccount {
  id: string;
  userId: string;
  email: string;
  projectId?: string;
  clientId?: string;
  credentialType: 'oauth' | 'service_account';
  status: 'active' | 'expired' | 'revoked';
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GSCProperty {
  id: string;
  googleAccountId: string;
  siteUrl: string;
  propertyType: 'domain' | 'url_prefix';
  status: 'verified' | 'unverified';
  isPrimary: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GSCData {
  id: string;
  gscPropertyId: string;
  coverage?: GSCCoverage;
  enhancements?: GSCEnhancements;
  lastUpdatedAt?: Date;
}

export interface GSCCoverage {
  indexed: number;
  notIndexed: number;
  excluded: number;
  pending: number;
}

export interface GSCEnhancements {
  ampErrors: number;
  mobileUsability: number;
  richResults: number;
}

export interface UrlDispatch {
  id: string;
  urlId: string;
  siteId: string;
  providerId: string;
  status: DispatchStatus;
  response?: string;
  attempts: number;
  error?: string;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  successAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncJob {
  id: string;
  siteId: string;
  provider: string;
  type: SyncJobType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
  createdAt: Date;
}

export interface IndexNowCredential {
  id: string;
  siteId: string;
  key: string;
  status: 'active' | 'inactive';
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONNECTOR INTERFACE (All providers implement this)
// ============================================================================

export interface IIndexPilotConnector {
  name: ProviderType;

  // Authenticate and authorize
  authenticate(credentials: Record<string, any>): Promise<boolean>;
  validateCredentials(credentials: Record<string, any>): Promise<boolean>;
  refreshCredentials(): Promise<boolean>;

  // Send URLs
  sendUrl(url: string, metadata?: Record<string, any>): Promise<ConnectorResponse>;
  sendUrls(urls: string[]): Promise<ConnectorResponse[]>;

  // Get status
  getUrlStatus(url: string): Promise<ConnectorStatus>;

  // Batch operations
  bulkSend(urls: string[]): Promise<BulkResponse>;
  bulkStatus(urls: string[]): Promise<BulkStatus>;

  // Cleanup
  disconnect(): Promise<void>;
}

export interface ConnectorResponse {
  success: boolean;
  status: 'accepted' | 'rejected' | 'pending' | 'error';
  message: string;
  rawResponse?: Record<string, any>;
  normalizedStatus: NormalizedStatus;
}

export type NormalizedStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'RATE_LIMITED' | 'INVALID_URL' | 'NOT_SUPPORTED';

export interface ConnectorStatus {
  url: string;
  indexed: boolean;
  discoveryDate?: Date;
  crawlDate?: Date;
  indexDate?: Date;
  issues?: string[];
}

export interface BulkResponse {
  successful: number;
  failed: number;
  results: ConnectorResponse[];
}

export interface BulkStatus {
  total: number;
  indexed: number;
  pending: number;
  failed: number;
  details: ConnectorStatus[];
}

// ============================================================================
// DISPATCH ENGINE TYPES
// ============================================================================

export interface DispatchConfig {
  providers: ProviderType[];
  strategy: 'all' | 'primary' | 'conditional';
  priorityOrder?: ProviderType[];
}

export interface DispatchDecision {
  url: string;
  targetProviders: ProviderType[];
  reasoning: string;
}

// ============================================================================
// RETRY ENGINE TYPES
// ============================================================================

export interface RetryConfig {
  delays: number[]; // milliseconds
  maxAttempts: number;
  exponentialBase: number;
  jitterFactor: number;
}

export interface RetryJob {
  urlId: string;
  providerId: string;
  attempt: number;
  nextRetryAt: Date;
  reason: string;
}

// ============================================================================
// RESPONSE NORMALIZER TYPES
// ============================================================================

export interface NormalizerConfig {
  [provider: string]: ProviderResponseMap;
}

export interface ProviderResponseMap {
  successStatuses: string[];
  failureStatuses: string[];
  pendingStatuses: string[];
  statusPath: string; // e.g., "status" or "response.status"
}

export interface NormalizedResponse {
  originalResponse: Record<string, any>;
  normalizedStatus: NormalizedStatus;
  message: string;
  timestamp: Date;
}

// ============================================================================
// SYNC ENGINE TYPES
// ============================================================================

export interface SyncConfig {
  interval: number; // milliseconds
  batchSize: number;
  providers: ProviderType[];
}

export interface SyncState {
  provider: ProviderType;
  lastSync: Date;
  nextSync: Date;
  status: 'idle' | 'syncing' | 'failed';
  lastError?: string;
}

// ============================================================================
// SCHEDULER TYPES
// ============================================================================

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  handler: () => Promise<void>;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardMetrics {
  sites: number;
  totalUrls: number;
  pendingUrls: number;
  queuedUrls: number;
  processingUrls: number;
  indexedUrls: number;
  failedUrls: number;
  successRate: number;
  averageProcessingTime: number;
  lastSync: Date;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  urlsToday: number;
  queueSize: number;
  successCount: number;
  errorCount: number;
  averageTime: number;
}

export interface IntegrationStatus {
  provider: ProviderType;
  connected: boolean;
  lastSync?: Date;
  nextSync?: Date;
  status: 'active' | 'inactive' | 'error';
  urlsProcessed: number;
  successRate: number;
  errors?: string[];
}
