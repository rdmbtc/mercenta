import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb, resetDb } from "@/lib/db";
import { mintSession } from "@/lib/auth";
import { GET } from "@/app/api/telegram/admin/orders/route";

const ADMIN = "0x" + "aa".repeat(20);
const OTHER = "0x" + "bb".repeat(20);

function request(wallet?: string, query = "") {
  const headers: Record<string, string> = {};
  if (wallet) headers.cookie = `mercenta_session=${encodeURIComponent(mintSession(wallet, Date.now()).token)}`;
  return new Request(`https://app.test/api/telegram/admin/orders${query}`, { headers });
}

describe("Telegram admin orders HTTP authorization", () => {
  beforeEach(() => {
    resetDb();
    vi.unstubAllEnvs();
  });

  it("refuses anonymous requests before reading store data", async () => {
    const res = await GET(request());
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses authenticated wallets that are not admins", async () => {
    vi.stubEnv("TELEGRAM_ADMIN_WALLETS", ADMIN);
    const res = await GET(request(OTHER));
    expect(res.status).toBe(403);
  });

  it("fails closed when the admin allowlist is absent", async () => {
    const res = await GET(request(ADMIN));
    expect(res.status).toBe(403);
  });

  it("allows an explicitly configured wallet and bounds pagination", async () => {
    vi.stubEnv("TELEGRAM_ADMIN_WALLETS", `not-a-wallet, ${ADMIN.toUpperCase()}`);
    const db = getDb();
    const now = Date.now();
    db.prepare(
      "INSERT INTO orders (id, product_id, customer_wallet, sale_amount_usdc_units, status, delivery_status, expires_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run("admin-order", "p1", OTHER, 1000, "FULFILLED", "NONE", now + 1000, now, now);

    const res = await GET(request(ADMIN, "?limit=999&offset=-10"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const data = await res.json();
    expect(data.pagination).toEqual({ limit: 50, offset: 0, total: 1 });
    expect(data.orders[0].id).toBe("admin-order");
  });
});
