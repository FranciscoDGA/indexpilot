import { supabase } from '@/lib/supabase/client';
import { DomainTrustMetrics } from '@/types/oge';

export class DomainTrustEvolutionEngine {
  /**
   * Calculate 8-component domain trust score
   * Unique to OGE - no other tool calculates this way
   */
  async calculateTrustScore(publicationId: string): Promise<DomainTrustMetrics> {
    const weekNumber = this.getCurrentWeekNumber();

    // Calculate individual components
    const crawlTrustScore = await this.calculateCrawlTrust(publicationId);
    const discoverySpeedScore = await this.calculateDiscoverySpeed(publicationId);
    const indexVelocityScore = await this.calculateIndexVelocity(publicationId);
    const impressionVelocityScore = await this.calculateImpressionVelocity(publicationId);
    const clickVelocityScore = await this.calculateClickVelocity(publicationId);
    const growthConsistencyScore = await this.calculateGrowthConsistency(publicationId);
    const contentFreshnessScore = await this.calculateContentFreshness(publicationId);
    const technicalHealthScore = await this.calculateTechnicalHealth(publicationId);

    // Calculate overall trust (weighted average)
    const overallTrust =
      (crawlTrustScore * 0.15 +
        discoverySpeedScore * 0.12 +
        indexVelocityScore * 0.15 +
        impressionVelocityScore * 0.15 +
        clickVelocityScore * 0.12 +
        growthConsistencyScore * 0.15 +
        contentFreshnessScore * 0.12 +
        technicalHealthScore * 0.04) /
      100;

    // Determine trend
    const previousTrust = await this.getPreviousTrustScore(publicationId, weekNumber - 1);
    const trend = this.calculateTrend(overallTrust, previousTrust);

    const metrics: DomainTrustMetrics = {
      id: BigInt(0),
      publication_id: publicationId,
      crawl_trust_score: crawlTrustScore,
      discovery_speed_score: discoverySpeedScore,
      index_velocity_score: indexVelocityScore,
      impression_velocity_score: impressionVelocityScore,
      click_velocity_score: clickVelocityScore,
      growth_consistency_score: growthConsistencyScore,
      content_freshness_score: contentFreshnessScore,
      technical_health_score: technicalHealthScore,
      overall_domain_trust: Math.min(100, Math.round(overallTrust * 100)),
      week_number: weekNumber,
      trend_direction: trend.direction,
      trend_percentage: trend.percentage,
      created_at: new Date(),
    };

    // Store in database
    await this.storeTrustMetrics(metrics);

    return metrics;
  }

  /**
   * 1. Crawl Trust (0-100): How often Googlebot visits
   * Higher = more frequent crawls = more trust
   */
  private async calculateCrawlTrust(publicationId: string): number {
    // Would integrate with GSC crawl stats
    // For now, estimate based on indexation rate
    const { data: articles } = await supabase
      .from('cluster_articles')
      .select('id')
      .eq('publication_id', publicationId);

    const totalArticles = articles?.length || 0;
    // Crawl trust: more content = more frequent crawls (up to 100)
    return Math.min(100, (totalArticles / 500) * 100);
  }

  /**
   * 2. Discovery Speed (0-100): Hours from first crawl to index
   * Lower hours = higher score
   */
  private async calculateDiscoverySpeed(publicationId: string): number {
    const { data: velocity } = await supabase
      .from('velocity_tracking')
      .select('publish_to_crawl_hours')
      .eq('publication_id', publicationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!velocity || velocity.length === 0) return 50;

    const avgHours = velocity.reduce((sum, v) => sum + (v.publish_to_crawl_hours || 48), 0) / velocity.length;
    // Ideal: <2 hours = 100, >48 hours = 0
    return Math.max(0, Math.min(100, 100 - (avgHours / 48) * 100));
  }

  /**
   * 3. Index Velocity (0-100): Hours from crawl to index
   * Faster indexing = higher trust
   */
  private async calculateIndexVelocity(publicationId: string): number {
    const { data: velocity } = await supabase
      .from('velocity_tracking')
      .select('crawl_to_index_hours')
      .eq('publication_id', publicationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!velocity || velocity.length === 0) return 50;

    const avgHours = velocity.reduce((sum, v) => sum + (v.crawl_to_index_hours || 24), 0) / velocity.length;
    // Ideal: <2 hours = 100, >48 hours = 0
    return Math.max(0, Math.min(100, 100 - (avgHours / 48) * 100));
  }

  /**
   * 4. Impression Velocity (0-100): Hours from index to SERP
   * Faster visibility = higher trust
   */
  private async calculateImpressionVelocity(publicationId: string): number {
    // Based on average time from index to first impression
    const { data: velocity } = await supabase
      .from('velocity_tracking')
      .select('index_to_impression_hours')
      .eq('publication_id', publicationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!velocity || velocity.length === 0) return 50;

    const avgHours = velocity.reduce((sum, v) => sum + (v.index_to_impression_hours || 72), 0) / velocity.length;
    // Ideal: <24 hours = 100, >192 hours = 0
    return Math.max(0, Math.min(100, 100 - (avgHours / 192) * 100));
  }

  /**
   * 5. Click Velocity (0-100): Hours from SERP to first click
   * Faster CTR achievement = higher trust
   */
  private async calculateClickVelocity(publicationId: string): number {
    const { data: velocity } = await supabase
      .from('velocity_tracking')
      .select('impression_to_click_hours')
      .eq('publication_id', publicationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!velocity || velocity.length === 0) return 50;

    const avgHours = velocity.reduce((sum, v) => sum + (v.impression_to_click_hours || 120), 0) / velocity.length;
    // Ideal: <48 hours = 100, >720 hours = 0
    return Math.max(0, Math.min(100, 100 - (avgHours / 720) * 100));
  }

  /**
   * 6. Growth Consistency (0-100): % of weeks showing improvement
   * Consistent growth = higher trust
   */
  private async calculateGrowthConsistency(publicationId: string): number {
    const { data: previousMetrics } = await supabase
      .from('domain_trust_metrics')
      .select('week_number, overall_domain_trust')
      .eq('publication_id', publicationId)
      .order('week_number', { ascending: false })
      .limit(12);

    if (!previousMetrics || previousMetrics.length < 2) return 50;

    let improvingWeeks = 0;
    for (let i = 1; i < previousMetrics.length; i++) {
      if (previousMetrics[i - 1].overall_domain_trust > (previousMetrics[i].overall_domain_trust || 0)) {
        improvingWeeks++;
      }
    }

    return (improvingWeeks / (previousMetrics.length - 1)) * 100;
  }

  /**
   * 7. Content Freshness (0-100): % of content recently updated
   */
  private async calculateContentFreshness(publicationId: string): number {
    const { data: content } = await supabase
      .from('content_freshness')
      .select('days_since_update')
      .eq('publication_id', publicationId);

    if (!content || content.length === 0) return 50;

    const fresh = content.filter((c) => c.days_since_update <= 90).length;
    return (fresh / content.length) * 100;
  }

  /**
   * 8. Technical Health (0-100): SEO score + Core Web Vitals
   */
  private async calculateTechnicalHealth(publicationId: string): number {
    // Would integrate with CWV + SEO audit data
    // For MVP: fixed score based on publication quality
    return 75;
  }

  /**
   * Calculate trend direction and percentage
   */
  private calculateTrend(
    current: number,
    previous?: number
  ): { direction: 'up' | 'stable' | 'down'; percentage: number } {
    if (!previous) {
      return { direction: 'stable', percentage: 0 };
    }

    const change = ((current - previous) / previous) * 100;

    if (change > 5) return { direction: 'up', percentage: change };
    if (change < -5) return { direction: 'down', percentage: change };
    return { direction: 'stable', percentage: change };
  }

  /**
   * Get trust score evolution over time
   */
  async getTrustEvolution(publicationId: string, weeks = 12): Promise<DomainTrustMetrics[]> {
    const { data: metrics, error } = await supabase
      .from('domain_trust_metrics')
      .select('*')
      .eq('publication_id', publicationId)
      .order('week_number', { ascending: false })
      .limit(weeks);

    if (error) throw error;
    return (metrics || []).reverse();
  }

  /**
   * Get actionable recommendations based on trust components
   */
  async getTrustRecommendations(metrics: DomainTrustMetrics): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.crawl_trust_score < 60) {
      recommendations.push('Increase crawlable content. Add more indexable pages.');
    }

    if (metrics.discovery_speed_score < 60) {
      recommendations.push('Improve URL discoverability. Optimize XML sitemaps and internal linking.');
    }

    if (metrics.index_velocity_score < 60) {
      recommendations.push('Speed up indexation. Reduce page load time and improve crawlability.');
    }

    if (metrics.impression_velocity_score < 60) {
      recommendations.push('Improve SERP visibility. Optimize for target keywords and CTR.');
    }

    if (metrics.click_velocity_score < 60) {
      recommendations.push('Improve CTR. Optimize titles, meta descriptions, and SERP presence.');
    }

    if (metrics.growth_consistency_score < 60) {
      recommendations.push('Focus on consistent improvement. Maintain regular content updates.');
    }

    if (metrics.content_freshness_score < 60) {
      recommendations.push('Increase content freshness. Update existing content regularly.');
    }

    if (metrics.technical_health_score < 70) {
      recommendations.push('Improve technical SEO. Fix crawl errors, optimize Core Web Vitals.');
    }

    return recommendations.length > 0
      ? recommendations
      : ['Continue current strategy. Trust metrics are healthy!'];
  }

  /**
   * Current week number (1-52)
   */
  private getCurrentWeekNumber(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  /**
   * Get previous trust score for comparison
   */
  private async getPreviousTrustScore(publicationId: string, weekNumber: number): Promise<number | null> {
    const { data } = await supabase
      .from('domain_trust_metrics')
      .select('overall_domain_trust')
      .eq('publication_id', publicationId)
      .eq('week_number', weekNumber)
      .single();

    return data?.overall_domain_trust || null;
  }

  /**
   * Store trust metrics
   */
  private async storeTrustMetrics(metrics: DomainTrustMetrics): Promise<void> {
    const { error } = await supabase.from('domain_trust_metrics').upsert(
      {
        publication_id: metrics.publication_id,
        crawl_trust_score: metrics.crawl_trust_score,
        discovery_speed_score: metrics.discovery_speed_score,
        index_velocity_score: metrics.index_velocity_score,
        impression_velocity_score: metrics.impression_velocity_score,
        click_velocity_score: metrics.click_velocity_score,
        growth_consistency_score: metrics.growth_consistency_score,
        content_freshness_score: metrics.content_freshness_score,
        technical_health_score: metrics.technical_health_score,
        overall_domain_trust: metrics.overall_domain_trust,
        week_number: metrics.week_number,
        trend_direction: metrics.trend_direction,
        trend_percentage: metrics.trend_percentage,
      },
      { onConflict: 'publication_id,week_number' }
    );

    if (error) throw error;
  }
}
