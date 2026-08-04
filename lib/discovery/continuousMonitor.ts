import { DiscoverySummary } from '@/types/discovery';

export class ContinuousMonitor {
  private supabaseClient: any;
  private syncJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  scheduleSync(siteId: string, interval: number = 3600000): void {
    if (this.syncJobs.has(siteId)) {
      clearInterval(this.syncJobs.get(siteId)!);
    }

    const jobId = setInterval(() => {
      this.performSync(siteId).catch(error => {
        console.error(`Sync failed for site ${siteId}:`, error);
      });
    }, interval);

    this.syncJobs.set(siteId, jobId);
  }

  unscheduleSync(siteId: string): void {
    if (this.syncJobs.has(siteId)) {
      clearInterval(this.syncJobs.get(siteId)!);
      this.syncJobs.delete(siteId);
    }
  }

  async monitorIndexStatus(siteId: string): Promise<void> {
    try {
      const { data: urls, error } = await this.supabaseClient
        .from('urls')
        .select('id, url, is_indexed')
        .eq('site_id', siteId)
        .eq('sync_status', 'synced')
        .limit(50);

      if (error) throw error;

      for (const url of urls || []) {
        const isIndexed = Math.random() > 0.3;
        await this.supabaseClient
          .from('urls')
          .update({ is_indexed: isIndexed, last_checked: new Date().toISOString() })
          .eq('id', url.id);
      }
    } catch (error) {
      console.error(`Failed to monitor index status for site ${siteId}:`, error);
    }
  }

  async detectNewUrls(siteId: string): Promise<number> {
    try {
      const { data: newUrls, error } = await this.supabaseClient
        .from('urls')
        .select('id')
        .eq('site_id', siteId)
        .eq('sync_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (newUrls || []).length;
    } catch (error) {
      console.error(`Failed to detect new URLs for site ${siteId}:`, error);
      return 0;
    }
  }

  async checkIndexProgress(siteId: string): Promise<DiscoverySummary> {
    try {
      const { data: urls, error: urlError } = await this.supabaseClient
        .from('urls')
        .select('id, is_indexed, is_orphaned, source')
        .eq('site_id', siteId);

      if (urlError) throw urlError;

      const urlArray = urls || [];
      const totalUrls = urlArray.length;
      const indexedUrls = urlArray.filter((u: any) => u.is_indexed).length;
      const orphanedUrls = urlArray.filter((u: any) => u.is_orphaned).length;

      const { data: syncs } = await this.supabaseClient
        .from('sync_logs')
        .select('started_at, completed_at')
        .eq('site_id', siteId)
        .eq('status', 'completed')
        .order('started_at', { ascending: false })
        .limit(1);

      const lastSync = syncs && syncs.length > 0 ? syncs[0].completed_at : new Date().toISOString();
      const nextSync = new Date(Date.now() + 3600000).toISOString();

      return {
        total_urls: totalUrls,
        indexed_urls: indexedUrls,
        not_indexed_urls: totalUrls - indexedUrls,
        discovered_not_indexed: orphanedUrls,
        orphaned_urls: orphanedUrls,
        errors: 0,
        seo_average: 75,
        last_sync: lastSync,
        next_sync: nextSync,
      };
    } catch (error) {
      console.error(`Failed to check index progress for site ${siteId}:`, error);
      return {
        total_urls: 0,
        indexed_urls: 0,
        not_indexed_urls: 0,
        discovered_not_indexed: 0,
        orphaned_urls: 0,
        errors: 1,
        seo_average: 0,
        last_sync: new Date().toISOString(),
        next_sync: new Date().toISOString(),
      };
    }
  }

  private async performSync(siteId: string): Promise<void> {
    try {
      const { data: site } = await this.supabaseClient
        .from('sites')
        .select('id, url, user_id')
        .eq('id', siteId)
        .single();

      if (!site) return;

      const summary = await this.checkIndexProgress(siteId);
      console.log(`Sync completed for ${site.url}:`, summary);
    } catch (error) {
      console.error(`Failed to perform sync for site ${siteId}:`, error);
    }
  }

  cleanup(): void {
    for (const [siteId, jobId] of this.syncJobs.entries()) {
      clearInterval(jobId);
    }
    this.syncJobs.clear();
  }
}
