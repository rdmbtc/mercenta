import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  decideRisk,
  type ComplianceCheckInput,
  type CompliancePolicy
} from '../src/services/compliance-risk.js';

describe('AGENT-07: Compliance & Risk-Tier Screening Engine (RFB 05)', () => {
  const defaultPolicy: CompliancePolicy = {
    maxMicro: 100000000n, // $100 max for Low risk
    cappedMicro: 25000000n, // $25 cap for Medium risk
    delayMs: 3600000, // 1 hour cooling off
    staleMs: 86400000 // 24 hours stale window
  };

  const baseTime = 1700000000000;

  it('strictly BLOCKS HIGH risk counterparties', () => {
    const input: ComplianceCheckInput = {
      risk: 'HIGH',
      screeningId: 'screen-high-001',
      observedAt: baseTime,
      amountMicro: 5000000n,
      policy: defaultPolicy,
      now: baseTime + 1000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'BLOCK');
    assert.equal(res.reason, 'HIGH_SANCTIONS_RISK_BLOCKED');
    assert.ok(res.auditReference.length === 64);
    assert.ok(res.disclaimer.includes('Simulation screening only'));
  });

  it('strictly BLOCKS UNKNOWN risk counterparty screening', () => {
    const input: ComplianceCheckInput = {
      risk: 'UNKNOWN',
      screeningId: 'screen-unk-002',
      observedAt: baseTime,
      amountMicro: 1000000n,
      policy: defaultPolicy,
      now: baseTime + 1000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'BLOCK');
    assert.equal(res.reason, 'UNKNOWN_COUNTERPARTY_RISK');
    assert.ok(res.auditReference);
  });

  it('strictly BLOCKS stale screening data older than policy staleness window', () => {
    const input: ComplianceCheckInput = {
      risk: 'LOW',
      screeningId: 'screen-stale-003',
      observedAt: baseTime,
      amountMicro: 1000000n,
      policy: defaultPolicy,
      now: baseTime + defaultPolicy.staleMs + 1000 // past stale limit
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'BLOCK');
    assert.equal(res.reason, 'STALE_SCREENING_DATA');
  });

  it('returns CAPPED_DELAY for MEDIUM risk within cooling-off period', () => {
    const observed = baseTime;
    const now = observed + 1800000; // 30 minutes in (delay is 60m)
    const input: ComplianceCheckInput = {
      risk: 'MEDIUM',
      screeningId: 'screen-med-004',
      observedAt: observed,
      amountMicro: 10000000n, // $10 <= $25 cap
      policy: defaultPolicy,
      now
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'CAPPED_DELAY');
    assert.equal(res.reason, 'COOLING_OFF_PERIOD_ACTIVE');
    assert.equal(res.effectiveCapMicro, 25000000n);
    assert.equal(res.delayRemainingMs, 1800000);
  });

  it('ESCALATES MEDIUM risk if amount exceeds tier cap', () => {
    const input: ComplianceCheckInput = {
      risk: 'MEDIUM',
      screeningId: 'screen-med-005',
      observedAt: baseTime,
      amountMicro: 30000000n, // $30 > $25 cap
      policy: defaultPolicy,
      now: baseTime + defaultPolicy.delayMs + 1000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'ESCALATE');
    assert.equal(res.reason, 'MEDIUM_RISK_EXCEEDS_TIER_CAP');
    assert.equal(res.effectiveCapMicro, 25000000n);
  });

  it('ALLOWS MEDIUM risk after cooling-off delay when within tier cap', () => {
    const input: ComplianceCheckInput = {
      risk: 'MEDIUM',
      screeningId: 'screen-med-006',
      observedAt: baseTime,
      amountMicro: 20000000n, // $20 <= $25 cap
      policy: defaultPolicy,
      now: baseTime + defaultPolicy.delayMs + 5000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'ALLOW');
    assert.equal(res.reason, 'MEDIUM_RISK_CAPPED_DELAY_SATISFIED');
    assert.equal(res.effectiveCapMicro, 25000000n);
  });

  it('ESCALATES LOW risk transactions exceeding maximum policy limit', () => {
    const input: ComplianceCheckInput = {
      risk: 'LOW',
      screeningId: 'screen-low-007',
      observedAt: baseTime,
      amountMicro: 150000000n, // $150 > $100 max
      policy: defaultPolicy,
      now: baseTime + 1000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'ESCALATE');
    assert.equal(res.reason, 'EXCEEDS_MAX_POLICY_CAP');
  });

  it('ALLOWS verified LOW risk within policy bounds', () => {
    const input: ComplianceCheckInput = {
      risk: 'LOW',
      screeningId: 'screen-low-008',
      observedAt: baseTime,
      amountMicro: 50000000n, // $50 <= $100
      policy: defaultPolicy,
      now: baseTime + 1000
    };

    const res = decideRisk(input);
    assert.equal(res.action, 'ALLOW');
    assert.equal(res.reason, 'LOW_RISK_AUTHORIZED');
    assert.equal(res.effectiveCapMicro, 100000000n);
  });

  it('produces deterministic and reproducible audit references', () => {
    const input: ComplianceCheckInput = {
      risk: 'LOW',
      screeningId: 'audit-test-009',
      observedAt: baseTime,
      amountMicro: 1000000n,
      policy: defaultPolicy,
      now: baseTime + 1000
    };

    const res1 = decideRisk(input);
    const res2 = decideRisk(input);
    assert.equal(res1.auditReference, res2.auditReference);
  });
});
