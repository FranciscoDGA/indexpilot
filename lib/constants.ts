/**
 * IndexPilot Constants
 */

// Priority scores for content types
export const PRIORITY_SCORES = {
  article: 100,
  page: 60,
  category: 40,
  tag: 30,
} as const;

// Priority modifiers
export const PRIORITY_MODIFIERS = {
  newContent: 50,
  updatedContent: 30,
  landingPage: 40,
} as const;

// Retry delays (in milliseconds)
export const RETRY_DELAYS = [
  5 * 60 * 1000, // 5 minutes
  30 * 60 * 1000, // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
  12 * 60 * 60 * 1000, // 12 hours
  24 * 60 * 60 * 1000, // 24 hours
] as const;

// Maximum retry attempts
export const MAX_RETRY_ATTEMPTS = 5;

// URL validation timeout (in milliseconds)
export const VALIDATION_TIMEOUT = 30000;

// Queue processing concurrency
export const QUEUE_MAX_CONCURRENT = 5;

// Rate limiting
export const RATE_LIMIT = {
  authenticated: 100, // per minute
  unauthenticated: 10, // per minute
} as const;

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 50,
  maxLimit: 100,
  defaultOffset: 0,
} as const;

// Supported content types for Google Indexing API
export const GOOGLE_SUPPORTED_TYPES = [
  'BroadcastEvent',
  'JobPosting',
  'Event',
] as const;

// Status messages
export const STATUS_MESSAGES = {
  pending: 'Waiting to be processed',
  queued: 'In queue for processing',
  processing: 'Currently being indexed',
  indexed: 'Successfully indexed',
  failed: 'Failed to index',
  retry: 'Scheduled for retry',
} as const;

// Log actions
export const LOG_ACTIONS = {
  INDEX_RECEIVED: 'index_received',
  VALIDATION_STARTED: 'validation_started',
  VALIDATION_PASSED: 'validation_passed',
  VALIDATION_FAILED: 'validation_failed',
  QUEUED: 'queued',
  PROCESSING_STARTED: 'processing_started',
  INDEXED_SUCCESS: 'indexed_success',
  INDEXED_FAILURE: 'indexed_failure',
  RETRY_SCHEDULED: 'retry_scheduled',
  PROVIDER_SYNC: 'provider_sync',
  AUTHENTICATION: 'authentication',
} as const;

// Dispatch strategies
export const DISPATCH_STRATEGIES = {
  ALL: 'all', // Send to all enabled providers
  PRIMARY: 'primary', // Send to primary provider only
  CONDITIONAL: 'conditional', // Smart routing based on content type
} as const;

// Provider types
export const PROVIDER_TYPES = {
  GOOGLE: 'google',
  INDEXNOW: 'indexnow',
  BING: 'bing',
  YANDEX: 'yandex',
} as const;

// Scheduler task types
export const SCHEDULER_TASKS = {
  PROCESS_QUEUE: 'process_queue',
  RETRY_FAILED_JOBS: 'retry_failed_jobs',
  SYNC_PROVIDER_PROPERTIES: 'sync_provider_properties',
  CLEANUP: 'cleanup',
  REFRESH_TOKENS: 'refresh_tokens',
} as const;

// Scheduler patterns
export const SCHEDULER_PATTERNS = {
  EVERY_MINUTE: 'every_minute',
  EVERY_HOUR: 'every_hour',
  EVERY_6_HOURS: 'every_6_hours',
  EVERY_DAY: 'every_day',
} as const;

// Default scheduler configuration
export const DEFAULT_SCHEDULER_CONFIG = {
  [SCHEDULER_TASKS.PROCESS_QUEUE]: SCHEDULER_PATTERNS.EVERY_MINUTE,
  [SCHEDULER_TASKS.RETRY_FAILED_JOBS]: SCHEDULER_PATTERNS.EVERY_HOUR,
  [SCHEDULER_TASKS.SYNC_PROVIDER_PROPERTIES]: SCHEDULER_PATTERNS.EVERY_6_HOURS,
  [SCHEDULER_TASKS.CLEANUP]: SCHEDULER_PATTERNS.EVERY_DAY,
  [SCHEDULER_TASKS.REFRESH_TOKENS]: SCHEDULER_PATTERNS.EVERY_6_HOURS,
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

// Validation check names
export const VALIDATION_CHECKS = {
  VALID_URL: 'validUrl',
  HTTPS_ENABLED: 'httpsEnabled',
  STATUS_CODE_200: 'statusCode200',
  CANONICAL_PRESENT: 'canonicalPresent',
  ROBOTS_TXT_OKAY: 'robotsTxtOkay',
  NOINDEX_ABSENT: 'noindexAbsent',
  SITEMAP_PRESENT: 'sitemapPresent',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  INDEX: '/api/v1/index',
  STATUS: '/api/v1/status',
  LOGS: '/api/v1/logs',
  SITES: '/api/v1/sites',
  WEBHOOK: '/api/v1/webhook',
  INTEGRATIONS_GOOGLE: '/api/v1/integrations/google',
  INTEGRATIONS_INDEXNOW: '/api/v1/integrations/indexnow',
} as const;
