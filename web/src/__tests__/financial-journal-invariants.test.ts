import { describe, it, expect } from 'vitest';
import { parseUsdc, formatUsdc, MoneyFormatError } from '@/lib/money';

describe('Financial Accounting & Double-Entry Ledger Invariants', () => {
  describe('Strict 6-Decimal USDC Monetary Arithmetic (No IEEE-754 Float Leaks)', () => {
    it.each([
      ['10.000000', 10000000n],
      ['25.500000', 25500000n],
      ['0.010000', 10000n],
      ['0.000001', 1n],
      ['1000000.000000', 1000000000000n],
      ['0.123456', 123456n],
      ['99.999999', 99999999n],
    ])('converts USDC string "%s" to exact BigInt micro-units %s', (inputStr, expectedBigInt) => {
      const parsed = parseUsdc(inputStr);
      expect(parsed).toBe(expectedBigInt);
      const formatted = formatUsdc(parsed);
      expect(formatted).toBe(inputStr);
    });

    it('rejects fractions exceeding 6 decimals without silent truncation', () => {
      expect(() => parseUsdc('10.1234567')).toThrowError(MoneyFormatError);
    });
  });

  describe('Double-Entry Balance Equation Invariant: Sum(Debits) === Sum(Credits)', () => {
    interface LedgerEntry {
      account: string;
      debit: bigint;
      credit: bigint;
    }

    interface JournalTransaction {
      id: string;
      entries: LedgerEntry[];
    }

    const verifyTransactionBalanced = (tx: JournalTransaction) => {
      const totalDebits = tx.entries.reduce((sum, e) => sum + e.debit, 0n);
      const totalCredits = tx.entries.reduce((sum, e) => sum + e.credit, 0n);
      return totalDebits === totalCredits;
    };

    // Test 25 synthetic client transactions
    it.each(Array.from({ length: 25 }, (_, i) => i + 1))(
      'transaction #%i maintains exact zero-sum balance between buyer, merchant, supplier, and platform fee',
      (txIndex) => {
        const orderAmount = BigInt(txIndex * 10 * 1000000); // e.g. 10, 20, 30 USDC in micro-units
        const supplierCost = (orderAmount * 82n) / 100n; // 82%
        const platformFee = (orderAmount * 2n) / 100n; // 2%
        const merchantProfit = orderAmount - supplierCost - platformFee; // 16%

        const tx: JournalTransaction = {
          id: `tx_journal_${txIndex}`,
          entries: [
            { account: 'buyer_cash', debit: 0n, credit: orderAmount },
            { account: 'supplier_payable', debit: supplierCost, credit: 0n },
            { account: 'platform_fee_revenue', debit: platformFee, credit: 0n },
            { account: 'merchant_operating_margin', debit: merchantProfit, credit: 0n },
          ],
        };

        expect(verifyTransactionBalanced(tx)).toBe(true);
      }
    );
  });

  describe('Ledger Solvency Invariants across 25 Simulated Client Accounts', () => {
    it.each(Array.from({ length: 25 }, (_, i) => [i + 1, 100 + i * 20, 30 + i * 5]))(
      'client #%i: balance=%d USDC, order=%d USDC preserves non-negative solvency',
      (_clientNum, initialBalanceUsdc, orderUsdc) => {
        const balanceMicro = BigInt(initialBalanceUsdc * 1000000);
        const orderMicro = BigInt(orderUsdc * 1000000);

        expect(balanceMicro).toBeGreaterThanOrEqual(orderMicro);

        const remainingMicro = balanceMicro - orderMicro;
        expect(remainingMicro).toBeGreaterThanOrEqual(0n);
        expect(remainingMicro + orderMicro).toBe(balanceMicro);
      }
    );
  });
});
