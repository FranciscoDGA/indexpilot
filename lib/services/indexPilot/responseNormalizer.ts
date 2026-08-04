import { NormalizedResponse, NormalizedStatus, ProviderType } from '@/types/indexPilot';

/**
 * Response Normalizer
 * Converts provider-specific responses to a standard format
 * Ensures consistent handling across all providers
 */
export class ResponseNormalizer {
  /**
   * Provider-specific response mappings
   */
  private statusMappings: Record<ProviderType, Record<string, NormalizedStatus>> = {
    google: {
      accepted: 'SUCCESS',
      rejected: 'FAILED',
      pending: 'PENDING',
      'QUOTA_EXCEEDED': 'RATE_LIMITED',
      'PERMISSION_DENIED': 'FAILED',
      'INVALID_ARGUMENT': 'INVALID_URL',
    },
    indexnow: {
      '200': 'SUCCESS',
      '400': 'FAILED',
      '403': 'FAILED',
      '429': 'RATE_LIMITED',
      accepted: 'SUCCESS',
      failed: 'FAILED',
    },
    bing: {
      ok: 'SUCCESS',
      error: 'FAILED',
      'rate_limit_exceeded': 'RATE_LIMITED',
    },
    yandex: {
      'ok': 'SUCCESS',
      'error': 'FAILED',
    },
  };

  /**
   * Normalize Google response
   */
  private normalizeGoogleResponse(response: Record<string, any>): NormalizedResponse {
    const status = response.status || response.code || 'unknown';
    const normalizedStatus = this.statusMappings.google[status] || 'FAILED';

    return {
      originalResponse: response,
      normalizedStatus: normalizedStatus as NormalizedStatus,
      message: response.error?.message || response.message || 'Google API Response',
      timestamp: new Date(),
    };
  }

  /**
   * Normalize IndexNow response
   */
  private normalizeIndexNowResponse(response: Record<string, any>): NormalizedResponse {
    const statusCode = response.status || response.statusCode || 500;
    const statusStr = String(statusCode);
    const normalizedStatus =
      this.statusMappings.indexnow[statusStr] ||
      (statusCode === 200 ? 'SUCCESS' : 'FAILED');

    return {
      originalResponse: response,
      normalizedStatus: normalizedStatus as NormalizedStatus,
      message: response.message || `HTTP ${statusCode}`,
      timestamp: new Date(),
    };
  }

  /**
   * Normalize Bing response
   */
  private normalizeBingResponse(response: Record<string, any>): NormalizedResponse {
    const status = response.status || 'unknown';
    const normalizedStatus = this.statusMappings.bing[status] || 'FAILED';

    return {
      originalResponse: response,
      normalizedStatus: normalizedStatus as NormalizedStatus,
      message: response.message || `Bing: ${status}`,
      timestamp: new Date(),
    };
  }

  /**
   * Normalize Yandex response
   */
  private normalizeYandexResponse(response: Record<string, any>): NormalizedResponse {
    const status = response.status || 'unknown';
    const normalizedStatus = this.statusMappings.yandex[status] || 'FAILED';

    return {
      originalResponse: response,
      normalizedStatus: normalizedStatus as NormalizedStatus,
      message: response.message || `Yandex: ${status}`,
      timestamp: new Date(),
    };
  }

  /**
   * Main normalize method - routes to provider-specific handler
   */
  normalize(
    provider: ProviderType,
    response: Record<string, any>
  ): NormalizedResponse {
    try {
      switch (provider) {
        case 'google':
          return this.normalizeGoogleResponse(response);
        case 'indexnow':
          return this.normalizeIndexNowResponse(response);
        case 'bing':
          return this.normalizeBingResponse(response);
        case 'yandex':
          return this.normalizeYandexResponse(response);
        default:
          return {
            originalResponse: response,
            normalizedStatus: 'FAILED' as NormalizedStatus,
            message: 'Unknown provider',
            timestamp: new Date(),
          };
      }
    } catch (err) {
      return {
        originalResponse: response,
        normalizedStatus: 'FAILED' as NormalizedStatus,
        message: `Error normalizing response: ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Normalize multiple responses
   */
  normalizeMultiple(
    provider: ProviderType,
    responses: Record<string, any>[]
  ): NormalizedResponse[] {
    return responses.map((r) => this.normalize(provider, r));
  }

  /**
   * Convert normalized status to human-readable message
   */
  getStatusMessage(status: NormalizedStatus): string {
    const messages: Record<NormalizedStatus, string> = {
      SUCCESS: 'URL successfully submitted',
      FAILED: 'Failed to submit URL',
      PENDING: 'Submission pending (check later)',
      RATE_LIMITED: 'Rate limited (will retry later)',
      INVALID_URL: 'Invalid URL format',
      NOT_SUPPORTED: 'Content type not supported by this provider',
    };

    return messages[status] || 'Unknown status';
  }

  /**
   * Get appropriate retry action based on status
   */
  shouldRetry(status: NormalizedStatus): boolean {
    return ['PENDING', 'RATE_LIMITED'].includes(status);
  }

  /**
   * Get retry delay suggestion based on status
   */
  getRetryDelaySuggestion(status: NormalizedStatus): number {
    const suggestions: Record<NormalizedStatus, number> = {
      SUCCESS: 0, // Don't retry
      FAILED: 0, // Don't retry (permanent failure)
      PENDING: 60 * 1000, // 1 minute
      RATE_LIMITED: 5 * 60 * 1000, // 5 minutes
      INVALID_URL: 0, // Don't retry
      NOT_SUPPORTED: 0, // Don't retry
    };

    return suggestions[status] || 0;
  }
}

export const responseNormalizer = new ResponseNormalizer();
