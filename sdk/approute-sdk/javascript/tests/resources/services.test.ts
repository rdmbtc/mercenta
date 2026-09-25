import { describe, it, expect } from "vitest";
import { ServicesResource } from "../../src/resources/services.js";
import { MockTransport } from "../support/index.js";
import { NotFoundError } from "../../src/errors/index.js";
import {
  makeProductListResponse,
  makeProductGetResponse,
  makeProductStockResponse,
  makeProductItem,
  makeItemLookupRequestItem,
  makeItemLookupRow,
  makeItemLookupResponse,
} from "../factories/index.js";
import type {
  ProductListResponse,
  Product,
  ProductItem,
  ProductStockResponse,
  ItemLookupResponse,
} from "../../src/models/index.js";

describe("ServicesResource", () => {
  describe("list()", () => {
    it("should return product list on success", async () => {
      const fixture = makeProductListResponse();
      const mock = new MockTransport(fixture);
      const resource = new ServicesResource(mock.transport);

      const result: ProductListResponse = await resource.list();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("prod-001");
      expect(result.items[0].name).toBe("Steam Wallet 50 USD");
      expect(result.items[0].type).toBe("voucher");
      expect(result.items[0].items).toHaveLength(1);
      expect(result.items[0].items[0].price).toBe(48.5);
      expect(result.hasNext).toBe(false);
    });

    it("should call GET /services", async () => {
      const mock = new MockTransport(makeProductListResponse());
      const resource = new ServicesResource(mock.transport);

      await resource.list();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/services");
      expect(mock.lastCall.options).toBeUndefined();
    });

    it("should include fields in product list", async () => {
      const fixture = makeProductListResponse();
      const mock = new MockTransport(fixture);
      const resource = new ServicesResource(mock.transport);

      const result = await resource.list();
      const fields = result.items[0].fields;

      expect(fields).toHaveLength(1);
      expect(fields![0].key).toBe("email");
      expect(fields![0].type).toBe("text");
      expect(fields![0].required).toBe(true);
      expect(fields![0].validation?.pattern).toBe("^[^@]+@[^@]+$");
    });
  });

  describe("get()", () => {
    it("should return a single product on success", async () => {
      const fixture = makeProductGetResponse();
      const mock = new MockTransport(fixture);
      const resource = new ServicesResource(mock.transport);

      const result: Product = await resource.get("prod-001");

      expect(result.id).toBe("prod-001");
      expect(result.name).toBe("Steam Wallet 50 USD");
      expect(result.countryCode).toBe("US");
      expect(result.categoryName).toBe("Gaming");
    });

    it("should call GET /services/:id", async () => {
      const mock = new MockTransport(makeProductGetResponse());
      const resource = new ServicesResource(mock.transport);

      await resource.get("prod-001");

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/services/prod-001");
    });

    it("should propagate errors from transport", async () => {
      const error = new NotFoundError("NOT_FOUND", "Product not found", "trace-1", 404);
      const mock = new MockTransport().setError(error);
      const resource = new ServicesResource(mock.transport);

      await expect(resource.get("unknown")).rejects.toThrow(NotFoundError);
    });
  });

  describe("stock()", () => {
    it("should return stock information on success", async () => {
      const fixture = makeProductStockResponse();
      const mock = new MockTransport(fixture);
      const resource = new ServicesResource(mock.transport);

      const result: ProductStockResponse = await resource.stock("prod-001");

      expect(result.productId).toBe("prod-001");
      expect(result.items).toHaveLength(2);
      expect(result.items[0].itemId).toBe("item-001");
      expect(result.items[0].stock).toBe(150);
      expect(result.items[1].stock).toBeNull();
    });

    it("should call GET /services/:id/stock", async () => {
      const mock = new MockTransport(makeProductStockResponse());
      const resource = new ServicesResource(mock.transport);

      await resource.stock("prod-001");

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/services/prod-001/stock");
    });
  });

  describe("getItem()", () => {
    it("should return a single ProductItem on success", async () => {
      const fixture = makeProductItem({ id: "item-1", price: 12.34 });
      const mock = new MockTransport(fixture);
      const resource = new ServicesResource(mock.transport);

      const result: ProductItem = await resource.getItem("svc-1", "item-1");

      expect(result.id).toBe("item-1");
      expect(result.price).toBe(12.34);
    });

    it("should call GET /services/:serviceId/items/:itemId", async () => {
      const mock = new MockTransport(makeProductItem());
      const resource = new ServicesResource(mock.transport);

      await resource.getItem("svc-1", "item-1");

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/services/svc-1/items/item-1");
      // GET — no body should be sent
      expect(mock.lastCall.options?.body).toBeUndefined();
    });

    it("should propagate NotFoundError from transport", async () => {
      const error = new NotFoundError(
        "NOT_FOUND",
        "Item not found",
        "trace-2",
        404,
      );
      const mock = new MockTransport().setError(error);
      const resource = new ServicesResource(mock.transport);

      await expect(resource.getItem("svc-1", "missing")).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("lookupItems()", () => {
    it("should return ItemLookupResponse on success", async () => {
      const mock = new MockTransport(makeItemLookupResponse());
      const resource = new ServicesResource(mock.transport);

      const result: ItemLookupResponse = await resource.lookupItems([
        makeItemLookupRequestItem({ serviceId: "svc-1", itemId: "item-1" }),
        makeItemLookupRequestItem({ serviceId: "svc-1", itemId: "item-2" }),
      ]);

      expect(result.items).toHaveLength(3);
    });

    it("should call POST /services/items/lookup with the items body", async () => {
      const mock = new MockTransport(makeItemLookupResponse());
      const resource = new ServicesResource(mock.transport);

      await resource.lookupItems([
        makeItemLookupRequestItem({ serviceId: "svc-1", itemId: "item-1" }),
        makeItemLookupRequestItem({ serviceId: "svc-2", itemId: "item-9" }),
      ]);

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/services/items/lookup");
      expect(mock.lastCall.options?.body).toEqual({
        items: [
          { serviceId: "svc-1", itemId: "item-1" },
          { serviceId: "svc-2", itemId: "item-9" },
        ],
      });
    });

    it("should decode mixed-outcome response (hit + service_not_found + item_not_found)", async () => {
      const mock = new MockTransport(makeItemLookupResponse());
      const resource = new ServicesResource(mock.transport);

      const result = await resource.lookupItems([
        makeItemLookupRequestItem(),
      ]);

      // Row 0: hit
      expect(result.items[0].found).toBe(true);
      expect(result.items[0].item).not.toBeNull();
      expect(result.items[0].error).toBeNull();
      // Row 1: service_not_found
      expect(result.items[1].found).toBe(false);
      expect(result.items[1].item).toBeNull();
      expect(result.items[1].error).toBe("service_not_found");
      // Row 2: item_not_found
      expect(result.items[2].found).toBe(false);
      expect(result.items[2].item).toBeNull();
      expect(result.items[2].error).toBe("item_not_found");
    });

    it("should preserve input order in the response (backend contract)", async () => {
      const rows = [
        makeItemLookupRow({ serviceId: "svc-A", itemId: "item-X" }),
        makeItemLookupRow({ serviceId: "svc-B", itemId: "item-Y" }),
        makeItemLookupRow({ serviceId: "svc-C", itemId: "item-Z" }),
      ];
      const mock = new MockTransport(makeItemLookupResponse({ items: rows }));
      const resource = new ServicesResource(mock.transport);

      const result = await resource.lookupItems([
        makeItemLookupRequestItem({ serviceId: "svc-A", itemId: "item-X" }),
        makeItemLookupRequestItem({ serviceId: "svc-B", itemId: "item-Y" }),
        makeItemLookupRequestItem({ serviceId: "svc-C", itemId: "item-Z" }),
      ]);

      expect(result.items.map((r) => [r.serviceId, r.itemId])).toEqual([
        ["svc-A", "item-X"],
        ["svc-B", "item-Y"],
        ["svc-C", "item-Z"],
      ]);
    });

    it("should reject empty input client-side without an HTTP call", async () => {
      const mock = new MockTransport(makeItemLookupResponse());
      const resource = new ServicesResource(mock.transport);

      await expect(resource.lookupItems([])).rejects.toThrow(
        "items must not be empty",
      );
      // Critical: rejection must be client-side — zero HTTP calls.
      expect(mock.callCount).toBe(0);
    });

    it("should reject >100 items client-side without an HTTP call", async () => {
      const mock = new MockTransport(makeItemLookupResponse());
      const resource = new ServicesResource(mock.transport);

      const tooMany = Array.from({ length: 101 }, (_, i) =>
        makeItemLookupRequestItem({ serviceId: "svc-1", itemId: `item-${i}` }),
      );

      await expect(resource.lookupItems(tooMany)).rejects.toThrow(
        "at most 100",
      );
      // Critical: rejection must be client-side — zero HTTP calls.
      expect(mock.callCount).toBe(0);
    });
  });
});
