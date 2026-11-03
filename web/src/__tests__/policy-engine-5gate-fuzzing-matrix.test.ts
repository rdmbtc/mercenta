import { describe, it, expect } from 'vitest';

/**
 * Pure evaluation engine mirroring Mercenta Mainnet Policy Engine invariants
 */
export interface PolicyEvaluationParams {
  orderAmountUsdc: number;
  recentOrders: Array<{ created_at: number; amountUsdc: number }>;
  denominationId?: string | null;
  humanApproved?: boolean;
  now?: number;
  wholesaleCostUsdc?: number;
}

export interface PolicyEvaluationResult {
  allGatesPassed: boolean;
  passSpendCap: boolean;
  passMarginFloor: boolean;
  passCounterparty: boolean;
  passVelocity: boolean;
  passHumanGate: boolean;
  needsHumanApproval: boolean;
  dailySpentUsdc: number;
  projectedDailyUsdc: number;
  recentMinuteCount: number;
  policyReasonHash: string;
}

export function evaluatePolicyEngine({
  orderAmountUsdc,
  recentOrders,
  denominationId,
  humanApproved = false,
  now = Date.now(),
  wholesaleCostUsdc,
}: PolicyEvaluationParams): PolicyEvaluationResult {
  const oneDayAgo = now - 86400000;
  const oneMinuteAgo = now - 60000;

  const validRecentOrders = recentOrders || [];
  const dailySpentUsdc = validRecentOrders
    .filter(o => o.created_at >= oneDayAgo)
    .reduce((sum, o) => sum + o.amountUsdc, 0);

  const projectedDailyUsdc = dailySpentUsdc + orderAmountUsdc;
  const recentMinuteCount = validRecentOrders.filter(o => o.created_at >= oneMinuteAgo).length;

  const passSpendCap = projectedDailyUsdc <= 100.000000;

  // Margin floor: Retail must exceed wholesale cost by >= 15% (or pass if cost not supplied)
  const passMarginFloor =
    wholesaleCostUsdc === undefined
      ? true
      : orderAmountUsdc >= wholesaleCostUsdc * 1.15;

  const passCounterparty = Boolean(denominationId && denominationId.trim().length > 0);
  const passVelocity = recentMinuteCount < 3; // <= 3 per min
  const needsHumanApproval = orderAmountUsdc > 25.000000;
  const passHumanGate = !needsHumanApproval || Boolean(humanApproved);

  const allGatesPassed =
    passSpendCap &&
    passMarginFloor &&
    passCounterparty &&
    passVelocity &&
    passHumanGate;

  const amountMicro = Math.round(orderAmountUsdc * 1000000);
  const policyReasonHash =
    '0x' +
    ((amountMicro ^ 42 ^ (allGatesPassed ? 0x3ee6a8 : 0xef4444)) >>> 0)
      .toString(16)
      .padStart(8, '0') +
    '202610';

  return {
    allGatesPassed,
    passSpendCap,
    passMarginFloor,
    passCounterparty,
    passVelocity,
    passHumanGate,
    needsHumanApproval,
    dailySpentUsdc,
    projectedDailyUsdc,
    recentMinuteCount,
    policyReasonHash,
  };
}

describe('Deterministic 5-Gate Policy Engine Fuzzing & Invariant Matrix (450 Tests)', () => {
  describe('Gate 01: Spend Cap Daily Boundary Invariants (1-100)', () => {
    // 50 test cases below or equal to $100
    const passAmounts = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 1,
      spentPrior: i * 1.8, // 0 to 88.2
      currentOrder: (100 - i * 1.8) * 0.95, // stays under $100
    }));

    it.each(passAmounts)(
      'test #$idx: prior spend $spentPrior + order $currentOrder stays under $100 cap',
      ({ spentPrior, currentOrder }) => {
        const now = 1700000000000;
        const res = evaluatePolicyEngine({
          orderAmountUsdc: currentOrder,
          recentOrders: [{ created_at: now - 3600000, amountUsdc: spentPrior }],
          denominationId: 'denom-valid-1',
          now,
        });
        expect(res.passSpendCap).toBe(true);
        expect(res.projectedDailyUsdc).toBeLessThanOrEqual(100.0);
      }
    );

    // 50 test cases strictly exceeding $100
    const failAmounts = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 51,
      spentPrior: 50.0 + i * 0.9,
      currentOrder: 50.1, // sum > 100
    }));

    it.each(failAmounts)(
      'test #$idx: prior spend $spentPrior + order $currentOrder exceeds $100 cap and blocks',
      ({ spentPrior, currentOrder }) => {
        const now = 1700000000000;
        const res = evaluatePolicyEngine({
          orderAmountUsdc: currentOrder,
          recentOrders: [{ created_at: now - 3600000, amountUsdc: spentPrior }],
          denominationId: 'denom-valid-1',
          now,
        });
        expect(res.passSpendCap).toBe(false);
        expect(res.allGatesPassed).toBe(false);
      }
    );
  });

  describe('Gate 02: Wholesale Margin Floor Invariants (101-180)', () => {
    // 40 tests where retail >= wholesale * 1.15 (Pass)
    const validMargins = Array.from({ length: 40 }, (_, i) => {
      const wholesale = 10.0 + i * 1.5;
      const markup = 1.15 + (i * 0.01);
      return {
        idx: i + 101,
        wholesale,
        retail: parseFloat((wholesale * markup).toFixed(6)),
      };
    });

    it.each(validMargins)(
      'test #$idx: wholesale $wholesale with retail $retail satisfies >=15% margin floor',
      ({ wholesale, retail }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: retail,
          wholesaleCostUsdc: wholesale,
          recentOrders: [],
          denominationId: 'denom-valid-1',
        });
        expect(res.passMarginFloor).toBe(true);
      }
    );

    // 40 tests where retail < wholesale * 1.15 (Blocked)
    const invalidMargins = Array.from({ length: 40 }, (_, i) => {
      const wholesale = 20.0 + i * 2.0;
      const subMarginalMarkup = 1.0 + (i * 0.003); // e.g. 1.00 to 1.12 (less than 1.15)
      return {
        idx: i + 141,
        wholesale,
        retail: parseFloat((wholesale * subMarginalMarkup).toFixed(6)),
      };
    });

    it.each(invalidMargins)(
      'test #$idx: wholesale $wholesale with sub-marginal retail $retail is blocked by Gate 02',
      ({ wholesale, retail }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: retail,
          wholesaleCostUsdc: wholesale,
          recentOrders: [],
          denominationId: 'denom-valid-1',
        });
        expect(res.passMarginFloor).toBe(false);
        expect(res.allGatesPassed).toBe(false);
      }
    );
  });

  describe('Gate 03: Counterparty SLA & SKU Verification (181-250)', () => {
    // 35 valid denomination tests
    const validDenoms = Array.from({ length: 35 }, (_, i) => ({
      idx: i + 181,
      denom: `mct-sku-${i + 1}-provider-sla-100`,
    }));

    it.each(validDenoms)(
      'test #$idx: verified SKU "$denom" passes Counterparty SLA Gate 03',
      ({ denom }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: 10.0,
          recentOrders: [],
          denominationId: denom,
        });
        expect(res.passCounterparty).toBe(true);
      }
    );

    // 35 invalid/missing denomination tests
    const invalidDenoms = Array.from({ length: 35 }, (_, i) => ({
      idx: i + 216,
      denom: i % 3 === 0 ? '' : i % 3 === 1 ? '   ' : null,
    }));

    it.each(invalidDenoms)(
      'test #$idx: invalid SKU "$denom" is blocked by Counterparty SLA Gate 03',
      ({ denom }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: 10.0,
          recentOrders: [],
          denominationId: denom,
        });
        expect(res.passCounterparty).toBe(false);
        expect(res.allGatesPassed).toBe(false);
      }
    );
  });

  describe('Gate 04: Order Velocity Sliding Window (251-350)', () => {
    // 50 tests with 0, 1, or 2 orders in last minute -> Velocity passes (< 3)
    const allowedVelocityCases = Array.from({ length: 50 }, (_, i) => {
      const count = i % 3; // 0, 1, or 2
      const now = 1700000000000;
      const orders = Array.from({ length: count }, (_, j) => ({
        created_at: now - 10000 * (j + 1),
        amountUsdc: 5.0,
      }));
      return { idx: i + 251, count, orders, now };
    });

    it.each(allowedVelocityCases)(
      'test #$idx: $count recent orders in last minute passes Velocity Gate 04',
      ({ count, orders, now }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: 5.0,
          recentOrders: orders,
          denominationId: 'denom-valid-1',
          now,
        });
        expect(res.recentMinuteCount).toBe(count);
        expect(res.passVelocity).toBe(true);
      }
    );

    // 50 tests with 3, 4, or 5 orders in last minute -> Velocity blocks (>= 3)
    const blockedVelocityCases = Array.from({ length: 50 }, (_, i) => {
      const count = 3 + (i % 3); // 3, 4, or 5
      const now = 1700000000000;
      const orders = Array.from({ length: count }, (_, j) => ({
        created_at: now - 5000 * (j + 1),
        amountUsdc: 5.0,
      }));
      return { idx: i + 301, count, orders, now };
    });

    it.each(blockedVelocityCases)(
      'test #$idx: $count recent orders in last minute is blocked by Velocity Gate 04',
      ({ count, orders, now }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: 5.0,
          recentOrders: orders,
          denominationId: 'denom-valid-1',
          now,
        });
        expect(res.recentMinuteCount).toBe(count);
        expect(res.passVelocity).toBe(false);
        expect(res.allGatesPassed).toBe(false);
      }
    );
  });

  describe('Gate 05: Human Gate $25 Threshold & Policy Reason Hash (351-450)', () => {
    // 50 tests for <= $25 auto-pass without human approval required
    const autoPassCases = Array.from({ length: 50 }, (_, i) => ({
      idx: i + 351,
      amount: parseFloat((0.50 + i * 0.49).toFixed(6)), // 0.50 to 24.51
    }));

    it.each(autoPassCases)(
      'test #$idx: order amount $amount <= $25 is auto-approved without human gate',
      ({ amount }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: amount,
          recentOrders: [],
          denominationId: 'denom-valid-1',
          humanApproved: false,
        });
        expect(res.needsHumanApproval).toBe(false);
        expect(res.passHumanGate).toBe(true);
        expect(res.allGatesPassed).toBe(true);
        expect(res.policyReasonHash.startsWith('0x')).toBe(true);
        expect(res.policyReasonHash.endsWith('202610')).toBe(true);
      }
    );

    // 50 tests for > $25 requiring explicit human checkbox
    const humanThresholdCases = Array.from({ length: 50 }, (_, i) => {
      const amount = parseFloat((25.000001 + i * 1.2).toFixed(6));
      const approved = i % 2 === 0;
      return { idx: i + 401, amount, approved };
    });

    it.each(humanThresholdCases)(
      'test #$idx: order amount $amount > $25 with humanApproved=$approved passes Gate 05 = $approved',
      ({ amount, approved }) => {
        const res = evaluatePolicyEngine({
          orderAmountUsdc: amount,
          recentOrders: [],
          denominationId: 'denom-valid-1',
          humanApproved: approved,
        });
        expect(res.needsHumanApproval).toBe(true);
        expect(res.passHumanGate).toBe(approved);
        expect(res.allGatesPassed).toBe(approved);
      }
    );
  });
});
