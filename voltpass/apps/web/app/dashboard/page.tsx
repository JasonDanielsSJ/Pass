'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../src/lib/api';

interface CrewMember {
  id: string;
  licenseNumber: string;
  issuingState: string;
  licenseType: string;
  tradeLevel: string;
  expiryDate: string;
  status: string;
  lastVerifiedAt: string | null;
  complianceVerdict?: string;
  user: { id: string; name: string; email: string };
}

const VERDICT_STYLES: Record<string, string> = {
  compliant: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  ineligible: 'bg-red-100 text-red-800',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
  pending: 'bg-gray-100 text-gray-800',
};

export default function DashboardPage() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobState, setJobState] = useState('TX');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [filterNonCompliant, setFilterNonCompliant] = useState(false);
  const [sortField, setSortField] = useState<keyof CrewMember>('expiryDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    apiRequest<{ data: CrewMember[] }>(`/employer/crew?targetState=${jobState}`)
      .then(r => setCrew(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobState]);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let filtered = crew;
  if (filterExpiring) {
    filtered = filtered.filter(m => new Date(m.expiryDate) <= in30Days);
  }
  if (filterNonCompliant) {
    filtered = filtered.filter(m => m.complianceVerdict !== 'compliant');
  }

  const sorted = [...filtered].sort((a, b) => {
    const av = String(a[sortField] ?? '');
    const bv = String(b[sortField] ?? '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  function toggleSort(field: keyof CrewMember) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="font-black text-amber-400 text-lg">VoltPass</span>
          <span className="text-blue-300 text-sm ml-2">Employer Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/verify" className="text-sm text-blue-300 hover:text-white">Verify</Link>
          <Link href="/settings" className="text-sm text-blue-300 hover:text-white">Settings</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h1 className="text-2xl font-black text-[#1e3a5f]">Crew Overview</h1>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-semibold text-gray-600">Job State:</label>
            <select value={jobState} onChange={e => setJobState(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              {['TX','CA','FL','NV','AZ','CO','GA','NC','VA','PA'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filterExpiring} onChange={e => setFilterExpiring(e.target.checked)} />
            Expiring in 30 days
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={filterNonCompliant} onChange={e => setFilterNonCompliant(e.target.checked)} />
            Non-compliant only
          </label>
          <Link href="/verify/batch"
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a5298] transition">
            Batch Verify CSV
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {[
                  { label: 'Name', field: 'user' },
                  { label: 'License #', field: 'licenseNumber' },
                  { label: 'State', field: 'issuingState' },
                  { label: 'Trade Level', field: 'tradeLevel' },
                  { label: 'Status', field: 'status' },
                  { label: 'Expiry', field: 'expiryDate' },
                  { label: `Compliant for ${jobState}`, field: 'complianceVerdict' },
                  { label: 'Actions', field: null },
                ].map(({ label, field }) => (
                  <th key={label}
                    className={`px-4 py-3 text-left font-semibold text-gray-600 ${field ? 'cursor-pointer hover:text-[#1e3a5f]' : ''}`}
                    onClick={() => field && toggleSort(field as keyof CrewMember)}>
                    {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading crew…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No results</td></tr>
              ) : sorted.map(member => {
                const expDate = new Date(member.expiryDate);
                const expiryWarning = expDate <= in30Days;
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{member.user.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{member.licenseNumber}</td>
                    <td className="px-4 py-3">{member.issuingState}</td>
                    <td className="px-4 py-3 capitalize">{member.tradeLevel}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[member.status] ?? ''}`}>
                        {member.status.toUpperCase()}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${expiryWarning ? 'text-red-600 font-semibold' : ''}`}>
                      {new Date(member.expiryDate).toLocaleDateString()}
                      {expiryWarning && <span className="ml-1 text-xs">⚠</span>}
                    </td>
                    <td className="px-4 py-3">
                      {member.complianceVerdict ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${VERDICT_STYLES[member.complianceVerdict] ?? ''}`}>
                          {member.complianceVerdict.toUpperCase()}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/verify?id=${member.id}`} className="text-[#1e3a5f] font-semibold text-xs hover:underline">
                        Verify →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
