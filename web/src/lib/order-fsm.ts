/**
 * Order lifecycle finite state machine (Group C, deterministic architecture-compliant).
 *
 * Hard-coded, unidirectional, code-authoritative transition table. No caller вЂ”
 * LLM or otherwise вЂ” can invent a path: every transition goes through
 * `transition()`, which validates against the table below and throws a typed
 * error on any illegal jump. The FSM is pure: it never mutates its input and
 * never performs I/O, so it can be replayed deterministically for audits.
 */

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/** Happy-path states, strictly linear. */
export type OrderFlowState =
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAYMENT_DETECTED"
  | "PAYMENT_CONFIRMED"
  | "POLICY_CHECK"
  | "APPROVED"
  | "PURCHASING"
  | "FULFILLED";

/** Exception / terminal states. Reachable only via explicit edges below. */
export type OrderExceptionState =
  | "EXPIRED"
  | "PAYMENT_FAILED"
  | "UNDERPAID"
  | "DUPLICATE"
  | "BLOCKED"
  | "ESCALATED"
  | "SUPPLIER_UNKNOWN"
  | "REFUND_PENDING"
  | "REFUNDED";

export type OrderState = OrderFlowState | OrderExceptionState;

export const ORDER_FLOW_STATES: readonly OrderFlowState[] = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_DETECTED",
  "PAYMENT_CONFIRMED",
  "POLICY_CHECK",
  "APPROVED",
  "PURCHASING",
  "FULFILLED",
];

export const ORDER_EXCEPTION_STATES: readonly OrderExceptionState[] = [
  "EXPIRED",
  "PAYMENT_FAILED",
  "UNDERPAID",
  "DUPLICATE",
  "BLOCKED",
  "ESCALATED",
  "SUPPLIER_UNKNOWN",
  "REFUND_PENDING",
  "REFUNDED",
];

// ---------------------------------------------------------------------------
// Transition table вЂ” single source of truth
// ---------------------------------------------------------------------------

/**
 * Edges are unordered per source state, but the machine itself is strictly
 * unidirectional: no state can ever go backwards. Every edge exists for one
 * concrete operational reason:
 *
 * - CREATED в†’ AWAITING_PAYMENT     quote accepted, invoice issued to buyer
 * - CREATED в†’ EXPIRED              order TTL elapsed before payment address minted
 * - CREATED в†’ DUPLICATE            dedupe key collided at intake
 * - AWAITING_PAYMENT в†’ PAYMENT_DETECTED   on-chain transfer seen (в‰Ґ1 conf or mempool by policy)
 * - AWAITING_PAYMENT в†’ EXPIRED     order TTL elapsed with no payment
 * - AWAITING_PAYMENT в†’ PAYMENT_FAILED    invoice voided / chain error before any funds seen
 * - AWAITING_PAYMENT в†’ DUPLICATE   tx hash already consumed by another order
 * - PAYMENT_DETECTED в†’ PAYMENT_CONFIRMED deterministic verifier accepted (right amount, right token, enough confirmations)
 * - PAYMENT_DETECTED в†’ UNDERPAID confirmed amount < order total
 * - PAYMENT_DETECTED в†’ ESCALATED overpaid anomaly (excess funds, human decides: refund excess vs proceed)
 * - PAYMENT_DETECTED в†’ PAYMENT_FAILED tx reverted / re-orged out
 * - PAYMENT_DETECTED в†’ DUPLICATE   tx hash already consumed by another order
 * - PAYMENT_CONFIRMED в†’ POLICY_CHECK funds locked; deterministic policy engine runs
 * - POLICY_CHECK в†’ APPROVED        every check passed
 * - POLICY_CHECK в†’ BLOCKED         a hard limit failed (amount, velocity, geofence)
 * - POLICY_CHECK в†’ ESCALATED       a soft check held (needs human, e.g. supplier availability uncertain)
 * - APPROVED в†’ PURCHASING          fulfillment purchase dispatched to DigitalInventoryProvider
 * - APPROVED в†’ SUPPLIER_UNKNOWN    fulfillment target could not be resolved pre-purchase
 * - PURCHASING в†’ FULFILLED         supplier returned the digital good
 * - PURCHASING в†’ SUPPLIER_UNKNOWN  supplier rejected / could not resolve mid-purchase
 * - PURCHASING в†’ REFUND_PENDING    purchase failed after funds were confirmed
 * - UNDERPAID в†’ ESCALATED          human decides: top-up window vs refund
 * - UNDERPAID в†’ REFUND_PENDING     partial refund of confirmed amount
 * - BLOCKED в†’ ESCALATED            compliance officer overrides for review
 * - BLOCKED в†’ REFUND_PENDING       frozen funds returned
 * - ESCALATED в†’ REFUND_PENDING     reviewer chose refund
 * - SUPPLIER_UNKNOWN в†’ ESCALATED   sourcing needs manual routing
 * - SUPPLIER_UNKNOWN в†’ REFUND_PENDING no fulfillable supplier; money back
 * - REFUND_PENDING в†’ REFUNDED      on-chain refund settled (terminal)
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderState, readonly OrderState[]>> = {
  CREATED: ["AWAITING_PAYMENT", "EXPIRED", "DUPLICATE"],
  AWAITING_PAYMENT: ["PAYMENT_DETECTED", "EXPIRED", "PAYMENT_FAILED", "DUPLICATE"],
  PAYMENT_DETECTED: ["PAYMENT_CONFIRMED", "UNDERPAID", "PAYMENT_FAILED", "DUPLICATE", "ESCALATED"],
  PAYMENT_CONFIRMED: ["POLICY_CHECK"],
  POLICY_CHECK: ["APPROVED", "BLOCKED", "ESCALATED"],
  APPROVED: ["PURCHASING", "SUPPLIER_UNKNOWN"],
  PURCHASING: ["FULFILLED", "SUPPLIER_UNKNOWN", "REFUND_PENDING"],
  FULFILLED: [],

  EXPIRED: [],
  PAYMENT_FAILED: [],
  UNDERPAID: ["ESCALATED", "REFUND_PENDING"],
  DUPLICATE: [],
  BLOCKED: ["ESCALATED", "REFUND_PENDING"],
  ESCALATED: ["REFUND_PENDING"],
  SUPPLIER_UNKNOWN: ["ESCALATED", "REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};

/** States with no outgoing edges. Entering one ends the machine forever. */
export const TERMINAL_STATES: readonly OrderState[] = [
  "FULFILLED",
  "EXPIRED",
  "PAYMENT_FAILED",
  "DUPLICATE",
  "REFUNDED",
];

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class InvalidStateTransitionError extends Error {
  readonly from: OrderState;
  readonly to: OrderState;
  readonly allowed: readonly OrderState[];

  constructor(from: OrderState, to: OrderState) {
    const allowed = ORDER_TRANSITIONS[from];
    super(
      `Invalid order state transition: ${from} в†’ ${to}. ` +
        `Allowed from ${from}: [${allowed.join(", ") || "none (terminal)"}]`,
    );
    this.name = "InvalidStateTransitionError";
    this.from = from;
    this.to = to;
    this.allowed = allowed;
  }
}

export class UnknownOrderStateError extends Error {
  constructor(state: OrderState | string) {
    super(`Unknown order state: ${String(state)}`);
    this.name = "UnknownOrderStateError";
  }
}

// ---------------------------------------------------------------------------
// Machine
// ---------------------------------------------------------------------------

export interface OrderSnapshot {
  readonly state: OrderState;
  readonly updatedAt: number; // epoch ms of last transition
}

export function isTerminal(state: OrderState): boolean {
  // Exhaustiveness guard: any new state must appear in the table above.
  if (ORDER_TRANSITIONS[state] === undefined) throw new UnknownOrderStateError(state);
  return ORDER_TRANSITIONS[state].length === 0;
}

export function canTransition(from: OrderState, to: OrderState): boolean {
  if (ORDER_TRANSITIONS[from] === undefined) throw new UnknownOrderStateError(from);
  if (ORDER_TRANSITIONS[to] === undefined) throw new UnknownOrderStateError(to);
  return ORDER_TRANSITIONS[from].includes(to);
}

/**
 * Apply a transition. Pure: returns a new snapshot, never mutates the input.
 * Throws `InvalidStateTransitionError` on any jump not present in the table вЂ”
 * including backwards moves, skips, and transitions out of terminal states.
 */
export function transition(
  order: OrderSnapshot,
  to: OrderState,
  now: number = Date.now(),
): OrderSnapshot {
  if (!canTransition(order.state, to)) {
    throw new InvalidStateTransitionError(order.state, to);
  }
  return { state: to, updatedAt: now };
}
