export type OperatorDraft = { goal: string; budget: string; reserve: string; region: string; quantity: number };
export type DraftIssue = 'GOAL' | 'BUDGET' | 'RESERVE' | 'REGION' | 'QUANTITY' | 'CAP_TOO_LOW';
function units(value: string): bigint | null {
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,6})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
}
/** Local rehearsal estimate, not a server quote, account check or spending permission. */
export function operatorPreflight(draft: OperatorDraft) {
  const issues: DraftIssue[] = [];
  const budget = units(draft.budget), reserve = units(draft.reserve);
  if (draft.goal.trim().length < 3 || draft.goal.trim().length > 1500) issues.push('GOAL');
  if (budget === null || budget === 0n) issues.push('BUDGET');
  if (reserve === null) issues.push('RESERVE');
  if (!draft.region.trim() || draft.region.trim().length > 20) issues.push('REGION');
  const quantityValid = Number.isInteger(draft.quantity) && draft.quantity >= 1 && draft.quantity <= 10;
  if (!quantityValid) issues.push('QUANTITY');
  const testAmount = quantityValid ? BigInt(draft.quantity) * 1000000n : null;
  if (testAmount !== null && budget !== null && budget > 0n && testAmount > budget) issues.push('CAP_TOO_LOW');
  return { valid: issues.length === 0, issues, testAmountUnits: testAmount?.toString() ?? null,
    budgetUnits: budget?.toString() ?? null, reserveUnits: reserve?.toString() ?? null,
    spendingAuthorized: false as const, serverQuoteVerified: false as const };
}
