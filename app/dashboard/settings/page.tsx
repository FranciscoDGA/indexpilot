'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [webhookNotifications, setWebhookNotifications] = useState(true);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-300 mt-1">Manage your account preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {saved && (
          <div className="mb-6 bg-green-900/20 border border-green-700 rounded-lg p-4 text-green-300">
            Settings saved successfully
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-slate-400 text-sm mt-1">
                  Receive email updates about indexing events
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-block w-12 h-6 rounded-full transition ${
                  emailNotifications ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition ${
                    emailNotifications ? 'translate-x-6' : ''
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Webhook Notifications</p>
                <p className="text-slate-400 text-sm mt-1">
                  Send webhooks for indexing events
                </p>
              </div>
              <button
                onClick={() => setWebhookNotifications(!webhookNotifications)}
                className={`relative inline-block w-12 h-6 rounded-full transition ${
                  webhookNotifications ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition ${
                    webhookNotifications ? 'translate-x-6' : ''
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Dispatch Settings */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Indexing</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-Dispatch to Providers</p>
                <p className="text-slate-400 text-sm mt-1">
                  Automatically send URLs to configured providers
                </p>
              </div>
              <button
                onClick={() => setAutoDispatch(!autoDispatch)}
                className={`relative inline-block w-12 h-6 rounded-full transition ${
                  autoDispatch ? 'bg-green-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition ${
                    autoDispatch ? 'translate-x-6' : ''
                  }`}
                ></span>
              </button>
            </div>

            <div className="border-t border-slate-600 pt-4 mt-4">
              <p className="text-white font-medium mb-4">Retry Configuration</p>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">
                  Retry delays: 5 minutes → 30 minutes → 2 hours → 12 hours → 24 hours
                </p>
                <p className="text-slate-400 text-sm mt-2">Maximum attempts: 5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-red-300 mb-6">Danger Zone</h2>

          <div className="space-y-4">
            <button className="w-full px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition text-left">
              Delete Account
            </button>
            <p className="text-slate-400 text-sm">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
