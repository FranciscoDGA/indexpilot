import {
  IIndexPilotConnector,
  ConnectorResponse,
  ConnectorStatus,
  BulkResponse,
  BulkStatus,
  NormalizedStatus,
  ProviderType,
} from '@/types/indexPilot';

/**
 * Base Connector
 * All provider-specific connectors extend this class
 * Ensures consistent interface across all providers
 */
export abstract class BaseConnector implements IIndexPilotConnector {
  abstract name: ProviderType;

  protected credentials: Record<string, any> = {};
  protected authenticated: boolean = false;

  /**
   * Authenticate and authorize with provider
   */
  abstract authenticate(credentials: Record<string, any>): Promise<boolean>;

  /**
   * Validate if credentials are correct
   */
  abstract validateCredentials(credentials: Record<string, any>): Promise<boolean>;

  /**
   * Refresh credentials (tokens, etc)
   */
  abstract refreshCredentials(): Promise<boolean>;

  /**
   * Send a single URL to provider
   */
  abstract sendUrl(url: string, metadata?: Record<string, any>): Promise<ConnectorResponse>;

  /**
   * Send multiple URLs
   */
  async sendUrls(urls: string[]): Promise<ConnectorResponse[]> {
    return Promise.all(urls.map((url) => this.sendUrl(url)));
  }

  /**
   * Get URL status from provider
   */
  abstract getUrlStatus(url: string): Promise<ConnectorStatus>;

  /**
   * Bulk send (optimized for provider if available)
   */
  async bulkSend(urls: string[]): Promise<BulkResponse> {
    const results = await this.sendUrls(urls);
    return {
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Bulk status check
   */
  async bulkStatus(urls: string[]): Promise<BulkStatus> {
    const details = await Promise.all(urls.map((url) => this.getUrlStatus(url)));
    return {
      total: urls.length,
      indexed: details.filter((d) => d.indexed).length,
      pending: details.filter((d) => !d.indexed && d.discoveryDate).length,
      failed: details.filter((d) => d.issues && d.issues.length > 0).length,
      details,
    };
  }

  /**
   * Disconnect from provider
   */
  async disconnect(): Promise<void> {
    this.authenticated = false;
    this.credentials = {};
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Normalize provider-specific response to standard format
   */
  protected normalizeStatus(
    providerStatus: string | Record<string, any>
  ): ConnectorResponse {
    // This should be overridden by specific connectors
    return {
      success: false,
      status: 'error',
      message: 'Not implemented',
      normalizedStatus: 'FAILED' as NormalizedStatus,
    };
  }

  /**
   * Validate URL format
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
   * Handle rate limiting
   */
  protected async handleRateLimit(retryAfter?: number): Promise<void> {
    const delay = retryAfter || 60000; // Default 1 minute
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
