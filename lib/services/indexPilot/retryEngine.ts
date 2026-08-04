import { RetryJob, RetryConfig } from '@/types/indexPilot';

/**
 * Retry Engine
 * Manages retry logic with exponential backoff
 * Delays: 5m → 30m → 2h → 12h → 24h
 */
export class RetryEngine {
  private config: RetryConfig = {
    delays: [
      5 * 60 * 1000, // 5 minutes
      30 * 60 * 1000, // 30 minutes
      2 * 60 * 60 * 1000, // 2 hours
      12 * 60 * 60 * 1000, // 12 hours
      24 * 60 * 60 * 1000, // 24 hours
    ],
    maxAttempts: 5,
    exponentialBase: 2,
    jitterFactor: 0.1, // Add up to 10% random jitter to prevent thundering herd
  };

  private retryJobs: Map<string, RetryJob> = new Map();

  /**
   * Schedule a retry for a failed dispatch
   */
  async scheduleRetry(
    urlId: string,
    providerId: string,
    currentAttempt: number,
    reason: string
  ): Promise<RetryJob | null> {
    // Check if we should retry
    if (currentAttempt >= this.config.maxAttempts) {
      console.log(`Max retries reached for ${urlId}`);
      return null;
    }

    // Calculate next retry time
    const delay = this.calculateDelay(currentAttempt);
    const nextRetryAt = new Date(Date.now() + delay);

    const retryJob: RetryJob = {
      urlId,
      providerId,
      attempt: currentAttempt + 1,
      nextRetryAt,
      reason,
    };

    this.retryJobs.set(`${urlId}_${providerId}`, retryJob);

    console.log(
      `Scheduled retry for ${urlId} with ${providerId} at ${nextRetryAt.toISOString()}`
    );

    return retryJob;
  }

  /**
   * Calculate delay for given attempt
   * Uses exponential backoff with jitter
   */
  private calculateDelay(attempt: number): number {
    // Use predefined delays if available
    if (attempt < this.config.delays.length) {
      const delay = this.config.delays[attempt];
      return this.addJitter(delay);
    }

    // Fall back to exponential backoff
    const exponentialDelay =
      this.config.delays[this.config.delays.length - 1] *
      Math.pow(this.config.exponentialBase, attempt - this.config.delays.length);

    return this.addJitter(exponentialDelay);
  }

  /**
   * Add random jitter to prevent thundering herd problem
   */
  private addJitter(delay: number): number {
    const jitter = delay * this.config.jitterFactor;
    return delay + Math.random() * jitter;
  }

  /**
   * Get retry jobs due for processing
   */
  async getRetryJobsDue(): Promise<RetryJob[]> {
    const now = new Date();
    const dueJobs: RetryJob[] = [];

    for (const job of this.retryJobs.values()) {
      if (job.nextRetryAt <= now) {
        dueJobs.push(job);
      }
    }

    return dueJobs;
  }

  /**
   * Mark retry job as processed
   */
  async markProcessed(urlId: string, providerId: string): Promise<void> {
    this.retryJobs.delete(`${urlId}_${providerId}`);
  }

  /**
   * Get retry job details
   */
  getRetryJob(urlId: string, providerId: string): RetryJob | null {
    return this.retryJobs.get(`${urlId}_${providerId}`) || null;
  }

  /**
   * Get retry statistics
   */
  getStats(): {
    totalRetries: number;
    dueNow: number;
    scheduled: number;
  } {
    const now = new Date();
    const dueNow = Array.from(this.retryJobs.values()).filter(
      (j) => j.nextRetryAt <= now
    ).length;

    return {
      totalRetries: this.retryJobs.size,
      dueNow,
      scheduled: this.retryJobs.size - dueNow,
    };
  }

  /**
   * Update retry configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cancel a scheduled retry
   */
  cancelRetry(urlId: string, providerId: string): boolean {
    return this.retryJobs.delete(`${urlId}_${providerId}`);
  }

  /**
   * Clear all retry jobs
   */
  clearAll(): void {
    this.retryJobs.clear();
  }
}

export const retryEngine = new RetryEngine();
