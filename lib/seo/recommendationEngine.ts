import { SeoCheck } from '@/types/seo';

export class RecommendationEngine {
  getRecommendation(check: SeoCheck): string {
    if (check.recommendation) {
      return check.recommendation;
    }

    return this.generateRecommendation(check);
  }

  private generateRecommendation(check: SeoCheck): string {
    switch (check.check_name) {
      case 'https':
        return this.recommendHttps(check);
      case 'http_status':
        return this.recommendHttpStatus(check);
      case 'redirect_chain':
        return this.recommendRedirectChain(check);
      case 'response_time':
        return this.recommendResponseTime(check);
      case 'robots_txt':
        return this.recommendRobotsTxt(check);
      case 'meta_robots':
        return this.recommendMetaRobots(check);
      case 'canonical':
        return this.recommendCanonical(check);
      case 'sitemap':
        return this.recommendSitemap(check);
      case 'og_tags':
        return this.recommendOgTags(check);
      case 'twitter_card':
        return this.recommendTwitterCard(check);
      case 'schema_org':
        return this.recommendSchema(check);
      case 'featured_image':
        return this.recommendFeaturedImage(check);
      case 'mobile_viewport':
        return this.recommendMobileViewport(check);
      case 'mobile_usability':
        return this.recommendMobileUsability(check);
      case 'internal_links':
        return this.recommendInternalLinks(check);
      case 'external_links':
        return this.recommendExternalLinks(check);
      default:
        return 'Review this issue and take corrective action if needed.';
    }
  }

  private recommendHttps(check: SeoCheck): string {
    if (check.status === 'PASS') {
      return 'Your site uses HTTPS, which is essential for security and SEO. Continue maintaining this configuration.';
    }

    return `Your site is not using HTTPS. This is critical because:
- Google Search Console will show warnings
- User browsers will display "Not Secure" warnings
- Core Web Vitals signals may be penalized

Action: Install an SSL certificate from your hosting provider, configure HTTPS, and set up permanent redirects (301) from HTTP to HTTPS. Update your sitemap and robots.txt to reference HTTPS URLs.`;
  }

  private recommendHttpStatus(check: SeoCheck): string {
    const status = check.details?.status as number;

    if (status === 200 || status === 201) {
      return 'The page is accessible and returning the correct status code. No action needed.';
    }

    if (status === 301 || status === 302) {
      return `This page is redirecting with HTTP ${status}. While some redirects are necessary, minimize redirect chains:
- Direct users immediately to the final destination
- Use 301 (permanent) for permanent changes
- Avoid multiple redirects in a chain (max 1-2 hops)`;
    }

    if (status === 404) {
      return `This page is returning HTTP 404 (Not Found). This means:
- Search engines cannot index this URL
- Users receive an error message
- Links to this page waste link equity

Action: Either restore the page content or create a permanent redirect (301) to a related page. Update internal links to point to the correct URL.`;
    }

    if (status === 410) {
      return `HTTP 410 (Gone) signals the page has been permanently removed. Consider:
- Creating a 301 redirect to a relevant page (if the content was moved)
- Leaving 410 if the content truly no longer exists (tells search engines to remove from index)

Update any internal links that point to this URL.`;
    }

    if (status >= 500) {
      return `Server error (HTTP ${status}). Your server is not responding correctly:
- Search engines cannot access the content
- Users see error pages
- Rankings will drop

Action: Check server logs immediately. Verify database connections, server resources, and application errors. Consider temporary redirect to a status page while investigating.`;
    }

    return `HTTP ${status} is not a standard successful response code. Investigate why this status is being returned and correct it to HTTP 200.`;
  }

  private recommendRedirectChain(check: SeoCheck): string {
    const chainLength = check.details?.chainLength as number;

    if (chainLength === 0) {
      return 'No redirect chains detected. Your redirects are optimized.';
    }

    if (chainLength <= 2) {
      return `You have a ${chainLength}-hop redirect chain. While acceptable, consider optimizing by:
- Updating internal links to point directly to the final URL
- Updating canonical tags to point to the final destination
- Removing intermediate redirects`;
    }

    return `You have a ${chainLength}-hop redirect chain, which slows down page loading and crawling efficiency:
- Each redirect requires an additional HTTP request
- Search engines may not follow all redirects
- User experience is negatively impacted

Action: Update all references (internal links, canonical tags, sitemaps) to point directly to the final URL. Remove intermediate redirects.`;
  }

  private recommendResponseTime(check: SeoCheck): string {
    const time = check.details?.time as number;

    if (time < 1000) {
      return `Excellent response time (${time}ms). Your server is performing well. Continue monitoring to maintain this performance.`;
    }

    if (time < 3000) {
      return `Response time is ${time}ms, which is slightly slow:
- Impacts Core Web Vitals (LCP - Largest Contentful Paint)
- Affects user experience and bounce rates
- Signals to search engines about site health

Optimization tips:
- Enable GZIP compression on your server
- Use a Content Delivery Network (CDN) to serve assets from locations closer to users
- Optimize database queries and reduce server-side processing
- Upgrade server resources if consistently overloaded`;
    }

    return `Response time is ${time}ms, which is significantly slow and will harm your SEO:
- First Input Delay (FID) / Interaction to Next Paint (INP) will be poor
- Users will bounce from slow-loading pages
- Search engines prioritize faster sites

Priority actions:
1. Check server resource usage (CPU, memory, disk I/O)
2. Enable compression and caching headers
3. Implement a CDN for static assets
4. Optimize or cache database queries
5. Consider upgrading hosting if resources are limited`;
  }

  private recommendRobotsTxt(check: SeoCheck): string {
    if (check.status === 'ERROR') {
      return `Your site is blocked by robots.txt. This is critical:
- Search engines cannot crawl your site
- Your content will not be indexed
- You will receive no organic search traffic

Action: Immediately remove the "Disallow: /" rule from your robots.txt file. You can verify the file at: https://yoursite.com/robots.txt`;
    }

    if (check.status === 'PASS') {
      return 'Your robots.txt is properly configured. Search engines can crawl your site as intended.';
    }

    return `Your robots.txt file is missing or inaccessible:
- Create a robots.txt file in your root directory
- Use it to guide crawler behavior (block ads directories, avoid duplicate content, etc.)
- Never block your entire site with "Disallow: /"

Example robots.txt:
User-agent: *
Disallow: /admin/
Disallow: /private/
Allow: /

Sitemap: https://yoursite.com/sitemap.xml`;
  }

  private recommendMetaRobots(check: SeoCheck): string {
    if (check.status === 'ERROR') {
      return `This page is marked with "noindex", which means:
- Search engines will not index this page
- It will not appear in search results
- Inbound links will not transfer value

Action: Remove "noindex" from the meta robots tag to allow indexing. The tag should read: <meta name="robots" content="index, follow">

Use noindex only for: login pages, duplicate pages, private content, or pages you specifically don't want indexed.`;
    }

    if (check.status === 'WARNING') {
      return `This page has "nofollow" in the meta robots tag, meaning:
- Links on this page will not pass PageRank
- Linked pages won't benefit from this page's authority
- Generally only needed for UGC or untrusted content

Consider removing "nofollow" if this is editorial content. Keep it if the page contains: user comments, affiliate links, or untrusted external links.`;
    }

    return 'Meta robots tag allows proper indexing and link following. No action needed.';
  }

  private recommendCanonical(check: SeoCheck): string {
    if (check.status === 'WARNING' && check.message.includes('No canonical')) {
      return `Add a canonical tag to specify the preferred version of this page:
<link rel="canonical" href="https://yoursite.com/page">

Why it matters:
- Prevents duplicate content penalties
- Consolidates ranking signals
- Tells search engines which version to prioritize

Best practice: Always include a self-referential canonical tag on every page.`;
    }

    if (check.status === 'WARNING' && check.message.includes('different URL')) {
      return `Your canonical tag points to a different URL. Verify:
- Is this page truly a duplicate of the canonical page?
- Should both pages exist, or should one redirect to the other?
- Is the canonical URL on the same domain?

If pages are duplicates, redirect to the canonical version (301). If they're different pages, each should have a self-referential canonical.`;
    }

    if (check.status === 'ERROR') {
      return `The canonical tag is malformed and not being recognized:
- Search engines will treat this as having no canonical
- Duplicate content issues may arise

Fix: Ensure the href is a valid, absolute URL:
✗ Incorrect: href="page"
✓ Correct: href="https://yoursite.com/page"`;
    }

    return 'Canonical tag is properly configured. This page is clearly marked as the preferred version.';
  }

  private recommendSitemap(check: SeoCheck): string {
    return `Verify your sitemap is submitted to Google Search Console:
1. Create or verify your XML sitemap exists at https://yoursite.com/sitemap.xml
2. Ensure all important pages are included
3. Submit the sitemap URL to Google Search Console
4. Update the sitemap whenever you add/remove pages

A sitemap helps search engines discover and prioritize your content.`;
  }

  private recommendOgTags(check: SeoCheck): string {
    const missing = check.details?.missing as string[];

    if (!missing || missing.length === 0) {
      return 'All critical Open Graph tags are present. Your content will display well when shared on social media.';
    }

    let recommendation = `Add missing Open Graph tags to improve social sharing:

Minimum required:
- og:title: The title shown when shared (separate from page <title>)
- og:image: A compelling image (1200x628 px recommended)
- og:description: Summary of the content
- og:url: The canonical URL

Example:
<meta property="og:title" content="Article Title">
<meta property="og:image" content="https://yoursite.com/image.jpg">
<meta property="og:description" content="Brief summary...">
<meta property="og:url" content="https://yoursite.com/page">

Missing tags: ${missing.join(', ')}`;

    return recommendation;
  }

  private recommendTwitterCard(check: SeoCheck): string {
    if (check.status === 'PASS') {
      return 'Twitter Card tags are complete. Your content will display optimally when shared on Twitter/X.';
    }

    return `Add Twitter Card tags for optimized Twitter/X sharing:

Recommended tags:
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Article Title">
<meta name="twitter:image" content="https://yoursite.com/image.jpg">
<meta name="twitter:description" content="Brief summary...">

Twitter Cards ensure your content displays beautifully when shared on Twitter/X, increasing click-through rates.`;
  }

  private recommendSchema(check: SeoCheck): string {
    if (check.status === 'PASS') {
      return 'Schema.org markup is properly implemented. Search engines can better understand your content.';
    }

    return `Add Schema.org markup (JSON-LD) to help search engines understand your content:

Choose the appropriate schema type:
- Article: News articles, blog posts, how-tos
- BlogPosting: Blog entries
- Organization: Company information
- Product: E-commerce products
- FAQ: Frequently asked questions
- BreadcrumbList: Site navigation hierarchy
- LocalBusiness: Physical business location

Example (Article):
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Title",
  "image": "https://yoursite.com/image.jpg",
  "author": "Author Name",
  "datePublished": "2024-01-01"
}
</script>

Schema.org markup can enable rich snippets in search results, improving click-through rates.`;
  }

  private recommendFeaturedImage(check: SeoCheck): string {
    if (check.status === 'PASS') {
      return 'Your featured image is properly configured for sharing and SEO.';
    }

    if (check.message.includes('missing alt')) {
      return `Add alt text to your featured image:
<img src="image.jpg" alt="Descriptive text about the image">

Or via og:image meta tag:
<meta property="og:image" alt="Descriptive text about the image" content="https://yoursite.com/image.jpg">

Alt text:
- Improves accessibility for screen readers
- Helps search engines understand the image
- Can appear in image search results
- Increases chances of being featured in Google Discover

Write descriptive alt text that explains what the image shows, not just "image" or "photo".`;
    }

    return `Add or improve your featured image:
- Recommended size: 1200×628 pixels (minimum 1200px wide)
- Format: JPG or PNG
- File size: Optimize for web (< 500KB)
- Add descriptive alt text

Featured images are used for:
- Social media sharing (OpenGraph)
- Google Discover cards
- Search results previews
- Email sharing

Use compelling, high-quality images that represent your content accurately.`;
  }

  private recommendMobileViewport(check: SeoCheck): string {
    if (check.status === 'PASS') {
      return 'Your site is mobile-responsive and properly configured for mobile devices.';
    }

    return `Add the mobile viewport meta tag to your <head>:
<meta name="viewport" content="width=device-width, initial-scale=1">

This tag:
- Tells mobile browsers to render at device width
- Enables mobile responsiveness
- Is required for Google Mobile-Friendly Test
- Improves Core Web Vitals

Without this tag:
- Site appears zoomed out and unusable on mobile
- Users will bounce immediately
- Mobile rankings will suffer

Verify your site is mobile-responsive by testing at: https://search.google.com/test/mobile-friendly`;
  }

  private recommendMobileUsability(check: SeoCheck): string {
    return `Optimize for mobile users:
- Ensure buttons are at least 48x48 pixels (finger-friendly)
- Use readable font sizes (minimum 12px)
- Avoid intrusive pop-ups
- Make navigation easy to use on small screens
- Avoid content that requires horizontal scrolling

Test your site with Google's Mobile-Friendly Test tool to identify specific issues.`;
  }

  private recommendInternalLinks(check: SeoCheck): string {
    if (check.status === 'WARNING') {
      return `Add internal links to your page:
- Links help distribute authority throughout your site
- They guide search engines to important pages
- They improve user navigation

Strategy:
- Link to related articles in your niche
- Use descriptive link text (not "click here")
- Link to higher-priority pages from this article
- Aim for 3-5 relevant internal links per article

Example:
<a href="/related-article">Learn about SEO optimization</a>`;
    }

    const internal = check.details?.internal as number;
    return `Good internal linking structure detected with ${internal} internal links. This helps distribute authority and improves SEO. Consider adding more links to high-priority pages.`;
  }

  private recommendExternalLinks(check: SeoCheck): string {
    const nofollow = check.details?.nofollow as number;

    if (nofollow > 0) {
      return `${nofollow} external links are marked with nofollow.

When to use nofollow:
- Links to untrusted or UGC sites
- Sponsored links or advertisements
- Affiliate links
- Pages you want to link to but not endorse

Best practice: Use follow links to high-authority sources (Wikipedia, industry leaders). This helps your SEO by association.`;
    }

    return 'Your external links are being followed. Ensure they point to reputable, relevant sources to improve your credibility.';
  }
}
