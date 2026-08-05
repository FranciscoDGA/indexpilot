import { createClient } from '@/lib/supabase/server';
import type { Competitor, CompetitorCrawl } from '@/types/competitors';

export class CompetitorManager {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient();
  }

  async listCompetitors(workspaceId: string): Promise<Competitor[]> {
    const { data, error } = await this.supabase
      .from('competitors')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getCompetitor(id: string): Promise<Competitor | null> {
    const { data, error } = await this.supabase
      .from('competitors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async createCompetitor(competitor: Omit<Competitor, 'id' | 'created_at' | 'updated_at'>): Promise<Competitor> {
    const { data, error } = await this.supabase
      .from('competitors')
      .insert(competitor)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompetitor(id: string, updates: Partial<Competitor>): Promise<Competitor> {
    const { data, error } = await this.supabase
      .from('competitors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCompetitor(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('competitors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getCrawlHistory(competitorId: string, limit: number = 10): Promise<CompetitorCrawl[]> {
    const { data, error } = await this.supabase
      .from('competitor_crawls')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async startCrawl(competitorId: string): Promise<CompetitorCrawl> {
    const { data, error } = await this.supabase
      .from('competitor_crawls')
      .insert({
        competitor_id: competitorId,
        status: 'pending',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update competitor last_crawled_at
    await this.supabase
      .from('competitors')
      .update({ last_crawled_at: new Date().toISOString() })
      .eq('id', competitorId);

    return data;
  }

  async updateCrawlStatus(crawlId: string, status: string, pagesFound?: number, errorMessage?: string): Promise<void> {
    const updates: Record<string, any> = { status };
    if (pagesFound !== undefined) updates.pages_found = pagesFound;
    if (errorMessage) updates.error_message = errorMessage;
    if (status === 'completed' || status === 'failed') updates.finished_at = new Date().toISOString();

    const { error } = await this.supabase
      .from('competitor_crawls')
      .update(updates)
      .eq('id', crawlId);

    if (error) throw error;
  }

  async saveCompetitorPages(competitorId: string, crawlId: string, pages: any[]): Promise<void> {
    // Clear old pages for this competitor
    await this.supabase
      .from('competitor_pages')
      .delete()
      .eq('competitor_id', competitorId);

    // Insert new pages
    if (pages.length > 0) {
      const { error } = await this.supabase
        .from('competitor_pages')
        .insert(pages.map(p => ({ ...p, competitor_id: competitorId, crawl_id: crawlId })));

      if (error) throw error;
    }
  }

  async getCompetitorPages(competitorId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('competitor_pages')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('depth', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async saveCompetitorCategories(competitorId: string, categories: any[]): Promise<void> {
    await this.supabase
      .from('competitor_categories')
      .delete()
      .eq('competitor_id', competitorId);

    if (categories.length > 0) {
      const { error } = await this.supabase
        .from('competitor_categories')
        .insert(categories.map(c => ({ ...c, competitor_id: competitorId })));

      if (error) throw error;
    }
  }

  async getCompetitorCategories(competitorId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('competitor_categories')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('depth', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}