'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Site } from '@/types/indexPilot';

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/sites');
        if (!response.ok) throw new Error('Failed to fetch sites');
        const data = await response.json();
        setSites(data.data?.sites || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-300 mt-1">Manage your sites and indexing</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add Site Button */}
        <div className="mb-8">
          <Link
            href="/dashboard/sites/new"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + Add New Site
          </Link>
        </div>

        {/* Sites Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-slate-300 mt-4">Loading sites...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-slate-700/50 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-4">No sites yet. Create one to get started.</p>
            <Link
              href="/dashboard/sites/new"
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create First Site
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <Link
                key={site.id}
                href={`/dashboard/sites/${site.id}`}
                className="group bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-6 transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400">
                      {site.name}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{site.domain}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      site.status === 'active'
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-yellow-900/30 text-yellow-300'
                    }`}
                  >
                    {site.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Created: {new Date(site.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
