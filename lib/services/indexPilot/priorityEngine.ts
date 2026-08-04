import { UrlType } from '@/types/indexPilot';

export class PriorityEngine {
  /**
   * Priority scoring system
   * Higher score = higher priority in queue
   */

  private readonly typeScores: Record<UrlType, number> = {
    article: 100,
    page: 60,
    category: 40,
    tag: 30,
  };

  /**
   * Calculate priority score for a URL
   */
  calculatePriority(
    type: UrlType,
    isNew: boolean = true,
    isUpdated: boolean = false,
    isLandingPage: boolean = false
  ): number {
    let score = this.typeScores[type] || 50;

    // New content gets boost
    if (isNew) {
      score += 50;
    }

    // Updated content gets moderate boost
    if (isUpdated && !isNew) {
      score += 30;
    }

    // Landing pages get priority
    if (isLandingPage) {
      score += 40;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Adjust priority based on queue position
   * Items that have been waiting get higher priority
   */
  adjustByWaitTime(
    baseScore: number,
    createdAt: Date,
    maxWaitHours: number = 24
  ): number {
    const now = new Date();
    const waitMs = now.getTime() - createdAt.getTime();
    const waitHours = waitMs / (1000 * 60 * 60);

    if (waitHours > maxWaitHours) {
      // Boost priority significantly if waiting too long
      return Math.min(baseScore + 30, 100);
    }

    return baseScore;
  }

  /**
   * Get priority tier for UI display
   */
  getPriorityTier(score: number): 'critical' | 'high' | 'normal' | 'low' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'normal';
    return 'low';
  }

  /**
   * Get priority color for UI
   */
  getPriorityColor(score: number): string {
    const tier = this.getPriorityTier(score);
    const colors: Record<string, string> = {
      critical: '#dc2626', // red
      high: '#f97316', // orange
      normal: '#3b82f6', // blue
      low: '#6b7280', // gray
    };
    return colors[tier];
  }
}

export const priorityEngine = new PriorityEngine();
