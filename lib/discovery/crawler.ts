import { CrawlResult, DiscoveredURL } from '@/types/discovery';

export class URLCrawler {
  private maxDepth: number = 5;
  private maxUrlsPerDomain: number = 10000;
  private timeout: number = 10000;
  private visited: Set<string> = new Set();
  private queue: Array<{ url: string; depth: number }> = [];

  async crawlSite(domainUrl: string, maxDepth: number = 5): Promise<CrawlResult> {
    this.maxDepth = maxDepth;
    this.visited.clear();
    this.queue = [];

    const domain = this.normalizeDomain(domainUrl);
    const robotsAllowed = await this.checkRobotsTxt(domain);

    if (!robotsAllowed) {
      return {
        urlsDiscovered: 0,
        urlsProcessed: 0,
        newUrls: 0,
        orphanedUrls: [],
        redirects: [],
      };
    }

    const urls = new Set<string>();
    this.queue.push({ url: domain, depth: 0 });

    while (this.queue.length > 0 && urls.size < this.maxUrlsPerDomain) {
      const { url, depth } = this.queue.shift()!;

      if (this.visited.has(url) || depth > this.maxDepth) continue;
      this.visited.add(url);

      try {
        const links = await this.crawlPage(url);
        const domainLinks = links.filter(link => this.isInternalLink(link, domain));

        for (const link of domainLinks) {
          if (!this.visited.has(link) && urls.size < this.maxUrlsPerDomain) {
            urls.add(link);
            this.queue.push({ url: link, depth: depth + 1 });
          }
        }
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
      }
    }

    return {
      urlsDiscovered: urls.size,
      urlsProcessed: this.visited.size,
      newUrls: urls.size,
      orphanedUrls: [],
      redirects: [],
    };
  }

  async crawlPage(url: string): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'IndexPilot/1.0' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return [];

      const html = await response.text();
      return this.extractLinksFromHtml(html, url);
    } catch {
      return [];
    }
  }

  async detectOrphanPages(sitemapUrls: string[], crawledUrls: string[]): Promise<string[]> {
    const sitemapSet = new Set(sitemapUrls);
    const crawledSet = new Set(crawledUrls);

    const orphans: string[] = [];
    for (const url of sitemapUrls) {
      if (!crawledSet.has(url)) {
        orphans.push(url);
      }
    }

    return orphans;
  }

  async checkUrlStatus(url: string): Promise<number> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'IndexPilot/1.0' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.status;
    } catch {
      return 0;
    }
  }

  private extractLinksFromHtml(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const urlPattern = /href=["']([^"']+)["']/g;
    let match;

    while ((match = urlPattern.exec(html)) !== null) {
      try {
        const link = match[1];
        if (link.startsWith('#') || link.startsWith('javascript:') || link.startsWith('mailto:')) {
          continue;
        }

        const absoluteUrl = new URL(link, baseUrl).href;
        const urlWithoutAnchor = absoluteUrl.split('#')[0];
        links.push(urlWithoutAnchor);
      } catch {
        continue;
      }
    }

    return [...new Set(links)];
  }

  private isInternalLink(link: string, domain: string): boolean {
    try {
      const linkUrl = new URL(link);
      const domainUrl = new URL(domain);
      return linkUrl.hostname === domainUrl.hostname;
    } catch {
      return false;
    }
  }

  private async checkRobotsTxt(domain: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${domain}/robots.txt`, {
        headers: { 'User-Agent': 'IndexPilot/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) return true;

      const robotsTxt = await response.text();
      return this.isUserAgentAllowed(robotsTxt, 'IndexPilot');
    } catch {
      return true;
    }
  }

  private isUserAgentAllowed(robotsTxt: string, userAgent: string): boolean {
    const lines = robotsTxt.split('\n');
    let inRuleBlock = false;
    let isDisallowed = false;

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.replace('user-agent:', '').trim();
        inRuleBlock = agent === '*' || agent === userAgent.toLowerCase();
      }

      if (inRuleBlock && trimmed.startsWith('disallow: /')) {
        isDisallowed = true;
        break;
      }
    }

    return !isDisallowed;
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
    this.queue = [];
  }
}
