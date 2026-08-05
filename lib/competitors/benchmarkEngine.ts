import { createClient } from '@/lib/supabase/server';
import type { Benchmark, BenchmarkComparison, SiteArchitecture, CompetitorPage } from '@/types/competitors';

export class BenchmarkEngine {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async generateBenchmarks(
    workspaceId: string,
    competitorId: string,
    myPages: any[],
    competitorPages: any[]
  ): Promise<Benchmark[]> {
    const benchmarks: Omit<Benchmark, 'id'>[] = [];

    // Technical benchmarks
    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'total_urls',
      my_value: myPages.length,
      competitor_value: competitorPages.length,
      category: 'technical',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'sitemap_coverage',
      my_value: this.calculateSitemapCoverage(myPages),
      competitor_value: this.calculateSitemapCoverage(competitorPages),
      category: 'technical',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'schema_adoption',
      my_value: this.calculateSchemaAdoption(myPages),
      competitor_value: this.calculateSchemaAdoption(competitorPages),
      category: 'technical',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'canonical_usage',
      my_value: this.calculateCanonicalUsage(myPages),
      competitor_value: this.calculateCanonicalUsage(competitorPages),
      category: 'technical',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'avg_depth',
      my_value: this.calculateAvgDepth(myPages),
      competitor_value: this.calculateAvgDepth(competitorPages),
      category: 'structure',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'orphan_pages',
      my_value: this.calculateOrphanPages(myPages),
      competitor_value: this.calculateOrphanPages(competitorPages),
      category: 'structure',
      calculated_at: new Date().toISOString(),
    });

    // Content benchmarks
    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'avg_word_count',
      my_value: this.calculateAvgWordCount(myPages),
      competitor_value: this.calculateAvgWordCount(competitorPages),
      category: 'content',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'faq_usage',
      my_value: this.calculateFaqUsage(myPages),
      competitor_value: this.calculateFaqUsage(competitorPages),
      category: 'content',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'howto_usage',
      my_value: this.calculateHowtoUsage(myPages),
      competitor_value: this.calculateHowtoUsage(competitorPages),
      category: 'content',
      calculated_at: new Date().toISOString(),
    });

    benchmarks.push({
      workspace_id: workspaceId,
      competitor_id: competitorId,
      metric: 'breadcrumb_adoption',
      my_value: this.calculateBreadcrumbAdoption(myPages),
      competitor_value: this.calculateBreadcrumbAdoption(competitorPages),
      category: 'technical',
      calculated_at: new Date().toISOString(),
    });

    // Save benchmarks
    const { error } = await this.supabase
      .from('benchmarks')
      .insert(benchmarks);

    if (error) throw error;

    return benchmarks as Benchmark[];
  }

  async getBenchmarks(workspaceId: string, competitorId: string): Promise<Benchmark[]> {
    const { data, error } = await this.supabase
      .from('benchmarks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('competitor_id', competitorId)
      .order('calculated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  compareBenchmarks(benchmarks: Benchmark[]): BenchmarkComparison[] {
    return benchmarks.map(b => {
      const myVal = typeof b.my_value === 'number' ? b.my_value : 0;
      const compVal = typeof b.competitor_value === 'number' ? b.competitor_value : 0;
      const diff = myVal - compVal;
      const pct = compVal > 0 ? ((myVal - compVal) / compVal) * 100 : 0;

      let trend: 'better' | 'worse' | 'equal' = 'equal';
      // For some metrics, lower is better (orphan_pages, avg_depth)
      if (b.metric === 'orphan_pages' || b.metric === 'avg_depth') {
        trend = myVal < compVal ? 'better' : myVal > compVal ? 'worse' : 'equal';
      } else {
        trend = myVal > compVal ? 'better' : myVal < compVal ? 'worse' : 'equal';
      }

      return {
        metric: b.metric,
        myValue: b.my_value,
        competitorValue: b.competitor_value,
        difference: diff,
        percentage: Math.round(pct),
        trend,
      };
    });
  }

  private calculateSitemapCoverage(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withSitemap = pages.filter(p => p.from_sitemap).length;
    return Math.round((withSitemap / pages.length) * 100);
  }

  private calculateSchemaAdoption(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withSchema = pages.filter(p => p.schema_types && p.schema_types.length > 0).length;
    return Math.round((withSchema / pages.length) * 100);
  }

  private calculateCanonicalUsage(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withCanonical = pages.filter(p => p.canonical).length;
    return Math.round((withCanonical / pages.length) * 100);
  }

  private calculateAvgDepth(pages: any[]): number {
    if (pages.length === 0) return 0;
    const totalDepth = pages.reduce((sum, p) => sum + (p.depth || 0), 0);
    return Math.round((totalDepth / pages.length) * 10) / 10;
  }

  private calculateOrphanPages(pages: any[]): number {
    // Pages with no internal links pointing to them
    const linkedUrls = new Set<string>();
    for (const page of pages) {
      if (page.internal_links) {
        for (const link of page.internal_links) {
          linkedUrls.add(link);
        }
      }
    }
    return pages.filter(p => !linkedUrls.has(p.url)).length;
  }

  private calculateAvgWordCount(pages: any[]): number {
    if (pages.length === 0) return 0;
    const totalWords = pages.reduce((sum, p) => sum + (p.word_count || 0), 0);
    return Math.round(totalWords / pages.length);
  }

  private calculateFaqUsage(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withFaq = pages.filter(p => p.has_faq).length;
    return Math.round((withFaq / pages.length) * 100);
  }

  private calculateHowtoUsage(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withHowto = pages.filter(p => p.has_howto).length;
    return Math.round((withHowto / pages.length) * 100);
  }

  private calculateBreadcrumbAdoption(pages: any[]): number {
    if (pages.length === 0) return 0;
    const withBreadcrumb = pages.filter(p => p.has_breadcrumb).length;
    return Math.round((withBreadcrumb / pages.length) * 100);
  }
}