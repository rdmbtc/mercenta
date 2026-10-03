import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import type { Config } from "../../config.js";
export function requestRef(secret: string, orderId: string) {
  return createHmac("sha256", secret)
    .update("mercenta:v1:" + orderId)
    .digest("hex");
}
export function encryptCode(code: string, key: string) {
  const iv = randomBytes(12),
    c = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  return Buffer.concat([
    iv,
    Buffer.alloc(0),
    c.update(code, "utf8"),
    c.final(),
    c.getAuthTag(),
  ]).toString("base64");
}
export function decryptCode(payload: string, key: string) {
  const b = Buffer.from(payload, "base64"),
    d = createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      b.subarray(0, 12),
    );
  d.setAuthTag(b.subarray(-16));
  return Buffer.concat([d.update(b.subarray(12, -16)), d.final()]).toString(
    "utf8",
  );
}
export type SupplyResult =
  | { status: "COMPLETED"; code: string }
  | { status: "NOT_EXECUTED" | "PENDING" | "UNKNOWN" };
export class SupplyNode {
  constructor(private c: Config, private fundingCheck?: (ref: string, costUsdUnits: string) => Promise<boolean>, private fundingAvailable?: () => boolean) {}
  get configured() {
    return (
      this.c.ENABLE_FULFILLMENT === "true" &&
      this.c.FULFILLMENT_CONTRACT_VERIFIED === "true" &&
      !!this.c.SUPPLIER_API_URL &&
      !!this.c.SUPPLIER_API_KEY
    );
  }
  get ready() { return this.configured && this.fundingAvailable?.() === true; }
  private async call(
    path: string,
    method: string,
    body?: object,
  ): Promise<SupplyResult> {
    if (!(method === "GET" ? this.configured : this.ready)) throw new Error("SUPPLY_NODE_NOT_CONFIGURED");
    try {
      const r = await fetch(new URL(path, this.c.SUPPLIER_API_URL), {
        method,
        headers: {
          Authorization: `Bearer ${this.c.SUPPLIER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) return { status: "UNKNOWN" };
      const v = (await r.json()) as { status?: string; code?: string };
      if (
        v.status === "COMPLETED" &&
        typeof v.code === "string" &&
        v.code.length <= 10000
      )
        return { status: "COMPLETED", code: v.code };
      if (v.status === "NOT_EXECUTED" || v.status === "PENDING")
        return { status: v.status };
      return { status: "UNKNOWN" };
    } catch {
      return { status: "UNKNOWN" };
    }
  }
  async purchase(ref: string, sku: string, quantity: number, costUsdUnits?: string) {
    if (!this.ready) throw Error("SUPPLY_NODE_NOT_CONFIGURED");
    if (!costUsdUnits || !this.fundingCheck) throw Error("PROCUREMENT_COST_UNVERIFIED");
    if (!(await this.fundingCheck(ref, costUsdUnits))) return {status:"UNKNOWN"} as const;
    return this.call("/orders", "POST", { request_ref: ref, sku, quantity });
  }
  lookup(ref: string) {
    return this.call("/orders/by-reference/" + encodeURIComponent(ref), "GET");
  }
}
