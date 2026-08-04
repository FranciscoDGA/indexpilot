'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Log } from '@/types/indexPilot';

export default function LogsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/logs?site=${siteId}&limit=${limit}&offset=${page * limit}`
        );
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data.data?.logs || []);
        setTotal(data.data?.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (siteId) fetchLogs();
  }, [siteId, page]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-900/20 text-green-300';
      case 'failed':
        return 'bg-red-900/20 text-red-300';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-300';
      default:
        return 'bg-slate-700/20 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href={`/dashboard/sites/${siteId}`} className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Site
          </Link>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-300 mt-1">View all actions and events for this site</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-slate-300 mt-4">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-slate-700/50 rounded-lg p-8 text-center">
            <p className="text-slate-300">No logs yet</p>
          </div>
        ) : (
          <>
            {/* Logs Table */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-600 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4 text-sm text-white">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{log.provider || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {log.duration && `${log.duration}ms`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-slate-400 text-sm">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
