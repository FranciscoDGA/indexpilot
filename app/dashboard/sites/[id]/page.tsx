'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Site, StatusResponse } from '@/types/indexPilot';

export default function SitePage() {
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch site details
        const siteRes = await fetch(`/api/v1/sites/${siteId}`);
        if (!siteRes.ok) throw new Error('Failed to fetch site');
        const siteData = await siteRes.json();
        setSite(siteData.data);

        // Fetch site status
        const statusRes = await fetch(`/api/v1/status?site=${siteId}`);
        if (!statusRes.ok) throw new Error('Failed to fetch status');
        const statusData = await statusRes.json();
        setStatus(statusData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (siteId) fetchData();
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error || 'Site not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">{site.name}</h1>
          <p className="text-slate-300 mt-1">{site.domain}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <Link
            href={`/dashboard/sites/${siteId}/index`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Submit URL
          </Link>
          <Link
            href={`/dashboard/sites/${siteId}/integrations`}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Integrations
          </Link>
        </div>

        {/* Status Overview */}
        {status && (
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Total URLs</p>
              <p className="text-2xl font-bold text-white mt-1">{status.totalUrls}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-300 text-sm">Queued</p>
              <p className="text-2xl font-bold text-blue-300 mt-1">{status.queued}</p>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">Processing</p>
              <p className="text-2xl font-bold text-yellow-300 mt-1">{status.processing}</p>
            </div>
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
              <p className="text-green-300 text-sm">Indexed</p>
              <p className="text-2xl font-bold text-green-300 mt-1">{status.indexed}</p>
            </div>
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-300 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-300 mt-1">{status.failed}</p>
            </div>
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-slate-300 mt-1">{status.pending}</p>
            </div>
          </div>
        )}

        {/* Logs Section */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <Link
            href={`/dashboard/sites/${siteId}/logs`}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            View all logs →
          </Link>
        </div>
      </div>
    </div>
  );
}
