import "dotenv/config";
import { randomBytes } from "node:crypto";
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3012),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_PATH: z.string().default("data/mercenta.sqlite"),
  BACKEND_PROXY_SECRET: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  DELIVERY_ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .optional(),
  REQUEST_REF_SECRET: z.string().min(32).optional(),
  ARC_RPC_URL: z.string().url().default("https://testnet.arc.network"),
  MERCHANT_WALLET: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  SUPPLIER_API_URL: z.string().url().optional(),
  SUPPLIER_API_KEY: z.string().optional(),
  ENABLE_FULFILLMENT: z.enum(["true", "false"]).default("false"),
  CATALOG_QUOTES_PATH: z.string().optional(),
  CIRCLE_API_KEY: z.string().optional(),
  ONRAMP_API_KEY: z.string().optional(),
  ONRAMP_WIDGET_ORIGIN: z.string().url().optional(),
  WEB_ORIGIN: z.string().url().default("http://localhost:3011"),
  LLM_API_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  PRIVATE_SUPPLY_IDENTITY: z.string().optional(),
  PRIVATE_MODEL_IDENTITY: z.string().optional(),
  PRIVATE_LEGACY_IDENTITY: z.string().optional(),
});
export type Config = ReturnType<typeof loadConfig>;
export function loadConfig(env = process.env) {
  const c = schema.parse(
    Object.fromEntries(Object.entries(env).filter(([, v]) => v !== "")),
  );
  if (
    c.NODE_ENV === "production" &&
    (!c.BACKEND_PROXY_SECRET ||
      !c.SESSION_SECRET ||
      !c.DELIVERY_ENCRYPTION_KEY ||
      !c.REQUEST_REF_SECRET)
  )
    throw new Error("PRODUCTION_SECRETS_REQUIRED");
  return {
    ...c,
    BACKEND_PROXY_SECRET:
      c.BACKEND_PROXY_SECRET ?? randomBytes(32).toString("hex"),
    SESSION_SECRET: c.SESSION_SECRET ?? randomBytes(32).toString("hex"),
    DELIVERY_ENCRYPTION_KEY:
      c.DELIVERY_ENCRYPTION_KEY ?? randomBytes(32).toString("hex"),
    REQUEST_REF_SECRET: c.REQUEST_REF_SECRET ?? randomBytes(32).toString("hex"),
  };
}
