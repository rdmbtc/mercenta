import {startProcurementMonitor,refreshProcurementHealth,reserveProcurement,procurementHealth} from './services/procurement-health.js';
import {registerOperatorLab} from './routes/operator-lab.js';
import {registerOperator} from './routes/agent-operator.js';
import {registerCatalogTestCheckout} from './routes/catalog-test-checkout.js';
import {registerAssistantPreview} from './routes/assistant-preview.js';
import {registerWorkspace} from './routes/workspace.js';
import {registerCircleDemoSeller} from './routes/circle-demo-seller.js';
import {registerCircleAgent} from './routes/circle-agent.js';
import {registerCommerce} from './routes/commerce.js';
import {registerAgentChat} from './routes/agent-chat.js';
import {registerAuthRoutes} from './routes/auth.js';
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { loadConfig, type Config } from "./config.js";
import { openDb } from "./db.js";
import { loadProducts, type Product } from "./services/catalog.js";
import { SupplyNode, type FulfillmentPort } from "./services/fulfillment/index.js";
import type { DB } from "./db.js";
import { Orders } from "./services/orders.js";
import { startReconciler } from "./services/fulfillment/reconciler.js";
import { registerRoutes } from "./routes/index.js";
import {registerAccountRoutes} from "./routes/account.js";
import {registerResilience} from "./services/resilience.js";
export async function buildServer(c: Config, products?: Product[], fulfillmentFactory?: (db:DB)=>FulfillmentPort) {
  const app = Fastify({
    logger: {
      level: "info",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers.x-mercenta-signature",
        "req.body",
        "res.body",
      ],
    },
    bodyLimit: 32768,
    requestTimeout: 30000,
    trustProxy: false,
  });
  await app.register(helmet);
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });
  const db = openDb(c.DATABASE_PATH),
    catalog = products ?? loadProducts(c.CATALOG_QUOTES_PATH),
    node = fulfillmentFactory?.(db) ?? new SupplyNode(c, async (ref,cost) => { await refreshProcurementHealth(db,c); return reserveProcurement(db,ref,cost); },()=>procurementHealth(db).open),
    orders = new Orders(db, c, catalog, node);
  registerResilience(app, db, c);
  registerAuthRoutes(app,db,c);
  registerRoutes(app, db, c, catalog, orders);
  registerAccountRoutes(app, db, c);
  registerCatalogTestCheckout(app, db, c);
  registerWorkspace(app, db, c);
  registerCommerce(app, db, c);
  registerCircleAgent(app, db, c);
  registerCircleDemoSeller(app, db, c);
  registerAgentChat(app, db, c);
  registerOperator(app, db, c);
  registerOperatorLab(app, db, c);
  registerAssistantPreview(app, db, c);
  const stopProcurement = startProcurementMonitor(db,c);
  const stop = startReconciler(db, orders, node);
  app.setErrorHandler((e, _req, reply) => {
    const message = e instanceof Error ? e.message : "REQUEST_REJECTED";
    const status =
      message === "UNAUTHORIZED" || message === "WALLET_AUTH_REQUIRED"
        ? 401
        : e instanceof ZodError
          ? 400
          : ["ORDER_NOT_FOUND","QUOTE_NOT_FOUND","DELIVERY_NOT_FOUND"].includes(message)
            ? 404
            : message.includes("CONFLICT") || message === "REQUEST_IN_PROGRESS"
              ? 409
              : message.includes("NOT_CONFIGURED") || ["SERVICE_PURCHASES_PAUSED","SERVICE_RESERVE_LIMIT"].includes(message)
                ? 503
                : 400;
    reply
      .code(status)
      .send({
        code:
          e instanceof ZodError
            ? "INVALID_REQUEST"
            : /^[A-Z_]+$/.test(message)
              ? message
              : "REQUEST_REJECTED",
        message:
          "Request could not be completed. No unverified operation is reported as settled.",
      });
  });
  app.addHook("onClose", async () => {
    stop();
    stopProcurement();
    db.close();
  });
  return app;
}
if (
  process.argv[1]?.endsWith("server.ts") ||
  process.argv[1]?.endsWith("server.js")
) {
  const c = loadConfig();
  const app = await buildServer(c);
  await app.listen({ host: c.HOST, port: c.PORT });
  for (const signal of ["SIGTERM", "SIGINT"])
    process.once(signal, () => {
      void app.close();
    });
}
