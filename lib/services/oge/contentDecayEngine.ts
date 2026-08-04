import { supabase } from '@/lib/supabase/client';
import { ContentDecay, DecayAlert } from '@/types/oge';

export class ContentDecayEngine {
  /**
   * Detect content decay (gradual performance decline)
   * Compares metrics over 90-30-7 day windows
   */
  async detectContentDecay(
    publicationId: string,
    metricType: 'impressions' | 'clicks' | 'ctr' | 'position' = 'impressions'
  ): Promise<DecayAlert[]> {
    const { data: decayItems, error } = await supabase
      .from('content_decay_tracking')
      .select('*')
      .eq('publication_id', publicationId)
      .eq('metric_type', metricType)
      .eq('trend', 'declining')
      .order('alert_level', { ascending: false })
      .order('decay_percentage', { ascending: false });

    if (error) throw error;

    return (decayItems || []).map((item) => ({
      url: item.url,
      metric_type: item.metric_type as
        | 'impressions'
        | 'clicks'
        | 'ctr'
        | 'position',
      current_value: item.value_today || 0,
      value_30d_ago: item.value_30d_ago || 0,
      decay_percentage: item.decay_percentage,
      alert_level: item.alert_level as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      root_cause: item.root_cause || 'Unknown',
      recovery_recommendation: item.recovery_recommendation || 'Review content quality',
      priority: this.calculateDecayPriority(
        item.decay_percentage,
        item.alert_level as string
      ),
    }));
  }

  /**
   * Analyze decay trend over time
   */
  private analyzeTrend(
    value90dAgo?: number,
    value30dAgo?: number,
    valueToday?: number
  ): 'improving' | 'stable' | 'declining' {
    if (!value30dAgo || !valueToday) return 'stable';

    const change30d = valueToday - (value30dAgo || 0);

    if (change30d > valueToday * 0.05) return 'improving';
    if (change30d < -valueToday * 0.05) return 'declining';
    return 'stable';
  }

  /**
   * Calculate decay percentage
   */
  private calculateDecayPercentage(
    value30dAgo?: number,
    valueToday?: number
  ): number {
    if (!value30dAgo || value30dAgo === 0) return 0;

    const decline = (value30dAgo - (valueToday || 0)) / value30dAgo;
    return Math.max(0, decline * 100);
  }

  /**
   * Analyze root causes of decay
   */
  analyzeRootCauses(
    metricType: string,
    decayPercentage: number,
    ctrTrend?: number,
    positionTrend?: number
  ): string {
    if (metricType === 'impressions') {
      if (positionTrend && positionTrend > 2) {
        return 'Position declined significantly, causing impression loss';
      }
      if (decayPercentage > 30) {
        return 'Potential algorithmic rank drop or SERP competition increased';
      }
      return 'Gradual impression decline, likely due to age/staleness';
    }

    if (metricType === 'clicks') {
      if (ctrTrend && ctrTrend < -2) {
        return 'CTR dropped significantly, check title/description effectiveness';
      }
      return 'Click decline due to impression loss or lowered CTR';
    }

    if (metricType === 'ctr') {
      return 'CTR decline likely due to SERP layout changes or increased competition';
    }

    if (metricType === 'position') {
      return 'Ranking decline suggests content is becoming outdated or competition strengthened';
    }

    return 'Unknown decay cause';
  }

  /**
   * Generate recovery recommendations
   */
  generateRecoveryRecommendation(
    metricType: string,
    decayPercentage: number,
    daysSinceDecay?: number
  ): string {
    const isRecent = (daysSinceDecay || 0) < 30;

    if (metricType === 'impressions' || metricType === 'position') {
      return isRecent
        ? 'Update content with latest information and optimize for target keyword'
        : 'Perform comprehensive content refresh with new data, examples, and improved SEO';
    }

    if (metricType === 'clicks') {
      return isRecent
        ? 'Test new title and meta description variants to improve CTR'
        : 'Rewrite title and description with power words and clear value proposition';
    }

    if (metricType === 'ctr') {
      return 'A/B test title variations, add numbers/emojis, emphasize benefits in SERP snippet';
    }

    return 'Review content quality, competitor offerings, and update if necessary';
  }

  /**
   * Calculate alert level based on decay severity
   */
  private calculateAlertLevel(
    decayPercentage: number,
    isRecent: boolean
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (isRecent && decayPercentage > 50) return 'CRITICAL';
    if (decayPercentage > 30) return 'CRITICAL';
    if (decayPercentage > 20) return 'HIGH';
    if (decayPercentage > 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate decay priority
   */
  private calculateDecayPriority(
    decayPercentage: number,
    alertLevel: string
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (alertLevel === 'CRITICAL') return 'CRITICAL';
    if (alertLevel === 'HIGH' && decayPercentage > 25) return 'CRITICAL';
    if (alertLevel === 'HIGH') return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Store decay analysis
   */
  async storeDecayAnalysis(data: {
    publication_id: string;
    url: string;
    metric_type: 'impressions' | 'clicks' | 'ctr' | 'position';
    value_90d_ago?: number;
    value_30d_ago?: number;
    value_today: number;
    ctr_trend?: number;
    position_trend?: number;
  }): Promise<void> {
    const decayPercentage = this.calculateDecayPercentage(
      data.value_30d_ago,
      data.value_today
    );
    const trend = this.analyzeTrend(
      data.value_90d_ago,
      data.value_30d_ago,
      data.value_today
    );
    const daysSinceDecay = 15; // Would calculate from actual data in production
    const alertLevel = this.calculateAlertLevel(decayPercentage, daysSinceDecay < 30);

    const rootCause = this.analyzeRootCauses(
      data.metric_type,
      decayPercentage,
      data.ctr_trend,
      data.position_trend
    );

    const recoveryRecommendation = this.generateRecoveryRecommendation(
      data.metric_type,
      decayPercentage,
      daysSinceDecay
    );

    const { error } = await supabase.from('content_decay_tracking').upsert(
      {
        publication_id: data.publication_id,
        url: data.url,
        metric_type: data.metric_type,
        value_90d_ago: data.value_90d_ago,
        value_30d_ago: data.value_30d_ago,
        value_today: data.value_today,
        decay_percentage: decayPercentage,
        trend,
        decay_start_date: new Date(),
        alert_level: alertLevel,
        root_cause: rootCause,
        recovery_recommendation: recoveryRecommendation,
      },
      { onConflict: 'publication_id,url,metric_type' }
    );

    if (error) throw error;
  }

  /**
   * Get critical decay alerts
   */
  async getCriticalDecayAlerts(publicationId: string): Promise<DecayAlert[]> {
    const { data: alerts, error } = await supabase
      .from('content_decay_tracking')
      .select('*')
      .eq('publication_id', publicationId)
      .eq('alert_level', 'CRITICAL')
      .order('decay_percentage', { ascending: false });

    if (error) throw error;

    return (alerts || []).map((alert) => ({
      url: alert.url,
      metric_type: alert.metric_type as
        | 'impressions'
        | 'clicks'
        | 'ctr'
        | 'position',
      current_value: alert.value_today || 0,
      value_30d_ago: alert.value_30d_ago || 0,
      decay_percentage: alert.decay_percentage,
      alert_level: alert.alert_level as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      root_cause: alert.root_cause || 'Unknown',
      recovery_recommendation:
        alert.recovery_recommendation || 'Review and update content',
      priority: 'CRITICAL' as const,
    }));
  }

  /**
   * Get decay statistics
   */
  async getDecayStats(publicationId: string): Promise<{
    contentInDecay: number;
    criticalAlerts: number;
    highAlerts: number;
    avgDecayPercentage: number;
    mostCommonRootCause: string;
  }> {
    const { data: allDecay, error } = await supabase
      .from('content_decay_tracking')
      .select('alert_level, decay_percentage, root_cause, trend')
      .eq('publication_id', publicationId)
      .eq('trend', 'declining');

    if (error) throw error;

    const items = allDecay || [];
    const contentInDecay = items.length;
    const criticalAlerts = items.filter((i) => i.alert_level === 'CRITICAL').length;
    const highAlerts = items.filter((i) => i.alert_level === 'HIGH').length;
    const avgDecayPercentage =
      contentInDecay > 0
        ? Math.round(
            items.reduce((sum, i) => sum + i.decay_percentage, 0) / contentInDecay
          )
        : 0;

    // Find most common root cause
    const causes = items.map((i) => i.root_cause || 'Unknown');
    const causeCounts: Record<string, number> = {};
    causes.forEach((cause) => {
      causeCounts[cause] = (causeCounts[cause] || 0) + 1;
    });

    const mostCommonRootCause =
      Object.entries(causeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'Unknown';

    return {
      contentInDecay,
      criticalAlerts,
      highAlerts,
      avgDecayPercentage,
      mostCommonRootCause,
    };
  }

  /**
   * Track decay recovery (content improvement)
   */
  async trackDecayRecovery(
    publicationId: string,
    url: string,
    metricType: string,
    beforeValue: number,
    afterValue: number
  ): Promise<void> {
    const { error } = await supabase.from('oge_action_logs').insert({
      publication_id: publicationId,
      action_type: 'content_updated',
      url,
      action_details: {
        action_type: 'decay_recovery',
        metric_type: metricType,
        before_value: beforeValue,
        after_value: afterValue,
      },
      result_impressions_before: metricType === 'impressions' ? beforeValue : 0,
      result_impressions_after: metricType === 'impressions' ? afterValue : 0,
      created_at: new Date(),
    });

    if (error) throw error;

    // Mark decay as resolved if recovered
    if (afterValue > beforeValue) {
      await supabase
        .from('content_decay_tracking')
        .update({ trend: 'improving' })
        .eq('publication_id', publicationId)
        .eq('url', url)
        .eq('metric_type', metricType);
    }
  }

  /**
   * Get content by decay stage
   */
  async getContentByDecayStage(publicationId: string): Promise<{
    stableContent: number;
    decliningContent: number;
    improvingContent: number;
  }> {
    const { data: allContent, error } = await supabase
      .from('content_decay_tracking')
      .select('trend')
      .eq('publication_id', publicationId);

    if (error) throw error;

    const trends = (allContent || []).map((c) => c.trend);
    const uniqueUrls = new Set(trends);

    return {
      stableContent: (allContent || []).filter((c) => c.trend === 'stable').length,
      decliningContent: (allContent || []).filter(
        (c) => c.trend === 'declining'
      ).length,
      improvingContent: (allContent || []).filter(
        (c) => c.trend === 'improving'
      ).length,
    };
  }
}
