import { supabase } from '@/lib/supabase/client';

export interface CrawlBudgetWaste {
  category: 'not_found' | 'soft_404' | 'redirect' | 'duplicate';
  count: number;
  estimated_crawl_waste: number;
  examples: string[];
  potential_savings: number;
  fix_strategy: string;
}

export class CrawlBudgetAnalyzer {
  /**
   * Identify wasted crawl budget categories
   */
  async analyzeCrawlWaste(publicationId: string): Promise<{
    total_waste_urls: number;
    total_crawl_waste_percentage: number;
    by_category: CrawlBudgetWaste[];
    recommendations: string[];
  }> {
    // In production, would integrate with GSC data
    // For now, generate realistic sample data

    const wastes: CrawlBudgetWaste[] = [
      {
        category: 'not_found',
        count: Math.floor(Math.random() * 50) + 10,
        estimated_crawl_waste: Math.floor(Math.random() * 300) + 100,
        examples: [
          '/old-page-1',
          '/old-page-2',
          '/deprecated-path',
          '/test-page',
          '/staging-content',
        ],
        potential_savings: Math.floor(Math.random() * 200) + 50,
        fix_strategy: 'Remove or redirect these 404 pages. Implement proper redirects or removal.',
      },
      {
        category: 'soft_404',
        count: Math.floor(Math.random() * 30) + 5,
        estimated_crawl_waste: Math.floor(Math.random() * 150) + 50,
        examples: [
          '/products?id=invalid',
          '/user-404-page',
          '/empty-category',
          '/removed-post',
        ],
        potential_savings: Math.floor(Math.random() * 100) + 25,
        fix_strategy:
          'Mark soft 404s with X-Robots-Tag: noindex or add canonical tags.',
      },
      {
        category: 'redirect',
        count: Math.floor(Math.random() * 20) + 3,
        estimated_crawl_waste: Math.floor(Math.random() * 100) + 30,
        examples: ['/old-url-1 → /new-url-1', '/old-url-2 → /new-url-2'],
        potential_savings: Math.floor(Math.random() * 50) + 15,
        fix_strategy: 'Reduce redirect chains. Use direct redirects instead of chains.',
      },
      {
        category: 'duplicate',
        count: Math.floor(Math.random() * 40) + 10,
        estimated_crawl_waste: Math.floor(Math.random() * 200) + 60,
        examples: [
          '/page and /page?utm_source=google',
          '/product and /product?ref=nav',
          '/blog-post and /blog-post/',
        ],
        potential_savings: Math.floor(Math.random() * 120) + 40,
        fix_strategy:
          'Use canonical tags or URL parameters in GSC to consolidate duplicates.',
      },
    ];

    const totalWaste = wastes.reduce((sum, w) => sum + w.estimated_crawl_waste, 0);
    const totalUrls = wastes.reduce((sum, w) => sum + w.count, 0);

    return {
      total_waste_urls: totalUrls,
      total_crawl_waste_percentage: Math.round((totalWaste / 1000) * 100),
      by_category: wastes,
      recommendations: this.generateRecommendations(wastes),
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(wastes: CrawlBudgetWaste[]): string[] {
    const recommendations: string[] = [];

    // Sort by potential savings
    wastes.sort((a, b) => b.potential_savings - a.potential_savings);

    wastes.slice(0, 3).forEach((waste) => {
      recommendations.push(
        `Fix ${waste.category}: ${waste.fix_strategy} (Save ~${waste.potential_savings} crawls)`
      );
    });

    return recommendations;
  }

  /**
   * Calculate crawl budget efficiency
   */
  calculateEfficiency(publishedUrls: number, totalCrawls: number, waste: number): {
    efficiency_percentage: number;
    wasted_crawls: number;
    efficient_crawls: number;
    recommendation: string;
  } {
    const wastedCrawls = Math.round((totalCrawls * waste) / 100);
    const efficientCrawls = totalCrawls - wastedCrawls;
    const efficiency = Math.round((efficientCrawls / totalCrawls) * 100);

    let recommendation = 'Good crawl budget efficiency';
    if (efficiency < 70)
      recommendation = 'Urgent: Significant crawl budget waste detected';
    else if (efficiency < 80)
      recommendation = 'Improvement needed: Some crawl budget waste';

    return {
      efficiency_percentage: efficiency,
      wasted_crawls: wastedCrawls,
      efficient_crawls: efficientCrawls,
      recommendation,
    };
  }

  /**
   * Estimate impact of fixing crawl waste
   */
  estimateImpact(
    analysis: Awaited<ReturnType<typeof this.analyzeCrawlWaste>>
  ): {
    crawls_freed: number;
    new_crawlable_urls: number;
    estimated_new_indexed_urls: number;
    potential_traffic_gain: number;
  } {
    const totalSavings = analysis.by_category.reduce(
      (sum, c) => sum + c.potential_savings,
      0
    );

    return {
      crawls_freed: totalSavings,
      new_crawlable_urls: Math.round(totalSavings * 0.7),
      estimated_new_indexed_urls: Math.round(totalSavings * 0.5),
      potential_traffic_gain: Math.round(totalSavings * 1.5),
    };
  }

  /**
   * Priority order for fixing crawl waste
   */
  getPriorityFixes(
    analysis: Awaited<ReturnType<typeof this.analyzeCrawlWaste>>
  ): Array<CrawlBudgetWaste & { priority: 1 | 2 | 3 | 4 }> {
    const priorityMap = {
      not_found: 1,
      soft_404: 2,
      duplicate: 3,
      redirect: 4,
    };

    return analysis.by_category
      .map((w) => ({
        ...w,
        priority: priorityMap[w.category] as 1 | 2 | 3 | 4,
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate implementation checklist
   */
  getImplementationChecklist(
    category: 'not_found' | 'soft_404' | 'redirect' | 'duplicate'
  ): string[] {
    const checklists: Record<string, string[]> = {
      not_found: [
        'Export list of 404 URLs from GSC',
        'Identify which URLs can be redirected (301)',
        'Identify which URLs should return 410 (gone)',
        'Implement redirects in .htaccess or web server config',
        'Monitor GSC after 2-4 weeks for removal',
        'Verify crawl reduction in GSC coverage',
      ],
      soft_404: [
        'Identify soft 404 patterns (e.g., /products?id=invalid)',
        'Add X-Robots-Tag: noindex to soft 404 responses',
        'Or implement canonical tags pointing to home/category',
        'Test changes with URL Inspection in GSC',
        'Monitor crawl budget impact over 2 weeks',
      ],
      redirect: [
        'Audit existing redirect chains in GSC',
        'Identify chain patterns (A→B→C)',
        'Replace with direct redirects (A→C)',
        'Test all redirects with status code checker',
        'Update internal links to skip intermediate redirects',
        'Verify with redirect trace tool',
      ],
      duplicate: [
        'Identify URL parameter patterns in GSC',
        'Set URL parameter handling in GSC Search Console',
        'Implement canonical tags on duplicate pages',
        'Implement X-Robots-Tag: rel=canonical for dynamic versions',
        'Test canonical implementation',
        'Monitor crawl efficiency improvement',
      ],
    };

    return checklists[category] || [];
  }

  /**
   * Get crawl budget statistics
   */
  async getStatistics(publicationId: string): Promise<{
    total_indexable_urls: number;
    estimated_monthly_crawls: number;
    crawl_waste_percentage: number;
    efficiency_score: number;
  }> {
    const analysis = await this.analyzeCrawlWaste(publicationId);

    return {
      total_indexable_urls: 0, // Would be fetched from GSC
      estimated_monthly_crawls: 1000, // Would be calculated from GSC data
      crawl_waste_percentage: analysis.total_crawl_waste_percentage,
      efficiency_score: 100 - analysis.total_crawl_waste_percentage,
    };
  }
}
