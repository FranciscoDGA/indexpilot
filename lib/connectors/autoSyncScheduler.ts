import { ConnectorManager } from './connectorManager';
import { PollingEngine, PollingConfig } from './pollingEngine';
import { Connector } from '@/types/connectors';

export interface SchedulerConfig {
  default_interval_minutes: number;
  max_concurrent_syncs: number;
  retry_delay_minutes: number;
  max_retries: number;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
}

interface ScheduledConnector {
  connectorId: string;
  config: PollingConfig;
  nextRunAt: Date;
  retryCount: number;
}

/**
 * AutoSyncScheduler
 *
 * Manages automatic synchronization of connectors based on schedules.
 * Supports cron-like scheduling, quiet hours, and retry logic.
 */
export class AutoSyncScheduler {
  private connectorManager: ConnectorManager;
  private pollingEngine: PollingEngine;
  private config: SchedulerConfig;
  private scheduledConnectors: Map<string, ScheduledConnector> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(
    connectorManager: ConnectorManager,
    pollingEngine: PollingEngine,
    config?: Partial<SchedulerConfig>
  ) {
    this.connectorManager = connectorManager;
    this.pollingEngine = pollingEngine;
    this.config = {
      default_interval_minutes: 30,
      max_concurrent_syncs: 3,
      retry_delay_minutes: 5,
      max_retries: 3,
      ...config,
    };
  }

  /**
   * Start the scheduler. Checks every minute for due syncs.
   */
  start(): void {
    if (this.timer) return;

    this.timer = setInterval(async () => {
      await this.tick();
    }, 60 * 1000);

    this.isRunning = true;
    console.log('[AutoSyncScheduler] Started');
  }

  /**
   * Stop the scheduler.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[AutoSyncScheduler] Stopped');
  }

  /**
   * Schedule a connector for automatic syncing.
   */
  scheduleConnector(connectorId: string, intervalMinutes?: number): void {
    const interval = intervalMinutes || this.config.default_interval_minutes;
    const nextRun = new Date(Date.now() + interval * 60 * 1000);

    this.scheduledConnectors.set(connectorId, {
      connectorId,
      config: {
        interval_minutes: interval,
        enabled: true,
      },
      nextRunAt: nextRun,
      retryCount: 0,
    });

    console.log(`[AutoSyncScheduler] Scheduled connector ${connectorId} every ${interval} minutes`);
  }

  /**
   * Unschedule a connector.
   */
  unscheduleConnector(connectorId: string): void {
    this.scheduledConnectors.delete(connectorId);
    this.pollingEngine.stopPolling(connectorId);
    console.log(`[AutoSyncScheduler] Unscheduled connector ${connectorId}`);
  }

  /**
   * Update the schedule for a connector.
   */
  updateSchedule(connectorId: string, intervalMinutes: number): void {
    const existing = this.scheduledConnectors.get(connectorId);
    if (existing) {
      existing.config.interval_minutes = intervalMinutes;
      existing.nextRunAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }
  }

  /**
   * Main tick - check for due syncs and execute them.
   */
  private async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();

      // Check quiet hours
      if (this.isQuietHour(now)) {
        return;
      }

      // Find connectors due for sync
      const dueConnectors: string[] = [];
      for (const [id, scheduled] of this.scheduledConnectors) {
        if (scheduled.config.enabled && scheduled.nextRunAt <= now) {
          dueConnectors.push(id);
        }
      }

      if (dueConnectors.length === 0) return;

      console.log(`[AutoSyncScheduler] ${dueConnectors.length} connectors due for sync`);

      // Execute syncs (limited by max_concurrent_syncs)
      const toSync = dueConnectors.slice(0, this.config.max_concurrent_syncs);

      await Promise.allSettled(
        toSync.map(async (connectorId) => {
          const scheduled = this.scheduledConnectors.get(connectorId);
          if (!scheduled) return;

          try {
            await this.pollingEngine.pollConnector(connectorId);

            // Reset retry count and schedule next run
            scheduled.retryCount = 0;
            scheduled.nextRunAt = new Date(
              Date.now() + scheduled.config.interval_minutes * 60 * 1000
            );
          } catch (error) {
            console.error(`[AutoSyncScheduler] Sync failed for ${connectorId}:`, error);

            scheduled.retryCount++;
            if (scheduled.retryCount >= this.config.max_retries) {
              console.error(`[AutoSyncScheduler] Max retries reached for ${connectorId}, disabling`);
              scheduled.config.enabled = false;
            } else {
              scheduled.nextRunAt = new Date(
                Date.now() + this.config.retry_delay_minutes * 60 * 1000
              );
            }
          }
        })
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Check if current time is within quiet hours.
   */
  private isQuietHour(now: Date): boolean {
    if (this.config.quiet_hours_start === undefined || this.config.quiet_hours_end === undefined) {
      return false;
    }

    const hour = now.getHours();
    const start = this.config.quiet_hours_start;
    const end = this.config.quiet_hours_end;

    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      // Handles overnight quiet hours (e.g., 22 to 6)
      return hour >= start || hour < end;
    }
  }

  /**
   * Get scheduler status.
   */
  getStatus(): {
    isRunning: boolean;
    scheduledCount: number;
    nextSync?: { connectorId: string; nextRunAt: Date };
    connectors: Array<{
      connectorId: string;
      interval: number;
      enabled: boolean;
      nextRunAt: Date;
      retryCount: number;
    }>;
  } {
    const connectors: Array<{
      connectorId: string;
      interval: number;
      enabled: boolean;
      nextRunAt: Date;
      retryCount: number;
    }> = [];

    let earliestNext: { connectorId: string; nextRunAt: Date } | undefined;

    for (const [id, scheduled] of this.scheduledConnectors) {
      connectors.push({
        connectorId: id,
        interval: scheduled.config.interval_minutes,
        enabled: scheduled.config.enabled,
        nextRunAt: scheduled.nextRunAt,
        retryCount: scheduled.retryCount,
      });

      if (scheduled.config.enabled) {
        if (!earliestNext || scheduled.nextRunAt < earliestNext.nextRunAt) {
          earliestNext = { connectorId: id, nextRunAt: scheduled.nextRunAt };
        }
      }
    }

    return {
      isRunning: this.isRunning,
      scheduledCount: this.scheduledConnectors.size,
      nextSync: earliestNext,
      connectors,
    };
  }

  /**
   * Load schedules from database.
   */
  async loadSchedules(siteId: string): Promise<void> {
    const connectors = await this.connectorManager.listConnectors(siteId);

    for (const connector of connectors) {
      if (connector.status === 'active' && connector.config?.sync_interval_minutes) {
        this.scheduleConnector(connector.id, connector.config.sync_interval_minutes);
      }
    }
  }
}
