import { describe, expect, it } from "vitest";
import { mintSession } from "@/lib/auth";
import { POST } from "@/app/api/agents/triggers/route";

const payer = "0x" + "11".repeat(20);
const other = "0x" + "22".repeat(20);

function trigger(overrides: Record<string, unknown> = {}) {
  return {
    kind: "CONTRACTOR_MILESTONE",
    category: "contractor",
    merchantId: "acme",
    payerAddress: payer,
    recipientAddress: other,
    amountUnits: "1000000",
    quotedCostUnits: "800000",
    quoteTimestamp: Date.now(),
    ...overrides,
  };
}

function req(body: unknown, who = payer) {
  const cookie = "mercenta_session=" + encodeURIComponent(mintSession(who, Date.now()).token);
  return new Request("https://hub.test/api/agents/triggers", {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("agent triggers are bound to the signed-in wallet", () => {
  it("refuses to act for a wallet that is not the session wallet", async () => {
    const res = await POST(req(trigger({ payerAddress: other })));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("PAYER_MISMATCH");
  });

  it("requires a session", async () => {
    const res = await POST(
      new Request("https://hub.test/api/agents/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trigger()),
      })
    );
    expect(res.status).toBe(401);
  });
});
