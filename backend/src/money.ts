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
