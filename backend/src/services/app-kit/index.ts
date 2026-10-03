import { AppKit } from "@circle-fin/app-kit";
import {
  createAppServerKit,
  parseOnrampSessionRequest,
} from "@circle-fin/app-kit/server";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { Config } from "../../config.js";
export const appKit = new AppKit();
// Wallet adapters are deliberately browser/human controlled; there is no private key in this service.
export const createHumanWalletAdapter = createViemAdapterFromProvider;
export async function discoverVaults(c: Config) {
  return appKit.earn.exploreVaults({
    chain: "Arc_Testnet",
    sortBy: "apy",
    config: c.CIRCLE_API_KEY ? { apiKey: c.CIRCLE_API_KEY } : undefined,
  });
}
export async function mintOnrampSession(
  c: Config,
  actor: string,
  address: string,
) {
  if (c.ONRAMP_VERIFIED !== "true") throw new Error("ONRAMP_VERIFICATION_REQUIRED");
  if (!c.ONRAMP_API_KEY) throw new Error("ONRAMP_NOT_CONFIGURED");
  const server = createAppServerKit({
    onramp: {
      apiKey: c.ONRAMP_API_KEY,
      referrerDomain: new URL(c.WEB_ORIGIN).hostname,
      widgetBaseUrl: c.ONRAMP_WIDGET_ORIGIN,
    },
  });
  return server.onramp.createSession(
    parseOnrampSessionRequest({
      appUserId: actor,
      destinationAddress: address,
      destinationChain: "ARC-TESTNET",
    }),
  );
}
// Typed operations are integration boundaries, not enabled server-side signing routes.
export const circleOperations = {
  deposit: appKit.earn.deposit,
  withdraw: appKit.earn.withdraw,
  borrow: appKit.borrow.borrow,
  swap: appKit.swap,
  bridge: appKit.bridge,
  unifiedBalance: appKit.unifiedBalance.getBalances,
};
