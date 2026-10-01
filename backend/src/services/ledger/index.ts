import type { DB } from "../../db.js";
export type Line = {
  account: string;
  currency: "USDC" | "USD";
  direction: "DEBIT" | "CREDIT";
  amount: bigint;
};
export function postJournal(
  db: DB,
  id: string,
  witness: string,
  lines: Line[],
) {
  if (!witness || lines.length < 2) throw new Error("WITNESS_REQUIRED");
  const sums = new Map<string, bigint>();
  for (const l of lines) {
    if (l.amount < 0n) throw new Error("NEGATIVE_LINE");
    sums.set(
      l.currency,
      (sums.get(l.currency) ?? 0n) +
        (l.direction === "DEBIT" ? l.amount : -l.amount),
    );
  }
  if ([...sums.values()].some((n) => n !== 0n))
    throw new Error("UNBALANCED_JOURNAL");
  db.transaction(() => {
    db.prepare(
      "INSERT INTO ledger_batches(id,witness,created_at) VALUES(?,?,?)",
    ).run(id, witness, Date.now());
    const insert = db.prepare(
      "INSERT INTO ledger_entries(batch_id,account,currency,direction,amount_units) VALUES(?,?,?,?,?)",
    );
    for (const l of lines)
      insert.run(id, l.account, l.currency, l.direction, l.amount.toString());
    db.prepare("UPDATE ledger_batches SET sealed=1 WHERE id=?").run(id);
  })();
}
export function balance(
  db: DB,
  account: string,
  currency: "USDC" | "USD" = "USDC",
): bigint {
  const rows = db
    .prepare(
      "SELECT e.amount_units,e.direction FROM ledger_entries e JOIN ledger_batches b ON b.id=e.batch_id WHERE e.account=? AND e.currency=? AND b.sealed=1",
    )
    .all(account, currency) as { amount_units: string; direction: string }[];
  return rows.reduce(
    (a, r) => a + (r.direction === "DEBIT" ? 1n : -1n) * BigInt(r.amount_units),
    0n,
  );
}
export function transfer(
  db: DB,
  id: string,
  witness: string,
  from: string,
  to: string,
  amount: bigint,
  currency: "USDC" | "USD" = "USDC",
) {
  postJournal(db, id, witness, [
    { account: from, currency, direction: "CREDIT", amount },
    { account: to, currency, direction: "DEBIT", amount },
  ]);
}
