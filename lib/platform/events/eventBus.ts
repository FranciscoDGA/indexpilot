import { PlatformEvent, PlatformEventType } from '@/types/platform';

type EventHandler = (event: PlatformEvent) => void | Promise<void>;

/**
 * EventBus
 *
 * In-memory pub/sub event bus for platform events.
 * Supports wildcards and async handlers.
 */
export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private wildcardHandlers: Set<EventHandler> = new Set();
  private eventHistory: PlatformEvent[] = [];
  private maxHistory = 1000;

  /**
   * Subscribe to an event type.
   * Use '*' to subscribe to all events.
   */
  on(eventType: PlatformEventType | '*', handler: EventHandler): () => void {
    if (eventType === '*') {
      this.wildcardHandlers.add(handler);
      return () => { this.wildcardHandlers.delete(handler); };
    }

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Subscribe to an event type (once).
   */
  once(eventType: PlatformEventType | '*', handler: EventHandler): () => void {
    const wrapper: EventHandler = async (event) => {
      unsub();
      await handler(event);
    };
    const unsub = this.on(eventType, wrapper);
    return unsub;
  }

  /**
   * Publish an event.
   */
  async emit(eventType: PlatformEventType, payload: Record<string, any>, workspaceId?: string): Promise<PlatformEvent> {
    const event: PlatformEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      workspace_id: workspaceId,
      event_type: eventType,
      payload,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'platform',
      },
      published_at: new Date().toISOString(),
      processed: false,
    };

    // Store in history
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistory);
    }

    // Notify specific handlers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, error);
        }
      }
    }

    // Notify wildcard handlers
    for (const handler of this.wildcardHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Error in wildcard handler:`, error);
      }
    }

    return event;
  }

  /**
   * Get recent events.
   */
  getHistory(limit: number = 50): PlatformEvent[] {
    return this.eventHistory.slice(0, limit);
  }

  /**
   * Get events for a workspace.
   */
  getWorkspaceEvents(workspaceId: string, limit: number = 50): PlatformEvent[] {
    return this.eventHistory
      .filter((e) => e.workspace_id === workspaceId)
      .slice(0, limit);
  }

  /**
   * Get subscriber count for an event type.
   */
  getSubscriberCount(eventType: string): number {
    return this.handlers.get(eventType)?.size || 0;
  }

  /**
   * Remove all handlers.
   */
  clear(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();
