import { BaseAdapter, VerificationResult } from './BaseAdapter';

/**
 * Texas TDLR Electrician License Verification
 * Uses the TDLR public license search API.
 * Docs: https://www.tdlr.texas.gov/TNPWS/Lookup.aspx
 */
export class TXTDLRAdapter extends BaseAdapter {
  stateCode = 'TX';
  private baseUrl = 'https://www.tdlr.texas.gov/TNPWS/Lookup.aspx';

  async verify(licenseNumber: string, licenseType: string): Promise<VerificationResult> {
    // TDLR exposes a REST-like endpoint; we use the public license lookup service
    const url = `https://www.tdlr.texas.gov/LicenseSearch/licfile.asp?licenseNumber=${encodeURIComponent(licenseNumber)}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'VoltPass/1.0 License Verification Service' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`TDLR API responded with ${response.status}`);
    }

    const html = await response.text();

    // Parse the HTML response for license status fields
    const statusMatch = html.match(/License Status[^:]*:\s*<[^>]+>([^<]+)/i);
    const nameMatch = html.match(/License Holder[^:]*:\s*<[^>]+>([^<]+)/i);
    const expiryMatch = html.match(/Expiration Date[^:]*:\s*<[^>]+>([^<]+)/i);

    if (!statusMatch) {
      return { licenseNumber, status: 'not_found' };
    }

    const rawStatus = statusMatch[1].trim().toLowerCase();
    let status: VerificationResult['status'] = 'not_found';
    if (rawStatus.includes('active')) status = 'active';
    else if (rawStatus.includes('suspended') || rawStatus.includes('revoked')) status = 'suspended';
    else if (rawStatus.includes('expired')) status = 'expired';

    const holderName = nameMatch?.[1]?.trim();
    const expiryRaw = expiryMatch?.[1]?.trim();
    const expiryDate = expiryRaw ? new Date(expiryRaw) : undefined;

    return {
      licenseNumber,
      status,
      licenseType,
      holderName,
      expiryDate,
      rawData: { rawStatus, source: 'TDLR' },
    };
  }
}
