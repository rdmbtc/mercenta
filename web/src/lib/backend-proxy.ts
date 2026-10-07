import {networkFromHost,MAINNET_CLOSED} from './network-profile';
import {fallbackSnapshot} from './backend-fallback';
import "server-only";
import { NextResponse } from "next/server";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { requireSession } from "@/lib/auth";
import { getCatalog, CATEGORIES } from "@/lib/supplier";
const cookieName = "mercenta_advisor";
const allowed=/^(auth\/(nonce|verify)|account\/[a-z0-9/-]+|agent\/(chat|quota)|liquidity\/(summary|earn\/(vaults|project|deposit|withdraw)|borrow\/(market|preview|originate|repay)|onramp\/(session|onDepositSettled)|unified-balance|swap)|approvals(?:\/[a-f0-9-]{36}\/decide)?|orders(?:\/[a-f0-9-]{36}(?:\/(verify|reveal))?)?|health|status|catalog)$/;
function sign(s: string, key: string) {
  return createHmac("sha256", key).update(s).digest("hex");
}
function validCookie(v: string, key: string) {
  const [p, s] = v.split(".");
  if (!p || !s) return null;
  const expected = sign(p, key);
  const a = Buffer.from(s),
    b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, "base64url").toString());
    return typeof d.id === "string" &&
      /^[a-f0-9-]{36}$/.test(d.id) &&
      d.exp > Date.now()
      ? d.id
      : null;
  } catch {
    return null;
  }
}
export async function proxyBackend(req: Request, path: string) {
  if(networkFromHost(new URL(req.url).hostname)==='mainnet')return NextResponse.json(MAINNET_CLOSED,{status:503,headers:{'Cache-Control':'no-store'}});
  if (!allowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  const secret = process.env.BACKEND_PROXY_SECRET;
  if (!secret || secret.length < 32)
    return NextResponse.json(
      { code: "BACKEND_NOT_CONFIGURED" },
      { status: 503 },
    );
  const requestUrl = new URL(req.url);
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    if (!origin || origin !== requestUrl.origin)
      return NextResponse.json({ code: "ORIGIN_REJECTED" }, { status: 403 });
  }
  let body: Record<string, unknown> | undefined;
  if (req.method !== "GET") {
    const raw = await req.text();
    if (raw.length > 32000)
      return NextResponse.json({ code: "BODY_TOO_LARGE" }, { status: 413 });
    try {
      body = raw ? JSON.parse(raw) : {};
      if (!body || Array.isArray(body) || typeof body !== "object")
        throw new Error();
    } catch {
      return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
    }
  }
  let wallet: string | undefined;
  try {
    wallet = requireSession(req, Date.now())?.address;
  } catch {
    /* No authenticated wallet. Never trust address in body. */
  }
  const match = /(?:^|;\s*)mercenta_advisor=([^;]+)/.exec(
    req.headers.get("cookie") ?? "",
  );
  const previous = match ? validCookie(match[1], secret) : null;
  const session = previous ?? randomUUID();
  const actor = wallet
    ? "wallet:" + wallet.toLowerCase()
    : "session:" + session;
  if (path === "agent/chat" && body) {
    try {
      const catalog = await getCatalog();
      const q = String(body.message ?? "").toLowerCase();
      const terms = q.split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2);
      body.catalog = catalog.products
        .map((p) => ({
          p,
          score: terms.reduce(
            (n, t) => n + (p.name.toLowerCase().includes(t) ? 1 : 0),
            0,
          ),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 60)
        .map(({ p }) => ({
          id: p.id,
          name: p.name,
          category:
            CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category,
          price: String(p.minPrice),
          currency: p.denominations[0]?.currency ?? "USD",
        }));
    } catch {
      body.catalog = [];
    }
  }
  const text = body ? JSON.stringify(body) : "";
  const ts = String(Date.now());
  const route = "/api/" + path + requestUrl.search;
  const sig = sign(`${ts}\n${req.method}\n${route}\n${actor}\n${text}`, secret);
  try {
    const res = await fetch(
      (process.env.BACKEND_URL ?? "http://127.0.0.1:3012") + route,
      {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          "x-mercenta-actor": actor,
          "x-mercenta-timestamp": ts,
          "x-mercenta-signature": sig,
        },
        body: text || undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      },
    );
    if(res.status>=500&&req.method==='GET'&&wallet){const cached=await fallbackSnapshot(req.method,path,requestUrl.search,actor);if(cached)return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});}
    const data = await res.json();
    const out = NextResponse.json(data, {
      status: res.status,
      headers: { "Cache-Control": "no-store" },
    });
    if (!previous) {
      const p = Buffer.from(
        JSON.stringify({ id: session, exp: Date.now() + 86400000 }),
      ).toString("base64url");
      out.cookies.set(cookieName, p + "." + sign(p, secret), {
        httpOnly: true,
        sameSite: "strict",
        secure: requestUrl.protocol === "https:",
        path: "/",
        maxAge: 86400,
      });
    }
    return out;
  } catch {
    if(req.method==='GET'&&wallet){const cached=await fallbackSnapshot(req.method,path,requestUrl.search,actor);if(cached)return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});}
    return NextResponse.json(
      {
        code: "BACKEND_UNAVAILABLE",
        message:
          "No operation has been reported as settled. Check backend connectivity before retrying.",
      },
      { status: 503 },
    );
  }
}
