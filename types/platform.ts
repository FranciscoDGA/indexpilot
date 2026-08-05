// ============================================================================
// SPRINT 12: DEVELOPER PLATFORM TYPES
// ============================================================================

// --- API Client ---
export type ApiClientStatus = 'active' | 'suspended' | 'revoked';
export type RateLimitTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface ApiClient {
  id: string;
  workspace_id: string;
  name: string;
  client_id: string;
  client_secret_hash?: string;
  redirect_uri?: string;
  scopes: string[];
  status: ApiClientStatus;
  rate_limit_tier: RateLimitTier;
  created_at: string;
  updated_at: string;
}

// --- API Tokens ---
export interface ApiToken {
  id: string;
  client_id: string;
  token_hash: string;
  token_prefix: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
}

// --- API Requests ---
export interface ApiRequest {
  id: string;
  client_id?: string;
  endpoint: string;
  method: string;
  status_code?: number;
  latency_ms?: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// --- Webhook Subscriptions ---
export type WebhookStatus = 'active' | 'paused' | 'failed';
export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface WebhookSubscription {
  id: string;
  workspace_id: string;
  url: string;
  secret: string;
  events: string[];
  status: WebhookStatus;
  failure_count: number;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  subscription_id: string;
  event: string;
  payload: Record<string, any>;
  status: WebhookDeliveryStatus;
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string;
  delivered_at?: string;
  response_status?: number;
  error_message?: string;
  created_at: string;
}

// --- Platform Events ---
export interface PlatformEvent {
  id: string;
  workspace_id?: string;
  event_type: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
  published_at: string;
  processed: boolean;
}

// --- Developer Apps (OAuth) ---
export type DeveloperAppStatus = 'active' | 'suspended' | 'revoked';

export interface DeveloperApp {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  app_id: string;
  app_secret_hash?: string;
  redirect_uris: string[];
  scopes: string[];
  status: DeveloperAppStatus;
  created_at: string;
  updated_at: string;
}

// --- OAuth ---
export interface OAuthCode {
  id: string;
  app_id: string;
  user_id: string;
  code: string;
  redirect_uri: string;
  scopes: string[];
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface OAuthToken {
  id: string;
  app_id: string;
  user_id?: string;
  access_token_hash: string;
  refresh_token_hash?: string;
  token_type: string;
  scopes: string[];
  expires_at: string;
  revoked_at?: string;
  created_at: string;
}

// --- Rate Limiting ---
export interface RateLimitConfig {
  tier: RateLimitTier;
  requests_per_minute: number;
  requests_per_day: number;
  burst_size: number;
}

export const RATE_LIMITS: Record<RateLimitTier, RateLimitConfig> = {
  free: { tier: 'free', requests_per_minute: 60, requests_per_day: 10000, burst_size: 10 },
  starter: { tier: 'starter', requests_per_minute: 300, requests_per_day: 50000, burst_size: 50 },
  pro: { tier: 'pro', requests_per_minute: 2000, requests_per_day: 500000, burst_size: 200 },
  enterprise: { tier: 'enterprise', requests_per_minute: 10000, requests_per_day: 5000000, burst_size: 500 },
};

// --- Event Types ---
export type PlatformEventType =
  | 'url.created'
  | 'url.updated'
  | 'url.deleted'
  | 'crawl.started'
  | 'crawl.finished'
  | 'audit.started'
  | 'audit.finished'
  | 'site.connected'
  | 'site.disconnected'
  | 'index.requested'
  | 'index.completed'
  | 'index.failed'
  | 'issue.detected'
  | 'recommendation.created'
  | 'score.changed'
  | 'alert.critical'
  | 'connector.connected'
  | 'connector.synced';

// --- API Gateway ---
export interface GatewayConfig {
  version: string;
  basePath: string;
  rateLimitEnabled: boolean;
  loggingEnabled: boolean;
  cacheEnabled: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// --- SDK ---
export interface SdkConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

// --- CLI ---
export interface CliConfig {
  apiUrl: string;
  token?: string;
  currentWorkspace?: string;
}
