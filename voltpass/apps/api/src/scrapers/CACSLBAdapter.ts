import { BaseAdapter, VerificationResult } from './BaseAdapter';

/**
 * California CSLB Electrician Certification Verification
 * Uses Playwright headless browser because CSLB uses a JavaScript-rendered
 * form that cannot be queried via simple HTTP fetch.
 * URL: https://www.cslb.ca.gov/OnlineServices/CheckLicense/LicenseDetail.aspx
 */
export class CACSLBAdapter extends BaseAdapter {
  stateCode = 'CA';
  private checkUrl = 'https://www.cslb.ca.gov/OnlineServices/CheckLicense/LicenseDetail.aspx';

  async verify(licenseNumber: string, licenseType: string): Promise<VerificationResult> {
    // Dynamically import Playwright to avoid loading it when not needed
    const { chromium } = await import('playwright');

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
      await page.goto(this.checkUrl, { waitUntil: 'networkidle', timeout: 30_000 });

      // Fill in the license number input
      const input = await page.$('input[name="LicNum"], input#LicNum, input[placeholder*="license"]');
      if (!input) throw new Error('Could not find license number input on CSLB page');

      await input.fill(licenseNumber);

      // Submit the form
      const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
      if (!submitBtn) throw new Error('Could not find submit button on CSLB page');
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle' }), submitBtn.click()]);

      // Extract status
      const pageText = await page.textContent('body') ?? '';

      if (pageText.includes('No records found') || pageText.includes('not found')) {
        return { licenseNumber, status: 'not_found' };
      }

      // Parse status from table
      const statusMatch = pageText.match(/License Status[:\s]+([A-Za-z ]+)/i);
      const nameMatch = pageText.match(/Business Name[:\s]+([^\n]+)/i)
        ?? pageText.match(/Name[:\s]+([^\n]+)/i);
      const expiryMatch = pageText.match(/Expir\w+[:\s]+([0-9\/\-]+)/i);

      const rawStatus = statusMatch?.[1]?.trim().toLowerCase() ?? '';
      let status: VerificationResult['status'] = 'not_found';
      if (rawStatus.includes('active') || rawStatus.includes('current')) status = 'active';
      else if (rawStatus.includes('suspend') || rawStatus.includes('revoke')) status = 'suspended';
      else if (rawStatus.includes('expir')) status = 'expired';

      const holderName = nameMatch?.[1]?.trim();
      const expiryDate = expiryMatch?.[1] ? new Date(expiryMatch[1]) : undefined;

      return {
        licenseNumber,
        status,
        licenseType,
        holderName,
        expiryDate,
        rawData: { rawStatus, source: 'CSLB' },
      };
    } finally {
      await browser.close();
    }
  }
}
