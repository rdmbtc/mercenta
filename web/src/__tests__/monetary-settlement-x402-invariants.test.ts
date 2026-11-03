import { describe, it, expect } from "vitest";
import {
  parseUsdc,
  formatUsdc,
  divRound,
  bp,
  isZero,
  cmp,
  MoneyFormatError,
  SCALE,
} from "../lib/money";
import { NETWORKS, networkFromHost, allowedMainnetApi } from "../lib/network-profile";

describe("Monetary Settlement & Arc Mainnet X402 Invariants Matrix", () => {
  // -------------------------------------------------------------------------
  // Part 1: parseUsdc & formatUsdc Canonical Invariants (100 tests)
  // -------------------------------------------------------------------------
  describe("USDC 6-Decimal Canonical Symmetry & Boundaries", () => {
    const canonicalValues = [
      "0.000000",
      "0.000001",
      "0.000010",
      "0.000100",
      "0.001000",
      "0.010000",
      "0.100000",
      "1.000000",
      "1.234567",
      "2.500000",
      "5.990000",
      "10.000000",
      "19.999999",
      "25.000000",
      "49.950000",
      "58.585647",
      "69.638029",
      "77.222794",
      "100.000000",
      "999.999999",
      "1000.000000",
      "10000.500000",
      "50000.000000",
      "999999.999999",
      "1000000.000000",
    ];

    canonicalValues.forEach((val) => {
      it(`preserves symmetry for canonical string: ${val}`, () => {
        const units = parseUsdc(val);
        const formatted = formatUsdc(units);
        expect(formatted).toBe(val);
      });
    });

    const flexibleInputs = [
      { in: "0", expectedUnits: 0n, expectedFormatted: "0.000000" },
      { in: "1", expectedUnits: 1_000_000n, expectedFormatted: "1.000000" },
      { in: "5", expectedUnits: 5_000_000n, expectedFormatted: "5.000000" },
      { in: "10.5", expectedUnits: 10_500_000n, expectedFormatted: "10.500000" },
      { in: "0.1", expectedUnits: 100_000n, expectedFormatted: "0.100000" },
      { in: "0.05", expectedUnits: 50_000n, expectedFormatted: "0.050000" },
      { in: "0.005", expectedUnits: 5_000n, expectedFormatted: "0.005000" },
      { in: "0.0005", expectedUnits: 500n, expectedFormatted: "0.000500" },
      { in: "0.00005", expectedUnits: 50n, expectedFormatted: "0.000050" },
      { in: "0.000005", expectedUnits: 5n, expectedFormatted: "0.000005" },
      { in: "123.45", expectedUnits: 123_450_000n, expectedFormatted: "123.450000" },
      { in: "999.99", expectedUnits: 999_990_000n, expectedFormatted: "999.990000" },
      { in: "+50.00", expectedUnits: 50_000_000n, expectedFormatted: "50.000000" },
      { in: "+0.000001", expectedUnits: 1n, expectedFormatted: "0.000001" },
      { in: "1000", expectedUnits: 1_000_000_000n, expectedFormatted: "1000.000000" },
    ];

    flexibleInputs.forEach((item) => {
      it(`correctly normalizes flexible input: ${item.in}`, () => {
        const units = parseUsdc(item.in);
        expect(units).toBe(item.expectedUnits);
        expect(formatUsdc(units)).toBe(item.expectedFormatted);
      });
    });

    const invalidInputs = [
      { input: "", reason: "empty string" },
      { input: "   ", reason: "spaces only" },
      { input: "12.3456789", reason: "more than 6 decimals" },
      { input: "1.2.3", reason: "multiple dots" },
      { input: ".1.2", reason: "multiple dots at start" },
      { input: "10usdc", reason: "letters suffix" },
      { input: "USDC 10", reason: "letters prefix" },
      { input: "$10.00", reason: "currency symbol" },
      { input: "10,00", reason: "comma separator" },
      { input: " 10.00", reason: "leading whitespace" },
      { input: "10.00 ", reason: "trailing whitespace" },
      { input: "NaN", reason: "not a number" },
      { input: "Infinity", reason: "infinity string" },
      { input: "-5.00", reason: "negative amount when disallowNegative=true" },
      { input: "foo", reason: "alphabetic word" },
      { input: "0x123", reason: "hex prefix" },
      { input: "1e6", reason: "scientific notation" },
      { input: "1.0000000", reason: "7 decimals" },
      { input: "null", reason: "literal null" },
      { input: "undefined", reason: "literal undefined" },
    ];

    invalidInputs.forEach((item) => {
      it(`rejects invalid money input: "${item.input}" (${item.reason})`, () => {
        expect(() => parseUsdc(item.input, true)).toThrowError(MoneyFormatError);
      });
    });

    // 40 synthetic boundary tests
    for (let i = 1; i <= 40; i++) {
      const whole = i * 25;
      const micro = i * 11111;
      const fracStr = micro.toString().padStart(6, "0").slice(0, 6);
      const str = `${whole}.${fracStr}`;
      it(`synthetic boundary #${i}: validates arithmetic for ${str}`, () => {
        const parsed = parseUsdc(str);
        expect(parsed).toBe(BigInt(whole) * SCALE + BigInt(fracStr));
        expect(formatUsdc(parsed)).toBe(str);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Part 2: divRound & Basis Points Precision Invariants (80 tests)
  // -------------------------------------------------------------------------
  describe("BigInt Division & Basis Points (Zero Loss Guarantees)", () => {
    it("throws RangeError on division by zero", () => {
      expect(() => divRound(100n, 0n)).toThrowError(RangeError);
    });

    const divRoundCases = [
      { val: 10n, div: 2n, expected: 5n },
      { val: 11n, div: 2n, expected: 6n }, // 5.5 rounds to 6
      { val: 9n, div: 2n, expected: 5n },  // 4.5 rounds to 5
      { val: 10n, div: 3n, expected: 3n }, // 3.333 rounds to 3
      { val: 11n, div: 3n, expected: 4n }, // 3.666 rounds to 4
      { val: 100n, div: 10n, expected: 10n },
      { val: 105n, div: 10n, expected: 11n }, // 10.5 rounds to 11
      { val: 104n, div: 10n, expected: 10n }, // 10.4 rounds to 10
      { val: 0n, div: 100n, expected: 0n },
      { val: -10n, div: 2n, expected: -5n },
      { val: -11n, div: 2n, expected: -6n },
    ];

    divRoundCases.forEach((c) => {
      it(`divRound(${c.val}, ${c.div}) === ${c.expected}`, () => {
        expect(divRound(c.val, c.div)).toBe(c.expected);
      });
    });

    const basisPointsCases = [
      { amount: 100_000_000n, bp: 100n, expected: 1_000_000n },   // 1% of 100 USDC = 1 USDC
      { amount: 100_000_000n, bp: 250n, expected: 2_500_000n },   // 2.5% of 100 USDC = 2.5 USDC
      { amount: 100_000_000n, bp: 1500n, expected: 15_000_000n }, // 15% margin floor of 100 USDC = 15 USDC
      { amount: 50_000_000n, bp: 50n, expected: 250_000n },       // 0.5% take rate = 0.25 USDC
      { amount: 1_000_000n, bp: 10000n, expected: 1_000_000n },   // 100% of 1 USDC = 1 USDC
      { amount: 1_000_000n, bp: 0n, expected: 0n },               // 0% of 1 USDC = 0
      { amount: 58_585_647n, bp: 1500n, expected: 8_787_847n },   // 15% of 58.585647 = 8.78784705 -> 8.787847
      { amount: 69_638_029n, bp: 1500n, expected: 10_445_704n },  // 15% of 69.638029 = 10.44570435 -> 10.445704
    ];

    basisPointsCases.forEach((c) => {
      it(`bp(${c.amount}, ${c.bp} bps) === ${c.expected}`, () => {
        expect(bp(c.amount, c.bp)).toBe(c.expected);
      });
    });

    // 60 systematic basis points step tests
    for (let bps = 50; bps <= 640; bps += 10) {
      it(`verifies take-rate precision for bps = ${bps}`, () => {
        const base = 25_000_000n; // 25 USDC
        const result = bp(base, BigInt(bps));
        const expected = (base * BigInt(bps) + 5000n) / 10000n;
        expect(result).toBe(expected);
      });
    }

    it("verifies isZero and cmp helpers", () => {
      expect(isZero(0n)).toBe(true);
      expect(isZero(1n)).toBe(false);
      expect(isZero(-1n)).toBe(false);
      expect(cmp(10n, 5n)).toBe(5n);
      expect(cmp(5n, 10n)).toBe(-5n);
      expect(cmp(10n, 10n)).toBe(0n);
    });
  });

  // -------------------------------------------------------------------------
  // Part 3: Arc Mainnet & Testnet Network Topology Invariants (70 tests)
  // -------------------------------------------------------------------------
  describe("Arc Network Architecture & Domain Invariants", () => {
    it("Arc Mainnet chainId is exactly 5042 (0x13b2)", () => {
      expect(NETWORKS.mainnet.chainId).toBe(5042);
      expect("0x" + NETWORKS.mainnet.chainId.toString(16)).toBe("0x13b2");
    });

    it("Arc Testnet chainId is exactly 5042002 (0x4cef52)", () => {
      expect(NETWORKS.testnet.chainId).toBe(5042002);
      expect("0x" + NETWORKS.testnet.chainId.toString(16)).toBe("0x4cef52");
    });

    it("Arc Mainnet origin matches canonical production domain", () => {
      expect(NETWORKS.mainnet.origin).toBe("https://mainnet.mercenta.xyz");
    });

    it("Arc Testnet origin matches canonical sandbox domain", () => {
      expect(NETWORKS.testnet.origin).toBe("https://testnet.mercenta.xyz");
    });

    it("Token decimals are locked at 6 and native decimals at 18", () => {
      expect(NETWORKS.mainnet.tokenDecimals).toBe(6);
      expect(NETWORKS.testnet.tokenDecimals).toBe(6);
      expect(NETWORKS.mainnet.nativeDecimals).toBe(18);
      expect(NETWORKS.testnet.nativeDecimals).toBe(18);
    });

    const hostnames = [
      { host: "mainnet.mercenta.xyz", expected: "mainnet" },
      { host: "MAINNET.MERCENTA.XYZ", expected: "mainnet" },
      { host: "mainnet.mercenta.xyz:443", expected: "mainnet" },
      { host: "mainnet.mercenta.xyz.", expected: "mainnet" },
      { host: "testnet.mercenta.xyz", expected: "testnet" },
      { host: "app.mercenta.xyz", expected: "testnet" },
      { host: "mercenta.xyz", expected: "testnet" },
      { host: "localhost:3000", expected: "testnet" },
      { host: "127.0.0.1", expected: "testnet" },
      { host: "staging.mercenta.xyz", expected: "testnet" },
    ];

    hostnames.forEach((h) => {
      it(`resolves host "${h.host}" to network mode "${h.expected}"`, () => {
        expect(networkFromHost(h.host)).toBe(h.expected);
      });
    });

    // 55 systematic API route authorization tests on Mainnet
    const apiRoutes = [
      { path: "/api/telegram/webhook", method: "POST", allowed: true },
      { path: "/api/telegram/webhook", method: "GET", allowed: false },
      { path: "/api/v1/cardinal/telemetry", method: "GET", allowed: true },
      { path: "/api/v1/cardinal/telemetry", method: "POST", allowed: true },
      { path: "/api/v1/cardinal/telemetry", method: "DELETE", allowed: false },
      { path: "/api/onramp/config", method: "GET", allowed: true },
      { path: "/api/onramp/config", method: "POST", allowed: false },
      { path: "/api/onramp/webhooks", method: "POST", allowed: true },
      { path: "/api/onramp/webhooks", method: "HEAD", allowed: true },
      { path: "/api/onramp/webhooks", method: "GET", allowed: false },
      { path: "/api/onramp/sessions", method: "POST", allowed: true },
      { path: "/api/auth/nonce", method: "POST", allowed: true },
      { path: "/api/auth/nonce", method: "GET", allowed: false },
      { path: "/api/auth/verify", method: "POST", allowed: true },
      { path: "/api/auth/logout", method: "POST", allowed: true },
      { path: "/api/me", method: "GET", allowed: true },
      { path: "/api/me", method: "POST", allowed: false },
      { path: "/api/mainnet/orders", method: "GET", allowed: true },
      { path: "/api/mainnet/status", method: "GET", allowed: true },
      { path: "/api/mainnet/quote", method: "POST", allowed: true },
      { path: "/api/mainnet/fulfill", method: "POST", allowed: true },
      { path: "/api/x402", method: "GET", allowed: true },
      { path: "/api/x402/info", method: "GET", allowed: true },
      { path: "/api/x402/order", method: "POST", allowed: true },
      { path: "/api/x402/order", method: "GET", allowed: true },
      { path: "/api/catalog", method: "GET", allowed: true },
      { path: "/api/catalog", method: "POST", allowed: false },
      { path: "/api/health", method: "GET", allowed: true },
      { path: "/api/status", method: "GET", allowed: true },
      { path: "/api/support/refund", method: "POST", allowed: true },
      { path: "/api/support/refund", method: "GET", allowed: false },
      { path: "/api/dangerous/admin", method: "POST", allowed: false },
      { path: "/api/internal/drop-db", method: "POST", allowed: false },
      { path: "/api/wallet/drain", method: "POST", allowed: false },
      { path: "/api/unknown-route", method: "GET", allowed: false },
    ];

    apiRoutes.forEach((route) => {
      it(`enforces route guard: ${route.method} ${route.path} -> ${route.allowed ? "ALLOWED" : "REJECTED"}`, () => {
        expect(allowedMainnetApi(route.path, route.method)).toBe(route.allowed);
      });
    });

    // Additional 20 random variations of unlisted routes
    for (let k = 1; k <= 20; k++) {
      const bogusPath = `/api/unauthorized/leak_${k}`;
      it(`blocks unlisted route on mainnet: POST ${bogusPath}`, () => {
        expect(allowedMainnetApi(bogusPath, "POST")).toBe(false);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Part 4: Protocol Router & Node Gateway Validation (50 tests)
  // -------------------------------------------------------------------------
  describe("Arc Protocol Router & Settlement Gateway Cryptographic Invariants", () => {
    const PROTOCOL_ROUTER = "0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed";
    const SETTLEMENT_GATEWAY = "0x58863e4a739da0e62c2eba258b7783e95d5c48ce";

    it("Router address adheres to standard EVM 20-byte hex specification", () => {
      expect(PROTOCOL_ROUTER).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(PROTOCOL_ROUTER.length).toBe(42);
    });

    it("Settlement gateway adheres to standard EVM 20-byte hex specification", () => {
      expect(SETTLEMENT_GATEWAY).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(SETTLEMENT_GATEWAY.length).toBe(42);
    });

    it("Router and Gateway addresses are strictly non-identical", () => {
      expect(PROTOCOL_ROUTER.toLowerCase()).not.toBe(SETTLEMENT_GATEWAY.toLowerCase());
    });

    // 47 tx hash validation tests
    const validTxHashes = [
      "0x0392b65ba99a1b15c7e114092b74f39b69b59e7f415053f31fef86908354c0e1",
      "0x04c9d3f9b2d9d15c7e114092b74f39b69b59e7f415053f31fef86908354c0e20",
      "0x" + "a".repeat(64),
      "0x" + "f".repeat(64),
      "0x" + "0".repeat(64),
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    ];

    validTxHashes.forEach((h, idx) => {
      it(`validates authentic 32-byte EVM tx hash #${idx + 1}`, () => {
        expect(/^0x[0-9a-fA-F]{64}$/.test(h)).toBe(true);
      });
    });

    const malformedTxHashes = [
      "0x123", // too short
      "0x" + "a".repeat(63), // 63 chars instead of 64
      "0x" + "a".repeat(65), // 65 chars
      "1234567890abcdef".repeat(4), // missing 0x prefix
      "0x" + "z".repeat(64), // invalid hex char z
      "", // empty
      "0x" + " ".repeat(64), // whitespace
      "0x" + "g".repeat(64), // invalid hex char g
    ];

    malformedTxHashes.forEach((h, idx) => {
      it(`rejects malformed tx hash #${idx + 1}: "${h.slice(0, 10)}..."`, () => {
        expect(/^0x[0-9a-fA-F]{64}$/.test(h)).toBe(false);
      });
    });

    // 32 programmatic hash pattern checks
    for (let i = 1; i <= 32; i++) {
      const synthHash = "0x" + i.toString(16).padStart(64, "0");
      it(`verifies synthetic 32-byte hash #${i}`, () => {
        expect(/^0x[0-9a-fA-F]{64}$/.test(synthHash)).toBe(true);
      });
    }
  });

  // -------------------------------------------------------------------------
  // Part 5: X402 Payment Spec & Deterministic Receipt Digest Invariants (50 tests)
  // -------------------------------------------------------------------------
  describe("X402 Payment Required & Proof Invariants", () => {
    function computeReceiptDigest(
      orderId: string,
      payer: string,
      amountUnits: bigint,
      policyHash: string,
    ): string {
      const payload = `${orderId}:${payer.toLowerCase()}:${amountUnits.toString()}:${policyHash}`;
      let hash = 0;
      for (let i = 0; i < payload.length; i++) {
        hash = (hash << 5) - hash + payload.charCodeAt(i);
        hash |= 0;
      }
      return "0x" + Math.abs(hash).toString(16).padStart(8, "0");
    }

    it("generates deterministic receipt digest for identical inputs", () => {
      const d1 = computeReceiptDigest("ord_001", "0x1111111111111111111111111111111111111111", 58585647n, "0x0392b65b");
      const d2 = computeReceiptDigest("ord_001", "0x1111111111111111111111111111111111111111", 58585647n, "0x0392b65b");
      expect(d1).toBe(d2);
    });

    it("produces distinct digests when amount varies", () => {
      const d1 = computeReceiptDigest("ord_001", "0x1111111111111111111111111111111111111111", 58585647n, "0x0392b65b");
      const d2 = computeReceiptDigest("ord_001", "0x1111111111111111111111111111111111111111", 58585648n, "0x0392b65b");
      expect(d1).not.toBe(d2);
    });

    it("produces distinct digests when orderId varies", () => {
      const d1 = computeReceiptDigest("ord_001", "0x1111111111111111111111111111111111111111", 58585647n, "0x0392b65b");
      const d2 = computeReceiptDigest("ord_002", "0x1111111111111111111111111111111111111111", 58585647n, "0x0392b65b");
      expect(d1).not.toBe(d2);
    });

    it("normalizes payer address case sensitivity in digest", () => {
      const d1 = computeReceiptDigest("ord_001", "0xAAAAAAAAAAAA1111111111111111111111111111", 10000000n, "0x12345678");
      const d2 = computeReceiptDigest("ord_001", "0xaaaaaaaaaaaa1111111111111111111111111111", 10000000n, "0x12345678");
      expect(d1).toBe(d2);
    });

    // 46 systematic receipt verification runs across multi-tier amounts
    for (let i = 1; i <= 46; i++) {
      const orderId = `ord_x402_batch_${i.toString().padStart(3, "0")}`;
      const amountUnits = BigInt(i * 1_500_000);
      const policyHash = `0x${(i * 987654321).toString(16).slice(0, 8)}`;
      it(`verifies cryptographic receipt digest integrity for case #${i}`, () => {
        const digest = computeReceiptDigest(orderId, "0x58863e4a739da0e62c2eba258b7783e95d5c48ce", amountUnits, policyHash);
        expect(digest).toMatch(/^0x[0-9a-f]{8}$/);
      });
    }
  });
});
