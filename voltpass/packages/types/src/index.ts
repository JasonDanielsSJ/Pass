// ─── Shared Types for VoltPass ───────────────────────────────────────────────

export type TradeType = 'journeyman' | 'master' | 'contractor' | 'apprentice';
export type TradeLevel = 'apprentice' | 'journeyman' | 'master' | 'contractor';
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'pending';
export type ComplianceVerdict = 'compliant' | 'partial' | 'ineligible';
export type VerificationMethod = 'api' | 'scrape' | 'manual_upload';
export type ReciprocityStatus = 'full' | 'partial' | 'none';
export type UserPlan = 'free' | 'pro' | 'employer' | 'enterprise';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tradeType: TradeType;
  homeState: string;
  plan: UserPlan;
  createdAt: string;
}

export interface Credential {
  id: string;
  userId: string;
  licenseNumber: string;
  issuingState: string;
  licenseType: string;
  tradeLevel: TradeLevel;
  issueDate?: string;
  expiryDate: string;
  status: LicenseStatus;
  verificationMethod: VerificationMethod;
  lastVerifiedAt?: string;
  vcJwt?: string;
  createdAt: string;
}

export interface StateRequirement {
  id: string;
  stateCode: string;
  tradeType: string;
  tradeLevel: string;
  requirementType: string;
  name: string;
  description?: string;
  feeAmount?: number;
  processingDays?: number;
  formUrl?: string;
  lastUpdated?: string;
}

export interface ReciprocityRule {
  id: string;
  homeState: string;
  targetState: string;
  tradeType: string;
  tradeLevel: string;
  status: ReciprocityStatus;
  conditions?: string[];
  effectiveDate?: string;
  sourceUrl?: string;
  lastVerified?: string;
}

export interface GapStep {
  requirementId: string;
  name: string;
  requirementType: string;
  description?: string;
  feeAmount?: number;
  processingDays?: number;
  formUrl?: string;
}

export interface ComplianceResult {
  verdict: ComplianceVerdict;
  message: string;
  clearedToWork: boolean;
  gapSteps?: GapStep[];
  estimatedDaysToCompliant?: number;
  matchedRule?: ReciprocityRule;
}

export interface ComplianceCheck {
  id: string;
  userId: string;
  targetState: string;
  tradeType: string;
  checkedAt: string;
  verdict: ComplianceVerdict;
  gapSteps?: GapStep[];
  employerId?: string;
}

export interface Employer {
  id: string;
  name: string;
  email: string;
  plan: string;
  createdAt: string;
}

export interface VerificationLog {
  id: string;
  credentialId: string;
  verifiedByType: 'employer' | 'inspector' | 'self';
  verifiedById?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  outcome: 'pass' | 'fail' | 'expired';
}

export interface VCQRPayload {
  vcJwt: string;
  credentialId: string;
  expiresAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShareToken {
  token: string;
  credentialId: string;
  expiresAt: string;
}

export interface BatchVerifyResult {
  credentialId: string;
  found: boolean;
  status?: LicenseStatus;
  holderName?: string;
  licenseType?: string;
  expiryDate?: string;
  complianceVerdict?: ComplianceVerdict;
  error?: string;
}
