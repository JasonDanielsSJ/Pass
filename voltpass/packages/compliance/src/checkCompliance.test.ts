import { checkCompliance, ActiveCredential, ReciprocityRule, StateRequirement } from './checkCompliance';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

const txJourneymanCred: ActiveCredential = {
  licenseNumber: 'TX-J-123456',
  issuingState: 'TX',
  licenseType: 'Journeyman Electrician',
  tradeLevel: 'journeyman',
  expiryDate: futureDate,
  status: 'active',
};

const txMasterCred: ActiveCredential = {
  licenseNumber: 'TX-M-789012',
  issuingState: 'TX',
  licenseType: 'Master Electrician',
  tradeLevel: 'master',
  expiryDate: futureDate,
  status: 'active',
};

const flJourneymanCred: ActiveCredential = {
  licenseNumber: 'FL-J-345678',
  issuingState: 'FL',
  licenseType: 'Journeyman Electrician',
  tradeLevel: 'journeyman',
  expiryDate: futureDate,
  status: 'active',
};

// TX → NV: full reciprocity for journeyman
const txNvFullRule: ReciprocityRule = {
  homeState: 'TX',
  targetState: 'NV',
  tradeLevel: 'journeyman',
  status: 'full',
};

// TX → CA: partial reciprocity for master with 2 gap steps
const txCaPartialRule: ReciprocityRule = {
  homeState: 'TX',
  targetState: 'CA',
  tradeLevel: 'master',
  status: 'partial',
  conditions: ['req-ca-exam', 'req-ca-bond'],
};

// TX → MS: no reciprocity for journeyman
const txMsNoneRule: ReciprocityRule = {
  homeState: 'TX',
  targetState: 'MS',
  tradeLevel: 'journeyman',
  status: 'none',
};

// FL → NV: full reciprocity for journeyman
const flNvFullRule: ReciprocityRule = {
  homeState: 'FL',
  targetState: 'NV',
  tradeLevel: 'journeyman',
  status: 'full',
};

const caExamReq: StateRequirement = {
  id: 'req-ca-exam',
  name: 'California State Electrical Exam',
  requirementType: 'exam',
  description: 'Pass the California journeyman electrician exam administered by the CSLB.',
  feeAmount: 125,
  processingDays: 45,
  formUrl: 'https://www.cslb.ca.gov/Contractors/Applicants/Electrical_Certification/',
};

const caBondReq: StateRequirement = {
  id: 'req-ca-bond',
  name: 'California Contractor Bond',
  requirementType: 'bond',
  description: 'Obtain a $15,000 surety bond from a California-licensed surety company.',
  feeAmount: 150,
  processingDays: 7,
  formUrl: 'https://www.cslb.ca.gov/Contractors/Applicants/Contractor_Bond/',
};

const requirementsMap = new Map<string, StateRequirement>([
  ['req-ca-exam', caExamReq],
  ['req-ca-bond', caBondReq],
]);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('checkCompliance', () => {
  describe('TX journeyman → NV (full reciprocity)', () => {
    it('returns COMPLIANT', () => {
      const result = checkCompliance(
        [txJourneymanCred],
        'NV',
        'journeyman',
        [txNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('compliant');
      expect(result.clearedToWork).toBe(true);
      expect(result.matchedRule).toEqual(txNvFullRule);
      expect(result.gapSteps).toBeUndefined();
    });

    it('message mentions TX and NV', () => {
      const result = checkCompliance(
        [txJourneymanCred],
        'NV',
        'journeyman',
        [txNvFullRule],
        requirementsMap
      );
      expect(result.message).toContain('TX');
      expect(result.message).toContain('NV');
    });
  });

  describe('TX master → CA (partial reciprocity, 2 gap steps)', () => {
    it('returns PARTIAL with 2 gap steps', () => {
      const result = checkCompliance(
        [txMasterCred],
        'CA',
        'master',
        [txCaPartialRule],
        requirementsMap
      );
      expect(result.verdict).toBe('partial');
      expect(result.clearedToWork).toBe(false);
      expect(result.gapSteps).toHaveLength(2);
    });

    it('gap steps include exam and bond', () => {
      const result = checkCompliance(
        [txMasterCred],
        'CA',
        'master',
        [txCaPartialRule],
        requirementsMap
      );
      const stepNames = result.gapSteps!.map(s => s.requirementType);
      expect(stepNames).toContain('exam');
      expect(stepNames).toContain('bond');
    });

    it('includes estimated days from max processing time', () => {
      const result = checkCompliance(
        [txMasterCred],
        'CA',
        'master',
        [txCaPartialRule],
        requirementsMap
      );
      // exam takes 45 days (the max), bond takes 7 days
      expect(result.estimatedDaysToCompliant).toBe(45);
    });

    it('gap steps include fee amounts', () => {
      const result = checkCompliance(
        [txMasterCred],
        'CA',
        'master',
        [txCaPartialRule],
        requirementsMap
      );
      const examStep = result.gapSteps!.find(s => s.requirementType === 'exam');
      expect(examStep?.feeAmount).toBe(125);
    });
  });

  describe('TX journeyman → MS (no reciprocity)', () => {
    it('returns INELIGIBLE', () => {
      const result = checkCompliance(
        [txJourneymanCred],
        'MS',
        'journeyman',
        [txMsNoneRule],
        requirementsMap
      );
      expect(result.verdict).toBe('ineligible');
      expect(result.clearedToWork).toBe(false);
    });

    it('message explains that MS does not recognize out-of-state licenses', () => {
      const result = checkCompliance(
        [txJourneymanCred],
        'MS',
        'journeyman',
        [txMsNoneRule],
        requirementsMap
      );
      expect(result.message).toContain('MS');
    });
  });

  describe('User with credentials in both TX and FL checking NV', () => {
    it('returns COMPLIANT because at least one credential qualifies', () => {
      const result = checkCompliance(
        [txJourneymanCred, flJourneymanCred],
        'NV',
        'journeyman',
        [txNvFullRule, flNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('compliant');
      expect(result.clearedToWork).toBe(true);
    });

    it('picks best rule (full over partial) when TX has full and hypothetical partial', () => {
      const partialRule: ReciprocityRule = {
        homeState: 'FL',
        targetState: 'NV',
        tradeLevel: 'journeyman',
        status: 'partial',
        conditions: ['req-ca-exam'],
      };
      const result = checkCompliance(
        [txJourneymanCred, flJourneymanCred],
        'NV',
        'journeyman',
        [partialRule, txNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('compliant');
      expect(result.matchedRule?.status).toBe('full');
    });
  });

  describe('Empty credentials array', () => {
    it('returns INELIGIBLE', () => {
      const result = checkCompliance(
        [],
        'NV',
        'journeyman',
        [txNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('ineligible');
      expect(result.clearedToWork).toBe(false);
    });
  });

  describe('Expired credentials are excluded', () => {
    it('returns INELIGIBLE when only credential is expired', () => {
      const expiredCred: ActiveCredential = {
        ...txJourneymanCred,
        expiryDate: pastDate,
      };
      const result = checkCompliance(
        [expiredCred],
        'NV',
        'journeyman',
        [txNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('ineligible');
      expect(result.clearedToWork).toBe(false);
    });

    it('uses valid credential when one is expired and one is active', () => {
      const expiredCred: ActiveCredential = {
        ...txJourneymanCred,
        licenseNumber: 'TX-J-EXPIRED',
        expiryDate: pastDate,
      };
      const result = checkCompliance(
        [expiredCred, flJourneymanCred],
        'NV',
        'journeyman',
        [txNvFullRule, flNvFullRule],
        requirementsMap
      );
      expect(result.verdict).toBe('compliant');
      expect(result.matchedRule?.homeState).toBe('FL');
    });
  });

  describe('Trade level mismatches', () => {
    it('returns INELIGIBLE when tradeLevel does not match available rules', () => {
      // TX has a journeyman rule for NV, but we are checking for master
      const result = checkCompliance(
        [txJourneymanCred],
        'NV',
        'master',
        [txNvFullRule], // only journeyman rule exists
        requirementsMap
      );
      expect(result.verdict).toBe('ineligible');
    });
  });
});
