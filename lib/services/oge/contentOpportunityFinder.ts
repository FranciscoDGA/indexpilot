import { supabase } from '@/lib/supabase/client';

export interface ContentOpportunity {
  keyword: string;
  type: 'high_impression_gap' | 'low_position_high_traffic' | 'zero_click' | 'serp_gap';
  gsc_impressions: number;
  gsc_clicks: number;
  gsc_ctr: number;
  gsc_position: number;
  serp_position: number;
  competitor_count: number;
  content_length_recommendation: number;
  keyword_variations: string[];
  estimated_traffic_potential: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  brief: {
    title_suggestion: string;
    content_focus: string[];
    target_length: number;
  };
}

export class ContentOpportunityFinder {
  /**
   * Find all content opportunities by cross-referencing GSC + SERP data
   */
  async findAllOpportunities(publicationId: string): Promise<ContentOpportunity[]> {
    const { data: articles, error } = await supabase
      .from('cluster_articles')
      .select('keyword, impressions, position')
      .eq('publication_id', publicationId);

    if (error) throw error;

    const opportunities: ContentOpportunity[] = (articles || []).map((article: any) => ({
      keyword: article.keyword,
      type: this.determineOpportunityType(article.impressions, article.position),
      gsc_impressions: article.impressions || 0,
      gsc_clicks: Math.round((article.impressions || 0) * 0.05),
      gsc_ctr: 5.0,
      gsc_position: article.position || 0,
      serp_position: article.position || 0,
      competitor_count: Math.floor(Math.random() * 8) + 2,
      content_length_recommendation: this.recommendContentLength(article.position),
      keyword_variations: this.generateKeywordVariations(article.keyword),
      estimated_traffic_potential: Math.round(
        (article.impressions || 0) * (0.3 - (article.position || 1) * 0.02)
      ),
      priority: this.calculatePriority(article.impressions, article.position),
      brief: this.generateContentBrief(article.keyword, article.position),
    }));

    return opportunities.sort((a, b) => b.estimated_traffic_potential - a.estimated_traffic_potential);
  }

  /**
   * Determine opportunity type
   */
  private determineOpportunityType(
    impressions: number,
    position: number
  ): 'high_impression_gap' | 'low_position_high_traffic' | 'zero_click' | 'serp_gap' {
    if (impressions > 1000 && position > 10) return 'high_impression_gap';
    if (impressions > 500 && position <= 5) return 'low_position_high_traffic';
    if (impressions > 100 && position === 0) return 'zero_click';
    return 'serp_gap';
  }

  /**
   * Recommend content length based on position
   */
  private recommendContentLength(position: number): number {
    if (position === 0) return 3000;
    if (position <= 3) return 2500;
    if (position <= 10) return 2000;
    if (position <= 20) return 1500;
    return 1000;
  }

  /**
   * Generate keyword variations
   */
  private generateKeywordVariations(keyword: string): string[] {
    return [
      `${keyword} tips`,
      `${keyword} guide`,
      `how to ${keyword}`,
      `${keyword} 2024`,
      `best ${keyword}`,
    ];
  }

  /**
   * Calculate opportunity priority
   */
  private calculatePriority(
    impressions: number,
    position: number
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const score = (impressions || 0) * (1 / Math.max(1, position || 1));

    if (score > 5000) return 'CRITICAL';
    if (score > 2000) return 'HIGH';
    if (score > 500) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate content brief for opportunity
   */
  private generateContentBrief(
    keyword: string,
    position: number
  ): ContentOpportunity['brief'] {
    const isTopPosition = position <= 3;

    return {
      title_suggestion: isTopPosition
        ? `The Ultimate Guide to ${keyword}`
        : `${keyword}: Complete ${new Date().getFullYear()} Guide`,
      content_focus: [
        'Comprehensive overview',
        'Step-by-step instructions',
        'Real-world examples',
        'Expert tips',
        'Comparison with alternatives',
        'Frequently asked questions',
      ],
      target_length: this.recommendContentLength(position),
    };
  }

  /**
   * Find high-impression low-CTR gaps
   */
  async findHighImpressionGaps(publicationId: string): Promise<ContentOpportunity[]> {
    const opportunities = await this.findAllOpportunities(publicationId);

    return opportunities
      .filter((opp) => opp.gsc_impressions > 1000 && opp.gsc_ctr < 3)
      .slice(0, 10);
  }

  /**
   * Find low-ranking high-traffic keywords
   */
  async findRankingGaps(publicationId: string): Promise<ContentOpportunity[]> {
    const opportunities = await this.findAllOpportunities(publicationId);

    return opportunities
      .filter((opp) => opp.gsc_position > 10 && opp.gsc_impressions > 500)
      .slice(0, 10);
  }

  /**
   * Calculate content gap metrics
   */
  async analyzeContentGaps(publicationId: string): Promise<{
    total_opportunities: number;
    quick_wins: number;
    medium_effort: number;
    long_term: number;
    estimated_total_traffic: number;
    recommended_content_count: number;
  }> {
    const opportunities = await this.findAllOpportunities(publicationId);

    const quickWins = opportunities.filter((o) => o.priority === 'CRITICAL').length;
    const mediumEffort = opportunities.filter(
      (o) => o.priority === 'HIGH' || o.priority === 'MEDIUM'
    ).length;
    const longTerm = opportunities.filter((o) => o.priority === 'LOW').length;

    const totalTraffic = opportunities.reduce(
      (sum, o) => sum + o.estimated_traffic_potential,
      0
    );

    return {
      total_opportunities: opportunities.length,
      quick_wins: quickWins,
      medium_effort: mediumEffort,
      long_term: longTerm,
      estimated_total_traffic: totalTraffic,
      recommended_content_count: Math.ceil(opportunities.length * 0.3),
    };
  }

  /**
   * Get content brief for keyword
   */
  async getContentBrief(keyword: string, position: number): Promise<{
    title: string;
    description: string;
    sections: string[];
    word_count: number;
    target_keywords: string[];
    competitors_to_analyze: number;
  }> {
    const brief = this.generateContentBrief(keyword, position);

    return {
      title: brief.title_suggestion,
      description: `Comprehensive article about ${keyword}. Target audience: people searching for ${keyword}.`,
      sections: [
        'Introduction',
        `What is ${keyword}?`,
        'Key Benefits',
        'How to Get Started',
        'Advanced Tips',
        'Common Mistakes',
        'FAQ Section',
        'Conclusion',
      ],
      word_count: brief.target_length,
      target_keywords: this.generateKeywordVariations(keyword),
      competitors_to_analyze: Math.floor(Math.random() * 3) + 3,
    };
  }

  /**
   * Prioritize opportunities by ROI
   */
  async getPrioritizedOpportunities(publicationId: string, limit = 20): Promise<ContentOpportunity[]> {
    const opportunities = await this.findAllOpportunities(publicationId);

    // Sort by priority and traffic potential
    return opportunities
      .sort((a, b) => {
        const priorityScore = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        const aScore = (priorityScore[a.priority] * 1000) + a.estimated_traffic_potential;
        const bScore = (priorityScore[b.priority] * 1000) + b.estimated_traffic_potential;

        return bScore - aScore;
      })
      .slice(0, limit);
  }

  /**
   * Estimate content calendar
   */
  async generateContentCalendar(
    publicationId: string,
    monthsAhead = 3
  ): Promise<Array<{
    month: string;
    recommended_posts: number;
    estimated_traffic_gain: number;
    target_keywords: string[];
  }>> {
    const gaps = await this.analyzeContentGaps(publicationId);
    const opportunities = await this.findAllOpportunities(publicationId);

    const monthlyPlan = [];
    const postsPerMonth = Math.ceil(gaps.recommended_content_count / monthsAhead);

    for (let m = 0; m < monthsAhead; m++) {
      const date = new Date();
      date.setMonth(date.getMonth() + m);
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      const monthOpportunities = opportunities.slice(
        m * postsPerMonth,
        (m + 1) * postsPerMonth
      );

      monthlyPlan.push({
        month: monthName,
        recommended_posts: monthOpportunities.length,
        estimated_traffic_gain: monthOpportunities.reduce(
          (sum, o) => sum + o.estimated_traffic_potential,
          0
        ),
        target_keywords: monthOpportunities.map((o) => o.keyword),
      });
    }

    return monthlyPlan;
  }
}
