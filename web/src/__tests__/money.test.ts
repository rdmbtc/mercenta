import { describe, it, expect } from "vitest";
import { parseUsdc, formatUsdc, bp, divRound, cmp, isZero, SCALE } from "@/lib/money";

describe("money", () => {
  describe("parseUsdc", () => {
    it("parses whole number", () => {
      expect(parseUsdc("10")).toBe(10_000_000n);
    });

    it("parses decimal with 6 places", () => {
      expect(parseUsdc("1.500000")).toBe(1_500_000n);
    });

    it("parses small decimal", () => {
      expect(parseUsdc("0.000001")).toBe(1n);
    });

    it("rejects >6 decimal places", () => {
      expect(() => parseUsdc("1.0000001")).toThrow();
    });

    it("rejects negative by default", () => {
      expect(() => parseUsdc("-1")).toThrow();
    });

    it("allows negative when permitted", () => {
      expect(parseUsdc("-1", false)).toBe(-1_000_000n);
    });

    it("rejects non-numeric", () => {
      expect(() => parseUsdc("abc")).toThrow();
    });

    it("rejects empty string", () => {
      expect(() => parseUsdc("")).toThrow();
    });

    it("rejects whitespace", () => {
      expect(() => parseUsdc(" 1 ")).toThrow();
    });

    it("parses with + sign", () => {
      expect(parseUsdc("+5")).toBe(5_000_000n);
    });
  });

  describe("formatUsdc", () => {
    it("formats zero", () => {
      expect(formatUsdc(0n)).toBe("0.000000");
    });

    it("formats whole units", () => {
      expect(formatUsdc(10_000_000n)).toBe("10.000000");
    });

    it("formats fractional", () => {
      expect(formatUsdc(1_500_000n)).toBe("1.500000");
    });

    it("formats negative", () => {
      expect(formatUsdc(-1_000_000n)).toBe("-1.000000");
    });
  });

  describe("bp (basis points)", () => {
    it("calculates 15% of 10 USDC", () => {
      expect(bp(10_000_000n, 1500n)).toBe(1_500_000n);
    });

    it("rounds half-up", () => {
      // 1000001 * 50 / 10000 = 5000.005 → rounds to 5000
      expect(bp(1_000_001n, 50n)).toBe(5000n);
    });

    it("handles zero base", () => {
      expect(bp(0n, 1500n)).toBe(0n);
    });
  });

  describe("divRound", () => {
    it("rounds half-up positive", () => {
      expect(divRound(5n, 2n)).toBe(3n);
    });

    it("exact division", () => {
      expect(divRound(10n, 5n)).toBe(2n);
    });
  });

  describe("cmp", () => {
    it("equal", () => expect(cmp(5n, 5n)).toBe(0n));
    it("less", () => expect(cmp(3n, 5n)).toBe(-2n));
    it("greater", () => expect(cmp(7n, 5n)).toBe(2n));
  });

  describe("isZero", () => {
    it("zero", () => expect(isZero(0n)).toBe(true));
    it("non-zero", () => expect(isZero(1n)).toBe(false));
  });

  describe("SCALE constant", () => {
    it("equals 1_000_000n", () => {
      expect(SCALE).toBe(1_000_000n);
    });
  });
});
