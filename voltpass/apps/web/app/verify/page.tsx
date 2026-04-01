'use client';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BrowserQRCodeReader } from '@zxing/browser';
import { apiRequest } from '../../src/lib/api';

interface VerifyResult {
  credentialId: string;
  licenseNumber: string;
  issuingState: string;
  licenseType: string;
  tradeLevel: string;
  expiryDate: string;
  status: string;
  lastVerifiedAt: string | null;
  vcSignatureValid: boolean;
  outcome: 'pass' | 'fail' | 'expired';
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const preloadId = searchParams.get('id');

  const [mode, setMode] = useState<'id' | 'qr'>('id');
  const [credentialId, setCredentialId] = useState(preloadId ?? '');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handleVerify() {
    if (!credentialId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiRequest<{ data: VerifyResult }>(`/verify/${credentialId.trim()}`);
      setResult(data.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (preloadId) handleVerify();
  }, []);

  async function startQRScan() {
    setScanning(true);
    const codeReader = new BrowserQRCodeReader();
    try {
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current!);
      setScanning(false);
      // Try to parse as QR payload
      try {
        const payload = JSON.parse(result.getText()) as { credentialId: string; vcJwt: string };
        setCredentialId(payload.credentialId);
        // Verify via QR endpoint
        const data = await apiRequest<{ data: VerifyResult }>(`/verify/${payload.credentialId}`);
        setResult(data.data);
      } catch {
        setCredentialId(result.getText());
      }
    } catch (e) {
      setScanning(false);
      setError('QR scan failed. Try entering the credential ID manually.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-[#1e3a5f] mb-6">Verify a Credential</h1>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('id')} className={`flex-1 py-3 rounded-xl font-bold transition ${mode === 'id' ? 'bg-[#1e3a5f] text-white' : 'bg-white border text-gray-600'}`}>
            Enter Credential ID
          </button>
          <button onClick={() => { setMode('qr'); startQRScan(); }} className={`flex-1 py-3 rounded-xl font-bold transition ${mode === 'qr' ? 'bg-[#1e3a5f] text-white' : 'bg-white border text-gray-600'}`}>
            📷 Scan QR Code
          </button>
        </div>

        {mode === 'id' && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Credential ID</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={credentialId}
                onChange={e => setCredentialId(e.target.value)}
                placeholder="e.g. a1b2c3d4-..."
                className="flex-1 border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
              />
              <button onClick={handleVerify} disabled={loading}
                className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2a5298] transition disabled:opacity-50">
                {loading ? '…' : 'Verify'}
              </button>
            </div>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          </div>
        )}

        {mode === 'qr' && scanning && (
          <div className="bg-black rounded-xl overflow-hidden aspect-video mb-6">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          </div>
        )}

        {/* Result card */}
        {result && (
          <div className={`rounded-2xl p-8 text-center shadow-lg ${result.outcome === 'pass' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            <div className="text-6xl mb-4">{result.outcome === 'pass' ? '✓' : '✗'}</div>
            <div className="text-3xl font-black mb-2">{result.outcome === 'pass' ? 'PASS' : result.outcome === 'expired' ? 'EXPIRED' : 'FAIL'}</div>
            <div className="text-lg font-semibold mb-1">{result.licenseType}</div>
            <div className="text-white/80 text-sm mb-4">{result.issuingState} · {result.tradeLevel} · #{result.licenseNumber}</div>
            <div className="bg-white/20 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span>Status</span><span className="font-bold">{result.status.toUpperCase()}</span></div>
              <div className="flex justify-between"><span>Expires</span><span className="font-bold">{new Date(result.expiryDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span>VC Signature</span><span className="font-bold">{result.vcSignatureValid ? '✓ Valid' : '⚠ Unverified'}</span></div>
              {result.lastVerifiedAt && (
                <div className="flex justify-between"><span>Last verified</span><span className="font-bold">{new Date(result.lastVerifiedAt).toLocaleDateString()}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
