import { supabase } from '@/lib/supabase/client';
import { OrphanPage, LinkSuggestion } from '@/types/oge';

export class InternalLinkingEngine {
  /**
   * Detect orphan pages (pages with 0 internal links)
   */
  async detectOrphanPages(publicationId: string): Promise<OrphanPage[]> {
    const { data: orphans, error } = await supabase
      .from('orphan_pages')
      .select('*')
      .eq('publication_id', publicationId)
      .order('priority', { ascending: false })
      .order('traffic', { ascending: false });

    if (error) throw error;
    return orphans || [];
  }

  /**
   * Calculate orphan page priority
   * Based on traffic potential and current inbound links
   */
  private calculateOrphanPriority(
    traffic: number,
    inboundLinks: number,
    potentialTraffic: number
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const trafficGap = potentialTraffic - traffic;
    const missedOpportunity = trafficGap / (potentialTraffic || 1);

    // High traffic, orphaned = CRITICAL
    if (traffic > 100 && inboundLinks === 0) return 'CRITICAL';

    // High potential with no links = CRITICAL
    if (potentialTraffic > 500 && inboundLinks === 0) return 'CRITICAL';

    // Medium traffic orphaned = HIGH
    if (traffic > 20 && inboundLinks === 0) return 'HIGH';

    // Has potential but no links = HIGH
    if (missedOpportunity > 0.5) return 'HIGH';

    // Low priority orphans
    if (inboundLinks === 0) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Suggest internal links for orphan pages
   * Uses keyword relevance and link authority
   */
  async suggestLinksForOrphanPage(
    publicationId: string,
    orphanUrl: string,
    orphanKeyword?: string
  ): Promise<LinkSuggestion[]> {
    // Get all published pages (potential link sources)
    const { data: allPages, error: pagesError } = await supabase
      .from('cluster_articles')
      .select('url, keyword, impressions, position')
      .eq('publication_id', publicationId);

    if (pagesError) throw pagesError;

    const suggestions: LinkSuggestion[] = [];

    // Generate link suggestions based on keyword relevance
    (allPages || []).forEach((page: any) => {
      const relevanceScore = this.calculateLinkRelevance(
        orphanKeyword || '',
        page.keyword
      );

      if (relevanceScore > 0.3) {
        // Only suggest relevant links
        suggestions.push({
          source_url: page.url,
          target_url: orphanUrl,
          keyword: page.keyword,
          relevance_score: relevanceScore,
          potential_impact: this.calculateLinkImpact(page.impressions || 0, relevanceScore),
          anchor_type: this.selectAnchorType(orphanKeyword || '', page.keyword),
        });
      }
    });

    return suggestions
      .sort((a, b) => b.potential_impact - a.potential_impact)
      .slice(0, 5);
  }

  /**
   * Calculate relevance score between two keywords
   * Higher score = more relevant link
   */
  private calculateLinkRelevance(keyword1: string, keyword2: string): number {
    if (!keyword1 || !keyword2) return 0;

    const words1 = keyword1.toLowerCase().split(' ');
    const words2 = keyword2.toLowerCase().split(' ');

    let matches = 0;
    words1.forEach((word) => {
      if (words2.includes(word)) matches++;
    });

    // Direct match = 1.0
    if (keyword1.toLowerCase() === keyword2.toLowerCase()) return 1.0;

    // Partial match score
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Determine best anchor type
   */
  private selectAnchorType(
    targetKeyword: string,
    sourceKeyword: string
  ): 'exact' | 'partial' | 'branded' | 'generic' {
    const exactMatch = targetKeyword.toLowerCase() === sourceKeyword.toLowerCase();
    const partialMatch =
      targetKeyword.toLowerCase().includes(sourceKeyword.toLowerCase()) ||
      sourceKeyword.toLowerCase().includes(targetKeyword.toLowerCase());

    if (exactMatch) return 'exact';
    if (partialMatch) return 'partial';
    if (
      sourceKeyword.toLowerCase().includes('guide') ||
      sourceKeyword.toLowerCase().includes('how to')
    ) {
      return 'generic';
    }
    return 'branded';
  }

  /**
   * Calculate potential traffic impact of a link
   */
  private calculateLinkImpact(sourceImpressions: number, relevanceScore: number): number {
    // 1 internal link from high-traffic page can increase impressions 5-15%
    const baseImpact = sourceImpressions * 0.08; // 8% average
    return Math.round(baseImpact * relevanceScore);
  }

  /**
   * Get link mesh visualization data
   * Shows interconnection strength between content
   */
  async getLinkMeshData(publicationId: string): Promise<{
    totalPages: number;
    orphanPages: number;
    avgLinksPerPage: number;
    meshStrength: number;
  }> {
    const { data: links, error: linksError } = await supabase
      .from('internal_links')
      .select('source_url, target_url')
      .eq('publication_id', publicationId);

    const { data: orphans, error: orphansError } = await supabase
      .from('orphan_pages')
      .select('id')
      .eq('publication_id', publicationId);

    if (linksError) throw linksError;
    if (orphansError) throw orphansError;

    const { count: totalPagesCount, error: countError } = await supabase
      .from('cluster_articles')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', publicationId);

    if (countError) throw countError;

    const totalPages = totalPagesCount || 0;
    const orphanCount = (orphans || []).length;
    const avgLinksPerPage = totalPages > 0 ? (links || []).length / totalPages : 0;

    // Mesh strength: 0-100, higher = better interconnected
    const meshStrength = Math.max(
      0,
      Math.min(100, 100 - (orphanCount / Math.max(totalPages, 1)) * 100)
    );

    return {
      totalPages,
      orphanPages: orphanCount,
      avgLinksPerPage,
      meshStrength,
    };
  }

  /**
   * Record a new internal link
   */
  async recordInternalLink(
    publicationId: string,
    sourceUrl: string,
    targetUrl: string,
    linkText?: string,
    anchorType: 'exact' | 'partial' | 'branded' | 'generic' = 'generic',
    autoSuggested = false
  ): Promise<void> {
    const { error } = await supabase.from('internal_links').upsert(
      {
        publication_id: publicationId,
        source_url: sourceUrl,
        target_url: targetUrl,
        link_text: linkText,
        anchor_type: anchorType,
        auto_suggested: autoSuggested,
        user_approved: false,
        relevance_score: 0.7,
      },
      { onConflict: 'publication_id,source_url,target_url' }
    );

    if (error) throw error;
  }

  /**
   * Mark orphan page as rescued (links added)
   */
  async markOrphanAsRescued(publicationId: string, url: string): Promise<void> {
    const { error } = await supabase
      .from('orphan_pages')
      .update({ rescue_status: 'resolved' })
      .eq('publication_id', publicationId)
      .eq('url', url);

    if (error) throw error;
  }

  /**
   * Get orphan rescue opportunities
   */
  async getOrphanRescueOpportunities(
    publicationId: string,
    limit = 10
  ): Promise<Array<OrphanPage & { suggested_links: LinkSuggestion[] }>> {
    const orphans = await this.detectOrphanPages(publicationId);

    const result: Array<OrphanPage & { suggested_links: LinkSuggestion[] }> = [];

    for (const orphan of orphans.slice(0, limit)) {
      const suggestions = await this.suggestLinksForOrphanPage(
        publicationId,
        orphan.url
      );

      result.push({
        ...orphan,
        suggested_links: suggestions,
      });
    }

    return result;
  }

  /**
   * Calculate link authority score for a URL
   * Based on traffic and position
   */
  async calculateLinkAuthority(
    publicationId: string,
    url: string
  ): Promise<number> {
    const { data: articles, error } = await supabase
      .from('cluster_articles')
      .select('impressions, position')
      .eq('publication_id', publicationId)
      .eq('url', url);

    if (error) throw error;

    if (!articles || articles.length === 0) return 0;

    const article = articles[0];
    const impressions = article.impressions || 0;
    const position = article.position || 100;

    // Authority = impressions + position bonus (top positions worth more)
    const positionBonus = Math.max(0, 100 - position * 5);
    return (impressions * 0.5 + positionBonus * 0.5) / 100;
  }
}
