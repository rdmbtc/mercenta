import { describe, it, expect } from 'vitest';
import { projectYield, loanRisk } from '@/lib/liquidity-math';

describe('Explicit sandbox risk calculations', () => {
  it('uses string units, not fabricated vault addresses', () => {
    expect(projectYield(1000000000n, 540n, 365).gainUnits).toBe('54000000');
  });

  it('zero debt has no liquidation health', () => {
    expect(loanRisk(10000000n, 0n).healthFactorBps).toBe(null);
  });

  it('enforces exact 75% maximum', () => {
    expect(loanRisk(10000000n, 6930000000n).allowed).toBe(true);
  });

  it('rejects a single micro-unit beyond LTV', () => {
    expect(loanRisk(10000000n, 6930000001n).allowed).toBe(false);
  });
});
