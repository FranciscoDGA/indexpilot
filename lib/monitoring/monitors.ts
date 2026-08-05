import { MonitoringSnapshot, AvailabilityCheck, IndexationDrift } from '@/types/monitoring';

/**
 * ContentMonitor
 *
 * Monitors content changes by comparing snapshots.
 */
export class ContentMonitor {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Create a snapshot from HTML content.
   */
  parseHtmlToSnapshot(url: string, html: string, statusCode: number, responseTimeMs: number): MonitoringSnapshot {
    // Basic HTML parsing (in production, use a proper parser)
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);

    const internalLinks = (html.match(/href=["'][^"']*["']/g) || []).length;
    const externalLinks = (html.match(/https?:\/\/[^"']*/g) || []).length;
    const images = (html.match(/<img[^>]*>/gi) || []).length;
    const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `snap-${Date.now()}`,
      site_id: this.siteId,
      url,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      content_hash: this.generateHash(html),
      title: titleMatch?.[1] || undefined,
      meta_description: metaDescMatch?.[1] || undefined,
      canonical: canonicalMatch?.[1] || undefined,
      robots: robotsMatch?.[1] || undefined,
      h1: h1Match?.[1] || undefined,
      internal_links_count: internalLinks,
      external_links_count: externalLinks,
      images_count: images,
      word_count: words,
      snapshot: { html_length: html.length },
      captured_at: new Date().toISOString(),
    };
  }

  /**
   * Compare two snapshots and return changed fields.
   */
  detectChanges(old: MonitoringSnapshot, current: MonitoringSnapshot): Array<{
    field: string;
    old_value: any;
    new_value: any;
  }> {
    const changes: Array<{ field: string; old_value: any; new_value: any }> = [];
    const fields = ['title', 'meta_description', 'canonical', 'robots', 'h1', 'schema_type', 'status_code', 'content_hash'];

    for (const field of fields) {
      const oldVal = (old as any)[field];
      const newVal = (current as any)[field];
      if (oldVal !== newVal) {
        changes.push({ field, old_value: oldVal, new_value: newVal });
      }
    }

    // Check link counts
    if (old.internal_links_count !== current.internal_links_count) {
      changes.push({ field: 'internal_links_count', old_value: old.internal_links_count, new_value: current.internal_links_count });
    }
    if (old.external_links_count !== current.external_links_count) {
      changes.push({ field: 'external_links_count', old_value: old.external_links_count, new_value: current.external_links_count });
    }

    return changes;
  }

  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

/**
 * TechnicalMonitor
 *
 * Monitors technical SEO aspects.
 */
export class TechnicalMonitor {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Check robots.txt for issues.
   */
  async checkRobotsTxt(domain: string): Promise<{
    available: boolean;
    blocks_important?: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const response = await fetch(`https://${domain}/robots.txt`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { available: false, issues: ['robots.txt not found'] };
      }

      const content = await response.text();

      // Check for common issues
      if (content.includes('Disallow: /') && !content.includes('Allow:')) {
        issues.push('robots.txt blocks entire site');
      }

      if (content.includes('noindex') || content.includes('Disallow: /')) {
        const importantPaths = ['/blog', '/products', '/about', '/contact'];
        for (const path of importantPaths) {
          if (content.includes(`Disallow: ${path}`)) {
            issues.push(`robots.txt blocks important path: ${path}`);
          }
        }
      }

      return {
        available: true,
        blocks_important: issues.length > 0,
        issues,
      };
    } catch {
      return { available: false, issues: ['Failed to fetch robots.txt'] };
    }
  }

  /**
   * Check sitemap for issues.
   */
  async checkSitemap(domain: string): Promise<{
    available: boolean;
    url_count: number;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      const response = await fetch(`https://${domain}/sitemap.xml`, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { available: false, url_count: 0, issues: ['sitemap.xml not found'] };
      }

      const content = await response.text();
      const urlCount = (content.match(/<url>/g) || []).length;

      if (urlCount === 0) {
        issues.push('Sitemap is empty');
      }

      return {
        available: true,
        url_count: urlCount,
        issues,
      };
    } catch {
      return { available: false, url_count: 0, issues: ['Failed to fetch sitemap'] };
    }
  }

  /**
   * Check SSL certificate.
   */
  async checkSsl(domain: string): Promise<{
    valid: boolean;
    expires_at?: string;
    issuer?: string;
    issues: string[];
  }> {
    // Basic SSL check - in production use proper certificate inspection
    try {
      const response = await fetch(`https://${domain}`, {
        signal: AbortSignal.timeout(10000),
      });
      return {
        valid: true,
        issues: [],
      };
    } catch {
      return {
        valid: false,
        issues: ['SSL connection failed'],
      };
    }
  }
}

/**
 * AvailabilityMonitor
 *
 * Monitors site availability and response times.
 */
export class AvailabilityMonitor {
  private siteId: string;
  private responseHistory: Map<string, number[]> = new Map();

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Check site availability.
   */
  async checkSite(url: string): Promise<AvailabilityCheck> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(30000),
        redirect: 'follow',
      });

      const responseTime = Date.now() - startTime;

      // Track response times
      const history = this.responseHistory.get(url) || [];
      history.push(responseTime);
      if (history.length > 100) history.shift();
      this.responseHistory.set(url, history);

      return {
        site_id: this.siteId,
        url,
        is_online: response.ok,
        status_code: response.status,
        response_time_ms: responseTime,
        checked_at: new Date().toISOString(),
      };
    } catch (error) {
      return {
        site_id: this.siteId,
        url,
        is_online: false,
        error: String(error),
        checked_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Get average response time.
   */
  getAverageResponseTime(url: string): number | null {
    const history = this.responseHistory.get(url);
    if (!history || history.length === 0) return null;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  /**
   * Detect response time degradation.
   */
  detectDegradation(url: string, threshold: number = 2): boolean {
    const history = this.responseHistory.get(url);
    if (!history || history.length < 10) return false;

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    return recentAvg > olderAvg * threshold;
  }
}
