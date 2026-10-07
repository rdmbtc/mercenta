import { createHash } from 'node:crypto';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export type CompliancePolicy = {
  maxMicro: bigint;
  cappedMicro: bigint;
  delayMs: number;
  staleMs: number;
};

export type ComplianceCheckInput = {
  risk: RiskTier;
  screeningId: string;
  observedAt: number;
  amountMicro: bigint;
  policy: CompliancePolicy;
  now: number;
};

export type ComplianceDecision = {
  action: 'ALLOW' | 'CAPPED_DELAY' | 'BLOCK' | 'ESCALATE';
  reason: string;
  auditReference: string;
  effectiveCapMicro?: bigint;
  delayRemainingMs?: number;
  disclaimer: string;
};

const COMPLIANCE_DISCLAIMER =
  'Simulation screening only; this engine does not constitute regulatory OFAC/sanctions clearance.';

/**
 * Lead-owned deterministic compliance decision engine (RFB 05 compliance).
 * Enforces dynamic risk-tiered transaction limits, mandatory cooling-off delays,
 * and fail-closed handling for stale or unknown screening records.
 */
export function decideRisk(input: ComplianceCheckInput): ComplianceDecision {
  const { risk, screeningId, observedAt, amountMicro, policy, now } = input;

  const auditPayload = {
    screeningId,
    risk,
    observedAt,
    amountMicro: amountMicro.toString(),
    now,
    engine: 'mercenta-compliance-tier-v1'
  };
  const auditReference = createHash('sha256')
    .update(JSON.stringify(auditPayload))
    .digest('hex');

  // Stale screening records fail closed
  if (now < observedAt || now - observedAt > policy.staleMs) {
    return {
      action: 'BLOCK',
      reason: 'STALE_SCREENING_DATA',
      auditReference,
      disclaimer: COMPLIANCE_DISCLAIMER
    };
  }

  // HIGH risk is strictly blocked
  if (risk === 'HIGH') {
    return {
      action: 'BLOCK',
      reason: 'HIGH_SANCTIONS_RISK_BLOCKED',
      auditReference,
      disclaimer: COMPLIANCE_DISCLAIMER
    };
  }

  // UNKNOWN risk fails closed
  if (risk === 'UNKNOWN') {
    return {
      action: 'BLOCK',
      reason: 'UNKNOWN_COUNTERPARTY_RISK',
      auditReference,
      disclaimer: COMPLIANCE_DISCLAIMER
    };
  }

  // MEDIUM risk requires capped limits and cooling-off delay
  if (risk === 'MEDIUM') {
    if (amountMicro > policy.cappedMicro) {
      return {
        action: 'ESCALATE',
        reason: 'MEDIUM_RISK_EXCEEDS_TIER_CAP',
        auditReference,
        effectiveCapMicro: policy.cappedMicro,
        disclaimer: COMPLIANCE_DISCLAIMER
      };
    }

    const elapsed = now - observedAt;
    if (elapsed < policy.delayMs) {
      return {
        action: 'CAPPED_DELAY',
        reason: 'COOLING_OFF_PERIOD_ACTIVE',
        auditReference,
        effectiveCapMicro: policy.cappedMicro,
        delayRemainingMs: policy.delayMs - elapsed,
        disclaimer: COMPLIANCE_DISCLAIMER
      };
    }

    return {
      action: 'ALLOW',
      reason: 'MEDIUM_RISK_CAPPED_DELAY_SATISFIED',
      auditReference,
      effectiveCapMicro: policy.cappedMicro,
      disclaimer: COMPLIANCE_DISCLAIMER
    };
  }

  // LOW risk obeys maximum policy cap
  if (amountMicro > policy.maxMicro) {
    return {
      action: 'ESCALATE',
      reason: 'EXCEEDS_MAX_POLICY_CAP',
      auditReference,
      effectiveCapMicro: policy.maxMicro,
      disclaimer: COMPLIANCE_DISCLAIMER
    };
  }

  return {
    action: 'ALLOW',
    reason: 'LOW_RISK_AUTHORIZED',
    auditReference,
    effectiveCapMicro: policy.maxMicro,
    disclaimer: COMPLIANCE_DISCLAIMER
  };
}
