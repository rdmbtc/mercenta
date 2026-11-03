import { describe, it, expect } from 'vitest';
import { POST } from '../app/api/treasury/sweep/route';

describe('Treasury Sweeper Invariant Tests (/api/treasury/sweep)', () => {
  describe('Operating Reserve Floor Invariants', () => {
    it.each([
      [100, 50, 50],
      [250, 100, 150],
      [1000, 250, 750],
      [5000, 1000, 4000],
      [10000, 2500, 7500],
      [50000, 10000, 40000],
    ])(
      'guarantees remaining balance is exactly the reserve floor: balance=%d, floor=%d, expectedSweep=%d',
      async (balance, floor, expectedSweep) => {
        const req = new Request('http://localhost/api/treasury/sweep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentBalance: balance, reserveFloor: floor, executeLive: false }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.amountSweptUsdc).toBe(expectedSweep);
        expect(data.newOperatingBalanceUsdc).toBe(floor);
        expect(data.amountSweptUsdc + data.newOperatingBalanceUsdc).toBe(balance);
      }
    );

    it.each([
      [50, 50],
      [40, 50],
      [0, 100],
      [99.99, 100.0],
      [0.05, 500],
    ])(
      'strictly rejects sweep when balance <= reserve floor: balance=%d, floor=%d',
      async (balance, floor) => {
        const req = new Request('http://localhost/api/treasury/sweep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentBalance: balance, reserveFloor: floor }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.sweepableAmount).toBe(0);
        expect(data.message).toContain('does not exceed reserve floor');
      }
    );
  });

  describe('Simulation vs Live Execution Modes', () => {
    it('simulation mode outputs simulated transaction hash and mode SIMULATION', async () => {
      const req = new Request('http://localhost/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: 200, reserveFloor: 50, executeLive: false }),
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.mode).toBe('SIMULATION');
      expect(data.txHash).toMatch(/^0xsim_/);
    });

    it('live execution mode outputs real 32-byte EVM hash and mode LIVE_EXECUTION', async () => {
      const req = new Request('http://localhost/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: 500, reserveFloor: 100, executeLive: true }),
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.mode).toBe('LIVE_EXECUTION');
      expect(data.txHash).toMatch(/^0x[0-9a-f]{64}$/i);
      expect(data.arcscanUrl).toBe(`https://arcscan.app/tx/${data.txHash}`);
    });
  });

  describe('Morpho Blue Vault Contract Validation', () => {
    it('verifies vault targets the official Morpho Galaxy USDC Vault', async () => {
      const req = new Request('http://localhost/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: 1000, reserveFloor: 200 }),
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.targetVault.chain).toBe('Arc Mainnet (5042)');
      expect(data.targetVault.vaultAddress).toBe('0x32A44B04C8567dB1a613271167E1402CeF5E8c1b');
      expect(data.targetVault.netApyPercent).toBe('8.4%');
    });

    it('records policyCheck metadata in sweep receipt', async () => {
      const req = new Request('http://localhost/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: 300, reserveFloor: 100, autoSweepEnabled: true }),
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.policyCheck.reserveFloorPreserved).toBe(true);
      expect(data.policyCheck.autoSweepPolicyActive).toBe(true);
      expect(data.policyCheck.guardrailRule).toBeTruthy();
    });
  });

  describe('Micro-Unit Precision & Fractional Amounts', () => {
    it.each([
      [100.555, 50.222, 50.333],
      [10.99, 10.01, 0.98],
      [1000.123456, 500.123456, 500.0],
      [25.000001, 25.0, 0.000001],
    ])('computes floating fractions with exact precision: balance=%d, floor=%d', async (bal, fl, expected) => {
      const req = new Request('http://localhost/api/treasury/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentBalance: bal, reserveFloor: fl }),
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.amountSweptUsdc).toBeCloseTo(expected, 4);
    });
  });

  describe('Multi-Client Sweep Scaling (Simulating 20 Merchants)', () => {
    it('processes 20 independent merchant sweep calculations simultaneously without state pollution', async () => {
      const merchants = Array.from({ length: 20 }, (_, idx) => ({
        id: `merchant_${idx + 1}`,
        balance: 100 + idx * 50,
        floor: 50,
      }));

      const results = await Promise.all(
        merchants.map((m) =>
          POST(
            new Request('http://localhost/api/treasury/sweep', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentBalance: m.balance,
                reserveFloor: m.floor,
                executeLive: true,
              }),
            })
          ).then((r) => r.json())
        )
      );

      expect(results.length).toBe(20);
      results.forEach((r, idx) => {
        const m = merchants[idx];
        expect(r.success).toBe(true);
        expect(r.amountSweptUsdc).toBe(m.balance - m.floor);
        expect(r.newOperatingBalanceUsdc).toBe(m.floor);
        expect(r.targetVault.vaultAddress).toBe('0x32A44B04C8567dB1a613271167E1402CeF5E8c1b');
      });
    });
  });

  describe('Yield Compounding Math Verifications', () => {
    const calcYearlyCompounded = (principal: number, apyPercent: number, days: number) => {
      const rate = apyPercent / 100;
      return principal * Math.pow(1 + rate / 365, days) - principal;
    };

    it.each([
      [1000, 8.4, 30],
      [5000, 8.4, 90],
      [10000, 8.4, 180],
      [50000, 8.4, 365],
    ])('computes projected yield for %d USDC at %d%% APY for %d days', (principal, apy, days) => {
      const yieldEarned = calcYearlyCompounded(principal, apy, days);
      expect(yieldEarned).toBeGreaterThan(0);
      if (days === 365) {
        // Annual return should slightly exceed linear rate due to daily compounding
        expect(yieldEarned).toBeGreaterThanOrEqual(principal * (apy / 100));
      }
    });
  });
});
