'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '../../src/lib/api';

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/employer/webhooks', { method: 'POST', body: JSON.stringify({ webhookUrl }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleManageBilling() {
    try {
      const { data } = await apiRequest<{ data: { url: string } }>('/stripe/portal', { method: 'POST' });
      window.location.href = data.url;
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-[#1e3a5f]">Settings</h1>

        {upgraded && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 font-semibold">
            ✓ Plan upgraded successfully! Welcome to Pro.
          </div>
        )}

        {/* Billing */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-4">Billing</h2>
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => apiRequest<{ data: { url: string } }>('/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ plan: 'employer' }) }).then(r => window.location.href = (r as any).data.url)}
              className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#2a5298] transition">
              Upgrade to Employer — $49/seat/mo
            </button>
            <button onClick={handleManageBilling}
              className="border border-[#1e3a5f] text-[#1e3a5f] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition">
              Manage Billing Portal
            </button>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold text-[#1e3a5f] mb-2">Webhooks</h2>
          <p className="text-sm text-gray-500 mb-4">Receive real-time compliance events via HTTP POST.</p>
          <form onSubmit={handleSaveWebhook} className="flex gap-3">
            <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://yourapp.com/webhooks/voltpass"
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
            <button type="submit" disabled={saving}
              className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {saved ? '✓ Saved' : saving ? '…' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
