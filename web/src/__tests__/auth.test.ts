import { describe, it, expect, beforeEach } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { verifyMessage } from "viem";
import {
  issueNonce,
  buildAuthMessage,
  consumeNonce,
  mintSession,
  verifySession,
  requireSession,
} from "@/lib/auth";
import { getDb, resetDb } from "@/lib/db";

const NOW = 1_700_000_000_000;

describe("auth", () => {
  beforeEach(() => resetDb());

  it("issues nonce and consumes it exactly once (replay blocked)", () => {
    const db = getDb();
    const { nonce } = issueNonce(db, NOW);
    expect(consumeNonce(db, nonce, "0xAaAa".padEnd(42, "a"), NOW)).toBe(true);
    expect(consumeNonce(db, nonce, "0xAaAa".padEnd(42, "a"), NOW)).toBe(false);
  });

  it("rejects expired nonce", () => {
    const db = getDb();
    const { nonce } = issueNonce(db, NOW);
    expect(consumeNonce(db, nonce, "0x" + "bb".repeat(20), NOW + 11 * 60_000)).toBe(false);
  });

  it("rejects unknown nonce", () => {
    expect(consumeNonce(getDb(), "deadbeefdeadbeef", "0x" + "cc".repeat(20), NOW)).toBe(false);
  });

  it("end-to-end: signed message verifies, wrong signer rejected", async () => {
    const db = getDb();
    const account = privateKeyToAccount(
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    );
    const address = account.address;
    const { nonce } = issueNonce(db, NOW);
    const message = buildAuthMessage(address, nonce, NOW);
    const signature = await account.signMessage({ message });

    // attacker cannot reuse the nonce after legit consume; consume first
    expect(consumeNonce(db, nonce, address, NOW)).toBe(true);
    expect(await verifyMessage({ address, message, signature })).toBe(true);
    expect(
      await verifyMessage({
        address: ("0x" + "12".repeat(20)) as `0x${string}`,
        message,
        signature,
      }),
    ).toBe(false);

    const { token } = mintSession(address, NOW);
    const claims = verifySession(token, NOW + 1000);
    expect(claims?.address).toBe(address.toLowerCase());
    expect(claims?.exp).toBe(NOW + 24 * 3600_000);

    const req = new Request("https://hub.test/", {
      headers: { cookie: `mercenta_session=${encodeURIComponent(token)}` },
    });
    expect(requireSession(req, NOW + 2000)?.address).toBe(address.toLowerCase());
    // expired
    expect(requireSession(req, NOW + 25 * 3600_000)).toBeNull();
    // tampered
    const tampered = token.slice(0, -2) + "xx";
    expect(
      requireSession(
        new Request("https://hub.test/", {
          headers: { cookie: `mercenta_session=${encodeURIComponent(tampered)}` },
        }),
        NOW + 1000,
      ),
    ).toBeNull();
  });
});
