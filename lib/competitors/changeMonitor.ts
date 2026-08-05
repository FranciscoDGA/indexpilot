import { createClient } from '@/lib/supabase/server';
import type { CompetitorChange, CompetitorChangeType, MarketTimelineEvent } from '@/types/competitors';

export class ChangeMonitor {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async detectChanges(
    competitorId: string,
    previousPages: any[],
    currentPages: any[]
  ): Promise<CompetitorChange[]> {
    const changes: Omit<CompetitorChange, 'id' | 'detected_at'>[] = [];
    const previousUrls = new Map(previousPages.map(p => [p.url, p]));
    const currentUrls = new Map(currentPages.map(p => [p.url, p]));

    // Detect new pages
    for (const [url, page] of currentUrls) {
      if (!previousUrls.has(url)) {
        changes.push({
          competitor_id: competitorId,
          change_type: 'new_page',
          url,
          new_value: page.title || url,
        });
      }
    }

    // Detect removed pages
    for (const [url, page] of previousUrls) {
      if (!currentUrls.has(url)) {
        changes.push({
          competitor_id: competitorId,
          change_type: 'removed_page',
          url,
          old_value: page.title || url,
        });
      }
    }

    // Detect updated pages
    for (const [url, currentPage] of currentUrls) {
      const previousPage = previousUrls.get(url);
      if (previousPage) {
        // Check title change
        if (previousPage.title !== currentPage.title) {
          changes.push({
            competitor_id: competitorId,
            change_type: 'updated_page',
            url,
            old_value: previousPage.title,
            new_value: currentPage.title,
          });
        }

        // Check schema change
        const prevSchema = JSON.stringify(previousPage.schema_types?.sort() || []);
        const currSchema = JSON.stringify(currentPage.schema_types?.sort() || []);
        if (prevSchema !== currSchema) {
          changes.push({
            competitor_id: competitorId,
            change_type: 'schema_change',
            url,
            old_value: prevSchema,
            new_value: currSchema,
          });
        }
      }
    }

    // Detect category changes
    const prevCategories = this.extractCategories(previousPages);
    const currCategories = this.extractCategories(currentPages);

    for (const cat of currCategories) {
      if (!prevCategories.has(cat)) {
        changes.push({
          competitor_id: competitorId,
          change_type: 'new_category',
          new_value: cat,
        });
      }
    }

    for (const cat of prevCategories) {
      if (!currCategories.has(cat)) {
        changes.push({
          competitor_id: competitorId,
          change_type: 'removed_category',
          old_value: cat,
        });
      }
    }

    // Save changes
    if (changes.length > 0) {
      await this.saveChanges(changes);
    }

    // Add to timeline
    await this.addToTimeline(competitorId, changes);

    return changes as CompetitorChange[];
  }

  async getChanges(competitorId: string, limit: number = 50): Promise<CompetitorChange[]> {
    const { data, error } = await this.supabase
      .from('competitor_changes')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getTimeline(workspaceId: string, limit: number = 100): Promise<MarketTimelineEvent[]> {
    const { data, error } = await this.supabase
      .from('market_timeline')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  private extractPages(pages: any[]): Map<string, any> {
    return new Map(pages.map(p => [p.url, p]));
  }

  private extractCategories(pages: any[]): Set<string> {
    const categories = new Set<string>();
    for (const page of pages) {
      try {
        const url = new URL(page.url);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          categories.add(parts[0]);
        }
      } catch {}
    }
    return categories;
  }

  private async saveChanges(changes: Omit<CompetitorChange, 'id' | 'detected_at'>[]): Promise<void> {
    const { error } = await this.supabase
      .from('competitor_changes')
      .insert(changes);

    if (error) throw error;
  }

  private async addToTimeline(competitorId: string, changes: Omit<CompetitorChange, 'id' | 'detected_at'>[]): Promise<void> {
    // Get competitor workspace_id
    const { data: competitor } = await this.supabase
      .from('competitors')
      .select('workspace_id')
      .eq('id', competitorId)
      .single();

    if (!competitor) return;

    const timelineEvents = changes.map(change => ({
      workspace_id: competitor.workspace_id,
      competitor_id: competitorId,
      event_type: change.change_type,
      title: this.getTimelineTitle(change.change_type),
      description: change.url || change.new_value || change.old_value,
      metadata: {
        url: change.url,
        old_value: change.old_value,
        new_value: change.new_value,
      },
      occurred_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase
      .from('market_timeline')
      .insert(timelineEvents);

    if (error) throw error;
  }

  private getTimelineTitle(changeType: CompetitorChangeType): string {
    const titles: Record<CompetitorChangeType, string> = {
      new_page: 'Nova página publicada',
      removed_page: 'Página removida',
      updated_page: 'Página atualizada',
      new_category: 'Nova categoria',
      removed_category: 'Categoria removida',
      structure_change: 'Estrutura alterada',
      sitemap_change: 'Sitemap alterado',
      robots_change: 'Robots.txt alterado',
      schema_change: 'Schema alterado',
    };
    return titles[changeType] || 'Mudança detectada';
  }
}