import type { SiteAnalysis, CompetitorPage, CategoryStructure } from '@/types/competitors';

interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  respectRobots?: boolean;
  delay?: number;
}

interface CrawledPage {
  url: string;
  title?: string;
  meta_description?: string;
  canonical?: string;
  schema_types: string[];
  internal_links: string[];
  external_links: string[];
  images: number;
  word_count: number;
  depth: number;
  has_faq: boolean;
  has_howto: boolean;
  has_breadcrumb: boolean;
  status_code: number;
  links_to: string[];
}

export class CompetitorCrawler {
  private visited: Set<string> = new Set();
  private pages: CrawledPage[] = [];
  private queue: Array<{ url: string; depth: number }> = [];
  private options: CrawlOptions;

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxPages: options.maxPages || 100,
      maxDepth: options.maxDepth || 5,
      respectRobots: options.respectRobots !== false,
      delay: options.delay || 1000,
    };
  }

  async crawl(startUrl: string): Promise<CrawledPage[]> {
    this.visited.clear();
    this.pages = [];
    this.queue = [{ url: startUrl, depth: 0 }];

    while (this.queue.length > 0 && this.pages.length < this.options.maxPages!) {
      const { url, depth } = this.queue.shift()!;

      if (this.visited.has(url) || depth > this.options.maxDepth!) {
        continue;
      }

      this.visited.add(url);

      try {
        const page = await this.fetchAndAnalyze(url, depth);
        if (page) {
          this.pages.push(page);

          // Add internal links to queue
          for (const link of page.links_to) {
            if (!this.visited.has(link) && this.isSameDomain(link, startUrl)) {
              this.queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }

      // Rate limiting
      if (this.options.delay) {
        await new Promise(resolve => setTimeout(resolve, this.options.delay));
      }
    }

    return this.pages;
  }

  private async fetchAndAnalyze(url: string, depth: number): Promise<CrawledPage | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'IndexPilot-Crawler/1.0',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return {
          url,
          status_code: response.status,
          depth,
          schema_types: [],
          internal_links: [],
          external_links: [],
          images: 0,
          word_count: 0,
          has_faq: false,
          has_howto: false,
          has_breadcrumb: false,
          links_to: [],
        };
      }

      const html = await response.text();
      return this.parseHtml(url, html, depth);
    } catch (error) {
      return null;
    }
  }

  private parseHtml(url: string, html: string, depth: number): CrawledPage {
    const baseUrl = new URL(url);

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const meta_description = metaMatch ? metaMatch[1].trim() : undefined;

    // Extract canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : undefined;

    // Extract schema types
    const schemaTypes: string[] = [];
    const schemaMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of schemaMatches) {
      try {
        const json = JSON.parse(match[1]);
        if (json['@type']) schemaTypes.push(json['@type']);
        if (json['@graph']) {
          for (const item of json['@graph']) {
            if (item['@type']) schemaTypes.push(item['@type']);
          }
        }
      } catch {}
    }

    // Extract links
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
    const internalLinks: string[] = [];
    const externalLinks: string[] = [];
    const linksTo: string[] = [];

    for (const match of linkMatches) {
      const href = match[1];
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(linkUrl.href);
          linksTo.push(linkUrl.href);
        } else if (href.startsWith('http')) {
          externalLinks.push(href);
        }
      } catch {}
    }

    // Extract images
    const imageMatches = html.match(/<img[^>]*>/gi) || [];
    const images = imageMatches.length;

    // Word count
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '';
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

    // Check for FAQ/HowTo
    const hasFaq = schemaTypes.some(t => t.toLowerCase().includes('faq'));
    const hasHowto = schemaTypes.some(t => t.toLowerCase().includes('howto'));
    const hasBreadcrumb = schemaTypes.some(t => t.toLowerCase().includes('breadcrumb'));

    return {
      url,
      title,
      meta_description,
      canonical,
      schema_types: schemaTypes,
      internal_links: internalLinks,
      external_links: externalLinks,
      images,
      word_count: wordCount,
      depth,
      has_faq: hasFaq,
      has_howto: hasHowto,
      has_breadcrumb: hasBreadcrumb,
      status_code: 200,
      links_to: [...new Set(linksTo)],
    };
  }

  private isSameDomain(url: string, baseUrl: string): boolean {
    try {
      const urlHost = new URL(url).hostname;
      const baseHost = new URL(baseUrl).hostname;
      return urlHost === baseHost || urlHost.endsWith('.' + baseHost);
    } catch {
      return false;
    }
  }

  buildArchitecture(pages: CrawledPage[], domain: string): CategoryStructure[] {
    const categories = new Map<string, CategoryStructure>();

    for (const page of pages) {
      try {
        const url = new URL(page.url);
        const parts = url.pathname.split('/').filter(Boolean);

        if (parts.length > 0) {
          const catName = parts[0];
          if (!categories.has(catName)) {
            categories.set(catName, {
              name: catName,
              slug: catName,
              pages_count: 0,
              subcategories: [],
            });
          }
          categories.get(catName)!.pages_count++;
        }
      } catch {}
    }

    return Array.from(categories.values());
  }
}