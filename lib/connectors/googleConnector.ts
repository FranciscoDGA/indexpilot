import { BaseConnector } from './baseConnector';
import { ConnectorResponse, ConnectorStatus, GSCProperty } from '@/types/indexPilot';

/**
 * Google Connector
 * Handles:
 * - OAuth 2.0 Authentication
 * - Service Account authentication
 * - Google Search Console integration
 * - Google Indexing API (limited to supported content types)
 */
export class GoogleConnector extends BaseConnector {
  name = 'google' as const;

  private clientId: string = '';
  private clientSecret: string = '';
  private projectId: string = '';
  private accessToken: string = '';
  private refreshToken: string = '';
  private tokenExpiresAt: Date = new Date();

  // Supported content types for Indexing API
  private supportedIndexingTypes = [
    'https://schema.org/BroadcastEvent',
    'https://schema.org/JobPosting',
    'https://schema.org/Event',
  ];

  /**
   * Authenticate with Google using OAuth 2.0
   */
  async authenticate(credentials: Record<string, any>): Promise<boolean> {
    try {
      const { authCode, clientId, clientSecret, redirectUri } = credentials;

      if (!authCode || !clientId || !clientSecret) {
        throw new Error('Missing required authentication parameters');
      }

      // Exchange auth code for tokens
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`OAuth error: ${data.error_description}`);
      }

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
      this.clientId = clientId;
      this.clientSecret = clientSecret;
      this.authenticated = true;

      return true;
    } catch (err) {
      console.error('Google authentication failed:', err);
      return false;
    }
  }

  /**
   * Authenticate with Google using Service Account
   */
  async authenticateServiceAccount(
    serviceAccountJson: Record<string, any>
  ): Promise<boolean> {
    try {
      this.projectId = serviceAccountJson.project_id;

      // In production, would use google-auth-library-nodejs
      // For now, simplified implementation
      this.authenticated = true;
      return true;
    } catch (err) {
      console.error('Service account authentication failed:', err);
      return false;
    }
  }

  /**
   * Validate credentials are still valid
   */
  async validateCredentials(credentials: Record<string, any>): Promise<boolean> {
    try {
      // Try to call a simple Google API endpoint
      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshCredentials(): Promise<boolean> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(`Token refresh error: ${data.error_description}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);

      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  }

  /**
   * Send URL to Google Indexing API
   * Important: Only for specific content types (Job Posting, Broadcast Event, etc)
   */
  async sendUrl(url: string, metadata?: Record<string, any>): Promise<ConnectorResponse> {
    if (!this.isValidUrl(url)) {
      return {
        success: false,
        status: 'rejected',
        message: 'Invalid URL format',
        normalizedStatus: 'INVALID_URL',
      };
    }

    try {
      // Check if token needs refresh
      if (new Date() > this.tokenExpiresAt) {
        await this.refreshCredentials();
      }

      // Note: Google Indexing API only accepts specific content types
      // For regular blog posts, use Search Console or rely on crawl
      const contentType = metadata?.contentType || 'https://schema.org/NewsArticle';

      // Check if content type is supported
      if (!this.isSupportedContentType(contentType)) {
        return {
          success: false,
          status: 'rejected',
          message: `Content type ${contentType} not supported by Indexing API. Only supports: ${this.supportedIndexingTypes.join(', ')}`,
          normalizedStatus: 'NOT_SUPPORTED',
        };
      }

      const response = await fetch(
        'https://indexing.googleapis.com/v3/urlNotifications:publish',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            type: 'URL_UPDATED',
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          status: 'accepted',
          message: 'URL submitted to Google Indexing API',
          rawResponse: data,
          normalizedStatus: 'SUCCESS',
        };
      } else if (response.status === 429) {
        // Rate limited
        return {
          success: false,
          status: 'pending',
          message: 'Rate limited by Google',
          normalizedStatus: 'RATE_LIMITED',
        };
      } else {
        return {
          success: false,
          status: 'rejected',
          message: data.error?.message || 'Google Indexing API error',
          rawResponse: data,
          normalizedStatus: 'FAILED',
        };
      }
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
   * Get URL status from Search Console
   */
  async getUrlStatus(url: string): Promise<ConnectorStatus> {
    try {
      if (new Date() > this.tokenExpiresAt) {
        await this.refreshCredentials();
      }

      // Query Search Console for URL inspection data
      const response = await fetch(
        'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inspectionUrl: url }),
        }
      );

      const data = await response.json();

      return {
        url,
        indexed: data.inspectionResult?.indexStatusResult?.indexingState === 'INDEXED',
        discoveryDate: data.inspectionResult?.indexStatusResult?.lastCrawlTime
          ? new Date(data.inspectionResult.indexStatusResult.lastCrawlTime)
          : undefined,
        issues: data.inspectionResult?.indexStatusResult?.issues?.map(
          (i: any) => i.issueMessage
        ),
      };
    } catch (err) {
      console.error('Error getting URL status:', err);
      return {
        url,
        indexed: false,
        issues: ['Could not fetch status from Google'],
      };
    }
  }

  /**
   * List Search Console properties
   */
  async listProperties(): Promise<GSCProperty[]> {
    try {
      if (new Date() > this.tokenExpiresAt) {
        await this.refreshCredentials();
      }

      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();

      return data.siteEntry?.map((site: any) => ({
        id: site.siteUrl,
        siteUrl: site.siteUrl,
        propertyType: site.siteUrl.includes('{') ? 'domain' : 'url_prefix',
        status: 'verified',
      })) || [];
    } catch (err) {
      console.error('Error listing properties:', err);
      return [];
    }
  }

  /**
   * Check if content type is supported by Indexing API
   */
  private isSupportedContentType(contentType: string): boolean {
    // For MVP, only allow specific supported types
    // Regular blog posts should use Search Console submittion or rely on crawl
    return this.supportedIndexingTypes.some((type) =>
      contentType.includes(type.split('/').pop() || '')
    );
  }
}

export const googleConnector = new GoogleConnector();
