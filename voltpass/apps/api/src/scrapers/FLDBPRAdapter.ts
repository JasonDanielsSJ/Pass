import { BaseAdapter, VerificationResult } from './BaseAdapter';

/**
 * Florida DBPR Electrician License Verification
 * Uses the Florida DBPR public license verification API.
 * Docs: https://www.myfloridalicense.com/wl11.asp
 */
export class FLDBPRAdapter extends BaseAdapter {
  stateCode = 'FL';
  private apiUrl = 'https://www.myfloridalicense.com/wl11.asp';

  async verify(licenseNumber: string, licenseType: string): Promise<VerificationResult> {
    // DBPR provides a public search API endpoint
    const params = new URLSearchParams({
      LicenseNumber: licenseNumber,
      SID: '',
      bSearchNameSearch: '0',
    });

    const response = await fetch(`${this.apiUrl}?${params}`, {
      headers: {
        'User-Agent': 'VoltPass/1.0 License Verification Service',
        Accept: 'application/json, text/html',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`DBPR API responded with ${response.status}`);
    }

    const html = await response.text();

    // Parse key fields from HTML table
    const statusMatch = html.match(/Status[^:]*:?\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const nameMatch = html.match(/Name[^:]*:?\s*<\/td>\s*<td[^>]*>([^<]+)/i);
    const expiryMatch = html.match(/Expir\w+[^:]*:?\s*<\/td>\s*<td[^>]*>([^<]+)/i);

    if (!statusMatch) {
      return { licenseNumber, status: 'not_found' };
    }

    const rawStatus = statusMatch[1].trim().toLowerCase();
    let status: VerificationResult['status'] = 'not_found';
    if (rawStatus.includes('current') || rawStatus.includes('active')) status = 'active';
    else if (rawStatus.includes('delinquent') || rawStatus.includes('suspended')) status = 'suspended';
    else if (rawStatus.includes('null') || rawStatus.includes('expired')) status = 'expired';

    const holderName = nameMatch?.[1]?.trim();
    const expiryRaw = expiryMatch?.[1]?.trim();
    const expiryDate = expiryRaw ? new Date(expiryRaw) : undefined;

    return {
      licenseNumber,
      status,
      licenseType,
      holderName,
      expiryDate,
      rawData: { rawStatus, source: 'DBPR' },
    };
  }
}
