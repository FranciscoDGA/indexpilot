import { SyncState, ProviderType } from '@/types/indexPilot';

/**
 * Sync Engine
 * Periodically syncs URL status with external providers
 * Keeps track of what's indexed, pending, or failed
 */
export class SyncEngine {
  private syncStates: Map<ProviderType, SyncState> = new Map();

  /**
   * Initialize sync state for provider
   */
  initializeProvider(provider: ProviderType): void {
    const state: SyncState = {
      provider,
      lastSync: new Date(0), // Epoch - never synced
      nextSync: new Date(), // Sync immediately
      status: 'idle',
    };

    this.syncStates.set(provider, state);
  }

  /**
   * Mark sync as started
   */
  async startSync(provider: ProviderType): Promise<void> {
    const state = this.syncStates.get(provider);
    if (state) {
      state.status = 'syncing';
    }
  }

  /**
   * Mark sync as completed successfully
   */
  async completeSync(provider: ProviderType, nextSyncInterval: number): Promise<void> {
    const state = this.syncStates.get(provider);
    if (state) {
      state.status = 'idle';
      state.lastSync = new Date();
      state.nextSync = new Date(Date.now() + nextSyncInterval);
      state.lastError = undefined;
    }
  }

  /**
   * Mark sync as failed
   */
  async failSync(provider: ProviderType, error: string): Promise<void> {
    const state = this.syncStates.get(provider);
    if (state) {
      state.status = 'failed';
      state.lastError = error;
      // Schedule retry sooner if failed
      state.nextSync = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
  }

  /**
   * Get sync state for provider
   */
  getState(provider: ProviderType): SyncState | null {
    return this.syncStates.get(provider) || null;
  }

  /**
   * Get all sync states
   */
  getAllStates(): SyncState[] {
    return Array.from(this.syncStates.values());
  }

  /**
   * Check which providers are due for sync
   */
  getProvidersDue(): ProviderType[] {
    const now = new Date();
    return Array.from(this.syncStates.values())
      .filter((state) => state.nextSync <= now && state.status === 'idle')
      .map((state) => state.provider);
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    totalProviders: number;
    syncing: number;
    failed: number;
    due: number;
    lastSyncTimes: Record<ProviderType, Date | null>;
  } {
    const states = Array.from(this.syncStates.values());

    return {
      totalProviders: states.length,
      syncing: states.filter((s) => s.status === 'syncing').length,
      failed: states.filter((s) => s.status === 'failed').length,
      due: states.filter((s) => s.nextSync <= new Date()).length,
      lastSyncTimes: Object.fromEntries(
        states.map((s) => [s.provider, s.lastSync])
      ) as Record<ProviderType, Date>,
    };
  }

  /**
   * Sync Google Search Console properties and status
   * Implementation would fetch from GSC API
   */
  async syncGoogleProperties(): Promise<{
    propertiesSynced: number;
    urlsUpdated: number;
    errors: string[];
  }> {
    return {
      propertiesSynced: 0,
      urlsUpdated: 0,
      errors: [],
    };
  }

  /**
   * Sync Google Indexing API status
   */
  async syncGoogleIndexingStatus(): Promise<{
    urlsChecked: number;
    indexed: number;
    pending: number;
    failed: number;
  }> {
    return {
      urlsChecked: 0,
      indexed: 0,
      pending: 0,
      failed: 0,
    };
  }

  /**
   * Verify IndexNow key is still published
   */
  async verifyIndexNowKey(siteUrl: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${siteUrl}/.well-known/IndexNow.txt`);
      const content = await response.text();
      return content.includes(apiKey);
    } catch {
      return false;
    }
  }

  /**
   * Clear all sync states
   */
  clearAll(): void {
    this.syncStates.clear();
  }
}

export const syncEngine = new SyncEngine();
