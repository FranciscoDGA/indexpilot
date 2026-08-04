// Mock Supabase client for development without backend setup
// Set NEXT_PUBLIC_USE_MOCK=true in .env.local

const mockUser = {
  id: 'mock-user-123',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
  },
};

const mockSession = {
  user: mockUser,
  access_token: 'mock-token',
};

const mockSites = [
  {
    id: 'site-1',
    user_id: 'mock-user-123',
    name: 'Tech Blog',
    domain: 'techblog.com',
    status: 'active' as const,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'site-2',
    user_id: 'mock-user-123',
    name: 'News Portal',
    domain: 'newscenter.io',
    status: 'active' as const,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'site-3',
    user_id: 'mock-user-123',
    name: 'E-commerce Store',
    domain: 'shop.example.com',
    status: 'active' as const,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockPublications = [
  {
    id: 'pub-1',
    site_id: 'site-1',
    title: 'React 19 Released',
    url: 'https://techblog.com/react-19-released',
    slug: 'react-19-released',
    type: 'article' as const,
    status: 'INDEXED' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-2',
    site_id: 'site-1',
    title: 'Next.js 15 Performance Tips',
    url: 'https://techblog.com/nextjs-15-tips',
    slug: 'nextjs-15-tips',
    type: 'article' as const,
    status: 'INDEXED' as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-3',
    site_id: 'site-2',
    title: 'Breaking News',
    url: 'https://newscenter.io/breaking-news',
    slug: 'breaking-news',
    type: 'news' as const,
    status: 'PROCESSING' as const,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-4',
    site_id: 'site-2',
    title: 'Market Update',
    url: 'https://newscenter.io/market-update',
    slug: 'market-update',
    type: 'news' as const,
    status: 'RECEIVED' as const,
    created_at: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    error_message: null,
  },
  {
    id: 'pub-5',
    site_id: 'site-3',
    title: 'New Product Launch',
    url: 'https://shop.example.com/products/new-item',
    slug: 'new-product-launch',
    type: 'product' as const,
    status: 'ERROR' as const,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    error_message: 'Failed to connect to indexing service',
  },
];

const mockApiKeys = [
  {
    id: 'key-1',
    site_id: 'site-1',
    name: 'Production Key',
    key_hash: 'mock-hash-1',
    key_type: 'live' as const,
    last_used_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    publications_count: 42,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'key-2',
    site_id: 'site-1',
    name: 'Test Key',
    key_hash: 'mock-hash-2',
    key_type: 'test' as const,
    last_used_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publications_count: 12,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockEvents = [
  {
    id: 'event-1',
    publication_id: 'pub-1',
    event_type: 'RECEIVED' as const,
    message: 'Publication received from API',
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-2',
    publication_id: 'pub-1',
    event_type: 'PROCESSING' as const,
    message: 'Processing publication content',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-3',
    publication_id: 'pub-1',
    event_type: 'INDEXED' as const,
    message: 'Successfully indexed by search engine',
    created_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
  },
];

const mockLogs = [
  {
    id: 'log-1',
    publication_id: 'pub-1',
    level: 'info' as const,
    message: 'Started processing publication',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    publication_id: 'pub-1',
    level: 'success' as const,
    message: 'Metadata extracted successfully',
    created_at: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
  },
];

const mockSeoAudits = [
  {
    id: 'audit-1',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    url: 'https://techblog.com/react-19-released',
    title: 'React 19 Released',
    score: 94,
    grade: 'A+' as const,
    status: 'completed' as const,
    scanned_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit-2',
    publication_id: 'pub-2',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    url: 'https://techblog.com/nextjs-15-tips',
    title: 'Next.js 15 Performance Tips',
    score: 87,
    grade: 'A' as const,
    status: 'completed' as const,
    scanned_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit-3',
    publication_id: 'pub-3',
    site_id: 'site-2',
    user_id: 'mock-user-123',
    url: 'https://newscenter.io/breaking-news',
    title: 'Breaking News',
    score: 72,
    grade: 'B' as const,
    status: 'completed' as const,
    scanned_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit-4',
    publication_id: 'pub-5',
    site_id: 'site-3',
    user_id: 'mock-user-123',
    url: 'https://shop.example.com/products/new-item',
    title: 'New Product Launch',
    score: 55,
    grade: 'C' as const,
    status: 'completed' as const,
    scanned_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const mockSeoChecks = [
  {
    id: 'check-1',
    audit_id: 'audit-1',
    check_name: 'https',
    status: 'PASS' as const,
    severity: 'LOW' as const,
    message: 'Site uses HTTPS',
    recommendation: 'Continue maintaining HTTPS configuration.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-2',
    audit_id: 'audit-1',
    check_name: 'meta_robots',
    status: 'PASS' as const,
    severity: 'LOW' as const,
    message: 'Meta robots tag allows indexing and following',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-3',
    audit_id: 'audit-1',
    check_name: 'og_tags',
    status: 'WARNING' as const,
    severity: 'LOW' as const,
    message: 'Missing Open Graph tags: twitter:card',
    recommendation: 'Add Twitter Card tags for optimized sharing on Twitter/X.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-4',
    audit_id: 'audit-2',
    check_name: 'featured_image',
    status: 'WARNING' as const,
    severity: 'MEDIUM' as const,
    message: 'Featured image missing alt text',
    recommendation: 'Add descriptive alt text to images for accessibility and SEO.',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-5',
    audit_id: 'audit-3',
    check_name: 'response_time',
    status: 'ERROR' as const,
    severity: 'HIGH' as const,
    message: 'Slow response: 2500ms',
    recommendation: 'Optimize server performance or use a CDN.',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-6',
    audit_id: 'audit-4',
    check_name: 'canonical',
    status: 'ERROR' as const,
    severity: 'HIGH' as const,
    message: 'No canonical tag found',
    recommendation: 'Add a canonical tag to prevent duplicate content issues.',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'check-7',
    audit_id: 'audit-4',
    check_name: 'mobile_viewport',
    status: 'ERROR' as const,
    severity: 'HIGH' as const,
    message: 'No viewport meta tag found',
    recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const mockSeoAuditHistory = [
  {
    id: 'hist-1',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    score_at_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    score: 78,
    grade: 'B' as const,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-2',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    score_at_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    score: 86,
    grade: 'A' as const,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'hist-3',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    score_at_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    score: 94,
    grade: 'A+' as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// Sprint 07 - Google Search Console Mock Data
const mockSearchPerformance = [
  {
    id: 'perf-1',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    impressions: 1250,
    clicks: 85,
    ctr: 6.8,
    avg_position: 4.2,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'perf-2',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    impressions: 1420,
    clicks: 98,
    ctr: 6.9,
    avg_position: 3.8,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'perf-3',
    publication_id: 'pub-2',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    impressions: 856,
    clicks: 42,
    ctr: 4.9,
    avg_position: 8.5,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockKeywordPerformance = [
  {
    id: 'kw-1',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    keyword: 'React 19 features',
    date: new Date().toISOString().split('T')[0],
    impressions: 520,
    clicks: 42,
    ctr: 8.1,
    position: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'kw-2',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    keyword: 'React tutorial',
    date: new Date().toISOString().split('T')[0],
    impressions: 380,
    clicks: 28,
    ctr: 7.4,
    position: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'kw-3',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    keyword: 'JavaScript performance',
    date: new Date().toISOString().split('T')[0],
    impressions: 210,
    clicks: 12,
    ctr: 5.7,
    position: 12,
    created_at: new Date().toISOString(),
  },
];

const mockPerformanceMilestones = [
  {
    id: 'mile-1',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    milestone_type: 'entered_top_10',
    milestone_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    keyword: 'React 19 features',
    previous_value: 12,
    new_value: 8,
    metadata: { source: 'GSC' },
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mile-2',
    publication_id: 'pub-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    milestone_type: 'ctr_increased',
    milestone_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    previous_value: 5.2,
    new_value: 6.8,
    metadata: { source: 'GSC' },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUrls = [
  {
    id: 'url-1',
    site_id: 'site-1',
    publication_id: 'pub-1',
    user_id: 'mock-user-123',
    url: 'https://techblog.com',
    slug: 'home',
    title: 'Tech Blog - Home',
    description: 'Latest tech trends and tutorials',
    source: 'sitemap',
    discovered_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    http_status: 200,
    is_redirect: false,
    is_indexable: true,
    is_indexed: true,
    is_orphaned: false,
    sync_status: 'synced',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    last_checked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'url-2',
    site_id: 'site-1',
    publication_id: 'pub-2',
    user_id: 'mock-user-123',
    url: 'https://techblog.com/react-19-released',
    slug: 'react-19-released',
    title: 'React 19 Released - New Features',
    description: 'Discover all the new features in React 19',
    source: 'sitemap',
    discovered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    http_status: 200,
    is_redirect: false,
    is_indexable: true,
    is_indexed: true,
    is_orphaned: false,
    sync_status: 'synced',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    last_checked: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'url-3',
    site_id: 'site-1',
    publication_id: null,
    user_id: 'mock-user-123',
    url: 'https://techblog.com/about',
    slug: 'about',
    title: 'About Tech Blog',
    description: 'Learn more about our blog',
    source: 'crawl',
    discovered_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    http_status: 200,
    is_redirect: false,
    is_indexable: true,
    is_indexed: false,
    is_orphaned: true,
    sync_status: 'synced',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    last_checked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'url-4',
    site_id: 'site-1',
    publication_id: null,
    user_id: 'mock-user-123',
    url: 'https://techblog.com/contact',
    slug: 'contact',
    title: 'Contact Us',
    description: 'Get in touch with our team',
    source: 'crawl',
    discovered_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    http_status: 404,
    is_redirect: false,
    is_indexable: false,
    is_indexed: false,
    is_orphaned: false,
    sync_status: 'synced',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    last_checked: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUrlMetadata = [
  {
    id: 'meta-1',
    url_id: 'url-1',
    og_title: 'Tech Blog - Latest Tutorials',
    og_description: 'Learn about latest tech trends',
    og_image: 'https://techblog.com/og-image.jpg',
    twitter_title: 'Tech Blog',
    twitter_image: 'https://techblog.com/twitter-image.jpg',
    canonical: 'https://techblog.com',
    robots_index: true,
    robots_follow: true,
    viewport: 'width=device-width, initial-scale=1',
    mobile_friendly: true,
    word_count: 2150,
    headings_count: 4,
    external_links_count: 12,
    internal_links_count: 15,
    schema_types: ['WebSite', 'Organization'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'meta-2',
    url_id: 'url-2',
    og_title: 'React 19 Released',
    og_description: 'New features in React 19',
    og_image: 'https://techblog.com/react19-og.jpg',
    twitter_title: 'React 19 Released',
    twitter_image: 'https://techblog.com/react19-tw.jpg',
    canonical: 'https://techblog.com/react-19-released',
    robots_index: true,
    robots_follow: true,
    viewport: 'width=device-width, initial-scale=1',
    mobile_friendly: true,
    word_count: 4230,
    headings_count: 8,
    external_links_count: 22,
    internal_links_count: 8,
    schema_types: ['BlogPosting', 'Article'],
    created_at: new Date().toISOString(),
  },
];

const mockSyncLogs = [
  {
    id: 'sync-1',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    sync_type: 'full',
    status: 'completed',
    urls_found: 45,
    urls_new: 5,
    urls_removed: 2,
    urls_updated: 8,
    error_message: null,
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sync-2',
    site_id: 'site-1',
    user_id: 'mock-user-123',
    sync_type: 'incremental',
    status: 'completed',
    urls_found: 47,
    urls_new: 2,
    urls_removed: 0,
    urls_updated: 3,
    error_message: null,
    started_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 25.5 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

type QueryBuilder = {
  eq: (field: string, value: any) => QueryBuilder;
  in: (field: string, values: any[]) => QueryBuilder;
  order: (field: string, options?: any) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  range: (from: number, to: number) => QueryBuilder;
  single: () => Promise<{ data: any; error: null }>;
  then?: (onfulfilled?: any, onrejected?: any) => Promise<any>;
  catch?: (onrejected?: any) => Promise<any>;
  finally?: (onfinally?: any) => Promise<any>;
};

function createQueryBuilder(data: any[], options?: { count?: string }): QueryBuilder & Promise<{ data: any; error: null; count?: number }> {
  let filtered = [...data];
  const initialCount = data.length;

  const result: any = {
    eq: (field: string, value: any) => {
      filtered = filtered.filter((d) => d[field] === value);
      return createQueryBuilder(filtered, options);
    },
    in: (field: string, values: any[]) => {
      filtered = filtered.filter((d) => values.includes(d[field]));
      return createQueryBuilder(filtered, options);
    },
    order: (field: string, orderOptions?: any) => {
      filtered.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        return orderOptions?.ascending === false ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
      });
      return createQueryBuilder(filtered, options);
    },
    limit: (count: number) => {
      filtered = filtered.slice(0, count);
      return createQueryBuilder(filtered, options);
    },
    range: (from: number, to: number) => {
      filtered = filtered.slice(from, to + 1);
      return createQueryBuilder(filtered, options);
    },
    single: async () => ({
      data: filtered[0] || null,
      error: null,
    }),
    // Make it thenable/awaitable
    then: (onfulfilled: any, onrejected: any) => {
      const promise = Promise.resolve({
        data: filtered,
        error: null,
        count: options?.count === 'exact' ? initialCount : undefined,
      }).then(onfulfilled, onrejected);
      return promise;
    },
    catch: (onrejected: any) => {
      return Promise.resolve({
        data: filtered,
        error: null,
        count: options?.count === 'exact' ? initialCount : undefined,
      }).catch(onrejected);
    },
    finally: (onfinally: any) => {
      return Promise.resolve({
        data: filtered,
        error: null,
        count: options?.count === 'exact' ? initialCount : undefined,
      }).finally(onfinally);
    },
  };

  return result;
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({
        data: { session: mockSession },
        error: null,
      }),
      signInWithPassword: async ({ email, password }: any) => {
        if (email === 'demo@example.com' && password === 'demo') {
          return { data: { session: mockSession }, error: null };
        }
        return {
          data: null,
          error: { message: 'Invalid credentials' },
        };
      },
      signUp: async ({ email, password }: any) => {
        return {
          data: { user: { id: 'new-user', email } },
          error: null,
        };
      },
      signOut: async () => ({
        error: null,
      }),
    },
    from: (table: string) => {
      let data: any[] = [];

      switch (table) {
        case 'sites':
          data = mockSites;
          break;
        case 'publication_queue':
          data = mockPublications;
          break;
        case 'api_keys':
          data = mockApiKeys;
          break;
        case 'publication_events':
          data = mockEvents;
          break;
        case 'publication_logs':
          data = mockLogs;
          break;
        case 'seo_audits':
          data = mockSeoAudits;
          break;
        case 'seo_checks':
          data = mockSeoChecks;
          break;
        case 'seo_audit_history':
          data = mockSeoAuditHistory;
          break;
        case 'search_performance':
          data = mockSearchPerformance;
          break;
        case 'keyword_performance':
          data = mockKeywordPerformance;
          break;
        case 'performance_milestones':
          data = mockPerformanceMilestones;
          break;
        case 'urls':
          data = mockUrls;
          break;
        case 'url_metadata':
          data = mockUrlMetadata;
          break;
        case 'sync_logs':
          data = mockSyncLogs;
          break;
        case 'users':
          data = [
            {
              id: 'mock-user-123',
              email: 'demo@example.com',
              full_name: 'Demo User',
              language: 'pt-BR',
              timezone: 'America/Sao_Paulo',
              theme: 'system',
              created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ];
          break;
      }

      return {
        select: (fields?: string, selectOptions?: any) => createQueryBuilder(data, selectOptions),
        insert: async (records: any[]) => ({
          data: records,
          error: null,
        }),
        update: async (updates?: any) => ({
          eq: async () => ({
            data: null,
            error: null,
          }),
          in: async () => ({
            data: null,
            error: null,
          }),
        }),
        delete: () => ({
          eq: async () => ({
            data: null,
            error: null,
          }),
          in: async () => ({
            data: null,
            error: null,
          }),
        }),
      };
    },
  };
}
