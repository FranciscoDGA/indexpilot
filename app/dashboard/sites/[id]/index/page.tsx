'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Site, UrlType } from '@/types/indexPilot';

export default function SubmitUrlPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    url: '',
    type: 'article' as UrlType,
  });

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/v1/sites/${siteId}`);
        if (!res.ok) throw new Error('Site not found');
        const data = await res.json();
        setSite(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load site');
      } finally {
        setLoading(false);
      }
    };

    if (siteId) fetchSite();
  }, [siteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/v1/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: siteId,
          url: formData.url,
          type: formData.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to submit URL');
        return;
      }

      setSuccess(`URL submitted successfully! Priority: ${data.data.priority}`);
      setFormData({ url: '', type: 'article' });

      setTimeout(() => {
        router.push(`/dashboard/sites/${siteId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            Site not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href={`/dashboard/sites/${siteId}`} className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Site
          </Link>
          <h1 className="text-3xl font-bold text-white">Submit URL</h1>
          <p className="text-slate-300 mt-1">{site.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-300">
              {success}
            </div>
          )}

          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              disabled={submitting}
            />
            <p className="text-slate-400 text-sm mt-1">Full URL of the page to index</p>
          </div>

          {/* Type Select */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Content Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as UrlType })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              disabled={submitting}
            >
              <option value="article">Article</option>
              <option value="page">Page</option>
              <option value="category">Category</option>
              <option value="tag">Tag</option>
            </select>
            <p className="text-slate-400 text-sm mt-1">Type affects priority calculation</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
          >
            {submitting ? 'Submitting...' : 'Submit URL'}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">How it works</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>✓ URL is validated for HTTPS, status 200, and other requirements</li>
            <li>✓ Priority is calculated based on content type</li>
            <li>✓ URL is queued for processing</li>
            <li>✓ Dispatched to configured search engines (Google, IndexNow, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
