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
  const now = new Date();

  // Only consider credentials that are active and not expired
  const validCredentials = credentials.filter(
    c => c.status === 'active' && c.expiryDate > now
  );

  if (validCredentials.length === 0) {
    return {
      verdict: 'ineligible',
      message: 'No valid active credentials found. Please ensure your license is active and not expired.',
      clearedToWork: false,
    };
  }

  // Find the best matching rule (prefer full > partial > none)
  const matchingRules = rules
    .filter(r =>
      validCredentials.some(c => c.issuingState === r.homeState) &&
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

  const estimatedDaysToCompliant =
    gapSteps.length > 0
      ? Math.max(...gapSteps.map(g => g.processingDays ?? 0))
      : 0;

  return {
    verdict: 'partial',
    message: `Your ${rule.homeState} license satisfies some ${targetState} requirements. ${gapSteps.length} step(s) remain.`,
    clearedToWork: false,
    gapSteps,
    estimatedDaysToCompliant,
    matchedRule: rule,
  };
}
