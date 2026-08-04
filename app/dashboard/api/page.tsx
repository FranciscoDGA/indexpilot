'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ApiKey {
  id: string;
  name: string;
  token: string;
  active: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      token: `sk_live_${Math.random().toString(36).substr(2, 32)}`,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setKeys([...keys, newKey]);
    setGeneratedKey(newKey.token);
    setNewKeyName('');
    setShowNewKeyForm(false);
  };

  const handleDeleteKey = (id: string) => {
    setKeys(keys.filter((k) => k.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="text-slate-300 mt-1">Manage API keys for programmatic access</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Create New Key */}
        {!showNewKeyForm ? (
          <button
            onClick={() => setShowNewKeyForm(true)}
            className="mb-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            + Create New Key
          </button>
        ) : (
          <form onSubmit={handleCreateKey} className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Create New API Key</h2>
            <div className="mb-4">
              <label className="block text-white font-medium mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Server, CI/CD Pipeline"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create Key
              </button>
              <button
                type="button"
                onClick={() => setShowNewKeyForm(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Generated Key Warning */}
        {generatedKey && (
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-2">API Key Created Successfully</h3>
            <p className="text-slate-300 text-sm mb-4">
              Save this key somewhere safe. You won't be able to see it again.
            </p>
            <div className="bg-slate-800 p-3 rounded-lg font-mono text-green-400 break-all text-sm">
              {generatedKey}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                setGeneratedKey(null);
              }}
              className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              Copy to Clipboard
            </button>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr
                    key={key.id}
                    className="border-b border-slate-600 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4 text-white font-medium">{key.name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          key.active
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-gray-900/30 text-gray-300'
                        }`}
                      >
                        {key.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">API Documentation</h3>
          <p className="text-slate-300 text-sm mb-4">
            Use your API key to make authenticated requests to IndexPilot's API.
          </p>
          <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm text-slate-300">
            {`curl -X POST https://api.indexpilot.com/v1/index \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "site": "example.com",
    "url": "https://example.com/article",
    "type": "article"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
