export interface VerificationResult {
  licenseNumber: string;
  status: 'active' | 'suspended' | 'expired' | 'not_found';
  licenseType?: string;
  holderName?: string;
  expiryDate?: Date;
  rawData?: object;
}

export abstract class BaseAdapter {
  abstract stateCode: string;
  abstract verify(licenseNumber: string, licenseType: string): Promise<VerificationResult>;
}
