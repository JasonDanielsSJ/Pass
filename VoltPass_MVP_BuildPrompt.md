# VoltPass — MVP Build Prompt
### For AI coding agents (Claude Code, Cursor, GPT-4o, etc.)

---

## ROLE & CONTEXT

You are a senior full-stack engineer building the MVP for **VoltPass** — a portable digital
credential wallet for licensed electricians. The product solves a single, high-value problem:
a licensed Texas electrician cannot legally work in California without 3–9 months of paperwork.
VoltPass verifies their license digitally and tells them in 30 seconds if they can work in
another state — and exactly what steps remain if they can't.

You are building the entire MVP from scratch. Follow the instructions below in order.
Do not skip ahead. Confirm each step is working before moving to the next.

---

## STACK (non-negotiable for this build)

| Layer | Choice | Why |
|-------|--------|-----|
| Mobile app | React Native + Expo SDK 51 | iOS + Android from one codebase |
| Web (employer + inspector) | Next.js 14 App Router | SSR + PWA support |
| Backend API | Node.js 20 + Fastify | Fast, schema-validated |
| Database | PostgreSQL via Supabase | Managed, RLS, realtime |
| Cache + queues | Redis (Railway add-on) | Compliance cache + job queues |
| Credential standard | W3C Verifiable Credentials | Cryptographic portability |
| VC signing | Ed25519 via @stablelib/ed25519 | Lightweight, offline-verifiable |
| Notifications | Resend (email) + FCM (push) | Simple setup, reliable |
| Billing | Stripe | Standard |
| Deployment | Vercel (web) + Railway (API + workers) | Zero-config CI/CD |

---

## STEP 1 — PROJECT SCAFFOLDING

Create a monorepo with this structure:

```
voltpass/
  apps/
    mobile/          # Expo React Native app
    web/             # Next.js 14 app (employer portal + inspector PWA)
    api/             # Fastify API server
    worker/          # Bull job processor (scrapers + notifications)
  packages/
    db/              # Prisma schema + migrations
    compliance/      # Compliance engine (pure TypeScript, no framework deps)
    vc/              # Verifiable Credential issuance + verification library
    types/           # Shared TypeScript types
  turbo.json
  package.json
```

Use **Turborepo** for monorepo management. Each app should be independently deployable.
Use **pnpm** as the package manager.

---

## STEP 2 — DATABASE SCHEMA

In `packages/db`, create a Prisma schema with these models. Run `prisma migrate dev` to apply.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  phone      String?
  tradeType  String   // journeyman | master | contractor
  homeState  String   @db.Char(2)
  createdAt  DateTime @default(now())

  credentials      Credential[]
  complianceChecks ComplianceCheck[]
}

model Credential {
  id                 String   @id @default(uuid())
  userId             String
  licenseNumber      String
  issuingState       String   @db.Char(2)
  licenseType        String
  tradeLevel         String   // apprentice | journeyman | master | contractor
  issueDate          DateTime?
  expiryDate         DateTime
  status             String   // active | suspended | expired | pending
  verificationMethod String   // api | scrape | manual_upload
  lastVerifiedAt     DateTime?
  rawDocUrl          String?
  vcJwt              String?  // signed W3C VC
  createdAt          DateTime @default(now())

  user             User             @relation(fields: [userId], references: [id])
  verificationLogs VerificationLog[]

  @@unique([licenseNumber, issuingState, licenseType])
}

model StateRequirement {
  id              String  @id @default(uuid())
  stateCode       String  @db.Char(2)
  tradeType       String
  tradeLevel      String
  requirementType String  // exam | bond | fee | experience_years | background_check
  name            String
  description     String?
  feeAmount       Decimal?
  processingDays  Int?
  formUrl         String?
  lastUpdated     DateTime?

  @@unique([stateCode, tradeType, tradeLevel, requirementType, name])
}

model ReciprocityRule {
  id            String   @id @default(uuid())
  homeState     String   @db.Char(2)
  targetState   String   @db.Char(2)
  tradeType     String
  tradeLevel    String
  status        String   // full | partial | none
  conditions    Json?    // array of StateRequirement IDs
  effectiveDate DateTime?
  sourceUrl     String?
  lastVerified  DateTime?

  @@unique([homeState, targetState, tradeType, tradeLevel])
}

model ComplianceCheck {
  id           String   @id @default(uuid())
  userId       String
  targetState  String   @db.Char(2)
  tradeType    String
  checkedAt    DateTime @default(now())
  verdict      String   // compliant | partial | ineligible
  gapSteps     Json?
  employerId   String?

  user User @relation(fields: [userId], references: [id])
}

model Employer {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  plan      String   // employer | enterprise
  createdAt DateTime @default(now())
}

model VerificationLog {
  id             String   @id @default(uuid())
  credentialId   String
  verifiedByType String   // employer | inspector | self
  verifiedById   String?
  timestamp      DateTime @default(now())
  latitude       Float?
  longitude      Float?
  outcome        String   // pass | fail | expired

  credential Credential @relation(fields: [credentialId], references: [id])
}
```

---

## STEP 3 — COMPLIANCE ENGINE

Create `packages/compliance/src/checkCompliance.ts`.

This is a **pure function** — no database calls, no side effects. It takes pre-fetched data
as arguments so it can be tested in isolation and cached easily.

```typescript
export type TradeLevel = 'apprentice' | 'journeyman' | 'master' | 'contractor';

export interface ActiveCredential {
  licenseNumber: string;
  issuingState: string;
  licenseType: string;
  tradeLevel: TradeLevel;
  expiryDate: Date;
  status: 'active';
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

export interface ReciprocityRule {
  homeState: string;
  targetState: string;
  tradeLevel: TradeLevel;
  status: 'full' | 'partial' | 'none';
  conditions?: string[]; // array of StateRequirement IDs
}

export interface StateRequirement {
  id: string;
  name: string;
  requirementType: string;
  description?: string;
  feeAmount?: number;
  processingDays?: number;
  formUrl?: string;
}

export type ComplianceVerdict = 'compliant' | 'partial' | 'ineligible';

export interface ComplianceResult {
  verdict: ComplianceVerdict;
  message: string;
  clearedToWork: boolean;
  gapSteps?: GapStep[];
  estimatedDaysToCompliant?: number;
  matchedRule?: ReciprocityRule;
}

export function checkCompliance(
  credentials: ActiveCredential[],
  targetState: string,
  tradeLevel: TradeLevel,
  rules: ReciprocityRule[],
  requirementsMap: Map<string, StateRequirement>
): ComplianceResult {
  // Find the best matching rule (prefer full > partial > none)
  const matchingRules = rules
    .filter(r =>
      credentials.some(c => c.issuingState === r.homeState) &&
      r.targetState === targetState &&
      r.tradeLevel === tradeLevel
    )
    .sort((a, b) => {
      const rank = { full: 0, partial: 1, none: 2 };
      return rank[a.status] - rank[b.status];
    });

  if (matchingRules.length === 0) {
    return {
      verdict: 'ineligible',
      message: `No reciprocity agreement found for your credentials in ${targetState}.`,
      clearedToWork: false,
    };
  }

  const rule = matchingRules[0];

  if (rule.status === 'full') {
    return {
      verdict: 'compliant',
      message: `Your ${rule.homeState} license is fully recognized in ${targetState}. You are cleared to work.`,
      clearedToWork: true,
      matchedRule: rule,
    };
  }

  if (rule.status === 'none') {
    return {
      verdict: 'ineligible',
      message: `${targetState} does not recognize out-of-state licenses. A full ${targetState} license is required.`,
      clearedToWork: false,
      matchedRule: rule,
    };
  }

  // partial — build gap steps
  const gapSteps: GapStep[] = (rule.conditions ?? [])
    .map(reqId => requirementsMap.get(reqId))
    .filter((r): r is StateRequirement => r !== undefined)
    .map(r => ({
      requirementId: r.id,
      name: r.name,
      requirementType: r.requirementType,
      description: r.description,
      feeAmount: r.feeAmount,
      processingDays: r.processingDays,
      formUrl: r.formUrl,
    }));

  const estimatedDaysToCompliant = Math.max(
    ...gapSteps.map(g => g.processingDays ?? 0)
  );

  return {
    verdict: 'partial',
    message: `Your ${rule.homeState} license satisfies some ${targetState} requirements. ${gapSteps.length} step(s) remain.`,
    clearedToWork: false,
    gapSteps,
    estimatedDaysToCompliant,
    matchedRule: rule,
  };
}
```

**Write unit tests in `packages/compliance/src/checkCompliance.test.ts` covering:**
- TX journeyman → NV (full reciprocity) → returns COMPLIANT
- TX master → CA (partial reciprocity, 2 gap steps) → returns PARTIAL with gap steps
- TX journeyman → MS (no reciprocity) → returns INELIGIBLE
- User with credentials in both TX and FL checking NV → picks best rule
- Empty credentials array → returns INELIGIBLE

---

## STEP 4 — VERIFIABLE CREDENTIAL LIBRARY

Create `packages/vc/src/index.ts`.

```typescript
import { sign, verify } from '@stablelib/ed25519';
import { randomBytes } from 'crypto';

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

// Issue a signed Verifiable Credential
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

// Verify a VC — works offline, requires only the issuer public key
export function verifyVC(
  vcJwt: string,
  issuerPublicKey: Uint8Array
): { valid: boolean; credential?: object; error?: string } {
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
```

---

## STEP 5 — FASTIFY API SERVER

In `apps/api`, build the following routes. Use Fastify with `@fastify/swagger` for auto-docs.

### Auth routes
```
POST /auth/magic-link          # send magic link email
POST /auth/verify              # verify token, return JWT session
```

### Credential routes
```
POST   /credentials            # upload + trigger verification
GET    /credentials            # list user's credentials
GET    /credentials/:id        # single credential
DELETE /credentials/:id        # delete (user consent required)
POST   /credentials/:id/share  # generate time-limited share token (24h default)
```

### Compliance routes
```
POST /compliance/check
  body: { targetState: string, tradeLevel: string }
  auth: required (JWT)
  returns: ComplianceResult
  cache: Redis 24h key = userId:targetState:tradeLevel
```

### Verification routes (employer / inspector)
```
GET  /verify/:credentialId           # verify a credential by ID (employer)
POST /verify/qr                      # verify credential from QR payload
POST /verify/log                     # log a verification event (with geolocation)
```

### Employer routes
```
POST /employer/batch-verify          # CSV upload → compliance report
GET  /employer/crew                  # list all workers + compliance status
POST /employer/webhooks              # register webhook URL
```

### Scraper adapter interface
Build `apps/api/src/scrapers/BaseAdapter.ts`:

```typescript
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
```

Implement `TXTDLRAdapter` and `FLDBPRAdapter` using their public verification APIs.
Implement `CACSLBAdapter` using Playwright headless browser scraping.

---

## STEP 6 — MOBILE APP (EXPO)

### Screen flow:
```
Onboarding:
  WelcomeScreen → EnterLicenseScreen → VerifyingScreen → CredentialReadyScreen

Main app (bottom tabs):
  WalletTab → CredentialDetailScreen → ShareCredentialScreen
  CheckTab  → TargetStatePickerScreen → ComplianceResultScreen → GapStepsScreen
  ProfileTab → NotificationSettingsScreen → PlanUpgradeScreen
```

### Key implementation notes:

**CredentialDetailScreen** — shows the digital license card:
- Styled to look like a physical license card (state seal placeholder, amber/navy palette)
- Status badge: green ACTIVE / red EXPIRED / orange SUSPENDED
- Expiry countdown: "Expires in 87 days"

**ShareCredentialScreen**:
- Large QR code centered on screen, auto-refreshes every 60 seconds
- "Hold near reader" instruction for NFC mode
- Time-limited banner: "This code expires in 71:43"

**ComplianceResultScreen** — three states:
- COMPLIANT: large green checkmark, state name, "You're cleared to work"
- PARTIAL: amber warning icon, list of gap steps as tappable cards
  - Each card shows: step name, estimated time, fee, link to form
- INELIGIBLE: red X, message, estimated full application timeline

**GapStepsScreen** — checklist:
- Each step has a checkbox + "Mark complete" button
- On mark complete: re-runs compliance check, updates status if all done
- Deep link to state board URL opens in in-app browser

### Offline behavior:
- On first credential load: cache signed VC JWT in expo-secure-store
- Mark cached credentials with timestamp: "Verified 2h ago"
- If offline: show cached credential with "Offline mode — last verified [time]" banner
- QR generation works fully offline (signed payload, no server needed)

---

## STEP 7 — EMPLOYER PORTAL (NEXT.JS)

### Pages:
```
/                    → marketing landing page
/login               → magic link auth
/dashboard           → crew overview table
/verify              → single credential verification (QR scan or ID entry)
/verify/batch        → CSV upload for batch verification
/settings            → webhooks, billing, seat management
```

### Dashboard table columns:
Name | License # | State | Trade Level | Status | Expiry | Compliant For (job state) | Actions

- Sortable by any column
- Filter by: expiry within 30 days, non-compliant workers
- Row click → credential detail modal
- Export button → PDF compliance report

### Verification page:
- Two input modes: "Enter credential ID" text field OR "Scan QR" (uses webcam via @zxing/browser)
- On verify: show large PASS / FAIL card with credential details
- PASS: green card, name, license type, expiry, compliance status for current state
- FAIL: red card, reason (expired, suspended, no reciprocity)

---

## STEP 8 — INSPECTOR PWA

**This must work 100% offline. This is a hard requirement.**

Build as a Next.js route at `/inspect` with `next-pwa` configured.

Service worker must cache:
- The VoltPass Ed25519 public key (used for offline VC verification)
- The page assets
- The @stablelib/ed25519 verify function

**Offline verification flow:**
1. Inspector opens scan.voltpass.io on phone
2. Taps "Scan License"
3. Camera opens, reads QR code
4. PWA parses QR payload: `{ vcJwt, credentialId, expiresAt }`
5. Verifies Ed25519 signature using cached public key — **no network call**
6. If valid + not expired: large green PASS screen
7. If invalid or expired: large red FAIL screen with reason
8. Auto-logs inspection (queued for sync when connectivity returns)

**Result screen must be unmistakably clear at a distance:**
- Pass: full-screen green (#16A34A), white checkmark, name, license type in 36pt text
- Fail: full-screen red (#DC2626), white X, reason in 36pt text

---

## STEP 9 — SEED DATA

Seed the database with:

1. `state_requirements` — for TX, CA, FL, NV, AZ, CO, GA, NC, VA, PA:
   - Each state: journeyman exam, master exam, contractor bond, contractor fee
   - Include real form URLs, fees, and processing times from state board websites

2. `reciprocity_rules` — for all 90 pairs among the 10 pilot states:
   - Research from NASCLA.org, individual state board websites
   - Mark status as full / partial / none
   - For partial: include the array of condition StateRequirement IDs

Create a seed script at `packages/db/seed.ts` that can be re-run idempotently.

---

## STEP 10 — BILLING (STRIPE)

Implement three plans:

| Plan | Price | Stripe Product |
|------|-------|----------------|
| Free | $0 | (no Stripe product, default) |
| Pro | $9.99/month | ELECTRICIAN_PRO |
| Employer | $49/month per seat | EMPLOYER_SEAT |

- Free limits: 1 credential, compliance checks for 3 states only
- Pro + Employer: no artificial limits
- Gating: enforced in Fastify middleware, checked against Stripe subscription status
- Stripe webhooks: handle subscription created / cancelled / payment failed events
- Billing portal: redirect to Stripe Customer Portal for plan changes

---

## STEP 11 — NOTIFICATIONS

In `apps/worker`, build notification jobs:

```typescript
// Expiry alert job — runs daily at 08:00 local time
// Query: credentials WHERE expiry_date IN (now+90d, now+60d, now+30d, now+7d)
// Send: push (FCM) + email (Resend) with renewal deep link

// State rule change job — triggered on ReciprocityRule update
// Query: all users affected by changed rule
// Send: in-app notification + email

// Gap step completion job — triggered when user marks step done
// Re-run compliance check
// If now compliant: send "You're cleared to work in [state]!" push notification
```

---

## IMPORTANT CONSTRAINTS

1. **Compliance engine is pure TypeScript** — no database calls inside it. Fetch data first,
   pass it in, get result back. This makes it testable, cacheable, and fast.

2. **Offline verification is non-negotiable** — the inspector PWA must verify credentials
   without any network request. The Ed25519 public key must be in the service worker cache.

3. **Employers never see raw license documents** — the `/verify` endpoint returns only
   status metadata. Raw doc URLs are never included in API responses to employers.

4. **Scraper abstraction is a hard requirement** — never hardcode scraping logic outside
   of adapter files. The BaseAdapter interface must be respected so new states can be
   added by adding a single file.

5. **Seed data must be idempotent** — `prisma db seed` should be safe to run multiple times.
   Use upsert with the @@unique fields as the where clause.

6. **Test the compliance engine thoroughly** — it is the core business logic and must be
   correct. Cover all three verdict paths and edge cases (multiple home states, expired
   credentials excluded from check, tradeLevel mismatches).

---

## DEFINITION OF MVP DONE

The MVP is complete when all of the following are true:

- [ ] A new electrician can sign up, upload their TX license, and have it verified in < 5 min
- [ ] The compliance check correctly returns COMPLIANT for TX→NV (full reciprocity)
- [ ] The compliance check correctly returns PARTIAL for TX→CA with real gap steps and form links
- [ ] The QR code generated on mobile is scannable by the Inspector PWA
- [ ] The Inspector PWA can verify a credential while the phone is in airplane mode
- [ ] An employer can upload a CSV of 10 credential IDs and receive a compliance report PDF
- [ ] A user receives a push notification when their license is 30 days from expiry
- [ ] Stripe billing gates Free users to 1 credential and 3 compliance checks
- [ ] All compliance engine unit tests pass
- [ ] Seed data covers all 10 pilot states and all 90 reciprocity rule pairs
