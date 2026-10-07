export type TreasuryObligation = {
  dueAt: number;
  amountMicro: bigint;
};

export type TreasuryForecastInput = {
  cashMicro: bigint;
  burn30dMicro: bigint;
  obligations: TreasuryObligation[];
  now: number;
  redemptionDelayMs: number;
  safetyBufferMicro?: bigint;
  eligibilityVerified: boolean;
  quotesFresh: boolean;
};

export type TreasuryPlanningDecision = 'ALLOCATE' | 'HOLD' | 'REDEEM';

export type TreasuryForecastResult = {
  schemaVersion: 1;
  decision: TreasuryPlanningDecision;
  runwayDays: string;
  totalCashMicro: string;
  requiredOperatingReserveMicro: string;
  imminentObligationsMicro: string;
  idleSurplusMicro: string;
  recommendedActionMicro: string;
  redemptionDeadlineUtc: string | null;
  rationale: string;
  disclaimer: string;
};

const DISCLAIMER =
  'Planning simulation only. USYC yield participation requires separate verified investor qualification, jurisdiction allowlisting, and manual authorization.';

/**
 * Pure deterministic quantitative forecasting engine for RFB 01 (Intelligent Treasury).
 * Calculates exact operating reserves, imminent obligations within redemption horizon,
 * and bounded surplus allocation into yield reserves.
 */
export function forecastTreasury(input: TreasuryForecastInput): TreasuryForecastResult {
  const {
    cashMicro,
    burn30dMicro,
    obligations,
    now,
    redemptionDelayMs,
    safetyBufferMicro = 0n,
    eligibilityVerified,
    quotesFresh
  } = input;

  if (cashMicro < 0n || burn30dMicro < 0n) {
    throw new Error('NEGATIVE_BALANCE_NOT_ALLOWED');
  }

  // 14-day operating reserve calculation: ceil(burn30d * 14 / 30)
  const fourteenDayBuffer = (burn30dMicro * 14n + 29n) / 30n;
  const baseReserve = fourteenDayBuffer > safetyBufferMicro ? fourteenDayBuffer : safetyBufferMicro;

  // Calculate obligations due inside the redemption window (now + redemptionDelayMs)
  const horizon = now + redemptionDelayMs;
  let imminentObligations = 0n;
  let nextObligationDue: number | null = null;

  for (const ob of obligations) {
    if (ob.amountMicro < 0n) throw new Error('NEGATIVE_OBLIGATION');
    if (ob.dueAt <= horizon) {
      imminentObligations += ob.amountMicro;
      if (nextObligationDue === null || ob.dueAt < nextObligationDue) {
        nextObligationDue = ob.dueAt;
      }
    }
  }

  const totalRequiredReserve = baseReserve + imminentObligations;

  // Runway calculation
  let runwayDays: string;
  if (burn30dMicro === 0n) {
    runwayDays = 'INFINITE_RUNWAY';
  } else {
    // Days = cash / (burn30d / 30)
    const dailyBurn = (burn30dMicro + 29n) / 30n;
    if (dailyBurn === 0n) {
      runwayDays = 'INFINITE_RUNWAY';
    } else {
      const days = cashMicro / dailyBurn;
      runwayDays = days.toString();
    }
  }

  // Compute surplus or deficit
  let decision: TreasuryPlanningDecision = 'HOLD';
  let recommendedActionMicro = 0n;
  let idleSurplus = 0n;
  let rationale = '';
  let redemptionDeadlineUtc: string | null = null;

  if (cashMicro < totalRequiredReserve) {
    // Deficit: cash is below needed reserves
    decision = 'REDEEM';
    recommendedActionMicro = totalRequiredReserve - cashMicro;
    rationale = 'Operating cash below minimum 14-day reserve plus imminent obligations; redemption recommended.';
    if (nextObligationDue !== null) {
      redemptionDeadlineUtc = new Date(nextObligationDue - redemptionDelayMs).toISOString();
    }
  } else {
    idleSurplus = cashMicro - totalRequiredReserve;
    if (idleSurplus > 0n) {
      if (!eligibilityVerified) {
        decision = 'HOLD';
        rationale = 'Idle surplus exists but USYC allowlist eligibility is unverified; holding in cash.';
      } else if (!quotesFresh) {
        decision = 'HOLD';
        rationale = 'Idle surplus exists but market redemption/oracle quotes are stale; holding in cash.';
      } else {
        decision = 'ALLOCATE';
        recommendedActionMicro = idleSurplus;
        rationale = 'Surplus exceeds required 14-day operating cash and imminent obligations; eligible for yield allocation.';
      }
    } else {
      decision = 'HOLD';
      rationale = 'Current cash exactly balances required operational reserves.';
    }
  }

  return {
    schemaVersion: 1,
    decision,
    runwayDays,
    totalCashMicro: cashMicro.toString(),
    requiredOperatingReserveMicro: baseReserve.toString(),
    imminentObligationsMicro: imminentObligations.toString(),
    idleSurplusMicro: idleSurplus.toString(),
    recommendedActionMicro: recommendedActionMicro.toString(),
    redemptionDeadlineUtc,
    rationale,
    disclaimer: DISCLAIMER
  };
}
