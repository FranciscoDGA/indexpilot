import {
  Connector,
  ConnectorProvider,
  ConnectorStatus,
  ConnectorEvent,
  ConnectorType,
  SyncJob,
  SyncJobStatus,
  SyncTriggerType,
  SyncResult,
  EventStatus,
} from '@/types/connectors';

/**
 * ConnectorManager
 *
 * Manages CRUD operations for connectors, sync jobs, and connector events.
 * Works with both real Supabase and mock client via constructor injection.
 */
export class ConnectorManager {
  private supabaseClient: any;

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }

  // ============================================================================
  // CONNECTOR CRUD
  // ============================================================================

  /**
   * List all connectors for a site.
   */
  async listConnectors(siteId: string): Promise<Connector[]> {
    const result = await this.supabaseClient
      .from('connectors')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    return result.data || [];
  }

  /**
   * Get a single connector by ID.
   */
  async getConnector(id: string): Promise<Connector | null> {
    const result = await this.supabaseClient
      .from('connectors')
      .select('*')
      .eq('id', id)
      .single();

    return result.data || null;
  }

  /**
   * Create a new connector.
   */
  async createConnector(data: {
    site_id: string;
    user_id: string;
    type: ConnectorType;
    provider: ConnectorProvider;
    name: string;
    config?: Record<string, any>;
    credentials_encrypted?: string;
  }): Promise<Connector> {
    const now = new Date().toISOString();
    const connector: Connector = {
      id: crypto.randomUUID ? crypto.randomUUID() : `conn-${Date.now()}`,
      site_id: data.site_id,
      user_id: data.user_id,
      type: data.type,
      provider: data.provider,
      name: data.name,
      status: 'inactive',
      config: data.config || {},
      credentials_encrypted: data.credentials_encrypted,
      version: '1.0.0',
      sync_count: 0,
      event_count: 0,
      created_at: now,
      updated_at: now,
    };

    const result = await this.supabaseClient
      .from('connectors')
      .insert(connector)
      .select()
      .single();

    return result.data || connector;
  }

  /**
   * Update a connector.
   */
  async updateConnector(id: string, data: Partial<Connector>): Promise<Connector | null> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const result = await this.supabaseClient
      .from('connectors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return result.data || null;
  }

  /**
   * Delete a connector and all related data.
   */
  async deleteConnector(id: string): Promise<boolean> {
    const result = await this.supabaseClient
      .from('connectors')
      .delete()
      .eq('id', id);

    return !result.error;
  }

  /**
   * Update connector status.
   */
  async updateStatus(id: string, status: ConnectorStatus, error?: string): Promise<void> {
    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (error) {
      updateData.last_error = error;
    }

    if (status === 'active') {
      updateData.last_sync_at = new Date().toISOString();
    }

    await this.supabaseClient
      .from('connectors')
      .update(updateData)
      .eq('id', id);
  }

  /**
   * Increment sync count for a connector.
   */
  async incrementSyncCount(id: string): Promise<void> {
    const connector = await this.getConnector(id);
    if (!connector) return;

    await this.supabaseClient
      .from('connectors')
      .update({
        sync_count: connector.sync_count + 1,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  /**
   * Increment event count for a connector.
   */
  async incrementEventCount(id: string): Promise<void> {
    const connector = await this.getConnector(id);
    if (!connector) return;

    await this.supabaseClient
      .from('connectors')
      .update({
        event_count: connector.event_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  // ============================================================================
  // SYNC JOBS
  // ============================================================================

  /**
   * Create a new sync job.
   */
  async createSyncJob(
    connectorId: string,
    siteId: string,
    userId: string,
    triggerType: SyncTriggerType = 'manual'
  ): Promise<SyncJob> {
    const now = new Date().toISOString();
    const syncJob: SyncJob = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sync-${Date.now()}`,
      connector_id: connectorId,
      site_id: siteId,
      user_id: userId,
      status: 'pending',
      trigger_type: triggerType,
      started_at: now,
      items_processed: 0,
      items_created: 0,
      items_updated: 0,
      items_removed: 0,
      items_failed: 0,
      metadata: {},
      created_at: now,
    };

    const result = await this.supabaseClient
      .from('sync_jobs')
      .insert(syncJob)
      .select()
      .single();

    return result.data || syncJob;
  }

  /**
   * Update a sync job.
   */
  async updateSyncJob(id: string, data: Partial<SyncJob>): Promise<void> {
    await this.supabaseClient
      .from('sync_jobs')
      .update(data)
      .eq('id', id);
  }

  /**
   * Mark a sync job as running.
   */
  async startSyncJob(id: string): Promise<void> {
    await this.updateSyncJob(id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });
  }

  /**
   * Complete a sync job with results.
   */
  async completeSyncJob(id: string, result: SyncResult): Promise<void> {
    const now = new Date().toISOString();
    await this.updateSyncJob(id, {
      status: result.success ? 'completed' : 'failed',
      finished_at: now,
      items_processed: result.items_processed,
      items_created: result.items_created,
      items_updated: result.items_updated,
      items_removed: result.items_removed,
      items_failed: result.items_failed,
      error_message: result.errors?.join('; '),
    });
  }

  /**
   * Fail a sync job with an error message.
   */
  async failSyncJob(id: string, error: string): Promise<void> {
    await this.updateSyncJob(id, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: error,
    });
  }

  /**
   * Cancel a sync job.
   */
  async cancelSyncJob(id: string): Promise<void> {
    await this.updateSyncJob(id, {
      status: 'cancelled',
      finished_at: new Date().toISOString(),
    });
  }

  /**
   * List sync jobs for a connector.
   */
  async listSyncJobs(connectorId: string, limit: number = 20): Promise<SyncJob[]> {
    const result = await this.supabaseClient
      .from('sync_jobs')
      .select('*')
      .eq('connector_id', connectorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return result.data || [];
  }

  /**
   * List all sync jobs for a site.
   */
  async listSyncJobsBySite(siteId: string, limit: number = 50): Promise<SyncJob[]> {
    const result = await this.supabaseClient
      .from('sync_jobs')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return result.data || [];
  }

  /**
   * Get a single sync job by ID.
   */
  async getSyncJob(id: string): Promise<SyncJob | null> {
    const result = await this.supabaseClient
      .from('sync_jobs')
      .select('*')
      .eq('id', id)
      .single();

    return result.data || null;
  }

  // ============================================================================
  // CONNECTOR EVENTS
  // ============================================================================

  /**
   * Log a new connector event.
   */
  async logEvent(
    connectorId: string,
    eventType: string,
    payload: Record<string, any>,
    sourceUrl?: string,
    contentHash?: string,
    impactLevel?: string
  ): Promise<void> {
    const event = {
      id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
      connector_id: connectorId,
      event_type: eventType,
      payload: payload || {},
      status: 'pending' as EventStatus,
      source_url: sourceUrl || null,
      content_hash: contentHash || null,
      impact_level: impactLevel || null,
      received_at: new Date().toISOString(),
      retry_count: 0,
    };

    await this.supabaseClient
      .from('connector_events')
      .insert(event);

    // Increment event count on connector
    await this.incrementEventCount(connectorId);
  }

  /**
   * List events for a connector.
   */
  async listEvents(connectorId: string, limit: number = 50): Promise<ConnectorEvent[]> {
    const result = await this.supabaseClient
      .from('connector_events')
      .select('*')
      .eq('connector_id', connectorId)
      .order('received_at', { ascending: false })
      .limit(limit);

    return result.data || [];
  }

  /**
   * List pending events that need processing.
   */
  async listPendingEvents(limit: number = 100): Promise<ConnectorEvent[]> {
    const result = await this.supabaseClient
      .from('connector_events')
      .select('*')
      .eq('status', 'pending')
      .order('received_at', { ascending: true })
      .limit(limit);

    return result.data || [];
  }

  /**
   * Update event status.
   */
  async updateEventStatus(id: string, status: EventStatus, error?: string): Promise<void> {
    const updateData: Record<string, any> = {
      status,
    };

    if (status === 'completed' || status === 'failed') {
      updateData.processed_at = new Date().toISOString();
    }

    if (error) {
      updateData.error_message = error;
    }

    if (status === 'failed') {
      // Increment retry count
      const event = await this.getEvent(id);
      if (event) {
        updateData.retry_count = (event.retry_count || 0) + 1;
      }
    }

    await this.supabaseClient
      .from('connector_events')
      .update(updateData)
      .eq('id', id);
  }

  /**
   * Get a single event by ID.
   */
  async getEvent(id: string): Promise<ConnectorEvent | null> {
    const result = await this.supabaseClient
      .from('connector_events')
      .select('*')
      .eq('id', id)
      .single();

    return result.data || null;
  }

  /**
   * Delete old events (cleanup).
   */
  async cleanupOldEvents(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.supabaseClient
      .from('connector_events')
      .delete()
      .lt('received_at', cutoffDate.toISOString());

    return result.data?.length || 0;
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get connector statistics for a site.
   */
  async getStats(siteId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    error: number;
    syncing: number;
    totalEvents: number;
    totalSyncs: number;
  }> {
    const connectors = await this.listConnectors(siteId);

    return {
      total: connectors.length,
      active: connectors.filter((c) => c.status === 'active').length,
      inactive: connectors.filter((c) => c.status === 'inactive').length,
      error: connectors.filter((c) => c.status === 'error').length,
      syncing: connectors.filter((c) => c.status === 'syncing').length,
      totalEvents: connectors.reduce((sum, c) => sum + (c.event_count || 0), 0),
      totalSyncs: connectors.reduce((sum, c) => sum + (c.sync_count || 0), 0),
    };
  }
}
