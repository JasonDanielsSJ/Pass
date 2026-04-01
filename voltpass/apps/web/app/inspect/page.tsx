'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

// The public key is embedded at build time so verification works offline
const ISSUER_PUBLIC_KEY_B64 = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? '';

interface QRPayload {
  vcJwt: string;
  credentialId: string;
  expiresAt: string;
}

interface VCCredential {
  holderDid?: string;
  credentialSubject?: {
    licenseNumber?: string;
    licenseType?: string;
    issuingState?: string;
    tradeLevel?: string;
    status?: string;
  };
  expirationDate?: string;
  issuanceDate?: string;
}

type ScanState = 'idle' | 'scanning' | 'pass' | 'fail';

interface ScanResult {
  pass: boolean;
  reason?: string;
  credential?: VCCredential;
  credentialId?: string;
}

export default function InspectPage() {
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const pendingLogRef = useRef<object[]>([]);

  // Queue offline verification logs for sync when connectivity returns
  function queueLog(entry: object) {
    pendingLogRef.current.push({ ...entry, timestamp: new Date().toISOString() });
    try {
      localStorage.setItem('voltpass_pending_logs', JSON.stringify(pendingLogRef.current));
    } catch { /* storage full */ }
  }

  // Flush queued logs when online
  useEffect(() => {
    function flush() {
      const raw = localStorage.getItem('voltpass_pending_logs');
      if (!raw) return;
      const logs = JSON.parse(raw) as object[];
      if (logs.length === 0) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      fetch(`${apiUrl}/verify/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs[0]),
      })
        .then(() => {
          const remaining = logs.slice(1);
          localStorage.setItem('voltpass_pending_logs', JSON.stringify(remaining));
          if (remaining.length > 0) flush();
        })
        .catch(() => { /* still offline */ });
    }
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  const verifyQR = useCallback(async (rawText: string): Promise<ScanResult> => {
    // Parse QR payload
    let payload: QRPayload;
    try {
      payload = JSON.parse(rawText);
    } catch {
      return { pass: false, reason: 'Invalid QR code format' };
    }

    if (!payload.vcJwt || !payload.credentialId || !payload.expiresAt) {
      return { pass: false, reason: 'QR payload missing required fields' };
    }

    // Check QR expiry
    if (new Date(payload.expiresAt) < new Date()) {
      return { pass: false, reason: 'QR code has expired' };
    }

    // Verify Ed25519 signature — offline, no network needed
    if (!ISSUER_PUBLIC_KEY_B64) {
      return { pass: false, reason: 'Issuer public key not configured' };
    }

    try {
      // Dynamically import @stablelib/ed25519 (bundled with the PWA)
      const { verify } = await import('@stablelib/ed25519');

      const parts = payload.vcJwt.split('.');
      if (parts.length !== 3) return { pass: false, reason: 'Invalid JWT format' };

      const [header, body, sig] = parts;
      const signingInput = `${header}.${body}`;

      const pubKey = Buffer.from(ISSUER_PUBLIC_KEY_B64, 'base64');
      const signature = Buffer.from(sig, 'base64url');
      const isValid = verify(new Uint8Array(pubKey), Buffer.from(signingInput), new Uint8Array(signature));

      if (!isValid) return { pass: false, reason: 'Signature verification failed' };

      const credential: VCCredential = JSON.parse(Buffer.from(body, 'base64url').toString());

      // Check VC expiry
      if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
        return { pass: false, reason: 'License has expired', credential };
      }

      if (credential.credentialSubject?.status !== 'active') {
        return { pass: false, reason: `License status: ${credential.credentialSubject?.status ?? 'unknown'}`, credential };
      }

      return { pass: true, credential, credentialId: payload.credentialId };
    } catch (err) {
      return { pass: false, reason: `Verification error: ${String(err)}` };
    }
  }, []);

  async function startScan() {
    setState('scanning');
    readerRef.current = new BrowserQRCodeReader();
    try {
      const qrResult = await readerRef.current.decodeOnceFromVideoDevice(undefined, videoRef.current!);
      const scanResult = await verifyQR(qrResult.getText());
      setResult(scanResult);
      setState(scanResult.pass ? 'pass' : 'fail');
      queueLog({
        credentialId: scanResult.credentialId,
        verifiedByType: 'inspector',
        outcome: scanResult.pass ? 'pass' : 'fail',
      });
    } catch {
      setState('idle');
    }
  }

  function reset() {
    setState('idle');
    setResult(null);
  }

  // Full-screen PASS result
  if (state === 'pass' && result?.credential) {
    const cs = result.credential.credentialSubject ?? {};
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 cursor-pointer"
        style={{ backgroundColor: '#16A34A' }}
        onClick={reset}
      >
        <div className="text-white text-center">
          <div style={{ fontSize: 120, lineHeight: 1 }}>✓</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 16 }}>PASS</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 12 }}>{cs.licenseType ?? 'Electrician'}</div>
          <div style={{ fontSize: 22, marginTop: 8, opacity: 0.9 }}>
            {cs.issuingState} · {(cs.tradeLevel ?? '').toUpperCase()}
          </div>
          <div style={{ fontSize: 18, marginTop: 6, opacity: 0.8 }}>#{cs.licenseNumber}</div>
          {result.credential.expirationDate && (
            <div style={{ fontSize: 15, marginTop: 8, opacity: 0.7 }}>
              Expires: {new Date(result.credential.expirationDate).toLocaleDateString()}
            </div>
          )}
          <div style={{ marginTop: 40, fontSize: 14, opacity: 0.6 }}>Tap anywhere to scan again</div>
        </div>
      </div>
    );
  }

  // Full-screen FAIL result
  if (state === 'fail') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 cursor-pointer"
        style={{ backgroundColor: '#DC2626' }}
        onClick={reset}
      >
        <div className="text-white text-center">
          <div style={{ fontSize: 120, lineHeight: 1 }}>✗</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 16 }}>FAIL</div>
          <div style={{ fontSize: 24, marginTop: 12, opacity: 0.9 }}>{result?.reason ?? 'Verification failed'}</div>
          {result?.credential?.credentialSubject && (
            <div style={{ fontSize: 18, marginTop: 12, opacity: 0.8 }}>
              {result.credential.credentialSubject.licenseType}
            </div>
          )}
          <div style={{ marginTop: 40, fontSize: 14, opacity: 0.6 }}>Tap anywhere to scan again</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6">
      <div className="text-center text-white mb-8">
        <span className="text-5xl">⚡</span>
        <h1 className="text-3xl font-black text-amber-400 mt-3">VoltPass Inspector</h1>
        <p className="text-blue-300 mt-2">Offline credential verification</p>
        {!navigator.onLine && (
          <div className="mt-3 bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-4 py-2">
            <p className="text-yellow-300 text-sm">Offline mode — verifying locally</p>
          </div>
        )}
      </div>

      {state === 'scanning' ? (
        <div className="w-full max-w-sm">
          <div className="bg-black rounded-2xl overflow-hidden aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          </div>
          <p className="text-blue-300 text-center mt-4 text-sm">Point camera at the VoltPass QR code</p>
          <button onClick={() => { setState('idle'); }} className="mt-4 w-full border border-white/30 text-white/60 rounded-xl py-3 text-sm">
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-4 w-full max-w-sm">
          <button
            onClick={startScan}
            className="w-full bg-amber-400 text-[#1e3a5f] rounded-2xl py-6 text-xl font-black hover:bg-amber-300 transition"
          >
            📷 Scan License
          </button>
          <p className="text-center text-blue-400 text-sm">Works in airplane mode · No data sent</p>
        </div>
      )}
    </div>
  );
}
