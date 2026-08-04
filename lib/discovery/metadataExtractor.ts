import { URLMetadata } from '@/types/discovery';

export class MetadataExtractor {
  private timeout: number = 10000;

  async extractFromUrl(url: string): Promise<URLMetadata> {
    try {
      const html = await this.fetchHtml(url);
      return this.parseMetadata(html, url);
    } catch (error) {
      console.error(`Failed to extract metadata from ${url}:`, error);
      return {};
    }
  }

  async extractBatch(urls: string[]): Promise<Map<string, URLMetadata>> {
    const metadata = new Map<string, URLMetadata>();
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(url => this.extractFromUrl(url)));

      batch.forEach((url, idx) => {
        metadata.set(url, results[idx]);
      });

      await new Promise(r => setTimeout(r, 500));
    }

    return metadata;
  }

  async extractOpenGraph(html: string): Promise<Record<string, string>> {
    const og: Record<string, string> = {};
    const ogPattern = /<meta\s+property=["']og:(\w+)["']\s+content=["']([^"']*)["']/g;
    let match;

    while ((match = ogPattern.exec(html)) !== null) {
      og[match[1]] = match[2];
    }

    return og;
  }

  async extractSchema(html: string): Promise<string[]> {
    const types: string[] = [];

    const jsonLdPattern = /"@type"\s*:\s*"([^"]+)"/g;
    let match;

    while ((match = jsonLdPattern.exec(html)) !== null) {
      if (!types.includes(match[1])) {
        types.push(match[1]);
      }
    }

    const microDataPattern = /itemtype=["']([^"']+)["']/g;
    while ((match = microDataPattern.exec(html)) !== null) {
      if (!types.includes(match[1])) {
        types.push(match[1]);
      }
    }

    return types;
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'IndexPilot/1.0' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseMetadata(html: string, url: string): URLMetadata {
    const metadata: URLMetadata = {};

    metadata.title = this.extractMetaTag(html, 'title') || this.extractTitle(html);
    metadata.description = this.extractMetaTag(html, 'description');
    metadata.canonical = this.extractCanonical(html);

    const og = this.extractOpenGraphSync(html);
    metadata.ogTitle = og.title;
    metadata.ogImage = og.image;

    const twitter = this.extractTwitterSync(html);
    metadata.twitterTitle = twitter.title;
    metadata.twitterImage = twitter.image;

    const robotsMeta = this.extractRobotsMeta(html);
    metadata.robotsIndex = robotsMeta.index;
    metadata.robotsFollow = robotsMeta.follow;

    metadata.viewport = this.extractMetaTag(html, 'viewport');
    metadata.mobileFriendly = metadata.viewport?.includes('width=device-width') ?? false;

    metadata.wordCount = this.countWords(html);
    metadata.headingsCount = (html.match(/<h[1-6][^>]*>/g) || []).length;

    metadata.schemaTypes = this.extractSchemaSync(html);

    const domain = url.split('/')[2];
    const externalLinkPattern = new RegExp(`href=["']https?:\\/\\/(?!${domain.replace(/\./g, '\\.')})`, 'g');
    metadata.externalLinksCount = (html.match(externalLinkPattern) || []).length;
    metadata.internalLinksCount = (html.match(/href=["']\/[^"']*/g) || []).length;

    return metadata;
  }

  private extractMetaTag(html: string, name: string): string | undefined {
    const pattern = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i');
    const match = html.match(pattern);
    return match ? match[1] : undefined;
  }

  private extractTitle(html: string): string | undefined {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1] : undefined;
  }

  private extractCanonical(html: string): string | undefined {
    const match = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    return match ? match[1] : undefined;
  }

  private extractOpenGraphSync(html: string): Record<string, string> {
    const og: Record<string, string> = {};
    const ogPattern = /<meta\s+property=["']og:(\w+)["']\s+content=["']([^"']*)["']/g;
    let match;

    while ((match = ogPattern.exec(html)) !== null) {
      og[match[1]] = match[2];
    }

    return og;
  }

  private extractTwitterSync(html: string): Record<string, string> {
    const twitter: Record<string, string> = {};
    const twitterPattern = /<meta\s+name=["']twitter:(\w+)["']\s+content=["']([^"']*)["']/g;
    let match;

    while ((match = twitterPattern.exec(html)) !== null) {
      twitter[match[1]] = match[2];
    }

    return twitter;
  }

  private extractRobotsMeta(html: string): { index: boolean; follow: boolean } {
    const robotsMeta = this.extractMetaTag(html, 'robots')?.toLowerCase() || '';
    return {
      index: !robotsMeta.includes('noindex'),
      follow: !robotsMeta.includes('nofollow'),
    };
  }

  private extractSchemaSync(html: string): string[] {
    const types: string[] = [];

    const jsonLdPattern = /"@type"\s*:\s*"([^"]+)"/g;
    let match;

    while ((match = jsonLdPattern.exec(html)) !== null) {
      if (!types.includes(match[1])) {
        types.push(match[1]);
      }
    }

    return types;
  }

  private countWords(html: string): number {
    const textContent = html.replace(/<[^>]*>/g, ' ');
    const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }
}
