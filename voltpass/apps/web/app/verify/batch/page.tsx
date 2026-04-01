'use client';
import { useState } from 'react';
import { apiRequest } from '../../../src/lib/api';

interface BatchResult {
  credentialId: string;
  found: boolean;
  holderName?: string;
  licenseNumber?: string;
  issuingState?: string;
  status?: string;
  expiryDate?: string;
  outcome?: string;
  complianceVerdict?: string;
  error?: string;
}

export default function BatchVerifyPage() {
  const [csvText, setCsvText] = useState('');
  const [targetState, setTargetState] = useState('TX');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string);
    reader.readAsText(file);
  }

  async function handleVerify() {
    const ids = csvText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (ids.length === 0) return;

    setLoading(true);
    try {
      const data = await apiRequest<{ data: BatchResult[] }>('/employer/batch-verify', {
        method: 'POST',
        body: JSON.stringify({ credentialIds: ids, targetState }),
      });
      setResults(data.data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function exportPDF() {
    // Simple print-to-PDF
    window.print();
  }

  const VERDICT_COLORS: Record<string, string> = {
    compliant: 'text-green-700 bg-green-100',
    partial: 'text-yellow-700 bg-yellow-100',
    ineligible: 'text-red-700 bg-red-100',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-[#1e3a5f] mb-2">Batch Credential Verification</h1>
        <p className="text-gray-500 mb-6">Upload a CSV of credential IDs to get a full compliance report.</p>

        <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Upload CSV</label>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload}
              className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg px-3 py-2" />
            <p className="text-xs text-gray-400 mt-1">CSV should have one credential ID per row (or comma-separated)</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Or paste IDs directly</label>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={4}
              placeholder="id1&#10;id2&#10;id3"
              className="w-full border rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mr-2">Target State:</label>
              <select value={targetState} onChange={e => setTargetState(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm">
                {['TX','CA','FL','NV','AZ','CO','GA','NC','VA','PA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleVerify} disabled={loading}
              className="bg-[#1e3a5f] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2a5298] transition disabled:opacity-50 ml-auto">
              {loading ? 'Verifying…' : 'Run Verification'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1e3a5f]">{results.length} Results</h2>
              <button onClick={exportPDF} className="text-sm text-[#1e3a5f] font-semibold border border-[#1e3a5f] px-4 py-2 rounded-lg hover:bg-[#1e3a5f] hover:text-white transition">
                Export PDF
              </button>
            </div>
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">License #</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">State</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiry</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map(r => (
                    <tr key={r.credentialId} className={!r.found ? 'bg-red-50' : ''}>
                      <td className="px-4 py-3">{r.holderName ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.licenseNumber ?? r.credentialId}</td>
                      <td className="px-4 py-3">{r.issuingState ?? '—'}</td>
                      <td className="px-4 py-3">
                        {r.found
                          ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {(r.status ?? 'unknown').toUpperCase()}
                            </span>
                          : <span className="text-red-500 text-xs">Not found</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        {r.complianceVerdict
                          ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${VERDICT_COLORS[r.complianceVerdict] ?? ''}`}>
                              {r.complianceVerdict.toUpperCase()}
                            </span>
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
