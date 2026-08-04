'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSitePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.domain.trim()) {
      setError('Name and domain are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/v1/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create site');
      }

      const data = await response.json();
      router.push(`/dashboard/sites/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Site</h1>
          <p className="text-slate-300 mt-1">Add a new site to manage URL indexing</p>
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

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Site Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome Blog"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-slate-400 text-sm mt-1">Display name for your site</p>
          </div>

          {/* Domain Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Domain</label>
            <input
              type="text"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <p className="text-slate-400 text-sm mt-1">Domain without https:// (e.g., example.com)</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
          >
            {loading ? 'Creating...' : 'Create Site'}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">What happens next?</h3>
          <ol className="space-y-2 text-slate-300 text-sm">
            <li>1. Site is created and ready to accept URL submissions</li>
            <li>2. Set up integrations with Google Search Console and IndexNow</li>
            <li>3. Submit URLs via dashboard or webhook</li>
            <li>4. Monitor indexing status and view logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
