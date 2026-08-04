import { supabase } from '@/lib/supabase/client';
import { CTRAnalysis, CTRGap } from '@/types/oge';

export class CTROptimizationEngine {
  /**
   * Analyzes CTR gaps for all keywords in a publication
   * Gap = Expected CTR - Actual CTR
   * Expected CTR varies by position (lower positions = lower expected CTR)
   */
  async analyzeCTRGaps(publicationId: string): Promise<CTRGap[]> {
    const { data: analyses, error } = await supabase
      .from('ctr_analysis')
      .select('*')
      .eq('publication_id', publicationId)
      .order('gap', { ascending: false });

    if (error) throw error;

    return (analyses || [])
      .map((analysis) => ({
        keyword: analysis.keyword,
        position: analysis.position,
        current_ctr: analysis.ctr,
        expected_ctr: analysis.expected_ctr,
        gap_percentage: ((analysis.gap / analysis.expected_ctr) * 100) || 0,
        impressions: analysis.impressions,
        potential_clicks: Math.round(
          (analysis.expected_ctr / 100) * analysis.impressions -
            (analysis.ctr / 100) * analysis.impressions
        ),
        suggested_titles: analysis.ai_generated_titles || [],
        suggested_descriptions: analysis.ai_generated_descriptions || [],
        priority: this.calculatePriority(
          analysis.gap,
          analysis.impressions,
          analysis.position
        ),
      }))
      .filter((gap) => gap.gap_percentage > 0)
      .sort((a, b) => {
        const impactA = a.gap_percentage * a.impressions;
        const impactB = b.gap_percentage * b.impressions;
        return impactB - impactA;
      });
  }

  /**
   * Calculate expected CTR based on position
   * Uses empirical Google SERP data
   */
  getExpectedCTR(position: number): number {
    const expectedCTRByPosition: Record<number, number> = {
      1: 28.5,
      2: 15.7,
      3: 11.0,
      4: 8.0,
      5: 6.5,
      6: 5.5,
      7: 4.8,
      8: 4.3,
      9: 3.9,
      10: 3.5,
    };

    if (position <= 10) return expectedCTRByPosition[position] || 2.5;
    if (position <= 20) return 1.5;
    return 0.5;
  }

  /**
   * Generate AI title suggestions
   * In production, integrate with Claude API
   */
  generateTitleSuggestions(
    keyword: string,
    currentTitle: string,
    position: number
  ): string[] {
    const suggestions: string[] = [];

    // Pattern 1: Add number for authority
    if (!currentTitle.match(/\b(\d+)\b/)) {
      suggestions.push(`${currentTitle} (${new Date().getFullYear()})`);
      suggestions.push(`Best ${currentTitle} - 2024 Guide`);
    }

    // Pattern 2: Action-oriented
    suggestions.push(`How to ${keyword}: Complete Guide`);
    suggestions.push(`${keyword}: Complete ${new Date().getFullYear()} Guide`);

    // Pattern 3: Question format (better for positions 4-10)
    if (position > 3) {
      suggestions.push(`What is ${keyword}? Expert Guide`);
      suggestions.push(`${keyword}: Everything You Need to Know`);
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Generate AI meta description suggestions
   */
  generateDescriptionSuggestions(
    keyword: string,
    currentCTR: number,
    expectedCTR: number
  ): string[] {
    const suggestions: string[] = [];

    // Pattern 1: CTR-optimized (155-160 chars)
    suggestions.push(
      `Learn about ${keyword}. Discover practical tips, expert advice, and step-by-step guides to help you succeed. Start your journey today.`
    );

    // Pattern 2: Value proposition
    suggestions.push(
      `Expert guide to ${keyword}. Complete with strategies, best practices, and resources. Get started with actionable insights now.`
    );

    // Pattern 3: FOMO/Urgency
    suggestions.push(
      `Master ${keyword} with our comprehensive guide. Updated for today's market. Find proven strategies and expert tips inside.`
    );

    // Pattern 4: Question answer
    suggestions.push(
      `Looking for ${keyword}? We provide detailed explanations, comparisons, and recommendations. Everything you need to know.`
    );

    // Pattern 5: Benefit-focused
    suggestions.push(
      `Maximize your results with ${keyword}. Proven methods, expert insights, and practical tools to improve performance.`
    );

    return suggestions;
  }

  /**
   * Calculate priority based on impact potential
   */
  private calculatePriority(
    gap: number,
    impressions: number,
    position: number
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const impactScore = gap * impressions;

    if (position <= 3 && impactScore > 1000) return 'CRITICAL';
    if (impactScore > 1500) return 'CRITICAL';
    if (impactScore > 750) return 'HIGH';
    if (impactScore > 250) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Track title/description changes and their impact
   */
  async trackTitleImpact(
    publicationId: string,
    url: string,
    oldTitle: string,
    newTitle: string,
    beforeMetrics: { impressions: number; clicks: number; position: number },
    afterMetrics: { impressions: number; clicks: number; position: number }
  ): Promise<void> {
    const { error } = await supabase.from('oge_action_logs').insert({
      publication_id: publicationId,
      action_type: 'title_update',
      url,
      action_details: {
        old_title: oldTitle,
        new_title: newTitle,
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
   * Store CTR analysis for keyword
   */
  async storeCTRAnalysis(analysis: {
    publication_id: string;
    keyword: string;
    position: number;
    impressions: number;
    clicks: number;
    ctr: number;
  }): Promise<void> {
    const expected_ctr = this.getExpectedCTR(analysis.position);
    const gap = expected_ctr - analysis.ctr;

    const { error } = await supabase.from('ctr_analysis').upsert(
      {
        publication_id: analysis.publication_id,
        keyword: analysis.keyword,
        position: analysis.position,
        impressions: analysis.impressions,
        clicks: analysis.clicks,
        ctr: analysis.ctr,
        expected_ctr,
        gap,
        ai_generated_titles: this.generateTitleSuggestions(
          analysis.keyword,
          '',
          analysis.position
        ),
        ai_generated_descriptions: this.generateDescriptionSuggestions(
          analysis.keyword,
          analysis.ctr,
          expected_ctr
        ),
      },
      { onConflict: 'publication_id,keyword' }
    );

    if (error) throw error;
  }

  /**
   * Get top CTR optimization opportunities
   */
  async getTopOpportunities(publicationId: string, limit = 10): Promise<CTRGap[]> {
    const gaps = await this.analyzeCTRGaps(publicationId);
    return gaps.slice(0, limit);
  }
}
