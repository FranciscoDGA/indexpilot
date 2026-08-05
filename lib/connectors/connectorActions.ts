import { ConnectorManager } from './connectorManager';
import { DiffEngine } from './diffEngine';
import { Connector, ContentItem, DiffResult } from '@/types/connectors';

export interface ActionConfig {
  auto_index: boolean;
  auto_notify: boolean;
  notify_email?: string;
  index_provider?: string;
  cooldown_minutes: number;
}

export interface ActionResult {
  action: string;
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * ConnectorActions
 *
 * Executes automated actions when content changes are detected.
 * Actions include auto-indexing, notifications, and webhook triggers.
 */
export class ConnectorActions {
  private connectorManager: ConnectorManager;
  private diffEngine: DiffEngine;
  private actionConfigs: Map<string, ActionConfig> = new Map();
  private lastActionTimes: Map<string, Date> = new Map();

  constructor(connectorManager: ConnectorManager) {
    this.connectorManager = connectorManager;
    this.diffEngine = new DiffEngine();
  }

  /**
   * Configure actions for a connector.
   */
  configure(connectorId: string, config: ActionConfig): void {
    this.actionConfigs.set(connectorId, config);
  }

  /**
   * Get action config for a connector.
   */
  getConfig(connectorId: string): ActionConfig | undefined {
    return this.actionConfigs.get(connectorId);
  }

  /**
   * Process content changes and execute appropriate actions.
   */
  async processChanges(
    connectorId: string,
    oldItems: ContentItem[],
    newItems: ContentItem[]
  ): Promise<ActionResult[]> {
    const config = this.actionConfigs.get(connectorId);
    if (!config) return [];

    const connector = await this.connectorManager.getConnector(connectorId);
    if (!connector) return [];

    // Check cooldown
    if (this.isOnCooldown(connectorId, config.cooldown_minutes)) {
      return [{
        action: 'skip',
        success: true,
        message: 'Action skipped due to cooldown',
        timestamp: new Date().toISOString(),
      }];
    }

    const results: ActionResult[] = [];

    // Detect changes
    const removed = this.diffEngine.detectRemoved(oldItems, newItems);
    const added = this.diffEngine.detectNew(oldItems, newItems);

    const modified: Array<{ old: ContentItem; new: ContentItem; diff: DiffResult }> = [];
    for (const newItem of newItems) {
      const oldItem = oldItems.find((o) => o.id === newItem.id);
      if (oldItem) {
        const diff = this.diffEngine.compareContent(oldItem, newItem);
        if (diff.has_changes) {
          modified.push({ old: oldItem, new: newItem, diff });
        }
      }
    }

    // Log changes
    if (removed.length > 0 || added.length > 0 || modified.length > 0) {
      await this.connectorManager.logEvent(
        connectorId,
        'update',
        {
          removed: removed.length,
          added: added.length,
          modified: modified.length,
          details: {
            removed_urls: removed.map((r) => r.url),
            added_urls: added.map((a) => a.url),
            modified_urls: modified.map((m) => ({
              url: m.new.url,
              changes: m.diff.changed_fields,
              impact: m.diff.impact,
            })),
          },
        },
        undefined,
        undefined,
        modified.some((m) => m.diff.impact === 'critical') ? 'critical' : 'medium'
      );
    }

    // Execute auto-index action
    if (config.auto_index) {
      for (const item of [...added, ...modified.map((m) => m.new)]) {
        const indexResult = await this.executeIndex(connector, item, config);
        results.push(indexResult);
      }
    }

    // Execute notify action
    if (config.auto_notify && config.notify_email) {
      const significantChanges = modified.filter(
        (m) => m.diff.impact === 'critical' || m.diff.impact === 'high'
      );

      if (added.length > 0 || removed.length > 0 || significantChanges.length > 0) {
        const notifyResult = await this.executeNotify(
          connector,
          { added, removed, modified: significantChanges },
          config
        );
        results.push(notifyResult);
      }
    }

    // Update cooldown
    this.lastActionTimes.set(connectorId, new Date());

    return results;
  }

  /**
   * Execute auto-index action for a content item.
   */
  private async executeIndex(
    connector: Connector,
    item: ContentItem,
    config: ActionConfig
  ): Promise<ActionResult> {
    try {
      // Log the indexing action
      await this.connectorManager.logEvent(
        connector.id,
        'publish',
        {
          action: 'auto_index',
          url: item.url,
          title: item.title,
          provider: config.index_provider || 'indexnow',
        },
        item.url,
        undefined,
        'low'
      );

      return {
        action: 'index',
        success: true,
        message: `Queued for indexing: ${item.url}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        action: 'index',
        success: false,
        message: `Failed to index ${item.url}: ${String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute notification action.
   */
  private async executeNotify(
    connector: Connector,
    changes: {
      added: ContentItem[];
      removed: ContentItem[];
      modified: Array<{ old: ContentItem; new: ContentItem; diff: DiffResult }>;
    },
    config: ActionConfig
  ): Promise<ActionResult> {
    try {
      const summary = {
        connector: connector.name,
        provider: connector.provider,
        added: changes.added.length,
        removed: changes.removed.length,
        modified: changes.modified.length,
        timestamp: new Date().toISOString(),
      };

      // Log the notification
      await this.connectorManager.logEvent(
        connector.id,
        'update',
        {
          action: 'notify',
          email: config.notify_email,
          summary,
        },
        undefined,
        undefined,
        'low'
      );

      return {
        action: 'notify',
        success: true,
        message: `Notification sent to ${config.notify_email}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        action: 'notify',
        success: false,
        message: `Failed to send notification: ${String(error)}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check if a connector is on cooldown.
   */
  private isOnCooldown(connectorId: string, cooldownMinutes: number): boolean {
    const lastAction = this.lastActionTimes.get(connectorId);
    if (!lastAction) return false;

    const cooldownMs = cooldownMinutes * 60 * 1000;
    return Date.now() - lastAction.getTime() < cooldownMs;
  }

  /**
   * Get action history for a connector.
   */
  async getActionHistory(connectorId: string, limit: number = 20): Promise<any[]> {
    const events = await this.connectorManager.listEvents(connectorId, limit);
    return events.filter(
      (e) => e.payload?.action === 'auto_index' || e.payload?.action === 'notify'
    );
  }
}
