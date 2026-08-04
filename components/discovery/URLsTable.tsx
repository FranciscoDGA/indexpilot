'use client';

import React, { useState } from 'react';
import { ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { URLRecord } from '@/types/discovery';

interface Props {
  urls: URLRecord[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function URLsTable({ urls, isLoading, onLoadMore, hasMore }: Props) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const toggleUrl = (urlId: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(urlId)) {
      newSelected.delete(urlId);
    } else {
      newSelected.add(urlId);
    }
    setSelectedUrls(newSelected);
  };

  const getStatusIcon = (url: URLRecord) => {
    if (url.http_status && url.http_status >= 400) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (url.is_indexed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (url.is_orphaned) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusLabel = (url: URLRecord) => {
    if (url.http_status && url.http_status >= 400) {
      return `Error ${url.http_status}`;
    }
    if (url.is_indexed) {
      return 'Indexed';
    }
    if (url.is_orphaned) {
      return 'Orphaned';
    }
    return 'Not Indexed';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">No URLs discovered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white w-10">
                <input
                  type="checkbox"
                  checked={selectedUrls.size === urls.length && urls.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUrls(new Set(urls.map(u => u.id!)));
                    } else {
                      setSelectedUrls(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                URL
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                Source
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                Last Checked
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {urls.map((url) => (
              <tr key={url.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedUrls.has(url.id!)}
                    onChange={() => toggleUrl(url.id!)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
                      title={url.url}
                    >
                      {url.url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 50)}
                    </a>
                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                  {url.title && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {url.title}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(url)}
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {getStatusLabel(url)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {url.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                  {url.last_checked
                    ? new Date(url.last_checked).toLocaleDateString('pt-BR')
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={onLoadMore}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-center font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
        >
          Load More
        </button>
      )}
    </div>
  );
}
