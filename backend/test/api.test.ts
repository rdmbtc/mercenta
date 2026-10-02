import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { buildServer } from "../src/server.js";
import { loadConfig } from "../src/config.js";
const c = loadConfig({
  NODE_ENV: "test",
  DATABASE_PATH: ":memory:",
  BACKEND_PROXY_SECRET: "x".repeat(64),
});
function headers(
  method: string,
  url: string,
  body: unknown,
  a = "session:test",
) {
  const ts = String(Date.now());
  return {
    "x-mercenta-actor": a,
    "x-mercenta-timestamp": ts,
    "x-mercenta-signature": createHmac("sha256", c.BACKEND_PROXY_SECRET)
      .update(
        `${ts}\n${method}\n${url}\n${a}\n${body ? JSON.stringify(body) : ""}`,
      )
      .digest("hex"),
  };
}
test("HTTP gate: health public, treasury auth, spoofed identity rejected", async () => {
  const app = await buildServer(c);
  try {
    assert.equal((await app.inject("/api/health")).statusCode, 200);
    assert.equal((await app.inject("/api/liquidity/summary")).statusCode, 401);
    const r = await app.inject({
      method: "GET",
      url: "/api/liquidity/summary",
      headers: headers("GET", "/api/liquidity/summary", null),
    });
    assert.equal(r.statusCode, 200);
    assert.equal(r.json().mode, "sandbox");
    assert.equal(r.json().realBalance, null);
  } finally {
    await app.close();
  }
});
test("HTTP sandbox idempotency, unsafe borrowing, hosted wallet gate", async () => {
  const app = await buildServer(c);
  try {
    const body = { requestId: randomUUID(), amount: "1000", mode: "sandbox" },
      url = "/api/liquidity/earn/deposit";
    const a = await app.inject({
      method: "POST",
      url,
      headers: headers("POST", url, body),
      payload: body,
    });
    const b = await app.inject({
      method: "POST",
      url,
      headers: headers("POST", url, body),
      payload: body,
    });
    assert.equal(a.statusCode, 200);
    assert.deepEqual(a.json(), b.json());
    const unsafe = {
        requestId: randomUUID(),
        amount: "7000",
        collateral: "0.10",
        mode: "sandbox",
      },
      u = "/api/liquidity/borrow/originate";
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: u,
          headers: headers("POST", u, unsafe),
          payload: unsafe,
        })
      ).json().code,
      "LOAN_OVER_LTV",
    );
    const on = { mode: "hosted", destinationAddress: "0x" + "1".repeat(40) },
      o = "/api/liquidity/onramp/session";
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: o,
          headers: headers("POST", o, on),
          payload: on,
        })
      ).statusCode,
      401,
    );
  } finally {
    await app.close();
  }
});
test('legacy helper retired; no customer event credits ledger',async()=>{const app=await buildServer(c);try{const u='/api/agent/chat',b={requestId:randomUUID(),message:'USDC'};assert.equal((await app.inject({method:'POST',url:u,headers:headers('POST',u,b),payload:b})).statusCode,410);assert.equal((await app.inject({method:'POST',url:u,payload:b})).statusCode,401);assert.equal((await app.inject({method:'POST',url:'/api/liquidity/onramp/onDepositSettled',payload:{amount:'1000'}})).json().accepted,false);}finally{await app.close()}});
