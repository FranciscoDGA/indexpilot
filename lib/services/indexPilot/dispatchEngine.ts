import { DispatchConfig, DispatchDecision, ProviderType } from '@/types/indexPilot';

/**
 * Dispatch Engine
 * Decides which providers should receive each URL
 * Strategies:
 * - all: Send to all enabled providers
 * - primary: Send only to primary provider
 * - conditional: Send based on content type and URL characteristics
 */
export class DispatchEngine {
  private config: DispatchConfig = {
    providers: ['google', 'indexnow'],
    strategy: 'conditional',
  };

  /**
   * Decide which providers should receive the URL
   */
  async makeDecision(
    url: string,
    metadata?: {
      contentType?: string;
      type?: string;
      isNew?: boolean;
      priority?: number;
    }
  ): Promise<DispatchDecision> {
    const decision: DispatchDecision = {
      url,
      targetProviders: [],
      reasoning: '',
    };

    switch (this.config.strategy) {
      case 'all':
        decision.targetProviders = this.getEnabledProviders();
        decision.reasoning = 'All enabled providers';
        break;

      case 'primary':
        const primary = this.getPrimaryProvider();
        if (primary) {
          decision.targetProviders = [primary];
          decision.reasoning = `Primary provider: ${primary}`;
        }
        break;

      case 'conditional':
        decision.targetProviders = this.decideConditionally(url, metadata);
        decision.reasoning = this.generateReasoning(url, metadata, decision.targetProviders);
        break;
    }

    return decision;
  }

  /**
   * Conditional decision logic
   * Different content types go to different providers
   */
  private decideConditionally(
    url: string,
    metadata?: Record<string, any>
  ): ProviderType[] {
    const providers: ProviderType[] = [];

    // Always send to IndexNow (simple, fast, wide support)
    if (this.isProviderEnabled('indexnow')) {
      providers.push('indexnow');
    }

    // Send to Google if:
    // - Content type is supported (Job Posting, Broadcast Event)
    // - OR it's brand new content (give Google a push)
    if (this.isProviderEnabled('google')) {
      const contentType = metadata?.contentType?.toLowerCase() || '';
      const isSupported =
        contentType.includes('jobposting') ||
        contentType.includes('broadcastevent') ||
        contentType.includes('event');

      if (isSupported || metadata?.isNew) {
        providers.push('google');
      }
    }

    return providers.length > 0 ? providers : ['indexnow']; // Fallback to IndexNow
  }

  /**
   * Get enabled providers
   */
  private getEnabledProviders(): ProviderType[] {
    return this.config.providers.filter((p) => this.isProviderEnabled(p));
  }

  /**
   * Get primary provider
   */
  private getPrimaryProvider(): ProviderType | null {
    return this.config.priorityOrder?.[0] || this.config.providers[0] || null;
  }

  /**
   * Check if provider is enabled
   */
  private isProviderEnabled(provider: ProviderType): boolean {
    return this.config.providers.includes(provider);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    url: string,
    metadata: Record<string, any> | undefined,
    providers: ProviderType[]
  ): string {
    if (providers.includes('google') && providers.includes('indexnow')) {
      return 'Both Google and IndexNow (content type matches Google Indexing API requirements)';
    }

    if (providers.includes('google')) {
      return 'Google Indexing API (supported content type or new content)';
    }

    if (providers.includes('indexnow')) {
      return 'IndexNow only (standard content type, use Search Console submission)';
    }

    return 'No suitable provider found';
  }

  /**
   * Update dispatch configuration
   */
  updateConfig(config: Partial<DispatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): DispatchConfig {
    return { ...this.config };
  }

  /**
   * Get dispatch statistics
   */
  async getStats(): Promise<{
    totalDispatches: number;
    byProvider: Record<ProviderType, number>;
    successRate: number;
  }> {
    return {
      totalDispatches: 0,
      byProvider: {
        google: 0,
        indexnow: 0,
      },
      successRate: 0,
    };
  }
}

export const dispatchEngine = new DispatchEngine();
