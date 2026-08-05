import { DiffResult, ImpactLevel, ContentItem } from '@/types/connectors';

/**
 * DiffEngine
 *
 * Compares content versions to detect changes and assess impact.
 * Used by both webhook and polling engines to determine what changed.
 */
export class DiffEngine {
  /**
   * Compare two content items and detect changes.
   */
  compareContent(oldItem: ContentItem | null, newItem: ContentItem): DiffResult {
    if (!oldItem) {
      return {
        url: newItem.url,
        has_changes: true,
        changed_fields: ['all'],
        impact: 'high',
        old_hash: '',
        new_hash: this.generateHash(newItem),
        changes: {},
      };
    }

    const changedFields: string[] = [];
    const changes: Record<string, { old: any; new: any }> = {};
    let impact: ImpactLevel = 'low';

    // Compare title
    if (oldItem.title !== newItem.title) {
      changedFields.push('title');
      changes['title'] = { old: oldItem.title, new: newItem.title };
      impact = this.upgradeImpact(impact, 'medium');
    }

    // Compare content/body
    if (JSON.stringify(oldItem.metadata?.content) !== JSON.stringify(newItem.metadata?.content)) {
      changedFields.push('content');
      changes['content'] = {
        old: oldItem.metadata?.content,
        new: newItem.metadata?.content,
      };
      impact = this.upgradeImpact(impact, 'high');
    }

    // Compare slug/URL
    if (oldItem.slug !== newItem.slug) {
      changedFields.push('slug');
      changes['slug'] = { old: oldItem.slug, new: newItem.slug };
      impact = this.upgradeImpact(impact, 'critical'); // URL change is critical
    }

    // Compare status
    if (oldItem.status !== newItem.status) {
      changedFields.push('status');
      changes['status'] = { old: oldItem.status, new: newItem.status };
      impact = this.upgradeImpact(impact, 'high');
    }

    // Compare metadata (SEO fields, etc.)
    const metaChanged = this.compareMetadata(oldItem.metadata || {}, newItem.metadata || {});
    if (metaChanged.length > 0) {
      changedFields.push(...metaChanged);
      impact = this.upgradeImpact(impact, 'medium');
    }

    // Compare updated_at timestamp
    if (oldItem.updated_at !== newItem.updated_at) {
      changedFields.push('updated_at');
      changes['updated_at'] = { old: oldItem.updated_at, new: newItem.updated_at };
    }

    return {
      url: newItem.url,
      has_changes: changedFields.length > 0,
      changed_fields: changedFields,
      impact,
      old_hash: this.generateHash(oldItem),
      new_hash: this.generateHash(newItem),
      changes,
    };
  }

  /**
   * Compare metadata objects and return changed field names.
   */
  private compareMetadata(
    oldMeta: Record<string, any>,
    newMeta: Record<string, any>
  ): string[] {
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(oldMeta), ...Object.keys(newMeta)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldMeta[key]) !== JSON.stringify(newMeta[key])) {
        changed.push(`metadata.${key}`);
      }
    }

    return changed;
  }

  /**
   * Upgrade impact level if the new level is higher.
   */
  private upgradeImpact(current: ImpactLevel, candidate: ImpactLevel): ImpactLevel {
    const levels: ImpactLevel[] = ['low', 'medium', 'high', 'critical'];
    const currentIdx = levels.indexOf(current);
    const candidateIdx = levels.indexOf(candidate);
    return candidateIdx > currentIdx ? candidate : current;
  }

  /**
   * Generate a simple hash for content comparison.
   */
  private generateHash(item: ContentItem): string {
    const str = JSON.stringify({
      title: item.title,
      slug: item.slug,
      content: item.metadata?.content,
      status: item.status,
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Detect removed items by comparing two lists.
   */
  detectRemoved(oldItems: ContentItem[], newItems: ContentItem[]): ContentItem[] {
    const newIds = new Set(newItems.map((item) => item.id));
    return oldItems.filter((item) => !newIds.has(item.id));
  }

  /**
   * Detect new items by comparing two lists.
   */
  detectNew(oldItems: ContentItem[], newItems: ContentItem[]): ContentItem[] {
    const oldIds = new Set(oldItems.map((item) => item.id));
    return newItems.filter((item) => !oldIds.has(item.id));
  }

  /**
   * Calculate content similarity score between two items (0-1).
   */
  calculateSimilarity(item1: ContentItem, item2: ContentItem): number {
    const fields1 = [
      item1.title,
      item1.slug,
      item1.status,
      item1.metadata?.description || '',
      item1.metadata?.content || '',
    ];
    const fields2 = [
      item2.title,
      item2.slug,
      item2.status,
      item2.metadata?.description || '',
      item2.metadata?.content || '',
    ];

    let matches = 0;
    for (let i = 0; i < fields1.length; i++) {
      if (fields1[i] === fields2[i]) matches++;
    }

    return matches / fields1.length;
  }
}
