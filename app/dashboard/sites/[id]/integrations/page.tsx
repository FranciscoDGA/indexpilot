'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface GoogleAccount {
  id: string;
  email: string;
  credentialType: string;
  status: string;
}

interface IndexNowCredential {
  id: string;
  siteUrl: string;
  status: string;
}

export default function IntegrationsPage() {
  const params = useParams();
  const siteId = params.id as string;

  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [indexNowCredentials, setIndexNowCredentials] = useState<IndexNowCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/integrations/google/properties');
        if (res.ok) {
          const data = await res.json();
          // Extract accounts from properties
          setGoogleAccounts(data.data?.properties || []);
        }
      } catch (err) {
        console.error('Error fetching integrations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (siteId) fetchIntegrations();
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href={`/dashboard/sites/${siteId}`} className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Site
          </Link>
          <h1 className="text-3xl font-bold text-white">Integrations</h1>
          <p className="text-slate-300 mt-1">Connect your site to search engines</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Google Integration */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Google Search Console</h2>
              <p className="text-slate-400 mt-1">
                Integrate with Google Search Console to submit URLs for indexing
              </p>
            </div>
            <div className="text-right">
              {googleAccounts.length > 0 ? (
                <span className="inline-block px-3 py-1 bg-green-900/30 text-green-300 text-sm rounded">
                  Connected
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-yellow-900/30 text-yellow-300 text-sm rounded">
                  Not Connected
                </span>
              )}
            </div>
          </div>

          {googleAccounts.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm mb-4">
                Connect your Google account to enable Search Console integration
              </p>
              <a
                href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(
                  'http://localhost:3000/api/v1/integrations/google/callback'
                )}&response_type=code&scope=${encodeURIComponent(
                  'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/indexing'
                )}`}
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Connect Google Account
              </a>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4">
              {googleAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{account.email}</p>
                    <p className="text-slate-400 text-sm">{account.credentialType}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm">
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IndexNow Integration */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">IndexNow</h2>
              <p className="text-slate-400 mt-1">
                Submit URLs to Bing and Yandex through the IndexNow protocol
              </p>
            </div>
            <div className="text-right">
              {indexNowCredentials.length > 0 ? (
                <span className="inline-block px-3 py-1 bg-green-900/30 text-green-300 text-sm rounded">
                  Configured
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-yellow-900/30 text-yellow-300 text-sm rounded">
                  Not Configured
                </span>
              )}
            </div>
          </div>

          {indexNowCredentials.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm mb-4">
                Set up IndexNow to notify Bing and Yandex when you publish new content
              </p>
              <button
                onClick={() => {
                  // Would open a modal or navigate to setup page
                  console.log('Setup IndexNow');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Set Up IndexNow
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg p-4">
              {indexNowCredentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <div>
                    <p className="text-white font-medium">{cred.siteUrl}</p>
                    <p className={`text-sm ${cred.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {cred.status}
                    </p>
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">Dispatch Strategy</h3>
          <p className="text-slate-300 text-sm mb-4">
            IndexPilot uses an intelligent dispatch strategy:
          </p>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• <strong>IndexNow:</strong> Always sent (simple, fast, supports Bing & Yandex)</li>
            <li>• <strong>Google:</strong> Sent for supported content types (structured content)</li>
            <li>• <strong>Fallback:</strong> Google Search Console for general content discovery</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
