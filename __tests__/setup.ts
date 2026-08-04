import { expect, afterEach, vi } from 'vitest';

// Mock Supabase responses
export const mockSupabase = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        then: (cb: any) => Promise.resolve({ data: [], error: null }).then(cb),
      }),
    }),
    insert: () => ({ data: [], error: null }),
    update: () => ({ eq: () => ({ data: [], error: null }) }),
  }),
};

// Mock factory for creating test data
export const createMockInsight = (overrides = {}) => ({
  id: 'test-insight-1',
  publication_id: 'pub-1',
  site_id: 'site-1',
  user_id: 'user-1',
  type: 'ranking_near_top10' as const,
  priority: 'HIGH' as const,
  title: 'Test Insight',
  description: 'Test Description',
  recommendation: 'Test Recommendation',
  estimated_impact: 'HIGH' as const,
  estimated_effort: '5_MIN' as const,
  status: 'open' as const,
  metrics: {},
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockKeywordPerformance = (overrides = {}) => ({
  id: 'kw-1',
  publication_id: 'pub-1',
  site_id: 'site-1',
  user_id: 'user-1',
  keyword: 'test keyword',
  date: new Date().toISOString().split('T')[0],
  impressions: 100,
  clicks: 5,
  ctr: 5.0,
  position: 10,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockUrl = (overrides = {}) => ({
  id: 'url-1',
  site_id: 'site-1',
  publication_id: 'pub-1',
  user_id: 'user-1',
  url: 'https://example.com/test',
  slug: 'test',
  title: 'Test Page',
  description: 'Test Description',
  source: 'sitemap' as const,
  discovered_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  http_status: 200,
  is_redirect: false,
  is_indexable: true,
  is_indexed: true,
  is_orphaned: false,
  sync_status: 'synced' as const,
  created_at: new Date().toISOString(),
  last_checked: new Date().toISOString(),
  last_modified: new Date().toISOString(),
  ...overrides,
});

afterEach(() => {
  vi.clearAllMocks();
});
