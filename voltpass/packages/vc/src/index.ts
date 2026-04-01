import { sign, verify, generateKeyPair } from '@stablelib/ed25519';
import { randomBytes } from 'crypto';

export { generateKeyPair };

export interface VCPayload {
  licenseNumber: string;
  licenseType: string;
  issuingState: string;
  tradeLevel: string;
  status: string;
  expiryDate: string; // ISO 8601
  holderDid: string;
}

export interface SignedVC {
  vcJwt: string;
  credentialId: string;
}

export interface VerifyResult {
  valid: boolean;
  credential?: object;
  error?: string;
}

/**
 * Issue a signed Verifiable Credential (W3C VC encoded as a JWT).
 * Uses Ed25519 / EdDSA signing.
 */
export function issueVC(
  payload: VCPayload,
  issuerPrivateKey: Uint8Array,
  issuerDid: string
): SignedVC {
  const credentialId = `urn:voltpass:${randomBytes(16).toString('hex')}`;
  const issuanceDate = new Date().toISOString();

  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: credentialId,
    type: ['VerifiableCredential', 'ElectricalLicense'],
    issuer: issuerDid,
    issuanceDate,
    expirationDate: payload.expiryDate,
    credentialSubject: {
      id: payload.holderDid,
      licenseNumber: payload.licenseNumber,
      licenseType: payload.licenseType,
      issuingState: payload.issuingState,
      tradeLevel: payload.tradeLevel,
      status: payload.status,
    },
  };

  const header = Buffer.from(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(credential)).toString('base64url');
  const signingInput = `${header}.${body}`;
  const signature = sign(issuerPrivateKey, Buffer.from(signingInput));
  const vcJwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  return { vcJwt, credentialId };
}

/**
 * Verify a VC — works offline, requires only the issuer public key.
 * No network call needed.
 */
export function verifyVC(
  vcJwt: string,
  issuerPublicKey: Uint8Array
): VerifyResult {
  try {
    const parts = vcJwt.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Invalid JWT format' };

    const [header, body, sig] = parts;
    const signingInput = `${header}.${body}`;
    const signature = Buffer.from(sig, 'base64url');

    const isValid = verify(issuerPublicKey, Buffer.from(signingInput), signature);
    if (!isValid) return { valid: false, error: 'Signature verification failed' };

    const credential = JSON.parse(Buffer.from(body, 'base64url').toString());

    // Check expiry
    if (credential.expirationDate && new Date(credential.expirationDate) < new Date()) {
      return { valid: false, error: 'Credential has expired', credential };
    }

    return { valid: true, credential };
  } catch (err) {
    return { valid: false, error: String(err) };
  }
}

/**
 * Generate a QR payload for offline verification.
 * The QR code contains the signed VC JWT plus a short-lived expiry.
 */
export function generateQRPayload(
  vcJwt: string,
  credentialId: string,
  ttlSeconds = 3600
): string {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const payload = { vcJwt, credentialId, expiresAt };
  return JSON.stringify(payload);
}

/**
 * Parse and validate a QR payload.
 */
export function parseQRPayload(raw: string): {
  vcJwt: string;
  credentialId: string;
  expiresAt: string;
  expired: boolean;
} | null {
  try {
    const parsed = JSON.parse(raw) as { vcJwt: string; credentialId: string; expiresAt: string };
    if (!parsed.vcJwt || !parsed.credentialId || !parsed.expiresAt) return null;
    const expired = new Date(parsed.expiresAt) < new Date();
    return { ...parsed, expired };
  } catch {
    return null;
  }
}
