import { BaseConnector } from './baseConnector';
import { ConnectorResponse, ConnectorStatus } from '@/types/indexPilot';
import crypto from 'crypto';

/**
 * IndexNow Connector
 * Supports IndexNow protocol for Bing, Yandex, and other compatible search engines
 * Simple, protocol-based URL notification without complex authentication
 */
export class IndexNowConnector extends BaseConnector {
  name = 'indexnow' as const;

  private apiKey: string = '';
  private siteUrl: string = '';
  private keyPublished: boolean = false;

  // Public IndexNow endpoints
  private endpoints = {
    bing: 'https://www.bing.com/indexnow',
    yandex: 'https://yandex.com/indexnow',
    google: 'https://google.com/indexnow', // If Google ever implements IndexNow
  };

  /**
   * Initialize IndexNow with API key
   * If key doesn't exist, generate one
   */
  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { siteUrl, apiKey } = credentials;

      if (!siteUrl) {
        throw new Error('siteUrl is required');
      }

      this.siteUrl = siteUrl;

      // If API key provided, use it; otherwise generate new one
      if (apiKey) {
        this.apiKey = apiKey;
      } else {
        this.apiKey = this.generateApiKey();
      }

      this.authenticated = true;
      return true;
    } catch (err) {
      console.error('IndexNow authentication failed:', err);
      return false;
    }
  }

  /**
   * Validate credentials
   * Try to publish the key
   */
  async validateCredentials(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { siteUrl, apiKey } = credentials;
      if (!siteUrl || !apiKey) return false;

      // Try to verify by publishing the key
      return await this.publishKey(siteUrl, apiKey);
    } catch (err) {
      return false;
    }
  }

  /**
   * Generate a new IndexNow API key
   */
  private generateApiKey(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Publish API key to .well-known/IndexNow.txt
   * This must be done manually or via hosting provider
   */
  async publishKey(siteUrl: string, apiKey: string): Promise<boolean> {
    try {
      // In production, this would verify that the key exists at:
      // {siteUrl}/.well-known/IndexNow.txt
      // For now, assume published if we can reach the site

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${siteUrl}/.well-known/IndexNow.txt`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const content = await response.text();
        // Key should be published there
        this.keyPublished = content.includes(apiKey);
        return this.keyPublished;
      }

      // If not found, assume it needs to be published
      return false;
    } catch (err) {
      console.error('Error publishing key:', err);
      return false;
    }
  }

  /**
   * Refresh credentials (IndexNow doesn't have token expiration)
   */
  async refreshCredentials(): Promise<boolean> {
    return true;
  }

  /**
   * Send single URL to IndexNow
   */
  async sendUrl(url: string): Promise<ConnectorResponse> {
    if (!this.isValidUrl(url)) {
      return {
        success: false,
        status: 'rejected',
        message: 'Invalid URL format',
        normalizedStatus: 'INVALID_URL',
      };
    }

    try {
      // Send to all major IndexNow endpoints
      const results = await Promise.all([
        this.sendToEndpoint(this.endpoints.bing, url),
        this.sendToEndpoint(this.endpoints.yandex, url),
      ]);

      const allSuccess = results.every((r) => r.success);

      return {
        success: allSuccess,
        status: allSuccess ? 'accepted' : 'pending',
        message: `Sent to ${results.filter((r) => r.success).length}/${results.length} endpoints`,
        normalizedStatus: allSuccess ? 'SUCCESS' : 'PENDING',
        rawResponse: { results },
      };
    } catch (err) {
      return {
        success: false,
        status: 'error',
        message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        normalizedStatus: 'FAILED',
      };
    }
  }

  /**
   * Send bulk URLs (optimized for IndexNow)
   */
  async bulkSend(urls: string[]): Promise<any> {
    try {
      const results = await Promise.all([
        this.sendBulkToEndpoint(this.endpoints.bing, urls),
        this.sendBulkToEndpoint(this.endpoints.yandex, urls),
      ]);

      const successful = results.reduce((sum, r) => sum + (r.success ? 1 : 0), 0);

      return {
        successful: successful > 0 ? urls.length : 0,
        failed: successful > 0 ? 0 : urls.length,
        message: `Bulk sent to ${successful}/${results.length} endpoints`,
      };
    } catch (err) {
      return {
        successful: 0,
        failed: urls.length,
        message: `Error: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Send to a specific IndexNow endpoint
   */
  private async sendToEndpoint(endpoint: string, url: string): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: new URL(this.siteUrl).hostname,
          key: this.apiKey,
          urlList: [url],
        }),
      });

      return {
        success: response.status === 200,
        endpoint,
        status: response.status,
      };
    } catch (err) {
      return {
        success: false,
        endpoint,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Send bulk URLs to endpoint (batch request)
   */
  private async sendBulkToEndpoint(endpoint: string, urls: string[]): Promise<any> {
    try {
      // IndexNow supports up to 10,000 URLs per request
      const chunks = [];
      for (let i = 0; i < urls.length; i += 10000) {
        chunks.push(urls.slice(i, i + 10000));
      }

      const results = await Promise.all(
        chunks.map((chunk) =>
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: new URL(this.siteUrl).hostname,
              key: this.apiKey,
              urlList: chunk,
            }),
          })
        )
      );

      return {
        success: results.every((r) => r.status === 200),
        endpoint,
        totalUrls: urls.length,
      };
    } catch (err) {
      return {
        success: false,
        endpoint,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  /**
   * Get URL status (IndexNow doesn't provide direct status queries)
   */
  async getUrlStatus(url: string): Promise<ConnectorStatus> {
    return {
      url,
      indexed: false,
      issues: ['IndexNow does not provide status queries'],
    };
  }

  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Check if key is published
   */
  isKeyPublished(): boolean {
    return this.keyPublished;
  }

  /**
   * Get key location for manual publishing
   */
  getKeyLocation(): string {
    return `${this.siteUrl}/.well-known/IndexNow.txt`;
  }
}

export const indexNowConnector = new IndexNowConnector();
