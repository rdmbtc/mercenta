/**
 * Mercenta money primitives.
 *
 * deterministic architecture standard: native BigInt only, 6-decimal scaling (USDC).
 * 1.00 USDC === 1_000_000n base units. Floating-point currency is
 * forbidden anywhere in the settlement path — every function here
 * either operates on BigInt directly or converts at the string/integer
 * boundary with explicit validation.
 */

/** USDC (and all Mercenta-listed stablecoins) use 6 decimals. */
export const DECIMALS = 6;

/** 10^6 — the scaling factor between whole units and base units. */
export const SCALE = 1_000_000n;

/** 1.00 USDC in base units. */
export const ONE_USDC = 1_000_000n;

/** Half of one base unit, for rounding-half-up at the boundary. */
const HALF = SCALE / 10n;

export class MoneyFormatError extends Error {
  constructor(
    readonly input: string,
    readonly reason: string,
  ) {
    super(`Invalid money string "${input}": ${reason}`);
    this.name = "MoneyFormatError";
  }
}

/**
 * Parse a human decimal string ("12.34", "0.000001", "12") into base
 * units. Accepts an optional leading sign only when disallowNegative is
 * false. Rejects: empty strings, multiple dots, >6 fractional digits,
 * non-digit characters, surrounding whitespace is NOT trimmed.
 */
export function parseUsdc(input: string, disallowNegative = true): bigint {
  if (typeof input !== "string" || input.length === 0) {
    throw new MoneyFormatError(String(input), "empty or non-string");
  }

  let body = input;
  let negative = false;
  if (body[0] === "-" || body[0] === "+") {
    negative = body[0] === "-";
    body = body.slice(1);
    if (negative && disallowNegative) {
      throw new MoneyFormatError(input, "negative amounts are not allowed");
    }
  }

  const dot = body.indexOf(".");
  let whole: string;
  let frac: string;
  if (dot === -1) {
    whole = body;
    frac = "";
  } else {
    whole = body.slice(0, dot);
    if (body.indexOf(".", dot + 1) !== -1) {
      throw new MoneyFormatError(input, "multiple decimal points");
    }
    frac = body.slice(dot + 1);
  }

  if (whole.length === 0 && frac.length === 0) {
    throw new MoneyFormatError(input, "no digits");
  }
  if (!/^\d*$/.test(whole) || !/^\d*$/.test(frac)) {
    throw new MoneyFormatError(input, "non-digit characters");
  }
  if (frac.length > DECIMALS) {
    throw new MoneyFormatError(input, `more than ${DECIMALS} fractional digits`);
  }

  const wholePart = BigInt(whole.length === 0 ? "0" : whole) * SCALE;
  const fracPadded = frac.padEnd(DECIMALS, "0");
  const fracPart = fracPadded.length === 0 ? 0n : BigInt(fracPadded);

  const value = negative ? -(wholePart + fracPart) : wholePart + fracPart;
  return value;
}

/**
 * Format base units as a canonical decimal string with exactly
 * ${DECIMALS} fractional digits, e.g. 12_345_678n → "12.345678".
 * Negative values keep the leading "-".
 */
export function formatUsdc(baseUnits: bigint): string {
  const negative = baseUnits < 0n;
  const abs = negative ? -baseUnits : baseUnits;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(DECIMALS, "0");
  const sign = negative ? "-" : "";
  return `${sign}${whole.toString()}.${frac}`;
}

/** Truncating division remainder check helper. */
export function isZero(baseUnits: bigint): boolean {
  return baseUnits === 0n;
}

/**
 * Compare two amounts lexicographically safe: returns negative if
 * a < b, 0 if equal, positive if a > b (same contract as BigInt
 * subtraction, exposed for readability at call sites).
 */
export function cmp(a: bigint, b: bigint): bigint {
  return a - b;
}

/** Round-half-up division of base units by an integer divisor. */
export function divRound(baseUnits: bigint, divisor: bigint): bigint {
  if (divisor === 0n) throw new RangeError("divisor must not be zero");
  const negative = baseUnits < 0n;
  const abs = negative ? -baseUnits : baseUnits;
  const q = abs / divisor;
  const r = abs % divisor;
  let out = r * 2n >= divisor ? q + 1n : q;
  if (negative) out = -out;
  return out;
}

/**
 * Percent-of computation with round-half-up: value * basisPoints / 10_000.
 * Used by the policy engine for take-rate and margin math so no
 * intermediate float ever exists.
 */
export function bp(baseUnits: bigint, basisPoints: bigint): bigint {
  return divRound(baseUnits * basisPoints, 10_000n);
}

export { HALF as HALF_BASE_UNIT };
