import { requireSession, type SessionClaims } from "@/lib/auth";

const ADDRESS = /^0x[a-f0-9]{40}$/;

function configuredAdminWallets(): Set<string> {
  const raw = process.env.TELEGRAM_ADMIN_WALLETS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter((value) => ADDRESS.test(value)),
  );
}

export type AdminAuthResult =
  | { status: 401; claims: null }
  | { status: 403; claims: SessionClaims }
  | { status: 200; claims: SessionClaims };

export function requireTelegramAdminWallet(req: Request, nowMs = Date.now()): AdminAuthResult {
  const claims = requireSession(req, nowMs);
  if (!claims) return { status: 401, claims: null };

  const wallet = claims.address.toLowerCase();
  if (!ADDRESS.test(wallet) || !configuredAdminWallets().has(wallet)) {
    return { status: 403, claims };
  }

  return { status: 200, claims };
}
