import { ConnectorManager } from './connectorManager';
import { IConnector, SyncResult, SyncParams, Connector } from '@/types/connectors';

export interface PollingConfig {
  interval_minutes: number;
  enabled: boolean;
  last_poll_at?: string;
  max_items_per_poll?: number;
}

interface PollingTask {
  connectorId: string;
  interval: ReturnType<typeof setInterval>;
  config: PollingConfig;
}

/**
 * PollingEngine
 *
 * Periodically polls CMS platforms for content changes.
 * Runs on a configurable interval and triggers sync jobs.
 */
export class PollingEngine {
  private connectorManager: ConnectorManager;
  private activeTasks: Map<string, PollingTask> = new Map();
  private connectors: Map<string, IConnector> = new Map();

  constructor(connectorManager: ConnectorManager) {
    this.connectorManager = connectorManager;
  }

  /**
   * Register a connector instance for polling.
   */
  registerConnector(connectorId: string, connector: IConnector): void {
    this.connectors.set(connectorId, connector);
  }

  /**
   * Unregister a connector from polling.
   */
  unregisterConnector(connectorId: string): void {
    this.stopPolling(connectorId);
    this.connectors.delete(connectorId);
  }

  /**
   * Start polling for a specific connector.
   */
  startPolling(connectorId: string, config: PollingConfig): void {
    // Stop existing polling if any
    this.stopPolling(connectorId);

    if (!config.enabled) return;

    const interval = setInterval(async () => {
      await this.pollConnector(connectorId);
    }, config.interval_minutes * 60 * 1000);

    this.activeTasks.set(connectorId, {
      connectorId,
      interval,
      config,
    });

    console.log(`[PollingEngine] Started polling for connector ${connectorId} every ${config.interval_minutes} minutes`);
  }

  /**
   * Stop polling for a specific connector.
   */
  stopPolling(connectorId: string): void {
    const task = this.activeTasks.get(connectorId);
    if (task) {
      clearInterval(task.interval);
      this.activeTasks.delete(connectorId);
      console.log(`[PollingEngine] Stopped polling for connector ${connectorId}`);
    }
  }

  /**
   * Stop all polling tasks.
   */
  stopAllPolling(): void {
    for (const [connectorId] of this.activeTasks) {
      this.stopPolling(connectorId);
    }
  }

  /**
   * Poll a connector for changes.
   */
  async pollConnector(connectorId: string): Promise<{
    success: boolean;
    result?: SyncResult;
    error?: string;
  }> {
    const connector = await this.connectorManager.getConnector(connectorId);
    if (!connector) {
      return { success: false, error: 'Connector not found' };
    }

    if (connector.status === 'inactive' || connector.status === 'error') {
      return { success: false, error: `Connector is ${connector.status}` };
    }

    const connectorInstance = this.connectors.get(connectorId);
    if (!connectorInstance) {
      return { success: false, error: 'Connector instance not registered' };
    }

    // Create a sync job
    const syncJob = await this.connectorManager.createSyncJob(
      connectorId,
      connector.site_id,
      connector.user_id,
      'polling'
    );

    try {
      await this.connectorManager.startSyncJob(syncJob.id);
      await this.connectorManager.updateStatus(connectorId, 'syncing');

      const task = this.activeTasks.get(connectorId);
      const maxItems = task?.config.max_items_per_poll || 100;

      const syncParams: SyncParams = {
        full: false,
        limit: maxItems,
      };

      const result = await connectorInstance.sync(syncParams);

      await this.connectorManager.completeSyncJob(syncJob.id, result);
      await this.connectorManager.incrementSyncCount(connectorId);
      await this.connectorManager.updateStatus(connectorId, 'active');

      // Update last poll time
      if (task) {
        task.config.last_poll_at = new Date().toISOString();
      }

      console.log(`[PollingEngine] Poll completed for connector ${connectorId}:`, result);
      return { success: true, result };
    } catch (error) {
      const errorMsg = String(error);
      await this.connectorManager.failSyncJob(syncJob.id, errorMsg);
      await this.connectorManager.updateStatus(connectorId, 'error', errorMsg);

      console.error(`[PollingEngine] Poll failed for connector ${connectorId}:`, error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Get the status of all active polling tasks.
   */
  getPollingStatus(): Array<{
    connectorId: string;
    config: PollingConfig;
    isActive: boolean;
  }> {
    const status: Array<{
      connectorId: string;
      config: PollingConfig;
      isActive: boolean;
    }> = [];

    for (const [connectorId, task] of this.activeTasks) {
      status.push({
        connectorId,
        config: task.config,
        isActive: true,
      });
    }

    return status;
  }

  /**
   * Check if polling is active for a connector.
   */
  isPolling(connectorId: string): boolean {
    return this.activeTasks.has(connectorId);
  }
}
