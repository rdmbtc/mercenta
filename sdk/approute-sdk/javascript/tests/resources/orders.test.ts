import { describe, it, expect } from "vitest";
import { OrdersResource } from "../../src/resources/orders.js";
import { MockTransport } from "../support/index.js";
import {
  makePurchaseResponse,
  makeDtuCheckResponse,
  makeTransactionListResponse,
} from "../factories/index.js";
import type {
  PurchaseResponse,
  DtuCheckResponse,
  TransactionListResponse,
} from "../../src/models/index.js";

describe("OrdersResource", () => {
  describe("create()", () => {
    it("should return purchase response on success", async () => {
      const fixture = makePurchaseResponse();
      const mock = new MockTransport(fixture);
      const resource = new OrdersResource(mock.transport);

      const result: PurchaseResponse = await resource.create({
        itemId: "item-001",
        productId: "prod-001",
        quantity: 1,
      });

      expect(result.transactionUuid).toBe("txn-abc-123");
      expect(result.orderId).toBe("ord-456");
      expect(result.status).toBe("completed");
      expect(result.price).toBe(48.5);
      expect(result.currency).toBe("USD");
      expect(result.result?.vouchers).toHaveLength(1);
      expect(result.result?.vouchers![0].pin).toBe("XXXX-YYYY-ZZZZ");
    });

    it("should call POST /orders with correct body", async () => {
      const mock = new MockTransport(makePurchaseResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.create({
        itemId: "item-001",
        productId: "prod-001",
        quantity: 1,
        referenceId: "ref-001",
      });

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/orders");
      expect(mock.lastCall.options?.body).toEqual({
        ordersType: "shop",
        itemId: "item-001",
        productId: "prod-001",
        quantity: 1,
        referenceId: "ref-001",
      });
    });

    it("should default ordersType to 'shop'", async () => {
      const mock = new MockTransport(makePurchaseResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.create({ itemId: "item-001" });

      expect(mock.lastCall.options?.body?.ordersType).toBe("shop");
    });

    it("should pass optional parameters correctly", async () => {
      const mock = new MockTransport(makePurchaseResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.create({
        ordersType: "dtu",
        itemId: "item-001",
        amount: 50,
        currency: "USD",
        directOrder: true,
        accountId: 1,
        fields: [{ key: "phone", value: "+1234567890" }],
      });

      const body = mock.lastCall.options?.body;
      expect(body?.ordersType).toBe("dtu");
      expect(body?.amount).toBe(50);
      expect(body?.currency).toBe("USD");
      expect(body?.directOrder).toBe(true);
      expect(body?.accountId).toBe(1);
      expect(body?.fields).toEqual([{ key: "phone", value: "+1234567890" }]);
    });

    it("should handle batch orders", async () => {
      const mock = new MockTransport(makePurchaseResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.create({
        orders: [
          { itemId: "item-001", quantity: 2 },
          { itemId: "item-002", quantity: 1 },
        ],
      });

      const body = mock.lastCall.options?.body;
      expect(body?.orders).toHaveLength(2);
    });
  });

  describe("checkDtu()", () => {
    it("should return DTU check response on success", async () => {
      const fixture = makeDtuCheckResponse();
      const mock = new MockTransport(fixture);
      const resource = new OrdersResource(mock.transport);

      const result: DtuCheckResponse = await resource.checkDtu({
        itemId: "item-001",
      });

      expect(result.canRecharge).toBe(true);
      expect(result.price).toBe(10.0);
      expect(result.currency).toBe("USD");
      expect(result.providerStatus).toBe("available");
      expect(result.attributes?.operatorName).toBe("T-Mobile");
    });

    it("should call POST /orders with checkOnly=true and ordersType=dtu", async () => {
      const mock = new MockTransport(makeDtuCheckResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.checkDtu({
        itemId: "item-001",
        amount: 10,
        currency: "USD",
      });

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/orders");
      expect(mock.lastCall.options?.body).toEqual({
        ordersType: "dtu",
        checkOnly: true,
        itemId: "item-001",
        amount: 10,
        currency: "USD",
      });
    });

    it("should pass optional fields to checkDtu", async () => {
      const mock = new MockTransport(makeDtuCheckResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.checkDtu({
        itemId: "item-001",
        fields: [{ key: "phone", value: "+1234567890" }],
      });

      expect(mock.lastCall.options?.body?.fields).toEqual([
        { key: "phone", value: "+1234567890" },
      ]);
    });
  });

  describe("list()", () => {
    it("should return transaction list on success", async () => {
      const fixture = makeTransactionListResponse();
      const mock = new MockTransport(fixture);
      const resource = new OrdersResource(mock.transport);

      const result: TransactionListResponse = await resource.list();

      expect(result.page.items).toHaveLength(1);
      expect(result.page.items[0].transactionUuid).toBe("txn-abc-123");
      expect(result.page.items[0].orderId).toBe("ord-456");
      expect(result.page.items[0].status).toBe("completed");
      expect(result.page.items[0].quantity).toBe(1);
      expect(result.page.hasNext).toBe(false);
    });

    it("should call GET /orders with default pagination", async () => {
      const mock = new MockTransport(makeTransactionListResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.list();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/orders");
      expect(mock.lastCall.options?.params).toEqual({
        limit: 50,
        offset: 0,
      });
    });

    it("should pass custom pagination and filter options", async () => {
      const mock = new MockTransport(makeTransactionListResponse());
      const resource = new OrdersResource(mock.transport);

      await resource.list({
        limit: 10,
        offset: 20,
        orderId: "ord-456",
        referenceId: "ref-001",
        unhide: true,
      });

      expect(mock.lastCall.options?.params).toEqual({
        limit: 10,
        offset: 20,
        orderId: "ord-456",
        referenceId: "ref-001",
        unhide: true,
      });
    });
  });
});
