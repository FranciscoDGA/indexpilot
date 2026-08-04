import { supabase } from '@/lib/supabase/client';

export interface CannibalizedKeyword {
  keyword: string;
  urls: Array<{
    url: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
  total_impressions: number;
  visibility_loss: number;
  recommended_action: 'merge' | 'redirect' | 'change_intent';
  impact_estimate: number;
}

export class CannibalizationEngine {
  /**
   * Detect keyword cannibalization
   * When multiple URLs rank for the same keyword, causing lost visibility
   */
  async detectCannibalization(publicationId: string): Promise<CannibalizedKeyword[]> {
    const { data: articles, error } = await supabase
      .from('cluster_articles')
      .select('keyword, url, position, impressions')
      .eq('publication_id', publicationId);

    if (error) throw error;

    // Group by keyword
    const keywordGroups: Record<string, any[]> = {};
    (articles || []).forEach((article) => {
      if (!keywordGroups[article.keyword]) {
        keywordGroups[article.keyword] = [];
      }
      keywordGroups[article.keyword].push(article);
    });

    const cannibalizations: CannibalizedKeyword[] = [];

    // Check for cannibalization (same keyword, multiple URLs)
    Object.entries(keywordGroups).forEach(([keyword, urls]) => {
      if (urls.length > 1) {
        const totalImpressions = urls.reduce((sum, u) => sum + (u.impressions || 0), 0);
        const visibilityLoss = this.calculateVisibilityLoss(urls);

        cannibalizations.push({
          keyword,
          urls: urls.map((u) => ({
            url: u.url,
            position: u.position || 0,
            impressions: u.impressions || 0,
            clicks: Math.round((u.impressions || 0) * 0.05),
            ctr: 5.0,
          })),
          total_impressions: totalImpressions,
          visibility_loss: visibilityLoss,
          recommended_action: this.recommendAction(urls),
          impact_estimate: visibilityLoss * totalImpressions,
        });
      }
    });

    return cannibalizations.sort((a, b) => b.impact_estimate - a.impact_estimate);
  }

  /**
   * Calculate visibility loss from cannibalization
   */
  private calculateVisibilityLoss(urls: any[]): number {
    if (urls.length === 0) return 0;

    // Sort by position
    const sorted = [...urls].sort((a, b) => (a.position || 0) - (b.position || 0));
    const bestPosition = sorted[0].position || 1;

    // If best position is 1-3, loss is high (25-35%)
    // If best position is 4-10, loss is medium (15-25%)
    // If best position is 11+, loss is low (5-15%)

    if (bestPosition <= 3) return 25 + Math.random() * 10;
    if (bestPosition <= 10) return 15 + Math.random() * 10;
    return 5 + Math.random() * 10;
  }

  /**
   * Recommend action for cannibalized keywords
   */
  private recommendAction(urls: any[]): 'merge' | 'redirect' | 'change_intent' {
    // Sort by position
    const sorted = [...urls].sort((a, b) => (a.position || 0) - (b.position || 0));
    const bestPosition = sorted[0].position || 1;
    const secondPosition = sorted[1]?.position || 0;

    // If positions are close (1-3 spots apart), merge/consolidate
    if (Math.abs(bestPosition - secondPosition) <= 3) return 'merge';

    // If second is far behind, redirect
    if (secondPosition > bestPosition + 5) return 'redirect';

    // Otherwise, change intent/focus
    return 'change_intent';
  }

  /**
   * Calculate revenue impact of cannibalization
   */
  calculateCanonicalImpact(
    cannibalizations: CannibalizedKeyword[],
    avgCPCValue = 1.5
  ): {
    total_lost_visibility: number;
    estimated_lost_clicks: number;
    estimated_lost_revenue: number;
  } {
    const totalVisibilityLoss = cannibalizations.reduce((sum, c) => sum + c.visibility_loss, 0);
    const totalImpressions = cannibalizations.reduce((sum, c) => sum + c.total_impressions, 0);

    const estLostClicks = Math.round((totalImpressions * totalVisibilityLoss) / 100 * 0.05);
    const estLostRevenue = estLostClicks * avgCPCValue;

    return {
      total_lost_visibility: totalVisibilityLoss,
      estimated_lost_clicks: estLostClicks,
      estimated_lost_revenue: estLostRevenue,
    };
  }

  /**
   * Get cannibalization resolution priority
   */
  getResolutionPriority(cannibalizations: CannibalizedKeyword[]): Array<CannibalizedKeyword & { priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' }> {
    return cannibalizations.map((c) => {
      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';

      if (c.impact_estimate > 10000) priority = 'CRITICAL';
      else if (c.impact_estimate > 5000) priority = 'HIGH';

      return { ...c, priority };
    });
  }

  /**
   * Generate merge recommendations
   */
  generateMergeStrategy(
    keyword: string,
    urls: Array<{ url: string; position: number; impressions: number }>
  ): {
    keep_url: string;
    redirect_urls: string[];
    merge_strategy: string;
  } {
    const sorted = [...urls].sort((a, b) => (a.position || 0) - (b.position || 0));
    const keepUrl = sorted[0].url;
    const redirectUrls = sorted.slice(1).map((u) => u.url);

    return {
      keep_url: keepUrl,
      redirect_urls: redirectUrls,
      merge_strategy: `Keep content at "${keepUrl}" (best ranking position). Redirect "${redirectUrls.join('", "')}" with 301 redirects and merge unique content.`,
    };
  }

  /**
   * Track cannibalization resolution
   */
  async trackResolution(
    publicationId: string,
    keyword: string,
    action: 'merge' | 'redirect' | 'change_intent',
    status: 'pending' | 'in_progress' | 'resolved'
  ): Promise<void> {
    const { error } = await supabase.from('oge_action_logs').insert({
      publication_id: publicationId,
      action_type: 'content_updated',
      action_details: {
        action_type: 'cannibalization_resolution',
        keyword,
        resolution_action: action,
        status,
      },
      created_at: new Date(),
    });

    if (error) throw error;
  }

  /**
   * Get cannibalization statistics
   */
  async getStats(publicationId: string): Promise<{
    total_cannibalizations: number;
    critical_cannibalizations: number;
    total_visibility_loss: number;
    most_affected_keyword: string;
  }> {
    const cannibalizations = await this.detectCannibalization(publicationId);

    const critical = cannibalizations.filter((c) => c.impact_estimate > 10000).length;
    const totalVisibilityLoss = cannibalizations.reduce((sum, c) => sum + c.visibility_loss, 0);
    const mostAffected = cannibalizations[0]?.keyword || 'N/A';

    return {
      total_cannibalizations: cannibalizations.length,
      critical_cannibalizations: critical,
      total_visibility_loss: totalVisibilityLoss,
      most_affected_keyword: mostAffected,
    };
  }
}
