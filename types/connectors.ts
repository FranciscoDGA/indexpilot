// ============================================================================
// SPRINT 11: CMS CONNECTORS & AUTO SYNC PLATFORM TYPES
// ============================================================================

// --- Connector Core ---
export type ConnectorType = 'cms' | 'headless_cms' | 'framework' | 'ssg' | 'ecommerce' | 'custom';

export type ConnectorProvider =
  | 'wordpress' | 'ghost' | 'drupal' | 'joomla'
  | 'strapi' | 'contentful' | 'sanity' | 'directus' | 'hygraph'
  | 'nextjs' | 'nuxt' | 'astro' | 'remix' | 'sveltekit'
  | 'hugo' | 'jekyll' | 'eleventy' | 'docusaurus'
  | 'shopify' | 'woocommerce'
  | 'custom';

export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'syncing';

// --- Events ---
export type EventType = 'publish' | 'update' | 'delete' | 'draft' | 'scheduled' | 'restore' | 'deploy' | 'push';
export type EventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';

// --- Sync ---
export type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SyncTriggerType = 'manual' | 'webhook' | 'polling' | 'scheduled' | 'deploy' | 'git';

// --- Data Models ---
export interface Connector {
  id: string;
  site_id: string;
  user_id: string;
  type: ConnectorType;
  provider: ConnectorProvider;
  name: string;
  status: ConnectorStatus;
  config: Record<string, any>;
  credentials_encrypted?: string;
  version: string;
  last_sync_at?: string;
  last_error?: string;
  sync_count: number;
  event_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConnectorEvent {
  id: string;
  connector_id: string;
  event_type: EventType;
  payload: Record<string, any>;
  status: EventStatus;
  source_url?: string;
  content_hash?: string;
  impact_level?: ImpactLevel;
  received_at: string;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
}

export interface SyncJob {
  id: string;
  connector_id: string;
  site_id: string;
  user_id: string;
  status: SyncJobStatus;
  trigger_type: SyncTriggerType;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_removed: number;
  items_failed: number;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ContentVersion {
  id: string;
  url_id: string;
  connector_id?: string;
  site_id: string;
  user_id: string;
  version: number;
  content_hash: string;
  title?: string;
  content_snapshot: Record<string, any>;
  published_at: string;
  created_at: string;
}

// --- SDK Interface ---
export interface IConnector {
  authenticate(config: ConnectorConfig): Promise<boolean>;
  listContent(params?: ListContentParams): Promise<ContentItem[]>;
  handleWebhook(payload: Record<string, any>): Promise<ConnectorEvent | null>;
  sync(params?: SyncParams): Promise<SyncResult>;
  disconnect(): Promise<void>;
}

export interface ConnectorConfig {
  api_url?: string;
  api_key?: string;
  access_token?: string;
  webhook_secret?: string;
  [key: string]: any;
}

export interface ListContentParams {
  page?: number;
  limit?: number;
  since?: string;
  status?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  url: string;
  type: string;
  status: string;
  published_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface SyncParams {
  full?: boolean;
  since?: string;
  limit?: number;
}

export interface SyncResult {
  success: boolean;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_removed: number;
  items_failed: number;
  errors?: string[];
}

// --- Diff Engine ---
export interface DiffResult {
  url: string;
  has_changes: boolean;
  changed_fields: string[];
  impact: ImpactLevel;
  old_hash: string;
  new_hash: string;
  changes: Record<string, { old: any; new: any }>;
}

// --- Provider Registry ---
export interface ProviderInfo {
  provider: ConnectorProvider;
  name: string;
  type: ConnectorType;
  description: string;
  icon: string;
  auth_type: 'api_key' | 'oauth' | 'webhook' | 'token';
  supports_webhook: boolean;
  supports_polling: boolean;
  config_fields: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}
