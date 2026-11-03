import { describe, it, expect } from 'vitest';
import {
  transition,
  isTerminal,
  canTransition,
  ORDER_TRANSITIONS,
  TERMINAL_STATES,
  InvalidStateTransitionError,
  type OrderState,
  type OrderSnapshot,
} from '@/lib/order-fsm';

describe('Order Lifecycle FSM (Finite State Machine) Exhaustive Invariants', () => {
  const makeSnapshot = (state: OrderState): OrderSnapshot => ({
    state,
    updatedAt: Date.now(),
  });

  describe('1. Valid State Transition Edges (Every Allowed Path)', () => {
    // Generate tests for all allowed transitions in ORDER_TRANSITIONS
    Object.entries(ORDER_TRANSITIONS).forEach(([fromState, allowedTos]) => {
      allowedTos.forEach((toState) => {
        it(`allows valid transition: ${fromState} -> ${toState}`, () => {
          const snapshot = makeSnapshot(fromState as OrderState);
          expect(canTransition(fromState as OrderState, toState)).toBe(true);

          const nextSnapshot = transition(snapshot, toState);
          expect(nextSnapshot.state).toBe(toState);
          expect(nextSnapshot.updatedAt).toBeGreaterThanOrEqual(snapshot.updatedAt);
        });
      });
    });
  });

  describe('2. Terminal State Immutability (Zero Outgoing Edges)', () => {
    it.each(TERMINAL_STATES)('verifies terminal state "%s" cannot transition anywhere', (terminalState) => {
      expect(isTerminal(terminalState)).toBe(true);
      expect(ORDER_TRANSITIONS[terminalState]).toEqual([]);

      // Attempt transitioning to CREATED from any terminal state
      const snapshot = makeSnapshot(terminalState);
      expect(canTransition(terminalState, 'CREATED')).toBe(false);
      expect(() => transition(snapshot, 'CREATED')).toThrow(InvalidStateTransitionError);
    });

    it.each([
      ['FULFILLED', 'REFUNDED'],
      ['FULFILLED', 'AWAITING_PAYMENT'],
      ['EXPIRED', 'CREATED'],
      ['PAYMENT_FAILED', 'PAYMENT_CONFIRMED'],
      ['DUPLICATE', 'APPROVED'],
      ['REFUNDED', 'PURCHASING'],
    ])('terminal state "%s" strictly rejects jump to "%s"', (fromTerm, illegalTo) => {
      const snapshot = makeSnapshot(fromTerm as OrderState);
      expect(() => transition(snapshot, illegalTo as OrderState)).toThrow(InvalidStateTransitionError);
    });
  });

  describe('3. Illegal Reverse / Skip Transitions', () => {
    it.each([
      ['PURCHASING', 'CREATED'],
      ['APPROVED', 'AWAITING_PAYMENT'],
      ['POLICY_CHECK', 'PAYMENT_DETECTED'],
      ['PAYMENT_CONFIRMED', 'CREATED'],
      ['AWAITING_PAYMENT', 'CREATED'],
      ['PAYMENT_DETECTED', 'CREATED'],
      ['CREATED', 'FULFILLED'], // Cannot skip payment & policy check
      ['CREATED', 'APPROVED'], // Cannot skip payment
      ['AWAITING_PAYMENT', 'PURCHASING'], // Cannot skip payment & policy check
    ])('strictly rejects illegal backward/skip jump: %s -> %s', (from, to) => {
      const snapshot = makeSnapshot(from as OrderState);
      expect(canTransition(from as OrderState, to as OrderState)).toBe(false);
      expect(() => transition(snapshot, to as OrderState)).toThrow(InvalidStateTransitionError);
    });
  });

  describe('4. Full Lifecycle Scenario Walkthroughs (E2E Order Paths)', () => {
    it('executes canonical Happy-Path (CREATED -> FULFILLED)', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'AWAITING_PAYMENT');
      snap = transition(snap, 'PAYMENT_DETECTED');
      snap = transition(snap, 'PAYMENT_CONFIRMED');
      snap = transition(snap, 'POLICY_CHECK');
      snap = transition(snap, 'APPROVED');
      snap = transition(snap, 'PURCHASING');
      snap = transition(snap, 'FULFILLED');

      expect(snap.state).toBe('FULFILLED');
      expect(isTerminal(snap.state)).toBe(true);
    });

    it('executes Underpaid Anomaly -> Escalated -> Refund Pending -> Refunded Path', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'AWAITING_PAYMENT');
      snap = transition(snap, 'PAYMENT_DETECTED');
      snap = transition(snap, 'UNDERPAID');
      snap = transition(snap, 'ESCALATED');
      snap = transition(snap, 'REFUND_PENDING');
      snap = transition(snap, 'REFUNDED');

      expect(snap.state).toBe('REFUNDED');
      expect(isTerminal(snap.state)).toBe(true);
    });

    it('executes Policy Blocked -> Refund Pending -> Refunded Path', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'AWAITING_PAYMENT');
      snap = transition(snap, 'PAYMENT_DETECTED');
      snap = transition(snap, 'PAYMENT_CONFIRMED');
      snap = transition(snap, 'POLICY_CHECK');
      snap = transition(snap, 'BLOCKED');
      snap = transition(snap, 'REFUND_PENDING');
      snap = transition(snap, 'REFUNDED');

      expect(snap.state).toBe('REFUNDED');
      expect(isTerminal(snap.state)).toBe(true);
    });

    it('executes Supplier Unknown -> Refund Pending -> Refunded Path', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'AWAITING_PAYMENT');
      snap = transition(snap, 'PAYMENT_DETECTED');
      snap = transition(snap, 'PAYMENT_CONFIRMED');
      snap = transition(snap, 'POLICY_CHECK');
      snap = transition(snap, 'APPROVED');
      snap = transition(snap, 'SUPPLIER_UNKNOWN');
      snap = transition(snap, 'REFUND_PENDING');
      snap = transition(snap, 'REFUNDED');

      expect(snap.state).toBe('REFUNDED');
      expect(isTerminal(snap.state)).toBe(true);
    });

    it('executes Immediate Expiration Path (CREATED -> EXPIRED)', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'EXPIRED');
      expect(snap.state).toBe('EXPIRED');
      expect(isTerminal(snap.state)).toBe(true);
    });

    it('executes Immediate Duplicate Rejection (CREATED -> DUPLICATE)', () => {
      let snap = makeSnapshot('CREATED');
      snap = transition(snap, 'DUPLICATE');
      expect(snap.state).toBe('DUPLICATE');
      expect(isTerminal(snap.state)).toBe(true);
    });
  });
});
