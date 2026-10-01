import { ceilDiv } from "../../money.js";
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
