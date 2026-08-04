import { JSDOM } from 'jsdom';
import { SeoCheck, ScanResult, Grade, CheckStatus, Severity, UrlMetadata, HttpMetadata } from '@/types/seo';

export class SeoScanner {
  private timeout = 10000;
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

  async scanUrl(url: string): Promise<ScanResult> {
    try {
      // Validate URL
      new URL(url);
    } catch {
      return this.createErrorResult('Invalid URL format');
    }

    const checks: SeoCheck[] = [];

    try {
      // HTTP checks
      const httpMeta = await this.getHttpMetadata(url);
      checks.push(await this.checkHttps(httpMeta));
      checks.push(await this.checkHttpStatus(httpMeta));
      checks.push(await this.checkRedirectChain(httpMeta));
      checks.push(await this.checkResponseTime(httpMeta));

      // Fetch page content
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        return this.createErrorResult(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // HTML-based checks
      checks.push(await this.checkRobotsTxt(url));
      checks.push(await this.checkMetaRobots(document));
      checks.push(await this.checkCanonical(document, url));
      checks.push(await this.checkOgTags(document));
      checks.push(await this.checkTwitterCard(document));
      checks.push(...await this.checkSchema(document));
      checks.push(await this.checkFeaturedImage(document));
      checks.push(await this.checkMobileViewport(document));
      checks.push(await this.checkInternalLinks(document, url));
      checks.push(await this.checkExternalLinks(document));

      // Calculate score
      const { score, grade } = this.calculateScore(checks);

      return {
        checks,
        score,
        grade,
        totalIssues: checks.filter(c => c.status !== 'PASS').length,
        criticalCount: checks.filter(c => c.severity === 'CRITICAL').length,
        highCount: checks.filter(c => c.severity === 'HIGH').length,
        mediumCount: checks.filter(c => c.severity === 'MEDIUM').length,
        lowCount: checks.filter(c => c.severity === 'LOW').length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResult(message);
    }
  }

  private async getHttpMetadata(url: string): Promise<HttpMetadata> {
    const redirectChain: Array<{ url: string; status: number }> = [];
    const startTime = Date.now();

    let currentUrl = url;
    let redirects = 0;
    const maxRedirects = 5;

    while (redirects < maxRedirects) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(currentUrl, {
        redirect: 'manual',
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      redirectChain.push({
        url: currentUrl,
        status: response.status,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        currentUrl = new URL(location, currentUrl).href;
        redirects++;
      } else {
        break;
      }
    }

    const responseTime = Date.now() - startTime;
    const https = new URL(url).protocol === 'https:';
    const statusCode = redirectChain[redirectChain.length - 1]?.status || 0;

    return { https, statusCode, redirectChain, responseTime };
  }

  private async checkHttps(meta: HttpMetadata): Promise<SeoCheck> {
    if (meta.https) {
      return this.createCheck('https', 'PASS', 'LOW', 'Site uses HTTPS');
    }
    return this.createCheck(
      'https',
      'ERROR',
      'HIGH',
      'Site does not use HTTPS. Google requires secure connections for indexing.',
      'Migrate your site to HTTPS. Use an SSL certificate and update all internal links.',
      { protocol: 'http' }
    );
  }

  private async checkHttpStatus(meta: HttpMetadata): Promise<SeoCheck> {
    const status = meta.statusCode;

    if (status === 200 || status === 201) {
      return this.createCheck('http_status', 'PASS', 'LOW', `HTTP ${status}: OK`);
    }

    if (status === 301 || status === 302) {
      return this.createCheck(
        'http_status',
        'WARNING',
        'MEDIUM',
        `HTTP ${status}: Redirect detected`,
        'Permanent redirects are acceptable, but ensure redirect chains are minimized.',
        { status }
      );
    }

    if (status === 404) {
      return this.createCheck(
        'http_status',
        'ERROR',
        'CRITICAL',
        'HTTP 404: Page not found',
        'This page returns a 404 error. Check the URL or restore the page content.',
        { status }
      );
    }

    if (status === 410) {
      return this.createCheck(
        'http_status',
        'ERROR',
        'CRITICAL',
        'HTTP 410: Page gone',
        'The page has been permanently removed. Consider redirecting to a relevant page.',
        { status }
      );
    }

    if (status >= 500) {
      return this.createCheck(
        'http_status',
        'ERROR',
        'CRITICAL',
        `HTTP ${status}: Server error`,
        'Your server is returning an error. Check server logs and fix the issue.',
        { status }
      );
    }

    return this.createCheck(
      'http_status',
      'WARNING',
      'MEDIUM',
      `HTTP ${status}: Unexpected status`,
      undefined,
      { status }
    );
  }

  private async checkRedirectChain(meta: HttpMetadata): Promise<SeoCheck> {
    const chain = meta.redirectChain.filter(r => r.status >= 300 && r.status < 400);

    if (chain.length === 0) {
      return this.createCheck('redirect_chain', 'PASS', 'LOW', 'No redirect chains detected');
    }

    if (chain.length <= 2) {
      return this.createCheck(
        'redirect_chain',
        'WARNING',
        'LOW',
        `Redirect chain with ${chain.length} hops`,
        'Minimize redirect chains. Ideally, redirect directly to the final URL.',
        { chainLength: chain.length, chain: meta.redirectChain }
      );
    }

    return this.createCheck(
      'redirect_chain',
      'ERROR',
      'MEDIUM',
      `Long redirect chain with ${chain.length} hops`,
      'This excessive redirect chain slows down page load. Reduce it to 1-2 redirects maximum.',
      { chainLength: chain.length, chain: meta.redirectChain }
    );
  }

  private async checkResponseTime(meta: HttpMetadata): Promise<SeoCheck> {
    const time = meta.responseTime;

    if (time < 1000) {
      return this.createCheck('response_time', 'PASS', 'LOW', `Fast response: ${time}ms`);
    }

    if (time < 3000) {
      return this.createCheck(
        'response_time',
        'WARNING',
        'MEDIUM',
        `Moderate response time: ${time}ms`,
        'Response times over 1 second can impact user experience. Optimize server performance or use a CDN.',
        { time }
      );
    }

    return this.createCheck(
      'response_time',
      'ERROR',
      'HIGH',
      `Slow response: ${time}ms`,
      'This slow response time significantly impacts Core Web Vitals. Optimize your server and database queries.',
      { time }
    );
  }

  private async checkRobotsTxt(url: string): Promise<SeoCheck> {
    try {
      const robotsUrl = new URL('/robots.txt', url).href;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(robotsUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        return this.createCheck(
          'robots_txt',
          'WARNING',
          'MEDIUM',
          'robots.txt not found or not accessible',
          'Create a robots.txt file to guide search engine crawlers. Use Disallow to block sensitive areas.',
          { status: response.status }
        );
      }

      const content = await response.text();
      const isBlocked = content.toLowerCase().includes(`disallow: /`) &&
                       !content.toLowerCase().includes(`disallow:`);

      if (isBlocked) {
        return this.createCheck(
          'robots_txt',
          'ERROR',
          'CRITICAL',
          'Site is blocked in robots.txt',
          'Remove the "Disallow: /" rule from robots.txt to allow search engines to crawl your site.',
          { content: content.substring(0, 200) }
        );
      }

      return this.createCheck(
        'robots_txt',
        'PASS',
        'LOW',
        'robots.txt is properly configured'
      );
    } catch {
      return this.createCheck(
        'robots_txt',
        'INFO',
        'LOW',
        'Could not verify robots.txt (may be on same domain)'
      );
    }
  }

  private async checkMetaRobots(document: Document): Promise<SeoCheck> {
    const metaRobots = document.querySelector('meta[name="robots"]');

    if (!metaRobots) {
      return this.createCheck(
        'meta_robots',
        'INFO',
        'LOW',
        'No meta robots tag found. Defaults to index, follow.',
        'Add <meta name="robots" content="index, follow"> if you want to explicitly define indexing rules.'
      );
    }

    const content = metaRobots.getAttribute('content') || '';
    const isIndexed = !content.toLowerCase().includes('noindex');
    const isFollowed = !content.toLowerCase().includes('nofollow');

    if (!isIndexed) {
      return this.createCheck(
        'meta_robots',
        'ERROR',
        'CRITICAL',
        'Page is set to noindex',
        'Remove "noindex" from the meta robots tag to allow this page to be indexed.',
        { content }
      );
    }

    if (!isFollowed) {
      return this.createCheck(
        'meta_robots',
        'WARNING',
        'MEDIUM',
        'Links on this page will not be followed',
        'Consider removing "nofollow" unless this page contains untrusted or user-generated content.',
        { content }
      );
    }

    return this.createCheck(
      'meta_robots',
      'PASS',
      'LOW',
      'Meta robots tag allows indexing and following'
    );
  }

  private async checkCanonical(document: Document, url: string): Promise<SeoCheck> {
    const canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      return this.createCheck(
        'canonical',
        'WARNING',
        'MEDIUM',
        'No canonical tag found',
        'Add <link rel="canonical" href="https://yoursite.com/page"> to prevent duplicate content issues.'
      );
    }

    const href = canonical.getAttribute('href') || '';

    if (!href) {
      return this.createCheck(
        'canonical',
        'ERROR',
        'HIGH',
        'Canonical tag has no href',
        'Add the href attribute with the canonical URL.'
      );
    }

    try {
      const canonicalUrl = new URL(href, url).href;
      const currentUrl = new URL(url).href;

      if (canonicalUrl === currentUrl) {
        return this.createCheck(
          'canonical',
          'PASS',
          'LOW',
          'Canonical tag points to itself (correct)',
          undefined,
          { canonical: canonicalUrl }
        );
      }

      if (new URL(canonicalUrl).hostname === new URL(currentUrl).hostname) {
        return this.createCheck(
          'canonical',
          'WARNING',
          'MEDIUM',
          'Canonical points to different URL on same domain',
          'Ensure canonical tags only point to self or truly duplicate pages.',
          { canonical: canonicalUrl, current: currentUrl }
        );
      }

      return this.createCheck(
        'canonical',
        'WARNING',
        'MEDIUM',
        'Canonical points to different domain',
        'Cross-domain canonicals are rare. Verify this is intentional.',
        { canonical: canonicalUrl, current: currentUrl }
      );
    } catch {
      return this.createCheck(
        'canonical',
        'ERROR',
        'HIGH',
        'Canonical URL is malformed',
        'Fix the canonical href to be a valid absolute URL.'
      );
    }
  }

  private async checkOgTags(document: Document): Promise<SeoCheck> {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');

    const missing = [];
    if (!ogTitle) missing.push('og:title');
    if (!ogImage) missing.push('og:image');
    if (!ogDescription) missing.push('og:description');
    if (!ogUrl) missing.push('og:url');

    if (missing.length === 0) {
      return this.createCheck(
        'og_tags',
        'PASS',
        'LOW',
        'All Open Graph tags are present'
      );
    }

    if (missing.length === 4) {
      return this.createCheck(
        'og_tags',
        'WARNING',
        'MEDIUM',
        'No Open Graph tags found',
        'Add Open Graph tags for better social media sharing. Minimum: og:title, og:image, og:description'
      );
    }

    return this.createCheck(
      'og_tags',
      'WARNING',
      'LOW',
      `Missing Open Graph tags: ${missing.join(', ')}`,
      `Add missing tags for complete social media optimization.`,
      { missing }
    );
  }

  private async checkTwitterCard(document: Document): Promise<SeoCheck> {
    const card = document.querySelector('meta[name="twitter:card"]');
    const title = document.querySelector('meta[name="twitter:title"]');
    const image = document.querySelector('meta[name="twitter:image"]');

    if (!card && !title && !image) {
      return this.createCheck(
        'twitter_card',
        'INFO',
        'LOW',
        'No Twitter Card tags found',
        'Add Twitter Card tags for optimized sharing on Twitter/X.'
      );
    }

    const missing = [];
    if (!card) missing.push('twitter:card');
    if (!title) missing.push('twitter:title');
    if (!image) missing.push('twitter:image');

    if (missing.length > 0) {
      return this.createCheck(
        'twitter_card',
        'WARNING',
        'LOW',
        `Incomplete Twitter Card: missing ${missing.join(', ')}`,
        'Add all Twitter Card tags for optimal Twitter/X sharing.',
        { missing }
      );
    }

    return this.createCheck(
      'twitter_card',
      'PASS',
      'LOW',
      'Twitter Card tags are complete'
    );
  }

  private async checkSchema(document: Document): Promise<SeoCheck[]> {
    const results: SeoCheck[] = [];
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    if (scripts.length === 0) {
      return [this.createCheck(
        'schema_org',
        'WARNING',
        'MEDIUM',
        'No Schema.org markup found',
        'Add Schema.org markup to help search engines understand your content. Use Article, BlogPosting, or Organization.'
      )];
    }

    const types = new Set<string>();

    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent || '{}');
        const type = json['@type'] || '';

        if (typeof type === 'string') {
          types.add(type);
        } else if (Array.isArray(type)) {
          type.forEach(t => types.add(t));
        }
      } catch {
        // Ignore parse errors
      }
    });

    if (types.size > 0) {
      return [this.createCheck(
        'schema_org',
        'PASS',
        'LOW',
        `Schema.org markup found: ${Array.from(types).join(', ')}`,
        undefined,
        { types: Array.from(types) }
      )];
    }

    return [this.createCheck(
      'schema_org',
      'INFO',
      'LOW',
      'Schema.org scripts found but could not parse',
      'Verify schema.org markup is valid JSON-LD'
    )];
  }

  private async checkFeaturedImage(document: Document): Promise<SeoCheck> {
    // Look for og:image first (most reliable)
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage?.getAttribute('content')) {
      return this.createCheck(
        'featured_image',
        'PASS',
        'LOW',
        'Featured image detected via og:image'
      );
    }

    // Look for first meaningful image
    const firstImage = document.querySelector('img[alt], img[title]');
    if (firstImage) {
      const src = firstImage.getAttribute('src') || '';
      const alt = firstImage.getAttribute('alt') || '';

      if (!alt) {
        return this.createCheck(
          'featured_image',
          'WARNING',
          'MEDIUM',
          'Featured image missing alt text',
          'Add descriptive alt text to images for accessibility and SEO. Example: alt="Description of the image content"'
        );
      }

      return this.createCheck(
        'featured_image',
        'PASS',
        'LOW',
        'Featured image has alt text'
      );
    }

    return this.createCheck(
      'featured_image',
      'WARNING',
      'MEDIUM',
      'No featured image detected',
      'Add an og:image meta tag or a prominent image with alt text to improve social sharing and engagement.'
    );
  }

  private async checkMobileViewport(document: Document): Promise<SeoCheck> {
    const viewport = document.querySelector('meta[name="viewport"]');

    if (!viewport) {
      return this.createCheck(
        'mobile_viewport',
        'ERROR',
        'HIGH',
        'No viewport meta tag found',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.'
      );
    }

    const content = viewport.getAttribute('content') || '';

    if (!content.includes('width=device-width')) {
      return this.createCheck(
        'mobile_viewport',
        'ERROR',
        'HIGH',
        'Viewport does not set width=device-width',
        'Update viewport to include width=device-width for proper mobile rendering.'
      );
    }

    return this.createCheck(
      'mobile_viewport',
      'PASS',
      'LOW',
      'Mobile viewport is properly configured'
    );
  }

  private async checkInternalLinks(document: Document, url: string): Promise<SeoCheck> {
    const links = document.querySelectorAll('a[href]');
    const baseDomain = new URL(url).hostname;

    let internal = 0;
    let external = 0;
    let broken = 0;

    links.forEach(link => {
      const href = link.getAttribute('href') || '';

      if (!href || href.startsWith('#')) return;

      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === baseDomain) {
          internal++;
        } else {
          external++;
        }
      } catch {
        broken++;
      }
    });

    if (internal === 0 && external === 0) {
      return this.createCheck(
        'internal_links',
        'WARNING',
        'MEDIUM',
        'No internal links detected',
        'Add internal links to help distribute page authority and improve navigation.'
      );
    }

    return this.createCheck(
      'internal_links',
      'PASS',
      'LOW',
      `Found ${internal} internal links, ${external} external links`,
      undefined,
      { internal, external, broken }
    );
  }

  private async checkExternalLinks(document: Document): Promise<SeoCheck> {
    const links = document.querySelectorAll('a[href]');
    let nofollow = 0;

    links.forEach(link => {
      const rel = link.getAttribute('rel') || '';
      if (rel.toLowerCase().includes('nofollow')) {
        nofollow++;
      }
    });

    if (nofollow === 0) {
      return this.createCheck(
        'external_links',
        'PASS',
        'LOW',
        'External links are being followed'
      );
    }

    return this.createCheck(
      'external_links',
      'INFO',
      'LOW',
      `${nofollow} external links marked with nofollow`,
      undefined,
      { nofollow }
    );
  }

  private calculateScore(checks: SeoCheck[]): { score: number; grade: Grade } {
    let score = 100;

    checks.forEach(check => {
      if (check.severity === 'CRITICAL') score -= 15;
      else if (check.severity === 'HIGH') score -= 10;
      else if (check.severity === 'MEDIUM') score -= 5;
      else if (check.severity === 'LOW') score -= 2;
    });

    score = Math.max(0, Math.min(100, score));

    let grade: Grade;
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else grade = 'D';

    return { score, grade };
  }

  private createCheck(
    checkName: string,
    status: CheckStatus,
    severity: Severity,
    message: string,
    recommendation?: string,
    details?: Record<string, any>
  ): SeoCheck {
    return {
      id: `check-${Date.now()}-${Math.random()}`,
      audit_id: '',
      check_name: checkName as any,
      status,
      severity,
      message,
      recommendation,
      details,
      created_at: new Date().toISOString(),
    };
  }

  private createErrorResult(error: string): ScanResult {
    return {
      checks: [this.createCheck(
        'error',
        'ERROR',
        'CRITICAL',
        `Scan failed: ${error}`
      )],
      score: 0,
      grade: 'D',
      totalIssues: 1,
      criticalCount: 1,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
    };
  }
}
