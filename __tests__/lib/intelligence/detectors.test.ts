import { describe, it, expect, beforeEach } from 'vitest';
import { RankingDetector } from '@/lib/intelligence/detectors/rankingDetector';
import { CtrDetector } from '@/lib/intelligence/detectors/ctrDetector';
import { IndexationDetector } from '@/lib/intelligence/detectors/indexationDetector';
import { CrawlDetector } from '@/lib/intelligence/detectors/crawlDetector';
import { ContentDetector } from '@/lib/intelligence/detectors/contentDetector';
import { createMockKeywordPerformance, createMockUrl } from '../../setup';

const mockClient = (data: any[] = []) => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        lt: () => ({
          gt: () => ({
            then: (cb: any) => Promise.resolve({ data, error: null }).then(cb),
          }),
          then: (cb: any) => Promise.resolve({ data, error: null }).then(cb),
        }),
        then: (cb: any) => Promise.resolve({ data, error: null }).then(cb),
      }),
      is: () => ({
        then: (cb: any) => Promise.resolve({ data, error: null }).then(cb),
      }),
      then: (cb: any) => Promise.resolve({ data, error: null }).then(cb),
    }),
  }),
});

describe('RankingDetector', () => {
  let detector: RankingDetector;

  beforeEach(() => {
    detector = new RankingDetector({} as any);
  });

  it('should detect keywords near top 10', async () => {
    const keywords = [
      createMockKeywordPerformance({ position: 11, impressions: 500, keyword: 'test keyword' }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new RankingDetector(mockSupabase as any);

    const insights = await detector.detectNearTopTen('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('ranking_near_top10');
    expect(insights[0].priority).toBe('HIGH');
  });

  it('should not detect keywords already in top 10', async () => {
    const keywords = [
      createMockKeywordPerformance({ position: 5, impressions: 500 }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new RankingDetector(mockSupabase as any);

    const insights = await detector.detectNearTopTen('pub-1');

    // Keywords already in top 10 shouldn't be detected as "near top 10"
    const nearTop10 = insights.filter(i => i.type === 'ranking_near_top10');
    expect(nearTop10.length).toBe(0);
  });

  it('should detect top 3 entries with LOW priority', async () => {
    const keywords = [
      createMockKeywordPerformance({ position: 1, keyword: 'top keyword' }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new RankingDetector(mockSupabase as any);

    const insights = await detector.detectTopThreeEntry('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('ranking_top3_entry');
    expect(insights[0].priority).toBe('LOW');
  });
});

describe('CtrDetector', () => {
  let detector: CtrDetector;

  beforeEach(() => {
    detector = new CtrDetector({} as any);
  });

  it('should detect very low CTR', async () => {
    const keywords = [
      createMockKeywordPerformance({
        ctr: 0.5,
        impressions: 100,
        clicks: 0,
        position: 5,
      }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new CtrDetector(mockSupabase as any);

    const insights = await detector.detectVeryLowCtr('pub-1', 1);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('ctr_very_low');
  });

  it('should not detect normal CTR', async () => {
    const keywords = [
      createMockKeywordPerformance({
        ctr: 8.0,
        impressions: 1000,
        position: 3,
      }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new CtrDetector(mockSupabase as any);

    const insights = await detector.detectVeryLowCtr('pub-1', 1);

    expect(insights.length).toBe(0);
  });

  it('should detect high impression low CTR as quick wins', async () => {
    const keywords = [
      createMockKeywordPerformance({
        impressions: 1000,
        clicks: 10,
        ctr: 1.0,
      }),
    ];

    const mockSupabase = mockClient(keywords);
    detector = new CtrDetector(mockSupabase as any);

    const insights = await detector.detectHighImpressionLowCtr('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('HIGH');
  });
});

describe('IndexationDetector', () => {
  let detector: IndexationDetector;

  beforeEach(() => {
    detector = new IndexationDetector({} as any);
  });

  it('should detect never indexed URLs', async () => {
    const urls = [
      createMockUrl({
        is_indexed: false,
        discovered_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new IndexationDetector(mockSupabase as any);

    const insights = await detector.detectNeverIndexed('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('indexation_delayed');
  });

  it('should detect lost indexation with CRITICAL priority', async () => {
    const urls = [
      createMockUrl({
        is_indexed: false,
        is_orphaned: true,
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new IndexationDetector(mockSupabase as any);

    const insights = await detector.detectLostIndexation('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('CRITICAL');
  });

  it('should detect fast indexation as positive signal', async () => {
    const urls = [
      createMockUrl({
        is_indexed: true,
        discovered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new IndexationDetector(mockSupabase as any);

    const insights = await detector.detectFastIndexation('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('LOW');
  });
});

describe('CrawlDetector', () => {
  let detector: CrawlDetector;

  beforeEach(() => {
    detector = new CrawlDetector({} as any);
  });

  it('should detect stopped crawl', async () => {
    const urls = [
      createMockUrl({
        is_indexed: true,
        last_checked: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new CrawlDetector(mockSupabase as any);

    const insights = await detector.detectCrawlStopped('pub-1', 14);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('crawl_stopped');
  });

  it('should detect crawl errors as CRITICAL', async () => {
    const urls = [
      createMockUrl({
        http_status: 500,
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new CrawlDetector(mockSupabase as any);

    const insights = await detector.detectRecurringCrawlErrors('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('CRITICAL');
  });
});

describe('ContentDetector', () => {
  let detector: ContentDetector;

  beforeEach(() => {
    detector = new ContentDetector({} as any);
  });

  it('should detect outdated content', async () => {
    const urls = [
      createMockUrl({
        is_indexed: true,
        last_modified: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new ContentDetector(mockSupabase as any);

    const insights = await detector.detectOutdatedContent('pub-1', 6);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('content_outdated');
  });

  it('should detect orphan pages with HIGH priority', async () => {
    const urls = [
      createMockUrl({
        is_indexed: true,
        is_orphaned: true,
      }),
    ];

    const mockSupabase = mockClient(urls);
    detector = new ContentDetector(mockSupabase as any);

    const insights = await detector.detectOrphanPages('pub-1');

    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].priority).toBe('HIGH');
  });
});
