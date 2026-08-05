import { MonitoringEvent, Incident, MonitoringRule, EventSeverity, IncidentSeverity } from '@/types/monitoring';

type EventCallback = (event: MonitoringEvent) => void | Promise<void>;

/**
 * AlertEngine
 *
 * Processes monitoring events and generates alerts/incidents.
 * Applies severity classification and correlation rules.
 */
export class AlertEngine {
  private siteId: string;
  private handlers: Map<string, EventCallback[]> = new Map();
  private incidentBuffer: Map<string, MonitoringEvent[]> = new Map();

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Process a monitoring event and determine if alert is needed.
   */
  async processEvent(event: MonitoringEvent): Promise<{
    shouldAlert: boolean;
    severity: EventSeverity;
    incident?: Partial<Incident>;
  }> {
    // Classify severity based on event type and payload
    const severity = this.classifySeverity(event);

    // Buffer events for correlation
    const bufferKey = `${event.event_type}:${(event.payload as any).url || 'global'}`;
    const buffer = this.incidentBuffer.get(bufferKey) || [];
    buffer.push(event);
    this.incidentBuffer.set(bufferKey, buffer);

    // Check if we should create an incident
    const shouldAlert = this.shouldCreateIncident(event, severity, buffer);

    let incident: Partial<Incident> | undefined;
    if (shouldAlert) {
      incident = {
        site_id: this.siteId,
        title: this.generateIncidentTitle(event),
        description: this.generateIncidentDescription(event),
        severity: this.toIncidentSeverity(severity),
        status: 'open',
        source: event.source,
        metadata: {
          event_id: event.id,
          event_type: event.event_type,
          payload: event.payload,
        },
      };
    }

    // Notify handlers
    if (shouldAlert) {
      await this.notifyHandlers(event, severity);
    }

    return { shouldAlert, severity, incident };
  }

  /**
   * Classify event severity.
   */
  private classifySeverity(event: MonitoringEvent): EventSeverity {
    // Critical events
    if (event.event_type === 'availability.site_down') return 'critical';
    if (event.event_type === 'availability.error_burst') return 'critical';
    if (event.event_type === 'technical.robots_changed' &&
        (event.payload as any).new_robots?.includes('Disallow: /')) return 'critical';

    // High events
    if (event.event_type === 'technical.canonical_changed') return 'high';
    if (event.event_type === 'technical.robots_changed') return 'high';
    if (event.event_type === 'indexation.coverage_drop') return 'high';
    if (event.event_type === 'availability.slow_response') return 'high';

    // Medium events
    if (event.event_type === 'content.changed') return 'medium';
    if (event.event_type === 'technical.sitemap_changed') return 'medium';
    if (event.event_type === 'technical.schema_changed') return 'medium';

    // Low events
    if (event.event_type === 'technical.title_changed') return 'low';
    if (event.event_type === 'technical.meta_changed') return 'low';
    if (event.event_type === 'technical.headings_changed') return 'low';
    if (event.event_type === 'technical.links_changed') return 'low';

    return event.severity;
  }

  /**
   * Determine if an incident should be created.
   */
  private shouldCreateIncident(
    event: MonitoringEvent,
    severity: EventSeverity,
    buffer: MonitoringEvent[]
  ): boolean {
    // Always create for critical/high
    if (severity === 'critical' || severity === 'high') return true;

    // For medium, check if multiple events in short time
    if (severity === 'medium') {
      const recentEvents = buffer.filter(
        (e) => Date.now() - new Date(e.detected_at).getTime() < 5 * 60 * 1000
      );
      return recentEvents.length >= 3;
    }

    return false;
  }

  /**
   * Generate incident title from event.
   */
  private generateIncidentTitle(event: MonitoringEvent): string {
    const payload = event.payload as any;
    switch (event.event_type) {
      case 'availability.site_down':
        return `Site offline: ${payload.url}`;
      case 'availability.slow_response':
        return `Resposta lenta detectada: ${payload.url}`;
      case 'technical.robots_changed':
        return `Robots.txt alterado: ${payload.url}`;
      case 'technical.canonical_changed':
        return `Canonical alterado: ${payload.url}`;
      case 'content.changed':
        return `Conteúdo alterado: ${payload.url}`;
      case 'indexation.coverage_drop':
        return `Queda na cobertura de indexação`;
      default:
        return `Evento detectado: ${event.event_type}`;
    }
  }

  /**
   * Generate incident description from event.
   */
  private generateIncidentDescription(event: MonitoringEvent): string {
    const payload = event.payload as any;
    const details: string[] = [];

    if (payload.old_value && payload.new_value) {
      details.push(`De: ${payload.old_value}`);
      details.push(`Para: ${payload.new_value}`);
    }

    if (payload.url) details.push(`URL: ${payload.url}`);
    if (payload.response_time_ms) details.push(`Tempo: ${payload.response_time_ms}ms`);

    return details.join('\n') || `Evento: ${event.event_type}`;
  }

  /**
   * Register event handler.
   */
  on(eventType: string, handler: EventCallback): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Convert EventSeverity to IncidentSeverity (filters out 'info').
   */
  private toIncidentSeverity(severity: EventSeverity): IncidentSeverity {
    if (severity === 'info') return 'low';
    return severity as IncidentSeverity;
  }

  /**
   * Notify registered handlers.
   */
  private async notifyHandlers(event: MonitoringEvent, severity: EventSeverity): Promise<void> {
    const handlers = this.handlers.get(event.event_type) || [];
    const globalHandlers = this.handlers.get('*') || [];

    for (const handler of [...handlers, ...globalHandlers]) {
      try {
        await handler(event);
      } catch (error) {
        console.error('[AlertEngine] Handler error:', error);
      }
    }
  }

  /**
   * Apply monitoring rules to events.
   */
  async applyRules(event: MonitoringEvent, rules: MonitoringRule[]): Promise<Array<{
    rule: MonitoringRule;
    triggered: boolean;
  }>> {
    const results: Array<{ rule: MonitoringRule; triggered: boolean }> = [];

    for (const rule of rules) {
      if (!rule.enabled) {
        results.push({ rule, triggered: false });
        continue;
      }

      const triggered = this.evaluateRule(rule, event);
      results.push({ rule, triggered });

      if (triggered) {
        rule.last_triggered_at = new Date().toISOString();
      }
    }

    return results;
  }

  /**
   * Evaluate a single rule against an event.
   */
  private evaluateRule(rule: MonitoringRule, event: MonitoringEvent): boolean {
    const trigger = rule.trigger_config;

    // Check event type match
    if (trigger.event_type && trigger.event_type !== event.event_type) {
      return false;
    }

    // Check severity threshold
    if (trigger.min_severity) {
      const severityOrder = ['low', 'medium', 'high', 'critical'];
      const eventIdx = severityOrder.indexOf(event.severity);
      const triggerIdx = severityOrder.indexOf(trigger.min_severity);
      if (eventIdx < triggerIdx) return false;
    }

    // Check URL pattern
    if (trigger.url_pattern) {
      const url = (event.payload as any).url || '';
      if (!url.includes(trigger.url_pattern)) return false;
    }

    return true;
  }
}
