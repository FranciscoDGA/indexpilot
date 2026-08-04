'use client';

import React, { useEffect, useState } from 'react';
import { DiscoverySummary } from '@/components/discovery/DiscoverySummary';
import { URLsTable } from '@/components/discovery/URLsTable';
import { SyncStatus } from '@/components/discovery/SyncStatus';
import { DiscoverySummary as DiscoverySummaryType, URLRecord, SyncLog } from '@/types/discovery';
import { Zap, RefreshCw } from 'lucide-react';

export default function DiscoveryPage() {
  const [summary, setSummary] = useState<DiscoverySummaryType | null>(null);
  const [urls, setUrls] = useState<URLRecord[]>([]);
  const [syncLog, setSyncLog] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedSiteId] = useState('site-1');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'indexed' | 'not_indexed' | 'orphaned' | 'errors'>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchSyncStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedSiteId, page, filter]);

  async function fetchData() {
    try {
      setLoading(true);

      const urlsRes = await fetch(
        `/api/discovery/urls?site_id=${selectedSiteId}&filter=${filter}&page=${page}&limit=50`
      );
      if (urlsRes.ok) {
        const urlsData = await urlsRes.json();
        if (page === 1) {
          setUrls(urlsData.data || []);
        } else {
          setUrls(prev => [...prev, ...(urlsData.data || [])]);
        }
        setHasMore(urlsData.page < urlsData.total_pages);

        setSummary({
          total_urls: urlsData.count,
          indexed_urls: 0,
          not_indexed_urls: 0,
          discovered_not_indexed: 0,
          orphaned_urls: 0,
          errors: 0,
          seo_average: 82,
          last_sync: new Date().toISOString(),
          next_sync: new Date(Date.now() + 3600000).toISOString(),
        });
      }

      await fetchSyncStatus();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSyncStatus() {
    try {
      const statusRes = await fetch(`/api/discovery/status?site_id=${selectedSiteId}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSyncLog(statusData.log);

        if (statusData.summary) {
          setSummary(prev => ({
            ...prev,
            ...statusData.summary,
            seo_average: prev?.seo_average || 82,
            last_sync: prev?.last_sync || new Date().toISOString(),
            next_sync: prev?.next_sync || new Date(Date.now() + 3600000).toISOString(),
          } as DiscoverySummaryType));
        }
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  }

  async function handleStartSync() {
    try {
      setSyncing(true);
      const res = await fetch('/api/discovery/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSiteId,
          siteUrl: 'https://techblog.com',
          userId: 'mock-user-123',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Discovery started:', data);
        await fetchSyncStatus();
      }
    } catch (error) {
      console.error('Error starting discovery:', error);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Site Discovery
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Discover and monitor all URLs on your site
          </p>
        </div>
        <button
          onClick={handleStartSync}
          disabled={syncing || syncLog?.status === 'in_progress'}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Zap className="h-4 w-4" />
          {syncing || syncLog?.status === 'in_progress' ? 'Syncing...' : 'Start Discovery'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <DiscoverySummary summary={summary} isLoading={loading && page === 1} />
      )}

      {/* Sync Status */}
      {syncLog && (
        <SyncStatus syncLog={syncLog} onRetry={handleStartSync} />
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'indexed', 'not_indexed', 'orphaned', 'errors'] as const).map(f => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {f === 'not_indexed' ? 'Not Indexed' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* URLs Table */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Discovered URLs
          </h2>
          <button
            onClick={() => {
              setPage(1);
              fetchData();
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <URLsTable
          urls={urls}
          isLoading={loading && page === 1}
          hasMore={hasMore}
          onLoadMore={() => setPage(p => p + 1)}
        />
      </div>
    </div>
  );
}
