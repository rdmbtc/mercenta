import { beforeEach, describe, expect, it, vi } from "vitest";

// The backend is unreachable; the local nonce/verify fallback is what is under test.
vi.mock("@/lib/backend-proxy", () => ({
  proxyBackend: vi.fn(async () => new Response(JSON.stringify({ code: "BACKEND_UNAVAILABLE" }), { status: 503 })),
}));
import { privateKeyToAccount } from "viem/accounts";
import { buildAuthMessage } from "@/lib/auth";
import { POST as noncePost } from "@/app/api/auth/nonce/route";
import { POST as verifyPost } from "@/app/api/auth/verify/route";

const ORIGIN = "https://hub.test";
const account = privateKeyToAccount("0x" + "11".repeat(32));

function req(path: string, body: unknown) {
  return new Request(ORIGIN + "/api/auth/" + path, {
    method: "POST",
    headers: { origin: ORIGIN, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function verifyBody(nonce: string, signature: string, issuedAt: number) {
  return { address: account.address, nonce, signature, issuedAt };
}

describe("sign-in signatures are single use", () => {

  it("mints one session per nonce and refuses a replay", async () => {
    const nonceRes = await noncePost(req("nonce", { address: account.address }));
    expect(nonceRes.status).toBe(200);
    const { nonce } = (await nonceRes.json()) as { nonce: string };
    expect(nonce).toMatch(/^[a-f0-9]{32}$/);

    const issuedAt = Date.now();
    const signature = await account.signMessage({ message: buildAuthMessage(account.address, nonce, issuedAt) });

    const first = await verifyPost(req("verify", verifyBody(nonce, signature, issuedAt)));
    expect(first.status).toBe(200);
    expect(first.cookies.get("mercenta_session")?.value).toBeTruthy();

    const replay = await verifyPost(req("verify", verifyBody(nonce, signature, issuedAt)));
    expect(replay.status).toBe(502);
    expect(await replay.json()).toEqual({ error: "invalid_backend_proof" });
  });

  it("refuses a signature over a nonce the server never issued", async () => {
    const nonce = "ab".repeat(16);
    const issuedAt = Date.now();
    const signature = await account.signMessage({ message: buildAuthMessage(account.address, nonce, issuedAt) });
    const res = await verifyPost(req("verify", verifyBody(nonce, signature, issuedAt)));
    expect(res.status).toBe(502);
  });
});
