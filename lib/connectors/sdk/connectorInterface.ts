import {
  IConnector,
  ConnectorConfig,
  ContentItem,
  ListContentParams,
  SyncResult,
  SyncParams,
  ConnectorEvent,
} from '@/types/connectors';

/**
 * Abstract base class for all CMS/Framework connectors.
 * Implements the IConnector interface with default behaviors.
 *
 * All provider-specific connectors should extend this class
 * and implement the abstract methods.
 */
export abstract class BaseCMSConnector implements IConnector {
  abstract readonly provider: string;
  abstract readonly name: string;

  protected config: ConnectorConfig = {};
  protected authenticated = false;

  /**
   * Authenticate with the CMS/API using provided config.
   * Returns true if authentication succeeds.
   */
  abstract authenticate(config: ConnectorConfig): Promise<boolean>;

  /**
   * List content items from the CMS.
   * Supports pagination and filtering by date.
   */
  abstract listContent(params?: ListContentParams): Promise<ContentItem[]>;

  /**
   * Handle an incoming webhook payload from the CMS.
   * Returns a normalized ConnectorEvent or null if the event should be ignored.
   */
  abstract handleWebhook(payload: Record<string, any>): Promise<ConnectorEvent | null>;

  /**
   * Perform a full or incremental sync.
   * Default implementation lists all content and returns a basic result.
   */
  async sync(params?: SyncParams): Promise<SyncResult> {
    try {
      const content = await this.listContent({
        since: params?.since,
        limit: params?.limit,
      });

      return {
        success: true,
        items_processed: content.length,
        items_created: 0,
        items_updated: 0,
        items_removed: 0,
        items_failed: 0,
      };
    } catch (error) {
      return {
        success: false,
        items_processed: 0,
        items_created: 0,
        items_updated: 0,
        items_removed: 0,
        items_failed: 0,
        errors: [String(error)],
      };
    }
  }

  /**
   * Disconnect and clean up resources.
   */
  async disconnect(): Promise<void> {
    this.authenticated = false;
    this.config = {};
  }

  /**
   * Check if the connector is authenticated.
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): ConnectorConfig {
    return { ...this.config };
  }

  /**
   * Validate a URL format.
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize a title into a URL-safe slug.
   */
  protected normalizeSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Generate a content hash for change detection.
   */
  protected generateHash(data: Record<string, any>): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Extract the domain from a URL.
   */
  protected extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  /**
   * Normalize a content item from provider-specific format.
   * Override this in subclasses for provider-specific mapping.
   */
  protected normalizeContentItem(raw: any): ContentItem {
    return {
      id: raw.id || raw._id || '',
      title: raw.title || raw.name || '',
      slug: raw.slug || this.normalizeSlug(raw.title || raw.name || ''),
      url: raw.url || raw.permalink || '',
      type: raw.type || raw.collection || 'page',
      status: raw.status || 'published',
      published_at: raw.published_at || raw.created_at || raw.date,
      updated_at: raw.updated_at || raw.modified_at,
      metadata: raw.metadata || raw.custom_fields || {},
    };
  }
}
