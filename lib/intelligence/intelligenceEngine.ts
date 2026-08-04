import { Insight, Recommendation, SeoHealthScore, Priority, Impact, Effort } from '@/types/intelligence';
import { RankingDetector } from './detectors/rankingDetector';
import { CtrDetector } from './detectors/ctrDetector';
import { IndexationDetector } from './detectors/indexationDetector';
import { CrawlDetector } from './detectors/crawlDetector';
import { ContentDetector } from './detectors/contentDetector';

export class IntelligenceEngine {
  private supabaseClient: any;
  private rankingDetector: RankingDetector;
  private ctrDetector: CtrDetector;
  private indexationDetector: IndexationDetector;
  private crawlDetector: CrawlDetector;
  private contentDetector: ContentDetector;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.rankingDetector = new RankingDetector(supabaseClient);
    this.ctrDetector = new CtrDetector(supabaseClient);
    this.indexationDetector = new IndexationDetector(supabaseClient);
    this.crawlDetector = new CrawlDetector(supabaseClient);
    this.contentDetector = new ContentDetector(supabaseClient);
  }

  async generateInsights(publicationId: string): Promise<Insight[]> {
    try {
      const allInsights: Insight[] = [];

      const rankingInsights = await Promise.all([
        this.rankingDetector.detectNearTopTen(publicationId),
        this.rankingDetector.detectRankingDecline(publicationId),
        this.rankingDetector.detectTopThreeEntry(publicationId),
      ]);

      const ctrInsights = await Promise.all([
        this.ctrDetector.detectVeryLowCtr(publicationId),
        this.ctrDetector.detectCtrDecline(publicationId),
        this.ctrDetector.detectHighImpressionLowCtr(publicationId),
      ]);

      const indexationInsights = await Promise.all([
        this.indexationDetector.detectNeverIndexed(publicationId),
        this.indexationDetector.detectLostIndexation(publicationId),
        this.indexationDetector.detectSlowIndexation(publicationId),
        this.indexationDetector.detectFastIndexation(publicationId),
      ]);

      const crawlInsights = await Promise.all([
        this.crawlDetector.detectCrawlStopped(publicationId),
        this.crawlDetector.detectCrawlIncreased(publicationId),
        this.crawlDetector.detectRecurringCrawlErrors(publicationId),
      ]);

      const contentInsights = await Promise.all([
        this.contentDetector.detectOutdatedContent(publicationId),
        this.contentDetector.detectOrphanPages(publicationId),
        this.contentDetector.detectMissingSchema(publicationId),
        this.contentDetector.detectBadFeaturedImage(publicationId),
      ]);

      allInsights.push(
        ...rankingInsights.flat(),
        ...ctrInsights.flat(),
        ...indexationInsights.flat(),
        ...crawlInsights.flat(),
        ...contentInsights.flat()
      );

      return allInsights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  async prioritizeInsights(insights: Insight[]): Promise<Insight[]> {
    const priorityOrder: Record<Priority, number> = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
    };

    return insights.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async generateRecommendations(insights: Insight[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const seenCategories = new Set<string>();

    for (const insight of insights) {
      const category = insight.type.split('_')[0];
      const key = `${insight.publication_id}-${category}`;

      if (seenCategories.has(key)) continue;
      seenCategories.add(key);

      const score = this.calculateRoiScore(insight.estimated_impact, insight.estimated_effort);

      recommendations.push({
        publication_id: insight.publication_id,
        site_id: insight.site_id,
        user_id: insight.user_id,
        category,
        title: insight.title,
        description: insight.description,
        score,
        estimated_impact: insight.estimated_impact,
        estimated_effort: insight.estimated_effort,
        action_items: [
          insight.recommendation,
          ...this.getActionItems(insight.type),
        ],
        status: 'active',
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  calculateRoiScore(impact: Impact, effort: Effort): number {
    const impactScores: Record<Impact, number> = {
      VERY_HIGH: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25,
    };

    const effortScores: Record<Effort, number> = {
      '5_MIN': 100,
      '15_MIN': 75,
      '30_MIN': 50,
      '2_HOURS': 25,
    };

    const impactValue = impactScores[impact];
    const effortValue = effortScores[effort];

    return Math.round((impactValue / effortValue) * 100 * 0.5 + impactValue * 0.5);
  }

  async calculateHealthScores(publicationId: string): Promise<SeoHealthScore> {
    try {
      const { data: urls } = await this.supabaseClient
        .from('urls')
        .select('*')
        .eq('publication_id', publicationId);

      const { data: keywords } = await this.supabaseClient
        .from('keyword_performance')
        .select('*')
        .eq('publication_id', publicationId);

      const urlArray = urls || [];
      const keywordArray = keywords || [];

      const indexedCount = urlArray.filter((u: any) => u.is_indexed).length;
      const totalUrls = urlArray.length || 1;
      const indexationRate = (indexedCount / totalUrls) * 100;

      const topTenCount = keywordArray.filter((k: any) => k.position && k.position <= 10).length;
      const growthPotential = Math.min(100, (topTenCount / Math.max(1, keywordArray.length)) * 50 + 50);

      const recentlyCrawled = urlArray.filter((u: any) => {
        const lastCheck = new Date(u.last_checked);
        const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
        return lastCheck.getTime() > threeDaysAgo;
      }).length;
      const indexVelocity = Math.min(100, (recentlyCrawled / Math.max(1, totalUrls)) * 100);

      const recentlyModified = urlArray.filter((u: any) => {
        const lastMod = new Date(u.last_modified);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return lastMod.getTime() > thirtyDaysAgo;
      }).length;
      const contentFreshness = Math.min(100, (recentlyModified / Math.max(1, totalUrls)) * 50 + 50);

      const overallHealth = Math.round(
        indexationRate * 0.3 + growthPotential * 0.3 + indexVelocity * 0.2 + contentFreshness * 0.2
      );

      return {
        overall_health: Math.max(0, Math.min(100, overallHealth)),
        growth_potential: Math.max(0, Math.min(100, Math.round(growthPotential))),
        index_velocity: Math.max(0, Math.min(100, Math.round(indexVelocity))),
        content_freshness: Math.max(0, Math.min(100, Math.round(contentFreshness))),
      };
    } catch (error) {
      console.error('Error calculating health scores:', error);
      return {
        overall_health: 50,
        growth_potential: 50,
        index_velocity: 50,
        content_freshness: 50,
      };
    }
  }

  private getActionItems(insightType: string): string[] {
    const actionMap: Record<string, string[]> = {
      ranking_near_top10: [
        'Revisar título e meta description',
        'Melhorar CTR através de estrutura visual',
      ],
      ranking_exit_top10: [
        'Analisar mudanças de concorrentes',
        'Atualizar conteúdo com informações recentes',
      ],
      ctr_very_low: [
        'Reescrever title tag com palavras-chave',
        'Melhorar meta description para aumentar apelo',
      ],
      content_missing_links: [
        'Encontrar 2-3 páginas relacionadas para linkar',
        'Adicionar links naturais no contexto',
      ],
      indexation_lost: [
        'Verificar robots.txt',
        'Resubmeter no Google Search Console',
      ],
    };

    return actionMap[insightType] || ['Revisar recomendação acima'];
  }
}
