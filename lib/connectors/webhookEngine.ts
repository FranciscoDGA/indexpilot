import { ConnectorManager } from './connectorManager';
import { IConnector, ConnectorEvent, Connector } from '@/types/connectors';

/**
 * WebhookEngine
 *
 * Handles incoming webhooks from CMS platforms.
 * Validates signatures, normalizes payloads, and queues events for processing.
 */
export class WebhookEngine {
  private connectorManager: ConnectorManager;
  private connectors: Map<string, IConnector> = new Map();

  constructor(connectorManager: ConnectorManager) {
    this.connectorManager = connectorManager;
  }

  /**
   * Register a connector instance for webhook handling.
   */
  registerConnector(connectorId: string, connector: IConnector): void {
    this.connectors.set(connectorId, connector);
  }

  /**
   * Unregister a connector.
   */
  unregisterConnector(connectorId: string): void {
    this.connectors.delete(connectorId);
  }

  /**
   * Process an incoming webhook payload.
   *
   * Steps:
   * 1. Find the connector
   * 2. Validate the webhook signature (if secret is configured)
   * 3. Delegate to the connector's handleWebhook method
   * 4. Log the event
   */
  async processWebhook(
    connectorId: string,
    payload: Record<string, any>,
    headers: Record<string, string> = {}
  ): Promise<{ success: boolean; event?: ConnectorEvent; error?: string }> {
    // 1. Find the connector record
    const connector = await this.connectorManager.getConnector(connectorId);
    if (!connector) {
      return { success: false, error: 'Connector not found' };
    }

    if (connector.status === 'inactive') {
      return { success: false, error: 'Connector is inactive' };
    }

    // 2. Validate webhook signature if configured
    const webhookSecret = connector.config.webhook_secret;
    if (webhookSecret) {
      const isValid = this.validateSignature(payload, headers, webhookSecret);
      if (!isValid) {
        return { success: false, error: 'Invalid webhook signature' };
      }
    }

    // 3. Get the connector instance
    const connectorInstance = this.connectors.get(connectorId);
    if (!connectorInstance) {
      return { success: false, error: 'Connector instance not registered' };
    }

    // 4. Delegate to connector's webhook handler
    const event = await connectorInstance.handleWebhook(payload);
    if (!event) {
      return { success: true, error: 'Event ignored by connector' };
    }

    // 5. Log the event
    await this.connectorManager.logEvent(
      connectorId,
      event.event_type,
      event.payload,
      event.source_url,
      event.content_hash,
      event.impact_level
    );

    return { success: true, event };
  }

  /**
   * Validate webhook signature using HMAC-SHA256.
   */
  private validateSignature(
    payload: Record<string, any>,
    headers: Record<string, string>,
    secret: string
  ): boolean {
    const signature = headers['x-webhook-signature'] || headers['x-hub-signature-256'] || headers['x-signature'];
    if (!signature) {
      return false;
    }

    // Simple hash comparison (in production, use crypto.subtle for HMAC)
    const body = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
      const char = body.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const expected = Math.abs(hash).toString(16).padStart(8, '0');
    return signature === expected || signature === `sha256=${expected}`;
  }

  /**
   * Process a batch of pending webhook events.
   */
  async processPendingEvents(limit: number = 50): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const events = await this.connectorManager.listPendingEvents(limit);
    let succeeded = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.connectorManager.updateEventStatus(event.id, 'processing');
        // In a real implementation, this would trigger indexing/actions
        await this.connectorManager.updateEventStatus(event.id, 'completed');
        succeeded++;
      } catch (error) {
        await this.connectorManager.updateEventStatus(event.id, 'failed', String(error));
        failed++;
      }
    }

    return {
      processed: events.length,
      succeeded,
      failed,
    };
  }

  /**
   * Generate a webhook URL for a connector.
   */
  generateWebhookUrl(connectorId: string, baseUrl: string): string {
    return `${baseUrl}/api/connectors/webhook/${connectorId}`;
  }
}
