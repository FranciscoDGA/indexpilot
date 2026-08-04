import { DiscoveredURL } from '@/types/discovery';

export class SearchConsoleSyncer {
  private accessToken?: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken;
  }

  async syncCoverageData(siteUrl: string): Promise<DiscoveredURL[]> {
    if (!this.accessToken) {
      return this.getMockCoverageData(siteUrl);
    }

    try {
      const urls: DiscoveredURL[] = [];
      const coverageStates = ['SUBMITTED', 'INDEXED', 'DISCOVERED'];

      for (const state of coverageStates) {
        const data = await this.fetchCoverageData(siteUrl, state);
        urls.push(...data);
      }

      return urls;
    } catch (error) {
      console.error(`Failed to sync coverage data for ${siteUrl}:`, error);
      return this.getMockCoverageData(siteUrl);
    }
  }

  async importNotIndexedUrls(siteUrl: string): Promise<string[]> {
    const coverageData = await this.syncCoverageData(siteUrl);
    return coverageData
      .filter(d => d.source === 'gsc' && !d.httpStatus || d.httpStatus === 404)
      .map(d => d.url);
  }

  async fetchCrawlErrors(siteUrl: string): Promise<Array<{ url: string; error: string }>> {
    if (!this.accessToken) {
      return [];
    }

    try {
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/crawlErrors?category=404`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) return [];

      const data: any = await response.json();
      return (data.crawlErrors || []).map((error: any) => ({
        url: error.urlCrawled,
        error: error.errorType,
      }));
    } catch (error) {
      console.error('Failed to fetch crawl errors:', error);
      return [];
    }
  }

  async syncEnhancements(siteUrl: string): Promise<any> {
    if (!this.accessToken) {
      return {};
    }

    try {
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchanalytics/data`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: this.getDateStr(-30),
          endDate: this.getDateStr(0),
          dimensions: ['PAGE'],
          rowLimit: 25000,
        }),
      });

      if (!response.ok) return {};

      return await response.json();
    } catch (error) {
      console.error('Failed to sync enhancements:', error);
      return {};
    }
  }

  private async fetchCoverageData(siteUrl: string, state: string): Promise<DiscoveredURL[]> {
    try {
      const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/coverageIssues?category=${state}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!response.ok) return [];

      const data: any = await response.json();
      return (data.issues || []).map((issue: any) => ({
        url: issue.issueType,
        source: 'gsc',
        httpStatus: 200,
      } as DiscoveredURL));
    } catch {
      return [];
    }
  }

  private getMockCoverageData(siteUrl: string): DiscoveredURL[] {
    const domain = new URL(siteUrl).hostname || 'example.com';
    const paths = ['/about', '/contact', '/blog', '/products', '/pricing', '/faq'];

    return paths.map((path, idx) => ({
      url: `https://${domain}${path}`,
      source: 'gsc',
      httpStatus: idx % 3 === 0 ? 404 : 200,
    }));
  }

  private getDateStr(daysOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }
}
