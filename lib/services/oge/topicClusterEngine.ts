import { supabase } from '@/lib/supabase/client';
import { TopicCluster, ClusterArticle, ClusterGap } from '@/types/oge';

export class TopicClusterEngine {
  /**
   * Get all topic clusters for a publication
   */
  async getClusters(publicationId: string): Promise<TopicCluster[]> {
    const { data: clusters, error } = await supabase
      .from('topic_clusters')
      .select('*')
      .eq('publication_id', publicationId)
      .order('completeness_score', { ascending: false });

    if (error) throw error;
    return clusters || [];
  }

  /**
   * Calculate cluster completeness score
   * Completeness = (current articles / target articles) * 100
   */
  calculateCompletenessScore(createdArticles: number, targetArticles: number): number {
    if (targetArticles === 0) return 0;
    return Math.min(100, (createdArticles / targetArticles) * 100);
  }

  /**
   * Detect cluster gaps (missing keywords/articles)
   */
  async detectClusterGaps(publicationId: string): Promise<ClusterGap[]> {
    const { data: clusters, error: clustersError } = await supabase
      .from('topic_clusters')
      .select('*, cluster_articles(*)')
      .eq('publication_id', publicationId);

    if (clustersError) throw clustersError;

    const gaps: ClusterGap[] = (clusters || []).map((cluster) => {
      const articles = (cluster.cluster_articles || []) as ClusterArticle[];
      const missingCount = Math.max(
        0,
        cluster.target_articles - cluster.created_articles
      );

      return {
        pillar_topic: cluster.pillar_topic,
        completeness_score: cluster.completeness_score,
        missing_keywords: this.generateMissingKeywords(
          cluster.pillar_topic,
          missingCount
        ),
        target_count: cluster.target_articles,
        current_count: cluster.created_articles,
        priority: this.calculateClusterPriority(
          cluster.completeness_score,
          articles
        ),
        estimated_traffic_potential: this.estimateTrafficPotential(articles),
      };
    });

    return gaps.sort((a, b) => {
      const impactA = a.estimated_traffic_potential * (1 - a.completeness_score / 100);
      const impactB = b.estimated_traffic_potential * (1 - b.completeness_score / 100);
      return impactB - impactA;
    });
  }

  /**
   * Generate missing keyword suggestions for cluster
   */
  private generateMissingKeywords(pillarTopic: string, count: number): string[] {
    const keywords: string[] = [];
    const baseTopic = pillarTopic.toLowerCase();

    // Common keyword variations to suggest
    const patterns = [
      `${baseTopic} guide`,
      `how to ${baseTopic}`,
      `${baseTopic} tips`,
      `${baseTopic} best practices`,
      `${baseTopic} tutorial`,
      `${baseTopic} examples`,
      `${baseTopic} tools`,
      `${baseTopic} comparison`,
      `${baseTopic} benefits`,
      `${baseTopic} mistakes`,
    ];

    for (let i = 0; i < count && i < patterns.length; i++) {
      keywords.push(patterns[i]);
    }

    return keywords;
  }

  /**
   * Calculate cluster priority based on completeness and traffic
   */
  private calculateClusterPriority(
    completenessScore: number,
    articles: ClusterArticle[]
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const totalImpressions = articles.reduce(
      (sum, a) => sum + (a.impressions || 0),
      0
    );

    // High traffic, low completeness = CRITICAL
    if (completenessScore < 30 && totalImpressions > 1000) return 'CRITICAL';
    if (completenessScore < 50 && totalImpressions > 2000) return 'CRITICAL';

    // Medium completeness with good traffic = HIGH
    if (completenessScore < 60 && totalImpressions > 500) return 'HIGH';
    if (completenessScore < 75 && totalImpressions > 1000) return 'HIGH';

    // Default to medium if incomplete
    if (completenessScore < 80) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Estimate total traffic potential for cluster
   */
  private estimateTrafficPotential(articles: ClusterArticle[]): number {
    return articles.reduce((sum, article) => {
      const traffic = article.impressions || 0;
      // Position-based boost (top positions have more potential to grow)
      const positionBoost = Math.max(0, 100 - (article.position || 100) * 2);
      return sum + traffic + positionBoost * 2;
    }, 0);
  }

  /**
   * Create or update a topic cluster
   */
  async createCluster(
    publicationId: string,
    pillarTopic: string,
    clusterType?: 'industry' | 'product' | 'location',
    targetArticles = 10
  ): Promise<bigint> {
    const { data, error } = await supabase
      .from('topic_clusters')
      .upsert(
        {
          publication_id: publicationId,
          pillar_topic: pillarTopic,
          cluster_type: clusterType,
          target_articles: targetArticles,
          created_articles: 0,
          completeness_score: 0,
          priority: 'MEDIUM',
        },
        { onConflict: 'publication_id,pillar_topic' }
      )
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /**
   * Add article to cluster
   */
  async addArticleToCluster(
    clusterId: bigint,
    url: string,
    keyword: string,
    role: 'pillar' | 'cluster',
    position = 0,
    impressions = 0
  ): Promise<void> {
    const { error } = await supabase.from('cluster_articles').upsert(
      {
        cluster_id: clusterId,
        url,
        keyword,
        position,
        impressions,
        role,
      },
      { onConflict: 'cluster_id,url' }
    );

    if (error) throw error;

    // Update cluster completeness score
    await this.updateClusterCompletenessScore(clusterId);
  }

  /**
   * Recalculate cluster completeness score
   */
  private async updateClusterCompletenessScore(clusterId: bigint): Promise<void> {
    const { data: cluster, error: clusterError } = await supabase
      .from('topic_clusters')
      .select('id, target_articles')
      .eq('id', clusterId)
      .single();

    if (clusterError) throw clusterError;

    const { count: articleCount, error: countError } = await supabase
      .from('cluster_articles')
      .select('id', { count: 'exact', head: true })
      .eq('cluster_id', clusterId);

    if (countError) throw countError;

    const completenessScore = this.calculateCompletenessScore(
      articleCount || 0,
      cluster.target_articles
    );

    const { error: updateError } = await supabase
      .from('topic_clusters')
      .update({
        created_articles: articleCount || 0,
        completeness_score: completenessScore,
      })
      .eq('id', clusterId);

    if (updateError) throw updateError;
  }

  /**
   * Generate content brief for missing keyword
   */
  generateContentBrief(
    pillarTopic: string,
    keyword: string,
    clusterType?: string
  ): {
    title: string;
    description: string;
    targetLength: number;
    suggestedSections: string[];
  } {
    const now = new Date().getFullYear();

    return {
      title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} - ${now} Guide`,
      description: `Comprehensive guide to ${keyword}. Learn the fundamentals, best practices, and advanced strategies to master ${keyword} in ${now}.`,
      targetLength: 2000,
      suggestedSections: [
        'Introduction',
        `What is ${keyword}?`,
        'Key Benefits',
        'Step-by-Step Guide',
        'Common Mistakes to Avoid',
        'Advanced Tips',
        'Tools & Resources',
        'Conclusion',
      ],
    };
  }

  /**
   * Get cluster statistics
   */
  async getClusterStats(publicationId: string): Promise<{
    totalClusters: number;
    completeCluster: number;
    incompleteCluster: number;
    avgCompletenessScore: number;
    totalArticles: number;
    totalImpressions: number;
  }> {
    const { data: clusters, error: clustersError } = await supabase
      .from('topic_clusters')
      .select('completeness_score, created_articles')
      .eq('publication_id', publicationId);

    if (clustersError) throw clustersError;

    const { data: articles, error: articlesError } = await supabase
      .from('cluster_articles')
      .select('impressions')
      .eq('publication_id', publicationId);

    if (articlesError) throw articlesError;

    const totalClusters = (clusters || []).length;
    const completeCluster = (clusters || []).filter(
      (c) => c.completeness_score >= 80
    ).length;
    const avgCompletenessScore =
      totalClusters > 0
        ? (clusters || []).reduce((sum, c) => sum + c.completeness_score, 0) /
          totalClusters
        : 0;

    const totalImpressions = (articles || []).reduce(
      (sum, a) => sum + (a.impressions || 0),
      0
    );

    return {
      totalClusters,
      completeCluster,
      incompleteCluster: totalClusters - completeCluster,
      avgCompletenessScore: Math.round(avgCompletenessScore),
      totalArticles: (articles || []).length,
      totalImpressions,
    };
  }

  /**
   * Get top cluster gaps by traffic potential
   */
  async getTopClusterGaps(publicationId: string, limit = 5): Promise<ClusterGap[]> {
    const gaps = await this.detectClusterGaps(publicationId);
    return gaps.slice(0, limit);
  }
}
