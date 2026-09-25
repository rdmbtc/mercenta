import { describe, it, expect } from "vitest";
import { AccountsResource } from "../../src/resources/accounts.js";
import { MockTransport } from "../support/index.js";
import {
  makeAccountListResponse,
  makeAccountTransactionPage,
} from "../factories/index.js";
import type {
  AccountListResponse,
  AccountTransactionPage,
} from "../../src/models/index.js";

describe("AccountsResource", () => {
  describe("balances()", () => {
    it("should return account balances on success", async () => {
      const fixture = makeAccountListResponse();
      const mock = new MockTransport(fixture);
      const resource = new AccountsResource(mock.transport);

      const result: AccountListResponse = await resource.balances();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].currency).toBe("USD");
      expect(result.items[0].balance).toBe(1250.5);
      expect(result.items[0].available).toBe(1200.0);
      expect(result.items[0].overdraftLimit).toBe(0.0);
    });

    it("should call GET /accounts", async () => {
      const mock = new MockTransport(makeAccountListResponse());
      const resource = new AccountsResource(mock.transport);

      await resource.balances();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/accounts");
      expect(mock.lastCall.options).toBeUndefined();
    });

    it("should include recent activity in balances response", async () => {
      const fixture = makeAccountListResponse();
      const mock = new MockTransport(fixture);
      const resource = new AccountsResource(mock.transport);

      const result = await resource.balances();
      const activity = result.items[0].recentActivity;

      expect(activity).toHaveLength(1);
      expect(activity[0].id).toBe("act-001");
      expect(activity[0].amount).toBe(-48.5);
      expect(activity[0].operation).toBe("purchase");
    });
  });

  describe("transactions()", () => {
    it("should return transactions on success", async () => {
      const fixture = makeAccountTransactionPage();
      const mock = new MockTransport(fixture);
      const resource = new AccountsResource(mock.transport);

      const result: AccountTransactionPage = await resource.transactions();

      expect(result.totalCount).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("tx-001");
      expect(result.items[0].category).toBe("shop");
      expect(result.items[0].amount).toBe(-48.5);
      expect(result.items[0].orderId).toBe("ord-456");
    });

    it("should call GET /accounts/transactions with default pagination", async () => {
      const mock = new MockTransport(makeAccountTransactionPage());
      const resource = new AccountsResource(mock.transport);

      await resource.transactions();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/accounts/transactions");
      expect(mock.lastCall.options?.params).toEqual({
        limit: 50,
        offset: 0,
      });
    });

    it("should pass all filter options", async () => {
      const mock = new MockTransport(makeAccountTransactionPage());
      const resource = new AccountsResource(mock.transport);

      await resource.transactions({
        currency: "USD",
        category: ["shop", "funding"],
        search: "Steam",
        transactionId: "txn-abc-123",
        orderId: "ord-456",
        dateFrom: "2026-01-01",
        dateTo: "2026-03-01",
        limit: 25,
        offset: 10,
      });

      expect(mock.lastCall.options?.params).toEqual({
        currency: "USD",
        category: ["shop", "funding"],
        search: "Steam",
        transactionId: "txn-abc-123",
        orderId: "ord-456",
        dateFrom: "2026-01-01",
        dateTo: "2026-03-01",
        limit: 25,
        offset: 10,
      });
    });

    it("should handle no options (undefined)", async () => {
      const mock = new MockTransport(makeAccountTransactionPage());
      const resource = new AccountsResource(mock.transport);

      await resource.transactions(undefined);

      expect(mock.lastCall.options?.params).toEqual({
        limit: 50,
        offset: 0,
      });
    });
  });
});
