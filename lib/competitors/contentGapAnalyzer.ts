import { createClient } from '@/lib/supabase/server';
import type { ContentGap, ContentGapAnalysis, CompetitorPage } from '@/types/competitors';

export class ContentGapAnalyzer {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async analyzeGaps(
    workspaceId: string,
    competitorId: string,
    myPages: any[],
    competitorPages: any[]
  ): Promise<ContentGapAnalysis[]> {
    // Group pages by topic/category
    const myTopics = this.extractTopics(myPages);
    const competitorTopics = this.extractTopics(competitorPages);

    const gaps: ContentGapAnalysis[] = [];

    for (const [topic, compPages] of competitorTopics) {
      const myCount = myTopics.get(topic)?.length || 0;
      const compCount = compPages.length;

      if (myCount < compCount) {
        gaps.push({
          topic,
          myArticles: myCount,
          competitorArticles: compCount,
          gap: compCount - myCount,
          priority: this.calculatePriority(myCount, compCount),
          competitorUrls: compPages.map(p => p.url),
          suggestedTopics: this.generateSuggestions(topic, myPages),
        });
      }
    }

    // Sort by priority then gap size
    gaps.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    });

    // Save gaps to database
    await this.saveGaps(workspaceId, competitorId, gaps);

    return gaps;
  }

  async getGaps(workspaceId: string): Promise<ContentGap[]> {
    const { data, error } = await this.supabase
      .from('content_gaps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateGapStatus(gapId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('content_gaps')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', gapId);

    if (error) throw error;
  }

  private extractTopics(pages: any[]): Map<string, any[]> {
    const topics = new Map<string, any[]>();

    for (const page of pages) {
      const topic = this.extractTopicFromUrl(page.url, page.title);
      if (topic) {
        const existing = topics.get(topic) || [];
        existing.push(page);
        topics.set(topic, existing);
      }
    }

    return topics;
  }

  private extractTopicFromUrl(url: string, title?: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length > 0) {
        // Use first path segment as topic
        return pathParts[0].replace(/-/g, ' ');
      }

      // Fallback to title
      if (title) {
        return title.split(' ').slice(0, 3).join(' ');
      }

      return null;
    } catch {
      return null;
    }
  }

  private calculatePriority(myCount: number, compCount: number): 'high' | 'medium' | 'low' {
    const ratio = compCount / Math.max(myCount, 1);
    if (ratio > 3) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private generateSuggestions(topic: string, myPages: any[]): string[] {
    const suggestions: string[] = [];
    const existingTitles = myPages.map(p => p.title?.toLowerCase() || '');

    // Generate suggestions based on topic
    const commonFormats = ['Guia Completo', 'Como Fazer', 'Dicas', 'Exemplos', 'Comparativo'];

    for (const format of commonFormats) {
      const suggestion = `${topic} ${format}`;
      if (!existingTitles.some(t => t.includes(suggestion.toLowerCase()))) {
        suggestions.push(suggestion);
      }
    }

    return suggestions.slice(0, 5);
  }

  private async saveGaps(workspaceId: string, competitorId: string, gaps: ContentGapAnalysis[]): Promise<void> {
    // Delete old gaps for this competitor
    await this.supabase
      .from('content_gaps')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('competitor_id', competitorId);

    // Insert new gaps
    if (gaps.length > 0) {
      const { error } = await this.supabase
        .from('content_gaps')
        .insert(gaps.map(gap => ({
          workspace_id: workspaceId,
          topic: gap.topic,
          competitor_id: competitorId,
          competitor_urls: gap.competitorUrls,
          priority: gap.priority,
          status: 'identified',
          estimated_potential: `${gap.gap} artigos potenciais`,
        })));

      if (error) throw error;
    }
  }
}