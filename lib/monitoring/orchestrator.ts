import { ChangeDetectionEngine } from './changeDetectionEngine';
import { ContentMonitor, TechnicalMonitor, AvailabilityMonitor } from './monitors';
import { AlertEngine } from './alertEngine';
import { MonitoringEvent, MonitoringSnapshot, Incident, MonitoringRule, TimelineEvent } from '@/types/monitoring';

/**
 * MonitoringOrchestrator
 *
 * Coordinates all monitoring components.
 * Main entry point for the monitoring system.
 */
export class MonitoringOrchestrator {
  private siteId: string;
  private changeEngine: ChangeDetectionEngine;
  private contentMonitor: ContentMonitor;
  private technicalMonitor: TechnicalMonitor;
  private availabilityMonitor: AvailabilityMonitor;
  private alertEngine: AlertEngine;
  private snapshots: Map<string, MonitoringSnapshot> = new Map();
  private timeline: TimelineEvent[] = [];

  constructor(siteId: string) {
    this.siteId = siteId;
    this.changeEngine = new ChangeDetectionEngine(siteId);
    this.contentMonitor = new ContentMonitor(siteId);
    this.technicalMonitor = new TechnicalMonitor(siteId);
    this.availabilityMonitor = new AvailabilityMonitor(siteId);
    this.alertEngine = new AlertEngine(siteId);
  }

  /**
   * Run a full monitoring check on a URL.
   */
  async monitorUrl(url: string, html: string, statusCode: number, responseTimeMs: number): Promise<{
    events: MonitoringEvent[];
    incidents: Incident[];
    snapshot: MonitoringSnapshot;
  }> {
    // Create new snapshot
    const newSnapshot = this.contentMonitor.parseHtmlToSnapshot(url, html, statusCode, responseTimeMs);

    // Compare with previous snapshot
    const oldSnapshot = this.snapshots.get(url);
    let events: MonitoringEvent[] = [];

    if (oldSnapshot) {
      events = this.changeEngine.compareSnapshots(oldSnapshot, newSnapshot);

      // Add to timeline
      for (const event of events) {
        this.addToTimeline(event);
      }
    }

    // Store snapshot
    this.snapshots.set(url, newSnapshot);

    // Process events through alert engine
    const incidents: Incident[] = [];
    for (const event of events) {
      const result = await this.alertEngine.processEvent(event);
      if (result.incident) {
        incidents.push(result.incident as Incident);
      }
    }

    return { events, incidents, snapshot: newSnapshot };
  }

  /**
   * Check site availability.
   */
  async checkAvailability(url: string): Promise<{
    isOnline: boolean;
    issues: string[];
  }> {
    const check = await this.availabilityMonitor.checkSite(url);
    const issues: string[] = [];

    if (!check.is_online) {
      issues.push(`Site offline: ${check.error || 'Unknown error'}`);

      const event: MonitoringEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
        site_id: this.siteId,
        event_type: 'availability.site_down',
        severity: 'critical',
        source: 'availability_monitor',
        payload: { url, error: check.error },
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await this.alertEngine.processEvent(event);
      this.addToTimeline(event);
    }

    if (check.response_time_ms && check.response_time_ms > 5000) {
      issues.push(`Slow response: ${check.response_time_ms}ms`);
    }

    return { isOnline: check.is_online, issues };
  }

  /**
   * Check technical SEO aspects.
   */
  async checkTechnical(domain: string): Promise<{
    robots: any;
    sitemap: any;
    ssl: any;
  }> {
    const robots = await this.technicalMonitor.checkRobotsTxt(domain);
    const sitemap = await this.technicalMonitor.checkSitemap(domain);
    const ssl = await this.technicalMonitor.checkSsl(domain);

    // Generate events for issues
    if (!robots.available) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
        site_id: this.siteId,
        event_type: 'technical.robots_changed',
        severity: 'high',
        source: 'technical_monitor',
        payload: { domain, issues: robots.issues },
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.addToTimeline(event);
    }

    if (!sitemap.available) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`,
        site_id: this.siteId,
        event_type: 'technical.sitemap_changed',
        severity: 'high',
        source: 'technical_monitor',
        payload: { domain, issues: sitemap.issues },
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      this.addToTimeline(event);
    }

    return { robots, sitemap, ssl };
  }

  /**
   * Get the event timeline.
   */
  getTimeline(limit: number = 50): TimelineEvent[] {
    return this.timeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Add event to timeline.
   */
  private addToTimeline(event: MonitoringEvent): void {
    const category = this.getEventCategory(event.event_type);
    const title = this.getEventTitle(event);

    this.timeline.push({
      id: event.id,
      site_id: event.site_id,
      category,
      title,
      description: JSON.stringify(event.payload),
      severity: event.severity,
      metadata: event.payload,
      timestamp: event.detected_at,
    });

    // Keep timeline manageable
    if (this.timeline.length > 500) {
      this.timeline = this.timeline.slice(-500);
    }
  }

  private getEventCategory(eventType: string): TimelineEvent['category'] {
    if (eventType.startsWith('content.')) return 'content';
    if (eventType.startsWith('technical.')) return 'technical';
    if (eventType.startsWith('availability.')) return 'availability';
    if (eventType.startsWith('indexation.')) return 'indexation';
    if (eventType.startsWith('alert.')) return 'alert';
    if (eventType.startsWith('audit.')) return 'audit';
    return 'content';
  }

  private getEventTitle(event: MonitoringEvent): string {
    const payload = event.payload as any;
    switch (event.event_type) {
      case 'content.changed': return `Conteúdo alterado: ${payload.url || ''}`;
      case 'technical.title_changed': return `Título alterado: ${payload.url || ''}`;
      case 'technical.meta_changed': return `Meta description alterada: ${payload.url || ''}`;
      case 'technical.canonical_changed': return `Canonical alterado: ${payload.url || ''}`;
      case 'technical.robots_changed': return `Robots.txt alterado`;
      case 'technical.sitemap_changed': return `Sitemap alterado`;
      case 'availability.site_down': return `Site offline: ${payload.url || ''}`;
      case 'availability.slow_response': return `Resposta lenta: ${payload.url || ''}`;
      default: return event.event_type;
    }
  }

  /**
   * Get the alert engine for rule registration.
   */
  getAlertEngine(): AlertEngine {
    return this.alertEngine;
  }
}
