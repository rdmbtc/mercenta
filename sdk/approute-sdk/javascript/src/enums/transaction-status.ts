/**
 * Transaction lifecycle statuses.
 */
export const TransactionStatus = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  PARTIALLY_COMPLETED: "partially_completed",
  CANCELLED: "cancelled",
} as const;

export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];
