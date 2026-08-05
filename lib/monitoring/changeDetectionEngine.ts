import { MonitoringEvent, MonitoringEventType, EventSeverity, MonitoringSnapshot, ContentChangeScore } from '@/types/monitoring';

/**
 * ChangeDetectionEngine
 *
 * Core engine that compares snapshots and detects changes.
 * Generates monitoring events and change records.
 */
export class ChangeDetectionEngine {
  private siteId: string;

  constructor(siteId: string) {
    this.siteId = siteId;
  }

  /**
   * Compare two snapshots and detect all changes.
   */
  compareSnapshots(oldSnapshot: MonitoringSnapshot, newSnapshot: MonitoringSnapshot): MonitoringEvent[] {
    const events: MonitoringEvent[] = [];

    // Status code change
    if (oldSnapshot.status_code !== newSnapshot.status_code) {
      events.push(this.createEvent(
        'technical.status_changed',
        'medium',
        'change_detection',
        {
          url: newSnapshot.url,
          old_status: oldSnapshot.status_code,
          new_status: newSnapshot.status_code,
        }
      ));
    }

    // Title change
    if (oldSnapshot.title !== newSnapshot.title) {
      events.push(this.createEvent(
        'technical.title_changed',
        'low',
        'change_detection',
        {
          url: newSnapshot.url,
          old_title: oldSnapshot.title,
          new_title: newSnapshot.title,
        }
      ));
    }

    // Meta description change
    if (oldSnapshot.meta_description !== newSnapshot.meta_description) {
      events.push(this.createEvent(
        'technical.meta_changed',
        'low',
        'change_detection',
        {
          url: newSnapshot.url,
          field: 'meta_description',
          old_value: oldSnapshot.meta_description,
          new_value: newSnapshot.meta_description,
        }
      ));
    }

    // Canonical change
    if (oldSnapshot.canonical !== newSnapshot.canonical) {
      events.push(this.createEvent(
        'technical.canonical_changed',
        'high',
        'change_detection',
        {
          url: newSnapshot.url,
          old_canonical: oldSnapshot.canonical,
          new_canonical: newSnapshot.canonical,
        }
      ));
    }

    // Robots change
    if (oldSnapshot.robots !== newSnapshot.robots) {
      events.push(this.createEvent(
        'technical.robots_changed',
        'high',
        'change_detection',
        {
          url: newSnapshot.url,
          old_robots: oldSnapshot.robots,
          new_robots: newSnapshot.robots,
        }
      ));
    }

    // H1 change
    if (oldSnapshot.h1 !== newSnapshot.h1) {
      events.push(this.createEvent(
        'content.changed',
        'low',
        'change_detection',
        {
          url: newSnapshot.url,
          field: 'h1',
          old_value: oldSnapshot.h1,
          new_value: newSnapshot.h1,
        }
      ));
    }

    // Schema change
    if (oldSnapshot.schema_type !== newSnapshot.schema_type) {
      events.push(this.createEvent(
        'technical.schema_changed',
        'medium',
        'change_detection',
        {
          url: newSnapshot.url,
          old_schema: oldSnapshot.schema_type,
          new_schema: newSnapshot.schema_type,
        }
      ));
    }

    // Content hash change (significant content update)
    if (oldSnapshot.content_hash && newSnapshot.content_hash &&
        oldSnapshot.content_hash !== newSnapshot.content_hash) {
      events.push(this.createEvent(
        'content.changed',
        'medium',
        'change_detection',
        {
          url: newSnapshot.url,
          content_changed: true,
          word_count_delta: (newSnapshot.word_count || 0) - (oldSnapshot.word_count || 0),
        }
      ));
    }

    // Links change
    if (oldSnapshot.internal_links_count !== newSnapshot.internal_links_count ||
        oldSnapshot.external_links_count !== newSnapshot.external_links_count) {
      events.push(this.createEvent(
        'technical.links_changed',
        'low',
        'change_detection',
        {
          url: newSnapshot.url,
          old_internal: oldSnapshot.internal_links_count,
          new_internal: newSnapshot.internal_links_count,
          old_external: oldSnapshot.external_links_count,
          new_external: newSnapshot.external_links_count,
        }
      ));
    }

    return events;
  }

  /**
   * Calculate a content change score.
   */
  calculateChangeScore(oldSnapshot: MonitoringSnapshot, newSnapshot: MonitoringSnapshot): ContentChangeScore {
    const factors = {
      title_changed: oldSnapshot.title !== newSnapshot.title,
      content_changed: oldSnapshot.content_hash !== newSnapshot.content_hash,
      slug_changed: false,
      headings_changed: oldSnapshot.h1 !== newSnapshot.h1,
      images_changed: false,
      schema_changed: oldSnapshot.schema_type !== newSnapshot.schema_type,
      links_changed: oldSnapshot.internal_links_count !== newSnapshot.internal_links_count ||
                     oldSnapshot.external_links_count !== newSnapshot.external_links_count,
    };

    // Calculate score (0-100)
    let score = 0;
    if (factors.title_changed) score += 20;
    if (factors.content_changed) score += 30;
    if (factors.slug_changed) score += 25;
    if (factors.headings_changed) score += 10;
    if (factors.images_changed) score += 5;
    if (factors.schema_changed) score += 10;
    if (factors.links_changed) score += 5;

    // Determine recommendation
    let recommendation: 'index' | 'audit' | 'ignore' = 'ignore';
    if (score >= 50) recommendation = 'index';
    else if (score >= 20) recommendation = 'audit';

    return {
      url: newSnapshot.url,
      score,
      factors,
      recommendation,
    };
  }

  /**
   * Create a monitoring event.
   */
  private createEvent(
    eventType: MonitoringEventType,
    severity: EventSeverity,
    source: string,
    payload: Record<string, any>
  ): MonitoringEvent {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      site_id: this.siteId,
      event_type: eventType,
      severity,
      source,
      payload,
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }
}
