export const DEPOSIT_UNITS=100_000n,GAS_BUDGET_WEI=20_000_000_000_000_000n;
export function assertFundingBudget(paid:bigint,gas:bigint,maxFee:bigint,reserved=0n){if(paid<0n||gas<=0n||maxFee<=0n||reserved<0n||paid+gas*maxFee+reserved>GAS_BUDGET_WEI)throw Error('APPROVED_GAS_BUDGET_EXCEEDED');}
export function paddedGas(estimated:bigint){if(estimated<=0n)throw Error('INVALID_GAS_ESTIMATE');return (estimated*120n+99n)/100n;}
