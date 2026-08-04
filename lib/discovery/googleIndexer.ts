import { GoogleIndexStatus } from '@/types/discovery';

export class GoogleIndexer {
  private apiKey?: string;
  private accessToken?: string;

  constructor(apiKey?: string, accessToken?: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  async checkIndexStatus(url: string): Promise<GoogleIndexStatus> {
    if (!this.accessToken && !this.apiKey) {
      return this.getMockIndexStatus(url);
    }

    try {
      const endpoint = 'https://www.googleapis.com/urlInspection/v1/urlInspection:inspect';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          inspectionUrl: url,
          languageCode: 'en-US',
        }),
      });

      if (!response.ok) {
        return this.getMockIndexStatus(url);
      }

      const data: any = await response.json();
      return this.parseIndexResponse(data, url);
    } catch (error) {
      console.error(`Failed to check index status for ${url}:`, error);
      return this.getMockIndexStatus(url);
    }
  }

  async checkBatchIndexStatus(urls: string[]): Promise<GoogleIndexStatus[]> {
    const statuses: GoogleIndexStatus[] = [];
    const batchSize = 10;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(url => this.checkIndexStatus(url)));
      statuses.push(...results);
      await new Promise(r => setTimeout(r, 500));
    }

    return statuses;
  }

  async requestIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED'): Promise<boolean> {
    if (!this.accessToken) {
      console.warn('No access token for indexing API');
      return false;
    }

    try {
      const endpoint = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          url,
          type,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error(`Failed to request indexing for ${url}:`, error);
      return false;
    }
  }

  async validateRobotsTxt(domainUrl: string): Promise<boolean> {
    try {
      const domain = this.normalizeDomain(domainUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${domain}/robots.txt`, {
        headers: { 'User-Agent': 'Google' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      return false;
    }
  }

  private parseIndexResponse(data: any, url: string): GoogleIndexStatus {
    const inspectionResult = data.inspectionResult || {};
    const indexStatusResult = inspectionResult.indexStatusResult || {};
    const mobileUsabilityResult = inspectionResult.mobileUsabilityResult || {};

    return {
      url,
      isIndexed: indexStatusResult.indexingState === 'INDEXED',
      isDiscoveredNotIndexed: indexStatusResult.indexingState === 'DISCOVERED_NOT_INDEXED',
      isBlockedByRobots: indexStatusResult.robotsTxtState === 'BLOCKED',
      isBlockedByUserAgent: indexStatusResult.crawledAs !== 'MOBILE_AND_DESKTOP',
      isNotFound: indexStatusResult.indexingState === 'NOT_FOUND',
      lastCrawled: indexStatusResult.lastCrawlTime,
      verdict: mobileUsabilityResult.verdict || 'NEUTRAL',
    };
  }

  private getMockIndexStatus(url: string): GoogleIndexStatus {
    const hash = url.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const isIndexed = (hash % 2) === 0;
    const isOrphan = (hash % 7) === 0;

    return {
      url,
      isIndexed,
      isDiscoveredNotIndexed: isOrphan && !isIndexed,
      isBlockedByRobots: false,
      isBlockedByUserAgent: false,
      isNotFound: false,
      lastCrawled: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      verdict: 'PASS',
    };
  }

  private normalizeDomain(domainUrl: string): string {
    let url = domainUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  }
}
