import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb } from '../src/db.js';
import {
  postJournal,
  balance,
  transfer,
  type Line,
  type LedgerIntent
} from '../src/services/ledger/index.js';

function createLedgerFixture() {
  const tmpFile = path.join(os.tmpdir(), `mercenta-ledger-errors-${randomUUID()}.db`);
  const db = openDb(tmpFile);

  // Initial funding
  transfer(
    db,
    'seed-equity',
    'verified-capital-witness',
    'equity:usdc',
    'arc:usdc:available',
    1000000000n // 1000 USDC
  );

  const cleanup = () => {
    try {
      db.close();
      for (const ext of ['', '-wal', '-shm']) {
        const p = tmpFile + ext;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch {}
  };

  const getJournalCount = () =>
    (db.prepare('SELECT count(*) as count FROM ledger_batches').get() as { count: number }).count;

  return { db, tmpFile, cleanup, getJournalCount };
}

describe('AGENT-01: Financial Ledger Integrity - Prevention of 6 Semantic Accounting Errors', () => {
  it('Scenario 1: Omission - Missing witness or missing source document reference is rejected', () => {
    const f = createLedgerFixture();
    try {
      const initialCount = f.getJournalCount();
      const initialBal = balance(f.db, 'arc:usdc:available');

      // 1. Error: empty witness
      assert.throws(
        () =>
          postJournal(f.db, 'omission-1', '', [
            { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 5000000n },
            { account: 'vendor:cloud', currency: 'USDC', direction: 'DEBIT', amount: 5000000n }
          ]),
        /OMISSION_REJECTED/
      );

      // 2. Error: missing source document ref when intent is specified
      assert.throws(
        () =>
          postJournal(
            f.db,
            'omission-2',
            'valid-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 5000000n },
              { account: 'vendor:cloud', currency: 'USDC', direction: 'DEBIT', amount: 5000000n }
            ],
            { intentId: 'intent-omission' }
          ),
        /MISSING_SOURCE_DOCUMENT_REF/
      );

      // State unchanged
      assert.equal(f.getJournalCount(), initialCount);
      assert.equal(balance(f.db, 'arc:usdc:available'), initialBal);

      // Control: Valid posting with witness & document ref succeeds
      postJournal(
        f.db,
        'control-omission',
        'valid-witness',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 5000000n },
          { account: 'vendor:cloud', currency: 'USDC', direction: 'DEBIT', amount: 5000000n }
        ],
        { intentId: 'intent-omission-valid', sourceDocumentRef: 'doc:inv-101' }
      );
      assert.equal(f.getJournalCount(), initialCount + 1);
    } finally {
      f.cleanup();
    }
  });

  it('Scenario 2: Commission - Right amount but wrong vendor recipient is rejected', () => {
    const f = createLedgerFixture();
    try {
      const initialCount = f.getJournalCount();
      const initialBal = balance(f.db, 'arc:usdc:available');

      const intent: LedgerIntent = {
        intentId: 'intent-comm-1',
        sourceDocumentRef: 'doc:po-402',
        expectedRecipient: 'vendor:legitimate-cloud'
      };

      // Error: Posting credits available cash and debits attacker vendor instead of expected recipient
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-comm-err',
            'signed-invoice-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 10000000n },
              { account: 'vendor:imposter-cloud', currency: 'USDC', direction: 'DEBIT', amount: 10000000n }
            ],
            intent
          ),
        /COMMISSION_ERROR: WRONG_RECIPIENT/
      );

      // Balance & journal count unchanged
      assert.equal(f.getJournalCount(), initialCount);
      assert.equal(balance(f.db, 'arc:usdc:available'), initialBal);

      // Control: Correct recipient passes
      postJournal(
        f.db,
        'batch-comm-valid',
        'signed-invoice-witness',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 10000000n },
          { account: 'vendor:legitimate-cloud', currency: 'USDC', direction: 'DEBIT', amount: 10000000n }
        ],
        intent
      );
      assert.equal(f.getJournalCount(), initialCount + 1);
    } finally {
      f.cleanup();
    }
  });

  it('Scenario 3: Principle - Asset misbooked as expense is rejected', () => {
    const f = createLedgerFixture();
    try {
      const initialCount = f.getJournalCount();
      const initialBal = balance(f.db, 'arc:usdc:available');

      // Intent: Purchasing GPU hardware/capacity asset
      const intent: LedgerIntent = {
        intentId: 'intent-principle-1',
        sourceDocumentRef: 'doc:gpu-reserve-1',
        expectedClassification: {
          'expense:operating': 'asset'
        }
      };

      // Error: booking asset as expense
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-principle-err',
            'procurement-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 20000000n },
              { account: 'expense:operating', currency: 'USDC', direction: 'DEBIT', amount: 20000000n }
            ],
            intent
          ),
        /PRINCIPLE_ERROR: ASSET_BOOKED_AS_EXPENSE/
      );

      assert.equal(f.getJournalCount(), initialCount);
      assert.equal(balance(f.db, 'arc:usdc:available'), initialBal);

      // Control: Correctly booked asset
      postJournal(
        f.db,
        'batch-principle-valid',
        'procurement-witness',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 20000000n },
          { account: 'asset:gpu-capacity', currency: 'USDC', direction: 'DEBIT', amount: 20000000n }
        ],
        {
          intentId: 'intent-principle-valid',
          sourceDocumentRef: 'doc:gpu-reserve-1',
          expectedClassification: { 'asset:gpu-capacity': 'asset' }
        }
      );
      assert.equal(f.getJournalCount(), initialCount + 1);
    } finally {
      f.cleanup();
    }
  });

  it('Scenario 4: Original-entry / Replay - Duplicate payment retry never creates a second debit', () => {
    const f = createLedgerFixture();
    try {
      const initialBal = balance(f.db, 'arc:usdc:available');

      const intent: LedgerIntent = {
        intentId: 'intent-replay-target-42',
        sourceDocumentRef: 'doc:tx-789'
      };

      // First valid payment
      postJournal(
        f.db,
        'batch-original-entry',
        'network-payment-witness',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 15000000n },
          { account: 'vendor:streaming', currency: 'USDC', direction: 'DEBIT', amount: 15000000n }
        ],
        intent
      );

      const balAfterFirst = balance(f.db, 'arc:usdc:available');
      assert.equal(balAfterFirst, initialBal - 15000000n);

      // Retry: Network glitch re-sends same batch ID
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-original-entry',
            'network-payment-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 15000000n },
              { account: 'vendor:streaming', currency: 'USDC', direction: 'DEBIT', amount: 15000000n }
            ],
            intent
          ),
        /REPLAY_ERROR: DUPLICATE_BATCH_ID/
      );

      // Retry: New batch ID but SAME intent ID
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-original-entry-new-id',
            'network-payment-witness-retry',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 15000000n },
              { account: 'vendor:streaming', currency: 'USDC', direction: 'DEBIT', amount: 15000000n }
            ],
            intent
          ),
        /REPLAY_ERROR: DUPLICATE_INTENT_ID/
      );

      // Critical: Available cash was NOT debited a second time
      assert.equal(balance(f.db, 'arc:usdc:available'), balAfterFirst);
    } finally {
      f.cleanup();
    }
  });

  it('Scenario 5: Compensating Error - Unverified cancelling errors are rejected', () => {
    const f = createLedgerFixture();
    try {
      const initialCount = f.getJournalCount();
      const initialBal = balance(f.db, 'arc:usdc:available');

      // Compensating offset without independent verification
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-comp-err',
            'compensating-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 5000000n },
              { account: 'vendor:misc', currency: 'USDC', direction: 'DEBIT', amount: 5000000n }
            ],
            {
              intentId: 'intent-comp-err',
              sourceDocumentRef: 'doc:audit-adj-1',
              isCompensatingOffset: true,
              compensatingControlVerified: false
            }
          ),
        /COMPENSATING_ERROR_REJECTED/
      );

      assert.equal(f.getJournalCount(), initialCount);
      assert.equal(balance(f.db, 'arc:usdc:available'), initialBal);

      // Control: Verified compensating control succeeds
      postJournal(
        f.db,
        'batch-comp-valid',
        'compensating-witness-verified',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'CREDIT', amount: 5000000n },
          { account: 'vendor:misc', currency: 'USDC', direction: 'DEBIT', amount: 5000000n }
        ],
        {
          intentId: 'intent-comp-valid',
          sourceDocumentRef: 'doc:audit-adj-1',
          isCompensatingOffset: true,
          compensatingControlVerified: true
        }
      );
      assert.equal(f.getJournalCount(), initialCount + 1);
    } finally {
      f.cleanup();
    }
  });

  it('Scenario 6: Complete Reversal - Balanced debit/credit inversion is rejected', () => {
    const f = createLedgerFixture();
    try {
      const initialCount = f.getJournalCount();
      const initialBal = balance(f.db, 'arc:usdc:available');

      // Error: Inverted payout (debiting available cash and crediting vendor)
      assert.throws(
        () =>
          postJournal(
            f.db,
            'batch-reversal-err',
            'inverted-witness',
            [
              { account: 'arc:usdc:available', currency: 'USDC', direction: 'DEBIT', amount: 8000000n },
              { account: 'vendor:gaming', currency: 'USDC', direction: 'CREDIT', amount: 8000000n }
            ],
            {
              intentId: 'intent-reversal-err',
              sourceDocumentRef: 'doc:payout-rev-1',
              allowReversal: false
            }
          ),
        /COMPLETE_REVERSAL_REJECTED/
      );

      assert.equal(f.getJournalCount(), initialCount);
      assert.equal(balance(f.db, 'arc:usdc:available'), initialBal);

      // Control: Explicitly authorized reversal or normal flow succeeds
      postJournal(
        f.db,
        'batch-reversal-valid',
        'authorized-reversal-witness',
        [
          { account: 'arc:usdc:available', currency: 'USDC', direction: 'DEBIT', amount: 8000000n },
          { account: 'vendor:gaming', currency: 'USDC', direction: 'CREDIT', amount: 8000000n }
        ],
        {
          intentId: 'intent-reversal-valid',
          sourceDocumentRef: 'doc:court-order-1',
          allowReversal: true
        }
      );
      assert.equal(f.getJournalCount(), initialCount + 1);
    } finally {
      f.cleanup();
    }
  });
});
