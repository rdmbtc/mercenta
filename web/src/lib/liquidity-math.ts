export const SCALE = 1_000_000n;
export const MAX_UNITS = 10n ** 30n;
export function parseMoney(s: string, decimals = 6): bigint {
  if (
    typeof s !== "string" ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(s) ||
    s.length > 40
  )
    throw new Error("INVALID_DECIMAL");
  const [whole = "", fraction = ""] = s.split(".");
  if (fraction.length > decimals) throw new Error("EXCESS_PRECISION");
  const value =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"));
  if (value > MAX_UNITS) throw new Error("AMOUNT_TOO_LARGE");
  return value;
}
export function units(s: string): bigint {
  if (!/^\d{1,31}$/.test(s)) throw new Error("INVALID_UNITS");
  return BigInt(s);
}
export function formatMoney(n: bigint, decimals = 6): string {
  const sign = n < 0n ? "-" : "";
  const v = n < 0n ? -n : n,
    scale = 10n ** BigInt(decimals);
  return `${sign}${v / scale}.${(v % scale).toString().padStart(decimals, "0")}`;
}
export function ceilDiv(a: bigint, b: bigint): bigint {
  if (a < 0n || b <= 0n) throw new Error("INVALID_DIVISION");
  return (a + b - 1n) / b;
}
export function jsonSafe(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) =>
    typeof v === "bigint" ? v.toString() : v,
  );
}

export const SANDBOX_MARKET = {
  priceUnits: 92_400_000_000n,
  maxLtvBps: 7500n,
  liquidationBps: 8250n,
  collateralScale: 100_000_000n,
};
export function projectYield(principal: bigint, apyBps: bigint, days: number) {
  if (
    principal < 0n ||
    apyBps < 0n ||
    apyBps > 10000n ||
    !Number.isInteger(days) ||
    days < 1 ||
    days > 3650
  )
    throw new Error("INVALID_YIELD_INPUT");
  // Simple pro-rata estimate, not a promise of compounding or realized APY.
  const gain = (principal * apyBps * BigInt(days)) / (10000n * 365n);
  return {
    gainUnits: gain.toString(),
    totalUnits: (principal + gain).toString(),
    method: "simple-pro-rata",
  };
}
export function loanRisk(collateral: bigint, debt: bigint, m = SANDBOX_MARKET) {
  if (collateral < 0n || debt < 0n) throw new Error("INVALID_LOAN_INPUT");
  const value = (collateral * m.priceUnits) / m.collateralScale,
    max = (value * m.maxLtvBps) / 10000n;
  const ltv =
    value === 0n ? (debt > 0n ? 10001n : 0n) : ceilDiv(debt * 10000n, value);
  const health = debt === 0n ? null : (value * m.liquidationBps) / debt;
  const liquidation =
    collateral === 0n
      ? null
      : ceilDiv(
          debt * m.collateralScale * 10000n,
          collateral * m.liquidationBps,
        );
  return {
    collateralValueUnits: value.toString(),
    maxBorrowUnits: max.toString(),
    ltvBps: ltv.toString(),
    healthFactorBps: health?.toString() ?? null,
    liquidationPriceUnits: liquidation?.toString() ?? null,
    allowed: collateral > 0n && debt > 0n && debt <= max,
    status:
      debt === 0n
        ? "NO_DEBT"
        : health !== null && health < 10000n
          ? "LIQUIDATABLE"
          : debt > max
            ? "OVER_LTV"
            : health !== null && health < 14000n
              ? "WATCH"
              : "HEALTHY",
  };
}

export function displayUnits(s: string | null, precision = 2): string {
  if (s === null) return "—";
  const n = BigInt(s),
    v = n < 0n ? -n : n;
  const whole = (v / 1000000n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (
    (n < 0n ? "-" : "") +
    whole +
    "." +
    (v % 1000000n).toString().padStart(6, "0").slice(0, precision)
  );
}
export function safeParse(s: string, decimals = 6): bigint {
  try {
    return parseMoney(s, decimals);
  } catch {
    return 0n;
  }
}
