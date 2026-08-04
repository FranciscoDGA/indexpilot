import { PerformanceStats, SearchPerformance } from '@/types/gsc';

export class PerformanceAnalyzer {
  constructor(private supabase: any) {}

  async analyzePerformance(
    publicationId: string,
    siteId: string,
    days: number = 30
  ): Promise<PerformanceStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (!data || data.length === 0) {
      return {
        total_impressions: 0,
        total_clicks: 0,
        avg_ctr: 0,
        avg_position: 0,
        trending_up_count: 0,
        trending_down_count: 0,
      };
    }

    const stats = this.calculateStats(data);
    return stats;
  }

  async detectAnomalies(
    publicationId: string,
    threshold: number = 2.0
  ): Promise<Array<{ date: string; anomaly: string; severity: string }>> {
    const anomalies: Array<{ date: string; anomaly: string; severity: string }> = [];

    const { data } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .order('date', { ascending: false })
      .limit(60);

    if (!data || data.length < 3) return anomalies;

    // Calculate rolling average and standard deviation
    const window = 7;
    for (let i = window; i < data.length; i++) {
      const windowData = data.slice(i - window, i);
      const avgImpressions =
        windowData.reduce((sum: number, d: SearchPerformance) => sum + d.impressions, 0) / window;
      const stdDev = Math.sqrt(
        windowData.reduce((sum: number, d: SearchPerformance) =>
          sum + Math.pow(d.impressions - avgImpressions, 2), 0
        ) / window
      );

      const current = data[i];
      const deviation =
        Math.abs(current.impressions - avgImpressions) / (stdDev || 1);

      if (deviation > threshold) {
        const direction = current.impressions > avgImpressions ? 'spike' : 'drop';
        anomalies.push({
          date: current.date,
          anomaly: `Impressions ${direction}: ${Math.round(
            deviation
          )}σ from average`,
          severity: deviation > threshold * 2 ? 'critical' : 'warning',
        });
      }
    }

    return anomalies;
  }

  async calculateTrend(
    publicationId: string,
    days: number = 7
  ): Promise<{ direction: string; change_percent: number }> {
    const { data } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .order('date', { ascending: false })
      .limit(days * 2);

    if (!data || data.length < 2) {
      return { direction: 'neutral', change_percent: 0 };
    }

    const recent = data.slice(0, days);
    const previous = data.slice(days, days * 2);

    const recentAvg =
      recent.reduce((sum: number, d: SearchPerformance) => sum + d.clicks, 0) / recent.length;
    const previousAvg =
      previous.reduce((sum: number, d: SearchPerformance) => sum + d.clicks, 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      change_percent: Math.round(change),
    };
  }

  async getKeywordOpportunities(
    publicationId: string,
    limit: number = 10
  ): Promise<Array<{ keyword: string; position: number; potential: string }>> {
    const { data } = await this.supabase
      .from('keyword_performance')
      .select('*')
      .eq('publication_id', publicationId)
      .gt('position', 10)
      .lt('position', 30)
      .order('impressions', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((kp: any) => ({
      keyword: kp.keyword,
      position: Math.round(kp.position),
      potential: this.calculatePotential(kp),
    }));
  }

  async getTopPerformingPages(
    siteId: string,
    limit: number = 10
  ): Promise<Array<{ url: string; impressions: number; clicks: number; ctr: number }>> {
    const { data } = await this.supabase
      .from('search_performance')
      .select('*')
      .eq('site_id', siteId)
      .order('clicks', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map((sp: SearchPerformance) => ({
      url: sp.publication_id,
      impressions: sp.impressions,
      clicks: sp.clicks,
      ctr: sp.ctr,
    }));
  }

  private calculateStats(data: SearchPerformance[]): PerformanceStats {
    const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0);
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
    const avgCtr =
      data.reduce((sum, d) => sum + d.ctr, 0) / data.length;
    const avgPosition =
      data.reduce((sum, d) => sum + d.avg_position, 0) / data.length;

    // Calculate trending
    const first = data[data.length - 1];
    const last = data[0];

    const trendingUp = last.clicks > first.clicks ? 1 : 0;
    const trendingDown = last.clicks < first.clicks ? 1 : 0;

    return {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      avg_ctr: Math.round(avgCtr * 100) / 100,
      avg_position: Math.round(avgPosition * 100) / 100,
      trending_up_count: trendingUp,
      trending_down_count: trendingDown,
    };
  }

  private calculatePotential(kp: any): string {
    const position = kp.position;
    const impressions = kp.impressions;

    if (position <= 5 && impressions > 1000) return 'Very High';
    if (position <= 10 && impressions > 500) return 'High';
    if (position <= 20 && impressions > 100) return 'Medium';
    return 'Low';
  }
}
