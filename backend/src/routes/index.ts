import {modelAvailability} from '../services/llm-providers.js';
import {publicProcurementHealth} from '../services/procurement-health.js';
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Config } from "../config.js";
import type { DB } from "../db.js";
import { parseMoney } from "../money.js";
import {
  categories,
  publicProducts,
  type Product,
} from "../services/catalog.js";
import { quota, advise } from "../services/agent/index.js";
import {
  projectYield,
  loanRisk,
  SANDBOX_MARKET,
} from "../services/app-kit/math.js";
import { treasury, mutateSandbox } from "../services/app-kit/sandbox.js";
import {
  discoverVaults,
  mintOnrampSession,
} from "../services/app-kit/index.js";
import { verifyArc, arcClient } from "../services/arc/index.js";
import type { Orders } from "../services/orders.js";
import type { Address, Hash } from "viem";
const amount = z
    .string()
    .regex(/^(0|[1-9]\d*)(\.\d{1,6})?$/)
    .max(30),
  id = z.string().uuid();
const actionBody = z.object({
  requestId: id,
  amount,
  mode: z.literal("sandbox"),
});
export function actor(req: FastifyRequest, c: Config) {
  const a = req.headers["x-mercenta-actor"],
    ts = req.headers["x-mercenta-timestamp"],
    sig = req.headers["x-mercenta-signature"];
  if (
    typeof a !== "string" ||
    typeof ts !== "string" ||
    typeof sig !== "string" ||
    !/^\d{13}$/.test(ts) ||
    a.length > 100 ||
    Math.abs(Date.now() - Number(ts)) > 30000
  )
    throw new Error("UNAUTHORIZED");
  const body = req.body ? JSON.stringify(req.body) : "";
  const expected = createHmac("sha256", c.BACKEND_PROXY_SECRET)
    .update(`${ts}\n${req.method}\n${req.url}\n${a}\n${body}`)
    .digest("hex");
  const left = Buffer.from(sig),
    right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    throw new Error("UNAUTHORIZED");
  return a;
}
export function registerRoutes(
  app: FastifyInstance,
  db: DB,
  c: Config,
  products: Product[],
  orders: Orders,
) {
  app.get("/api/health", () => ({
    ok: db.prepare("SELECT 1").get() !== undefined,
    service: "mercenta-backend",
    chainId: 5042002,
  }));
  app.get("/api/status", () => ({
    service: "mercenta-backend",
    uptimeSeconds: Math.floor(process.uptime()),
    chainId: 5042002,
    capabilities: {
      earn: "sdk-discovery-only-no-signing",
      borrow: "calculator-only-no-market",
      onramp: c.ONRAMP_API_KEY ? "configured-not-verified" : "not-configured",
      agent: modelAvailability(c).configured ? "model-tools-available" : "model-unconfigured",
      fulfillment:
        publicProcurementHealth(db,c,orders.ready).realPurchasesEnabled ? "guarded-not-mainnet" : "paused",
    },
    moduleTelemetry: "not-configured",
  }));
  app.get("/api/catalog", (req) => {
    const q = z
      .object({
        q: z.string().max(100).optional(),
        category: z
          .enum(["gaming", "streaming", "creator", "developer", "cloud"])
          .optional(),
      })
      .parse(req.query);
    return {
      categories,
      products: publicProducts(
        products.filter(
          (p) =>
            (!q.category || p.category === q.category) &&
            (!q.q || p.name.toLowerCase().includes(q.q.toLowerCase())),
        ),
      ),
      source: products.length ? "configured-server-quotes" : "not-configured",
    };
  });
  app.get("/api/agent/quota", (req,reply)=>{actor(req,c);return reply.code(410).send({code:'AGENT_REPLACED',path:'/agent'});});
  app.post("/api/agent/chat",(req,reply)=>{actor(req,c);return reply.code(410).send({code:'AGENT_REPLACED',path:'/agent'});});

  app.get("/api/liquidity/summary", (req) => ({
    mode: "sandbox",
    treasury: treasury(db, actor(req, c)),
    reserveUnits: "3150000000",
    realBalance: null,
  }));
  app.get("/api/liquidity/earn/vaults", async (req) => {
    const live = (req.query as { source?: string }).source === "sdk";
    if (live) {
      try {
        const result = await discoverVaults(c);
        return { mode: "sdk-discovery", result };
      } catch {
        return {
          mode: "unavailable",
          vaults: [],
          message: "Circle Earn discovery unavailable. No fabricated live APY.",
        };
      }
    }
    return {
      mode: "sandbox",
      vaults: [
        {
          id: "sandbox-usdc",
          name: "USDC reserve model",
          apyBps: "540",
          address: null,
          liquidity: "simulated",
          asOf: null,
        },
      ],
      message:
        "5.4% is a calculator assumption, not current or guaranteed APY.",
    };
  });
  app.post("/api/liquidity/earn/project", (req) => {
    const b = z
      .object({
        amount,
        days: z.number().int().min(1).max(3650),
        apyBps: z.string().regex(/^\d{1,5}$/),
      })
      .parse(req.body);
    return {
      mode: "sandbox",
      ...projectYield(parseMoney(b.amount), BigInt(b.apyBps), b.days),
    };
  });
  for (const action of ["deposit", "withdraw"] as const)
    app.post("/api/liquidity/earn/" + action, (req) => {
      const a = actor(req, c),
        b = actionBody.parse(req.body);
      return mutateSandbox(db, a, b.requestId, action, parseMoney(b.amount));
    });
  app.get("/api/liquidity/borrow/market", () => ({
    mode: "sandbox",
    priceUnits: SANDBOX_MARKET.priceUnits.toString(),
    maxLtvBps: "7500",
    liquidationBps: "8250",
    collateralDecimals: 8,
    oracleAsOf: null,
    marketAddress: null,
    message: "Assumed cirBTC price and risk thresholds. Not a live market.",
  }));
  app.post("/api/liquidity/borrow/preview", (req) => {
    const b = z
      .object({ collateral: z.string().max(30), amount })
      .parse(req.body);
    return {
      mode: "sandbox",
      ...loanRisk(parseMoney(b.collateral, 8), parseMoney(b.amount)),
    };
  });
  app.post("/api/liquidity/borrow/originate", (req) => {
    const a = actor(req, c),
      b = actionBody.extend({ collateral: z.string().max(30) }).parse(req.body);
    return mutateSandbox(
      db,
      a,
      b.requestId,
      "borrow",
      parseMoney(b.amount),
      parseMoney(b.collateral, 8),
    );
  });
  app.post("/api/liquidity/borrow/repay", (req) => {
    const a = actor(req, c),
      b = actionBody.parse(req.body);
    return mutateSandbox(db, a, b.requestId, "repay", parseMoney(b.amount));
  });
  app.post("/api/liquidity/onramp/session", async (req) => {
    const a = actor(req, c),
      b = z
        .object({
          mode: z.enum(["sandbox", "hosted"]),
          destinationAddress: z
            .string()
            .regex(/^0x[a-fA-F0-9]{40}$/)
            .optional(),
          amount: amount.optional(),
        })
        .parse(req.body);
    if (b.mode === "sandbox")
      return {
        mode: "sandbox",
        id: crypto.randomUUID(),
        status: "PREVIEW_ONLY",
        message:
          "Card / Apple Pay layout preview. No card data collected, no USDC minted.",
      };
    if (
      !a.startsWith("wallet:") ||
      a.slice(7) !== b.destinationAddress?.toLowerCase()
    )
      throw new Error("WALLET_AUTH_REQUIRED");
    return {
      mode: "hosted",
      session: await mintOnrampSession(c, a, b.destinationAddress),
    };
  });
  // A browser DEPOSIT_SETTLED event is not trusted payment proof. Verify its transaction through the same on-chain order endpoint.
  app.post("/api/liquidity/onramp/onDepositSettled", () => ({
    accepted: false,
    code: "ONCHAIN_VERIFICATION_REQUIRED",
    message:
      "Submit transaction hash to the authenticated order verification endpoint.",
  }));
  app.get("/api/liquidity/unified-balance", () => ({
    mode: "not-configured",
    chains: ["Base_Sepolia", "Arbitrum_Sepolia", "Arc_Testnet"],
    balances: null,
    message:
      "Gateway balance is distinct from wallet balance. Signing adapter required.",
  }));
  app.post("/api/liquidity/swap", () => ({
    code: "HUMAN_SIGNATURE_REQUIRED",
    message:
      "USDC/EURC App Kit swap integration boundary. No execution enabled.",
  }));
  app.get("/api/approvals", (req) => orders.pendingApprovals(actor(req, c)));
  app.post("/api/approvals/:id/decide", async (req) => {
    const a = actor(req, c),
      p = z.object({ id }).parse(req.params),
      b = z.object({ approve: z.boolean() }).parse(req.body);
    return orders.resolveApproval(p.id, a, b.approve);
  });
  app.post("/api/orders", async (req) => {
    const a = actor(req, c);
    if (!a.startsWith("wallet:")) throw new Error("WALLET_AUTH_REQUIRED");
    const b = z
      .object({
        requestId: id,
        productId: z.string().max(100),
        quantity: z.number().int().min(1).max(100),
      })
      .parse(req.body);
    return orders.public(
      await orders.createVerified(a, b.requestId, b.productId, b.quantity),
    );
  });
  app.get("/api/orders/:id", (req) => {
    const a = actor(req, c),
      p = z.object({ id }).parse(req.params),
      o = orders.get(p.id);
    if (!o || o.actor !== a) throw new Error("ORDER_NOT_FOUND");
    return orders.public(o);
  });
  app.post("/api/orders/:id/verify", async (req) => {
    const a = actor(req, c);
    if (!a.startsWith("wallet:") || !c.MERCHANT_WALLET)
      throw new Error("WALLET_AUTH_REQUIRED");
    const p = z.object({ id }).parse(req.params),
      b = z
        .object({ txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) })
        .parse(req.body);
    return orders.acceptPayment(
      p.id,
      a,
      await verifyArc(
        arcClient(c.ARC_RPC_URL),
        b.txHash as Hash,
        c.MERCHANT_WALLET as Address,
        a.slice(7) as Address,
      ),
    );
  });
  app.post("/api/orders/:id/reveal", (req) => {
    const a = actor(req, c),
      p = z.object({ id }).parse(req.params);
    return orders.reveal(p.id, a);
  });
}
