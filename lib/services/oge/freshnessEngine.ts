import { supabase } from '@/lib/supabase/client';
import { ContentFreshness, FreshnessOpportunity } from '@/types/oge';

export class FreshnessEngine {
  /**
   * Calculate freshness score based on last update
   * Score ranges 0-100, where 100 = very fresh, 0 = very stale
   */
  calculateFreshnessScore(daysSinceUpdate: number, position: number): number {
    // Fresh content (0-30 days) = high score
    if (daysSinceUpdate <= 30) return 90 + Math.random() * 10;

    // Somewhat stale (30-90 days) = medium score
    if (daysSinceUpdate <= 90) return 60 + (90 - daysSinceUpdate) / 3;

    // Very stale (90+ days) = low score
    const veryStaleDeduction = Math.min(60, (daysSinceUpdate - 90) / 10);
    return Math.max(10, 50 - veryStaleDeduction);
  }

  /**
   * Predict impact of updating content
   * Returns estimated impression gain percentage
   */
  predictUpdateImpact(
    currentPosition: number,
    daysSinceUpdate: number,
    currentCTRTrend: number
  ): number {
    // Decay impact = how much freshness could help
    const decayFactor = Math.min(15, (daysSinceUpdate - 30) / 10);

    // Position factor = top positions benefit more
    const positionFactor = Math.max(0, (10 - currentPosition) / 10);

    // Trend factor = declining content benefits more from updates
    const trendFactor = Math.max(0, -currentCTRTrend * 5);

    // Combined impact prediction: 5% - 30%
    const baseImpact = 8;
    const totalImpact = baseImpact + decayFactor + positionFactor * 10 + trendFactor;

    return Math.min(30, Math.max(5, totalImpact));
  }

  /**
   * Detect outdated content
   */
  async detectOutdatedContent(publicationId: string): Promise<FreshnessOpportunity[]> {
    const { data: contentItems, error } = await supabase
      .from('content_freshness')
      .select('*')
      .eq('publication_id', publicationId)
      .filter('days_since_update', 'gt', 30)
      .order('days_since_update', { ascending: false });

    if (error) throw error;

    return (contentItems || [])
      .map((item) => ({
        url: item.url,
        days_since_update: item.days_since_update,
        freshness_score: item.freshness_score,
        position: item.position,
        impressions: item.impressions,
        ctr_trend: item.ctr_trend,
        potential_impression_gain: Math.round(
          item.impressions * (this.predictUpdateImpact(
            item.position,
            item.days_since_update,
            item.ctr_trend
          ) / 100)
        ),
        confidence: this.calculateConfidence(
          item.days_since_update,
          item.impressions
        ),
        priority: this.calculateFreshnessPriority(
          item.position,
          item.days_since_update,
          item.impressions
        ),
      }))
      .sort((a, b) => b.potential_impression_gain - a.potential_impression_gain);
  }

  /**
   * Calculate confidence score for prediction
   */
  private calculateConfidence(daysSinceUpdate: number, impressions: number): number {
    // More data (impressions) = higher confidence
    // Older content = higher confidence in prediction
    const ageConfidence = Math.min(0.9, daysSinceUpdate / 365);
    const dataConfidence = Math.min(0.8, impressions / 1000);

    return Math.min(1, ageConfidence + dataConfidence) * 100;
  }

  /**
   * Calculate freshness-based priority
   */
  private calculateFreshnessPriority(
    position: number,
    daysSinceUpdate: number,
    impressions: number
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    // High traffic + very stale + top position = CRITICAL
    if (impressions > 500 && daysSinceUpdate > 180 && position <= 5) {
      return 'CRITICAL';
    }

    // Stale and getting traffic = HIGH
    if (daysSinceUpdate > 90 && impressions > 100) return 'HIGH';

    // Somewhat stale = MEDIUM
    if (daysSinceUpdate > 30) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Correlate freshness with ranking changes
   * Shows if updating helps rankings
   */
  async correlateFreshnessWithRanking(
    publicationId: string,
    url: string,
    lookbackDays = 90
  ): Promise<{
    correlationStrength: number;
    freshnessImpactsRanking: boolean;
    recommendUpdate: boolean;
  }> {
    const { data: freshness, error: freshnessError } = await supabase
      .from('content_freshness')
      .select('*')
      .eq('publication_id', publicationId)
      .eq('url', url)
      .single();

    if (freshnessError) throw freshnessError;

    // In production, would correlate with historical ranking data
    // For now, use heuristics based on position and trend

    const positionImpactsPotential = freshness.position && freshness.position > 20;
    const trendIsNegative = freshness.ctr_trend && freshness.ctr_trend < -1;
    const hasGoodTraffic = (freshness.impressions || 0) > 50;

    const correlationStrength =
      (positionImpactsPotential ? 0.6 : 0.2) +
      (trendIsNegative ? 0.3 : 0) +
      (hasGoodTraffic ? 0.1 : 0);

    return {
      correlationStrength: Math.min(1, correlationStrength),
      freshnessImpactsRanking: correlationStrength > 0.4,
      recommendUpdate: correlationStrength > 0.5 && hasGoodTraffic,
    };
  }

  /**
   * Store or update content freshness data
   */
  async storeContentFreshness(data: {
    publication_id: string;
    url: string;
    last_update?: Date;
    position: number;
    impressions: number;
    ctr_trend: number;
  }): Promise<void> {
    const daysSinceUpdate = data.last_update
      ? Math.floor(
          (new Date().getTime() - new Date(data.last_update).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 365;

    const freshnessScore = this.calculateFreshnessScore(
      daysSinceUpdate,
      data.position
    );
    const updateRecommended = daysSinceUpdate > 90;
    const updatePotentialGain = Math.round(
      data.impressions *
        (this.predictUpdateImpact(
          data.position,
          daysSinceUpdate,
          data.ctr_trend
        ) / 100)
    );

    const { error } = await supabase.from('content_freshness').upsert(
      {
        publication_id: data.publication_id,
        url: data.url,
        last_update: data.last_update,
        days_since_update: daysSinceUpdate,
        freshness_score: freshnessScore,
        position: data.position,
        impressions: data.impressions,
        ctr_trend: data.ctr_trend,
        priority: this.calculateFreshnessPriority(
          data.position,
          daysSinceUpdate,
          data.impressions
        ),
        update_recommended: updateRecommended,
        update_potential_gain: updatePotentialGain,
      },
      { onConflict: 'publication_id,url' }
    );

    if (error) throw error;
  }

  /**
   * Track content update and its impact
   */
  async trackContentUpdate(
    publicationId: string,
    url: string,
    beforeMetrics: {
      impressions: number;
      clicks: number;
      position: number;
    },
    afterMetrics: {
      impressions: number;
      clicks: number;
      position: number;
    }
  ): Promise<void> {
    const { error } = await supabase.from('oge_action_logs').insert({
      publication_id: publicationId,
      action_type: 'content_updated',
      url,
      action_details: {
        update_type: 'freshness',
      },
      result_impressions_before: beforeMetrics.impressions,
      result_impressions_after: afterMetrics.impressions,
      result_position_before: beforeMetrics.position,
      result_position_after: afterMetrics.position,
      created_at: new Date(),
    });

    if (error) throw error;
  }

  /**
   * Get top freshness opportunities
   */
  async getTopFreshnessOpportunities(
    publicationId: string,
    limit = 10
  ): Promise<FreshnessOpportunity[]> {
    const opportunities = await this.detectOutdatedContent(publicationId);
    return opportunities
      .filter((opp) => opp.priority !== 'LOW')
      .slice(0, limit);
  }

  /**
   * Get freshness statistics
   */
  async getFreshnessStats(publicationId: string): Promise<{
    avgDaysSinceUpdate: number;
    avgFreshnessScore: number;
    veryStaleCount: number;
    staleCount: number;
    freshCount: number;
    totalContent: number;
  }> {
    const { data: content, error } = await supabase
      .from('content_freshness')
      .select('days_since_update, freshness_score')
      .eq('publication_id', publicationId);

    if (error) throw error;

    const total = (content || []).length;
    if (total === 0) {
      return {
        avgDaysSinceUpdate: 0,
        avgFreshnessScore: 0,
        veryStaleCount: 0,
        staleCount: 0,
        freshCount: 0,
        totalContent: 0,
      };
    }

    const avgDaysSinceUpdate = Math.round(
      (content || []).reduce((sum, c) => sum + c.days_since_update, 0) / total
    );

    const avgFreshnessScore = Math.round(
      (content || []).reduce((sum, c) => sum + c.freshness_score, 0) / total
    );

    const veryStaleCount = (content || []).filter(
      (c) => c.days_since_update > 180
    ).length;
    const staleCount = (content || []).filter(
      (c) => c.days_since_update > 90 && c.days_since_update <= 180
    ).length;
    const freshCount = (content || []).filter(
      (c) => c.days_since_update <= 30
    ).length;

    return {
      avgDaysSinceUpdate,
      avgFreshnessScore,
      veryStaleCount,
      staleCount,
      freshCount,
      totalContent: total,
    };
  }
}
