import type { DB } from '../../db.js';

export type Line = {
  account: string;
  currency: 'USDC' | 'USD';
  direction: 'DEBIT' | 'CREDIT';
  amount: bigint;
};

export type AccountClassification = 'asset' | 'expense' | 'liability' | 'equity' | 'revenue';

export type LedgerIntent = {
  intentId: string;
  sourceDocumentRef?: string;
  expectedRecipient?: string;
  expectedClassification?: Record<string, AccountClassification>;
  allowReversal?: boolean;
  compensatingControlVerified?: boolean;
  isCompensatingOffset?: boolean;
};

/**
 * Validates posting lines against declared business intent.
 * Defends against the 6 fatal accounting errors identified in Canteen's 'Agents and Ledgers':
 * 1. Omission
 * 2. Commission (wrong recipient)
 * 3. Principle (asset vs expense misclassification)
 * 4. Original-entry / Replay (duplicate retry)
 * 5. Compensating errors
 * 6. Complete reversal
 */
export function validateIntentGate(
  db: DB,
  batchId: string,
  witness: string,
  lines: Line[],
  intent?: LedgerIntent
) {
  if (!witness || lines.length < 2) {
    throw new Error('OMISSION_REJECTED: MISSING_WITNESS_OR_LINES');
  }

  // 1. Omission: Source document reference is mandatory when intent is tracked
  if (intent && !intent.sourceDocumentRef) {
    throw new Error('OMISSION_REJECTED: MISSING_SOURCE_DOCUMENT_REF');
  }

  // 2. Original-entry / Replay: Ensure batch ID and intent ID have not been sealed
  const existingBatch = db.prepare('SELECT id FROM ledger_batches WHERE id=?').get(batchId);
  if (existingBatch) {
    throw new Error('REPLAY_ERROR: DUPLICATE_BATCH_ID');
  }

  if (intent?.intentId) {
    const existingIntent = db.prepare(
      'SELECT batch_id AS id FROM ledger_intent_keys WHERE intent_id=?'
    ).get(intent.intentId);
    if (existingIntent) {
      throw new Error('REPLAY_ERROR: DUPLICATE_INTENT_ID');
    }
  }

  // 3. Commission: Wrong recipient check
  if (intent?.expectedRecipient) {
    const matchesRecipient = lines.some(
      l => l.direction==='DEBIT' && l.account.toLowerCase() === intent.expectedRecipient!.toLowerCase()
    );
    if (!matchesRecipient) {
      throw new Error('COMMISSION_ERROR: WRONG_RECIPIENT');
    }
  }

  // 4. Principle: Account classification mismatch
  if (intent?.expectedClassification) {
    for (const [account, expectedClass] of Object.entries(intent.expectedClassification)) {
      const line = lines.find(l => l.account.toLowerCase() === account.toLowerCase());
      if (!line)throw Error('PRINCIPLE_ERROR: EXPECTED_ACCOUNT_MISSING');
      if (line) {
        // Enforce prefix conventions (e.g. expense: vs asset:)
        const lower = line.account.toLowerCase();
        if (expectedClass === 'asset' && lower.startsWith('expense:')) {
          throw new Error('PRINCIPLE_ERROR: ASSET_BOOKED_AS_EXPENSE');
        }
        if (expectedClass === 'expense' && lower.startsWith('asset:')) {
          throw new Error('PRINCIPLE_ERROR: EXPENSE_BOOKED_AS_ASSET');
        }
      }
    }
  }

  // 5. Compensating error: Undocumented balancing offsets
  if (intent?.isCompensatingOffset && !intent.compensatingControlVerified) {
    throw new Error('COMPENSATING_ERROR_REJECTED: UNVERIFIED_OFFSET');
  }

  // 6. Complete reversal: Debit/Credit inverted without explicit authorization
  if (intent && !intent.allowReversal) {
    for (const l of lines) {
      const lower = l.account.toLowerCase();
      // An operating payout should credit the funding source, not debit it
      if (lower.startsWith('arc:usdc:available') && l.direction === 'DEBIT' && lines.length === 2) {
        const other = lines.find(x => x !== l);
        if (other && (other.account.startsWith('vendor:') || other.account.startsWith('expense:')) && other.direction === 'CREDIT') {
          throw new Error('COMPLETE_REVERSAL_REJECTED: INVERTED_DEBIT_CREDIT');
        }
      }
    }
  }
}

export function postJournal(
  db: DB,
  id: string,
  witness: string,
  lines: Line[],
  intent?: LedgerIntent
) {
  // Semantic checks and uniqueness execute inside the same immediate write transaction.

  const sums = new Map<string, bigint>();
  for (const l of lines) {
    if (l.amount < 0n) throw new Error('NEGATIVE_LINE');
    sums.set(
      l.currency,
      (sums.get(l.currency) ?? 0n) +
        (l.direction === 'DEBIT' ? l.amount : -l.amount)
    );
  }
  if ([...sums.values()].some(n => n !== 0n)) {
    throw new Error('UNBALANCED_JOURNAL');
  }

  const witnessPayload = intent?.intentId ? `${witness} [intent:${intent.intentId}]` : witness;

  db.transaction(() => {
    db.exec('CREATE TABLE IF NOT EXISTS ledger_intent_keys(intent_id TEXT PRIMARY KEY,batch_id TEXT UNIQUE NOT NULL REFERENCES ledger_batches(id))');
    validateIntentGate(db,id,witness,lines,intent);
    db.prepare('INSERT INTO ledger_batches(id,witness,created_at) VALUES(?,?,?)').run(
      id,
      witnessPayload,
      Date.now()
    );
    const insert = db.prepare(
      'INSERT INTO ledger_entries(batch_id,account,currency,direction,amount_units) VALUES(?,?,?,?,?)'
    );
    for (const l of lines) {
      insert.run(id, l.account, l.currency, l.direction, l.amount.toString());
    }
    if(intent?.intentId)db.prepare('INSERT INTO ledger_intent_keys VALUES(?,?)').run(intent.intentId,id);
    db.prepare('UPDATE ledger_batches SET sealed=1 WHERE id=?').run(id);
  }).immediate();
}

export function balance(db: DB, account: string, currency: 'USDC' | 'USD' = 'USDC'): bigint {
  const row = db
    .prepare(
      "SELECT COALESCE(signed_micro_sum(CASE WHEN e.direction='DEBIT' THEN e.amount_units ELSE '-'||e.amount_units END),'0') amount FROM ledger_entries e JOIN ledger_batches b ON b.id=e.batch_id WHERE e.account=? AND e.currency=? AND b.sealed=1"
    )
    .get(account, currency) as { amount: string };
  return BigInt(row.amount);
}

export function transfer(
  db: DB,
  id: string,
  witness: string,
  from: string,
  to: string,
  amount: bigint,
  currency: 'USDC' | 'USD' = 'USDC',
  intent?: LedgerIntent
) {
  postJournal(
    db,
    id,
    witness,
    [
      { account: from, currency, direction: 'CREDIT', amount },
      { account: to, currency, direction: 'DEBIT', amount }
    ],
    intent
  );
}
