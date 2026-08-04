import { DiscoveredURL, SyncLog, URLRecord } from '@/types/discovery';

export class URLSynchronizer {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  async fullSync(siteId: string, userId: string): Promise<SyncLog> {
    const syncLog: SyncLog = {
      site_id: siteId,
      user_id: userId,
      sync_type: 'full',
      status: 'in_progress',
      urls_found: 0,
      urls_new: 0,
      urls_removed: 0,
      urls_updated: 0,
      started_at: new Date().toISOString(),
    };

    try {
      const existingUrls = await this.getExistingUrls(siteId);
      const discoveredUrls = await this.getDiscoveredUrls(siteId);

      const result = await this.compareAndUpdate(siteId, discoveredUrls, userId);

      syncLog.urls_found = discoveredUrls.length;
      syncLog.urls_new = result.new;
      syncLog.urls_updated = result.updated;
      syncLog.urls_removed = result.removed;
      syncLog.status = 'completed';
      syncLog.completed_at = new Date().toISOString();

      await this.logSync(syncLog);
      return syncLog;
    } catch (error) {
      syncLog.status = 'error';
      syncLog.error_message = String(error);
      syncLog.completed_at = new Date().toISOString();
      await this.logSync(syncLog);
      throw error;
    }
  }

  async incrementalSync(siteId: string, userId: string): Promise<SyncLog> {
    const syncLog: SyncLog = {
      site_id: siteId,
      user_id: userId,
      sync_type: 'incremental',
      status: 'in_progress',
      urls_found: 0,
      urls_new: 0,
      urls_removed: 0,
      urls_updated: 0,
      started_at: new Date().toISOString(),
    };

    try {
      const discoveredUrls = await this.getDiscoveredUrls(siteId);
      const result = await this.compareAndUpdate(siteId, discoveredUrls, userId);

      syncLog.urls_found = discoveredUrls.length;
      syncLog.urls_new = result.new;
      syncLog.urls_updated = result.updated;
      syncLog.urls_removed = result.removed;
      syncLog.status = 'completed';
      syncLog.completed_at = new Date().toISOString();

      await this.logSync(syncLog);
      return syncLog;
    } catch (error) {
      syncLog.status = 'error';
      syncLog.error_message = String(error);
      syncLog.completed_at = new Date().toISOString();
      await this.logSync(syncLog);
      throw error;
    }
  }

  async compareAndUpdate(
    siteId: string,
    discoveredUrls: DiscoveredURL[],
    userId: string
  ): Promise<{ new: number; updated: number; removed: number }> {
    const existingUrls = await this.getExistingUrls(siteId);
    const existingMap = new Map(existingUrls.map(u => [u.url, u]));

    let newCount = 0;
    let updatedCount = 0;

    for (const discovered of discoveredUrls) {
      const existing = existingMap.get(discovered.url);

      if (!existing) {
        await this.insertUrl(siteId, userId, discovered);
        newCount++;
      } else if (this.hasChanged(existing, discovered)) {
        await this.updateUrl(existing.id!, discovered);
        updatedCount++;
      }
      existingMap.delete(discovered.url);
    }

    const removedCount = existingMap.size;
    for (const orphaned of existingMap.values()) {
      await this.markAsOrphaned(orphaned.id!);
    }

    return { new: newCount, updated: updatedCount, removed: removedCount };
  }

  async markMissing(siteId: string, urlsNotFound: string[]): Promise<number> {
    const { error } = await this.supabaseClient
      .from('urls')
      .update({ is_orphaned: true, sync_status: 'synced', updated_at: new Date().toISOString() })
      .in('url', urlsNotFound)
      .eq('site_id', siteId);

    if (error) throw error;
    return urlsNotFound.length;
  }

  private async getExistingUrls(siteId: string): Promise<URLRecord[]> {
    const { data, error } = await this.supabaseClient
      .from('urls')
      .select('*')
      .eq('site_id', siteId);

    if (error) throw error;
    return data || [];
  }

  private async getDiscoveredUrls(siteId: string): Promise<DiscoveredURL[]> {
    const { data, error } = await this.supabaseClient
      .from('urls')
      .select('*')
      .eq('site_id', siteId)
      .eq('sync_status', 'pending');

    if (error) throw error;
    return (data || []).map((r: any) => ({
      url: r.url,
      source: r.source,
      title: r.title,
      description: r.description,
      lastModified: r.last_modified,
      httpStatus: r.http_status,
      isRedirect: r.is_redirect,
      redirectTo: r.redirect_to,
    }));
  }

  private async insertUrl(siteId: string, userId: string, url: DiscoveredURL): Promise<void> {
    const { error } = await this.supabaseClient.from('urls').insert({
      site_id: siteId,
      user_id: userId,
      url: url.url,
      source: url.source,
      title: url.title,
      description: url.description,
      last_modified: url.lastModified,
      http_status: url.httpStatus,
      is_redirect: url.isRedirect,
      redirect_to: url.redirectTo,
      discovered_at: new Date().toISOString(),
      sync_status: 'synced',
      is_indexable: true,
      is_indexed: false,
      is_orphaned: false,
    });

    if (error) throw error;
  }

  private async updateUrl(urlId: string, url: DiscoveredURL): Promise<void> {
    const { error } = await this.supabaseClient
      .from('urls')
      .update({
        title: url.title,
        description: url.description,
        last_modified: url.lastModified,
        http_status: url.httpStatus,
        is_redirect: url.isRedirect,
        redirect_to: url.redirectTo,
        sync_status: 'synced',
        updated_at: new Date().toISOString(),
      })
      .eq('id', urlId);

    if (error) throw error;
  }

  private async markAsOrphaned(urlId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('urls')
      .update({
        is_orphaned: true,
        sync_status: 'synced',
        updated_at: new Date().toISOString(),
      })
      .eq('id', urlId);

    if (error) throw error;
  }

  private async logSync(syncLog: SyncLog): Promise<void> {
    const { error } = await this.supabaseClient.from('sync_logs').insert({
      site_id: syncLog.site_id,
      user_id: syncLog.user_id,
      sync_type: syncLog.sync_type,
      status: syncLog.status,
      urls_found: syncLog.urls_found,
      urls_new: syncLog.urls_new,
      urls_removed: syncLog.urls_removed,
      urls_updated: syncLog.urls_updated,
      error_message: syncLog.error_message,
      started_at: syncLog.started_at,
      completed_at: syncLog.completed_at,
    });

    if (error) throw error;
  }

  private hasChanged(existing: URLRecord, discovered: DiscoveredURL): boolean {
    return (
      existing.title !== discovered.title ||
      existing.description !== discovered.description ||
      existing.http_status !== discovered.httpStatus ||
      existing.last_modified !== discovered.lastModified
    );
  }
}
