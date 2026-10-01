import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DISBURSER_ADDRESS,
  resolvePrivateKey,
  ArcWalletError,
  ERC20_TRANSFER_ABI,
} from "../lib/arc-wallet";

describe("arc-wallet", () => {
  const KEY = "0x" + "ab".repeat(32);
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ARC_DISBURSER_KEY;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ARC_DISBURSER_KEY;
    else process.env.ARC_DISBURSER_KEY = saved;
  });

  it("DISBURSER_ADDRESS is the funded testnet address", () => {
    expect(DISBURSER_ADDRESS).toBe("0x1dBD2507b68368E10E3d32240E326eaaF063dA6b");
  });

  it("resolvePrivateKey reads ARC_DISBURSER_KEY env", () => {
    process.env.ARC_DISBURSER_KEY = KEY;
    expect(resolvePrivateKey()).toBe(KEY);
  });

  it("resolvePrivateKey throws ArcWalletError when env missing", () => {
    delete process.env.ARC_DISBURSER_KEY;
    expect(() => resolvePrivateKey()).toThrow(ArcWalletError);
    expect(() => resolvePrivateKey()).toThrow(/ARC_DISBURSER_KEY/);
  });

  it("resolvePrivateKey rejects malformed key", () => {
    process.env.ARC_DISBURSER_KEY = "not-a-key";
    expect(() => resolvePrivateKey()).toThrow(ArcWalletError);
  });

  it("resolvePrivateKey accepts explicit override over env", () => {
    process.env.ARC_DISBURSER_KEY = "0x" + "cd".repeat(32);
    expect(resolvePrivateKey({ privateKey: KEY as `0x${string}` })).toBe(KEY);
  });

  it("ERC20_TRANSFER_ABI contains transfer function", () => {
    const names = ERC20_TRANSFER_ABI.map((e: { name?: string }) => e.name);
    expect(names).toContain("transfer");
  });
});
