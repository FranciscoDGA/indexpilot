import { DiscoveredURL, SitemapLocation } from '@/types/discovery';

export class SitemapDiscoverer {
  private visited: Set<string> = new Set();
  private maxRetries = 3;
  private timeout = 10000;

  async discoverSitemaps(domainUrl: string): Promise<SitemapLocation[]> {
    const domain = this.normalizeDomain(domainUrl);
    const commonPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/post-sitemap.xml',
      '/page-sitemap.xml',
      '/news-sitemap.xml',
      '/category-sitemap.xml',
      '/tag-sitemap.xml',
      '/product-sitemap.xml',
    ];

    const sitemaps: SitemapLocation[] = [];

    for (const path of commonPaths) {
      const url = `${domain}${path}`;
      const accessible = await this.validateSitemap(url);
      if (accessible) {
        const urlCount = await this.countUrlsInSitemap(url);
        sitemaps.push({ url, found: true, accessible: true, urlCount });
      } else {
        sitemaps.push({ url, found: false, accessible: false });
      }
    }

    const robotsUrls = await this.extractSitemapsFromRobots(domain);
    for (const url of robotsUrls) {
      if (!sitemaps.find(s => s.url === url)) {
        const urlCount = await this.countUrlsInSitemap(url);
        sitemaps.push({ url, found: true, accessible: true, urlCount });
      }
    }

    return sitemaps.filter(s => s.accessible);
  }

  async parseSitemapXml(sitemapUrl: string): Promise<DiscoveredURL[]> {
    if (this.visited.has(sitemapUrl)) return [];
    this.visited.add(sitemapUrl);

    try {
      const xml = await this.fetchWithRetry(sitemapUrl);
      const urls: DiscoveredURL[] = [];

      if (xml.includes('<sitemapindex')) {
        const indexUrls = this.extractSitemapIndexUrls(xml);
        for (const url of indexUrls) {
          const nestedUrls = await this.parseSitemapXml(url);
          urls.push(...nestedUrls);
        }
      } else {
        urls.push(...this.extractSitemapUrls(xml));
      }

      return urls;
    } catch (error) {
      console.error(`Failed to parse sitemap ${sitemapUrl}:`, error);
      return [];
    }
  }

  async handleSitemapIndex(indexUrl: string): Promise<DiscoveredURL[]> {
    return this.parseSitemapXml(indexUrl);
  }

  async validateSitemap(sitemapUrl: string): Promise<boolean> {
    try {
      const response = await this.fetchWithRetry(sitemapUrl);
      return response.length > 0 && (response.includes('<?xml') || response.includes('<url'));
    } catch {
      return false;
    }
  }

  private async fetchWithRetry(url: string, retries = 0): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'IndexPilot/1.0' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      if (retries < this.maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
        return this.fetchWithRetry(url, retries + 1);
      }
      throw error;
    }
  }

  private extractSitemapUrls(xml: string): DiscoveredURL[] {
    const urls: DiscoveredURL[] = [];
    const urlPattern = /<url>\s*<loc>(.*?)<\/loc>(?:[\s\S]*?<lastmod>(.*?)<\/lastmod>)?[\s\S]*?<\/url>/g;
    let match;

    while ((match = urlPattern.exec(xml)) !== null) {
      urls.push({
        url: match[1].trim(),
        source: 'sitemap',
        lastModified: match[2] ? match[2].trim() : undefined,
      });
    }

    return urls;
  }

  private extractSitemapIndexUrls(xml: string): string[] {
    const urls: string[] = [];
    const urlPattern = /<sitemap>\s*<loc>(.*?)<\/loc>/g;
    let match;

    while ((match = urlPattern.exec(xml)) !== null) {
      urls.push(match[1].trim());
    }

    return urls;
  }

  private async extractSitemapsFromRobots(domain: string): Promise<string[]> {
    try {
      const robotsUrl = `${domain}/robots.txt`;
      const robotsTxt = await this.fetchWithRetry(robotsUrl);
      const urls: string[] = [];
      const sitemapPattern = /Sitemap:\s*(.*?)$/gm;
      let match;

      while ((match = sitemapPattern.exec(robotsTxt)) !== null) {
        urls.push(match[1].trim());
      }

      return urls;
    } catch {
      return [];
    }
  }

  private async countUrlsInSitemap(sitemapUrl: string): Promise<number | undefined> {
    try {
      const xml = await this.fetchWithRetry(sitemapUrl);
      if (xml.includes('<sitemapindex')) {
        return undefined;
      }
      const matches = xml.match(/<url>/g);
      return matches ? matches.length : undefined;
    } catch {
      return undefined;
    }
  }

  private normalizeDomain(domainUrl: string): string {
    let url = domainUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  }

  resetVisited(): void {
    this.visited.clear();
  }
}
