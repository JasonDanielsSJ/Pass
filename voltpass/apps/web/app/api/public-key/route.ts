import { NextResponse } from 'next/server';

/**
 * GET /api/public-key
 * Returns the VoltPass issuer Ed25519 public key (base64-encoded).
 * This endpoint is cached by the service worker so the Inspector PWA
 * can verify credentials fully offline.
 */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_ISSUER_PUBLIC_KEY ?? '';
  return NextResponse.json(
    { publicKey },
    {
      headers: {
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400', // 7 days
      },
    }
  );
}
