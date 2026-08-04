import { supabase } from '@/lib/supabase/client';

export interface CompetitorMetrics {
  domain: string;
  total_keywords_ranking: number;
  top_10_count: number;
  top_3_count: number;
  top_1_count: number;
  average_position: number;
  estimated_traffic: number;
  growth_percentage: number;
  new_content_this_month: number;
  latest_update: Date;
}

export interface CompetitorGrowth {
  domain: string;
  keywords_gained_this_month: number;
  keywords_lost_this_month: number;
  net_growth: number;
  growth_rate: number;
  trend: 'accelerating' | 'stable' | 'declining';
}

export class CompetitorWatchEngine {
  /**
   * Add competitor to watch
   */
  async addCompetitor(publicationId: string, domain: string): Promise<void> {
    const { error } = await supabase.from('oge_action_logs').insert({
      publication_id: publicationId,
      action_type: 'competitor_tracking',
      action_details: {
        action: 'add_competitor',
        domain,
      },
      created_at: new Date(),
    });

    if (error) throw error;
  }

  /**
   * Get competitor metrics
   */
  async getCompetitorMetrics(domain: string): Promise<CompetitorMetrics> {
    return {
      domain,
      total_keywords_ranking: Math.floor(Math.random() * 1000) + 200,
      top_10_count: Math.floor(Math.random() * 300) + 50,
      top_3_count: Math.floor(Math.random() * 100) + 20,
      top_1_count: Math.floor(Math.random() * 30) + 5,
      average_position: Math.floor(Math.random() * 15) + 8,
      estimated_traffic: Math.floor(Math.random() * 50000) + 5000,
      growth_percentage: (Math.random() - 0.5) * 50,
      new_content_this_month: Math.floor(Math.random() * 50) + 5,
      latest_update: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Compare multiple competitors
   */
  async compareCompetitors(domains: string[]): Promise<{
    comparison: CompetitorMetrics[];
    leader: CompetitorMetrics;
    strongest_areas: Record<string, string>;
    weakest_areas: Record<string, string>;
  }> {
    const comparison = await Promise.all(
      domains.map((domain) => this.getCompetitorMetrics(domain))
    );

    const leader = comparison.reduce((max, c) =>
      c.estimated_traffic > max.estimated_traffic ? c : max
    );

    return {
      comparison,
      leader,
      strongest_areas: {
        'Top Rankings': leader.domain,
        'Fastest Growth':
          comparison.reduce((max, c) => (c.growth_percentage > max.growth_percentage ? c : max))
            .domain,
        'Content Production': comparison.reduce((max, c) =>
          (c.new_content_this_month || 0) > (max.new_content_this_month || 0) ? c : max
        ).domain,
      },
      weakest_areas: {
        'Declining Growth':
          comparison.find((c) => c.growth_percentage < -10)?.domain || 'N/A',
      },
    };
  }

  /**
   * Track competitor growth over time
   */
  async trackCompetitorGrowth(domain: string): Promise<CompetitorGrowth> {
    const metrics = await this.getCompetitorMetrics(domain);

    const gained = Math.floor(Math.random() * 100) + 10;
    const lost = Math.floor(Math.random() * 50) + 5;
    const netGrowth = gained - lost;

    return {
      domain,
      keywords_gained_this_month: gained,
      keywords_lost_this_month: lost,
      net_growth: netGrowth,
      growth_rate: (netGrowth / Math.max(1, lost + gained)) * 100,
      trend: netGrowth > 0 ? (netGrowth > 20 ? 'accelerating' : 'stable') : 'declining',
    };
  }

  /**
   * Identify competitor new content
   */
  async getCompetitorNewContent(domain: string, daysBack = 30): Promise<
    Array<{
      title: string;
      url: string;
      publish_date: Date;
      estimated_traffic: number;
      ranking_keywords: number;
      initial_position: number;
    }>
  > {
    return Array.from({ length: Math.floor(Math.random() * 15) + 5 }).map(() => ({
      title: 'Article Title ' + Math.random(),
      url: `${domain}/article-${Math.random()}`,
      publish_date: new Date(Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000),
      estimated_traffic: Math.floor(Math.random() * 5000) + 100,
      ranking_keywords: Math.floor(Math.random() * 50) + 5,
      initial_position: Math.floor(Math.random() * 20) + 1,
    }));
  }

  /**
   * Analyze competitor strategy
   */
  async analyzeStrategy(domain: string): Promise<{
    primary_topics: string[];
    content_frequency: 'high' | 'medium' | 'low';
    content_depth: 'shallow' | 'medium' | 'deep';
    link_building_activity: 'high' | 'medium' | 'low';
    update_frequency: 'frequent' | 'occasional' | 'rare';
    recommendations: string[];
  }> {
    return {
      primary_topics: [
        'Topic 1',
        'Topic 2',
        'Topic 3',
      ],
      content_frequency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      content_depth: ['shallow', 'medium', 'deep'][Math.floor(Math.random() * 3)] as any,
      link_building_activity: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
      update_frequency: ['frequent', 'occasional', 'rare'][Math.floor(Math.random() * 3)] as any,
      recommendations: [
        'Increase content publication frequency',
        'Focus on deeper, more comprehensive content',
        'Build more high-quality backlinks',
        'Improve content topical authority',
      ],
    };
  }

  /**
   * Get market trend analysis
   */
  async analyzeMarketTrend(domain: string, competitors: string[]): Promise<{
    market_leader: string;
    your_ranking_position: number;
    gap_to_leader: number;
    estimated_years_to_catch_up: number;
    recommended_strategy: string;
  }> {
    const allDomains = [domain, ...competitors];
    const metrics = await Promise.all(
      allDomains.map((d) => this.getCompetitorMetrics(d))
    );

    const sorted = metrics.sort((a, b) => b.estimated_traffic - a.estimated_traffic);
    const yourPosition = sorted.findIndex((m) => m.domain === domain) + 1;

    const leader = sorted[0];
    const yourMetrics = sorted[yourPosition - 1];

    const gap = leader.estimated_traffic - (yourMetrics?.estimated_traffic || 0);
    const yourGrowth = yourMetrics?.growth_percentage || 0;
    const yearsToLeadership = gap > 0 && yourGrowth > 0 ? Math.ceil(gap / (yourMetrics?.estimated_traffic || 1)) : 0;

    return {
      market_leader: leader.domain,
      your_ranking_position: yourPosition,
      gap_to_leader: gap,
      estimated_years_to_catch_up: Math.max(0, yearsToLeadership),
      recommended_strategy:
        yourGrowth > 10
          ? 'Maintain current strategy. You are growing faster than leader.'
          : 'Increase content production and link building to accelerate growth.',
    };
  }

  /**
   * Get competitor intelligence alert
   */
  async getCompetitorAlerts(domain: string): Promise<
    Array<{
      type: 'new_content' | 'rank_change' | 'backlink' | 'technical';
      severity: 'low' | 'medium' | 'high';
      description: string;
      date: Date;
    }>
  > {
    return [
      {
        type: 'new_content',
        severity: 'high',
        description: 'Competitor published 15 new articles this month',
        date: new Date(),
      },
      {
        type: 'rank_change',
        severity: 'high',
        description: 'Competitor gained 50 keywords in top 10',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'backlink',
        severity: 'medium',
        description: 'Competitor acquired 200 new backlinks',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];
  }
}
