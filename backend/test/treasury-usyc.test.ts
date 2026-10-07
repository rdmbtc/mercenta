import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  forecastTreasury,
  type TreasuryForecastInput
} from '../src/services/treasury-yield.js';

describe('AGENT-05: Quantitative Treasury & USYC Yield Simulation (RFB 01)', () => {
  const baseNow = 1700000000000;
  const oneDayMs = 86400000;
  const redemptionDelayMs = 2 * oneDayMs; // 48h redemption window

  it('calculates 14-day reserve and allocates surplus when eligible and fresh', () => {
    // 30-day burn = $3,000 (3,000,000,000 micro-USDC)
    // 14-day reserve = ceil(3000 * 14 / 30) = $1,400 (1,400,000,000 micro-USDC)
    // Cash = $5,000 (5,000,000,000 micro-USDC)
    // Obligations: none
    const input: TreasuryForecastInput = {
      cashMicro: 5000000000n,
      burn30dMicro: 3000000000n,
      obligations: [],
      now: baseNow,
      redemptionDelayMs,
      eligibilityVerified: true,
      quotesFresh: true
    };

    const res = forecastTreasury(input);
    assert.equal(res.decision, 'ALLOCATE');
    assert.equal(res.requiredOperatingReserveMicro, '1400000000');
    assert.equal(res.idleSurplusMicro, '3600000000');
    assert.equal(res.recommendedActionMicro, '3600000000');
    assert.ok(res.disclaimer.includes('USYC yield participation'));
  });

  it('explicitly returns INFINITE_RUNWAY on zero monthly burn', () => {
    const input: TreasuryForecastInput = {
      cashMicro: 1000000000n,
      burn30dMicro: 0n,
      obligations: [],
      now: baseNow,
      redemptionDelayMs,
      eligibilityVerified: true,
      quotesFresh: true
    };

    const res = forecastTreasury(input);
    assert.equal(res.runwayDays, 'INFINITE_RUNWAY');
    // Ensure valid serializable JSON with no Infinity/NaN
    const json = JSON.stringify(res);
    assert.ok(!json.includes('Infinity'));
    assert.ok(!json.includes('NaN'));
  });

  it('HOLDS surplus when eligibility is unverified even if cash is abundant', () => {
    const input: TreasuryForecastInput = {
      cashMicro: 10000000000n,
      burn30dMicro: 1000000000n,
      obligations: [],
      now: baseNow,
      redemptionDelayMs,
      eligibilityVerified: false, // Unverified
      quotesFresh: true
    };

    const res = forecastTreasury(input);
    assert.equal(res.decision, 'HOLD');
    assert.equal(res.recommendedActionMicro, '0');
    assert.ok(res.rationale.includes('eligibility is unverified'));
  });

  it('HOLDS surplus when oracle or redemption quotes are stale', () => {
    const input: TreasuryForecastInput = {
      cashMicro: 10000000000n,
      burn30dMicro: 1000000000n,
      obligations: [],
      now: baseNow,
      redemptionDelayMs,
      eligibilityVerified: true,
      quotesFresh: false // Stale quotes
    };

    const res = forecastTreasury(input);
    assert.equal(res.decision, 'HOLD');
    assert.ok(res.rationale.includes('quotes are stale'));
  });

  it('retains conservative reserve for obligations inside redemption window and REDEEMS when deficient', () => {
    // 14-day reserve: $1,400
    // Imminent obligation due in 24h: $1,000 (within 48h window)
    // Future obligation due in 10 days: $500 (outside 48h window)
    // Required cash: $1,400 + $1,000 = $2,400
    // Current cash: $2,000 => Deficit of $400 => REDEEM
    const input: TreasuryForecastInput = {
      cashMicro: 2000000000n,
      burn30dMicro: 3000000000n,
      obligations: [
        { dueAt: baseNow + oneDayMs, amountMicro: 1000000000n },
        { dueAt: baseNow + 10 * oneDayMs, amountMicro: 500000000n }
      ],
      now: baseNow,
      redemptionDelayMs,
      eligibilityVerified: true,
      quotesFresh: true
    };

    const res = forecastTreasury(input);
    assert.equal(res.decision, 'REDEEM');
    assert.equal(res.imminentObligationsMicro, '1000000000');
    assert.equal(res.recommendedActionMicro, '400000000'); // $400 deficit
    assert.ok(res.redemptionDeadlineUtc !== null);
  });

  it('rejects negative cash or obligation amounts fail-closed', () => {
    assert.throws(() => {
      forecastTreasury({
        cashMicro: -100n,
        burn30dMicro: 1000n,
        obligations: [],
        now: baseNow,
        redemptionDelayMs,
        eligibilityVerified: true,
        quotesFresh: true
      });
    }, /NEGATIVE_BALANCE_NOT_ALLOWED/);

    assert.throws(() => {
      forecastTreasury({
        cashMicro: 1000n,
        burn30dMicro: 1000n,
        obligations: [{ dueAt: baseNow, amountMicro: -50n }],
        now: baseNow,
        redemptionDelayMs,
        eligibilityVerified: true,
        quotesFresh: true
      });
    }, /NEGATIVE_OBLIGATION/);
  });
});
