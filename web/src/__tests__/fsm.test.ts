import { describe, it, expect } from "vitest";
import type { OrderState } from "@/lib/order-fsm.js";
import {
  transition,
  canTransition,
  isTerminal,
  InvalidStateTransitionError,
  ORDER_FLOW_STATES,
  ORDER_EXCEPTION_STATES,
} from "@/lib/order-fsm";

describe("order-fsm", () => {
  const snap = (state: OrderState) => ({ state, updatedAt: 1000 });

  describe("happy path transitions", () => {
    const happyPath: OrderState[] = [
      "CREATED",
      "AWAITING_PAYMENT",
      "PAYMENT_DETECTED",
      "PAYMENT_CONFIRMED",
      "POLICY_CHECK",
      "APPROVED",
      "PURCHASING",
      "FULFILLED",
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      it(`${happyPath[i]} → ${happyPath[i + 1]}`, () => {
        const result = transition(snap(happyPath[i]), happyPath[i + 1] as OrderState);
        expect(result.state).toBe(happyPath[i + 1]);
        expect(result.updatedAt).toBeGreaterThan(0);
      });
    }
  });

  describe("invalid transitions throw", () => {
    it("CREATED → FULFILLED throws InvalidStateTransitionError", () => {
      expect(() => transition(snap("CREATED"), "FULFILLED" as OrderState))
        .toThrow(InvalidStateTransitionError);
    });

    it("BLOCKED → PURCHASING throws", () => {
      expect(() => transition(snap("BLOCKED"), "PURCHASING" as OrderState))
        .toThrow(InvalidStateTransitionError);
    });

    it("FULFILLED → CREATED throws (terminal exit)", () => {
      expect(() => transition(snap("FULFILLED"), "CREATED" as OrderState))
        .toThrow(InvalidStateTransitionError);
    });

    it("REFUNDED → anything throws", () => {
      expect(() => transition(snap("REFUNDED"), "APPROVED" as OrderState))
        .toThrow(InvalidStateTransitionError);
    });

    it("error contains from/to/allowed fields", () => {
      try {
        transition(snap("CREATED"), "FULFILLED" as OrderState);
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidStateTransitionError);
        const err = e as InstanceType<typeof InvalidStateTransitionError>;
        expect(err.from).toBe("CREATED");
        expect(err.to).toBe("FULFILLED");
        expect(Array.isArray(err.allowed)).toBe(true);
      }
    });
  });

  describe("canTransition", () => {
    it("returns true for valid edge", () => {
      expect(canTransition("CREATED", "AWAITING_PAYMENT")).toBe(true);
    });

    it("returns false for invalid edge", () => {
      expect(canTransition("CREATED", "FULFILLED")).toBe(false);
    });
  });

  describe("isTerminal", () => {
    const terminals = ["FULFILLED", "EXPIRED", "PAYMENT_FAILED", "DUPLICATE", "REFUNDED"];
    for (const s of terminals) {
      it(`${s} is terminal`, () => expect(isTerminal(s as OrderState)).toBe(true));
    }

    it("CREATED is not terminal", () => {
      expect(isTerminal("CREATED" as OrderState)).toBe(false);
    });
  });

  describe("immutability", () => {
    it("input snapshot unchanged after transition", () => {
      const input = snap("CREATED");
      transition(input, "AWAITING_PAYMENT" as OrderState);
      expect(input.state).toBe("CREATED");
      expect(input.updatedAt).toBe(1000);
    });
  });

  describe("exception edges", () => {
    it("CREATED → EXPIRED", () => {
      expect(canTransition("CREATED", "EXPIRED")).toBe(true);
    });

    it("AWAITING_PAYMENT → PAYMENT_FAILED", () => {
      expect(canTransition("AWAITING_PAYMENT", "PAYMENT_FAILED")).toBe(true);
    });

    it("POLICY_CHECK → BLOCKED", () => {
      expect(canTransition("POLICY_CHECK", "BLOCKED")).toBe(true);
    });

    it("POLICY_CHECK → ESCALATED", () => {
      expect(canTransition("POLICY_CHECK", "ESCALATED")).toBe(true);
    });

    it("PURCHASING → REFUND_PENDING", () => {
      expect(canTransition("PURCHASING", "REFUND_PENDING")).toBe(true);
    });
  });

  describe("state arrays exported", () => {
    it("ORDER_FLOW_STATES has 8 entries", () => {
      expect(ORDER_FLOW_STATES.length).toBe(8);
    });

    it("ORDER_EXCEPTION_STATES has 9 entries", () => {
      expect(ORDER_EXCEPTION_STATES.length).toBe(9);
    });
  });
});
