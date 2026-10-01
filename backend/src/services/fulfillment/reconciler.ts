import type { DB } from "../../db.js";
import type { Orders } from "../orders.js";
import type { SupplyNode } from "./index.js";
export function startReconciler(db: DB, orders: Orders, node: SupplyNode) {
  orders.recover();
  let running = false;
  const tick = async () => {
    if (running || !node.ready) return;
    running = true;
    try {
      const rows = db
        .prepare(
          "SELECT order_id,attempts FROM reconciliations WHERE next_at<=? AND lease_until<? LIMIT 20",
        )
        .all(Date.now(), Date.now()) as {
        order_id: string;
        attempts: number;
      }[];
      for (const r of rows) {
        const lease = db
          .prepare(
            "UPDATE reconciliations SET lease_until=? WHERE order_id=? AND lease_until<?",
          )
          .run(Date.now() + 60000, r.order_id, Date.now());
        if (lease.changes !== 1) continue;
        const o = orders.get(r.order_id);
        if (o?.request_ref)
          orders.applySupply(o.id, await node.lookup(o.request_ref));
        db.prepare(
          "UPDATE reconciliations SET attempts=attempts+1,next_at=?,lease_until=0 WHERE order_id=?",
        ).run(
          Date.now() + Math.min(3600000, 15000 * 2 ** Math.min(r.attempts, 8)),
          r.order_id,
        );
      }
    } finally {
      running = false;
    }
  };
  const t = setInterval(
    () =>
      void tick().catch(() => {
        running = false;
      }),
    15000,
  );
  t.unref();
  return () => clearInterval(t);
}
