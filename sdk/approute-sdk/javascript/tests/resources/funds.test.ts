import { describe, it, expect } from "vitest";
import { FundsResource } from "../../src/resources/funds.js";
import { MockTransport } from "../support/index.js";
import {
  makeFundingMethodsResponse,
  makeFundingInvoice,
  makeFundingInvoiceList,
  makeFundingInvoiceTimeLeft,
  makeTonDepositState,
  makeBybitState,
} from "../factories/index.js";
import type {
  FundingMethodsResponse,
  FundingInvoice,
  FundingInvoiceList,
  FundingInvoiceTimeLeft,
  TonDepositState,
  BybitState,
} from "../../src/models/index.js";

describe("FundsResource", () => {
  describe("methods()", () => {
    it("should return funding methods on success", async () => {
      const fixture = makeFundingMethodsResponse();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: FundingMethodsResponse = await resource.methods();

      expect(result.items).toHaveLength(1);
      expect(result.items[0].code).toBe("USDT_TRC20");
      expect(result.items[0].name).toBe("USDT (TRC-20)");
      expect(result.items[0].minAmount).toBe(10.0);
      expect(result.items[0].commission).toBe(0.0);
      expect(result.items[0].ttlMinutes).toBe(60);
      expect(result.items[0].confirmationsRequired).toBe(20);
    });

    it("should call GET /funds/methods", async () => {
      const mock = new MockTransport(makeFundingMethodsResponse());
      const resource = new FundsResource(mock.transport);

      await resource.methods();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/methods");
    });
  });

  describe("createInvoice()", () => {
    it("should return created invoice on success", async () => {
      const fixture = makeFundingInvoice();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: FundingInvoice = await resource.createInvoice({
        methodCode: "USDT_TRC20",
        amount: 100,
      });

      expect(result.id).toBe("inv-001");
      expect(result.methodCode).toBe("USDT_TRC20");
      expect(result.amountExpected).toBe(100.0);
      expect(result.status).toBe("pending");
      expect(result.address).toBe("TXyz123abc");
      expect(result.direction).toBe("incoming");
    });

    it("should call POST /funds/invoices with correct body", async () => {
      const mock = new MockTransport(makeFundingInvoice());
      const resource = new FundsResource(mock.transport);

      await resource.createInvoice({
        methodCode: "USDT_TRC20",
        amount: 100,
      });

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/funds/invoices");
      expect(mock.lastCall.options?.body).toEqual({
        methodCode: "USDT_TRC20",
        amount: 100,
      });
    });
  });

  describe("listInvoices()", () => {
    it("should return invoice list on success", async () => {
      const fixture = makeFundingInvoiceList();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: FundingInvoiceList = await resource.listInvoices();

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe("inv-001");
    });

    it("should call GET /funds/invoices with default pagination", async () => {
      const mock = new MockTransport(makeFundingInvoiceList());
      const resource = new FundsResource(mock.transport);

      await resource.listInvoices();

      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/invoices");
      expect(mock.lastCall.options?.params).toEqual({
        limit: 50,
        offset: 0,
      });
    });

    it("should pass all filter options", async () => {
      const mock = new MockTransport(makeFundingInvoiceList());
      const resource = new FundsResource(mock.transport);

      await resource.listInvoices({
        status: ["pending", "confirming"],
        methodCode: ["USDT_TRC20"],
        search: "inv-001",
        invoiceId: "inv-001",
        createdFrom: "2026-01-01",
        createdTo: "2026-03-01",
        withTx: true,
        limit: 10,
        offset: 0,
      });

      expect(mock.lastCall.options?.params).toEqual({
        status: ["pending", "confirming"],
        methodCode: ["USDT_TRC20"],
        search: "inv-001",
        invoiceId: "inv-001",
        createdFrom: "2026-01-01",
        createdTo: "2026-03-01",
        withTx: true,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe("getInvoice()", () => {
    it("should return a single invoice on success", async () => {
      const fixture = makeFundingInvoice();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: FundingInvoice = await resource.getInvoice("inv-001");

      expect(result.id).toBe("inv-001");
      expect(result.status).toBe("pending");
    });

    it("should call GET /funds/invoices/:id", async () => {
      const mock = new MockTransport(makeFundingInvoice());
      const resource = new FundsResource(mock.transport);

      await resource.getInvoice("inv-001");

      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/invoices/inv-001");
    });
  });

  describe("checkInvoice()", () => {
    it("should call POST /funds/invoices/:id/check", async () => {
      const mock = new MockTransport(makeFundingInvoice());
      const resource = new FundsResource(mock.transport);

      await resource.checkInvoice("inv-001");

      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/funds/invoices/inv-001/check");
    });
  });

  describe("invoiceTimeLeft()", () => {
    it("should return time left on success", async () => {
      const fixture = makeFundingInvoiceTimeLeft();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: FundingInvoiceTimeLeft =
        await resource.invoiceTimeLeft("inv-001");

      expect(result.invoiceId).toBe("inv-001");
      expect(result.secondsLeft).toBe(3200);
      expect(result.expired).toBe(false);
    });

    it("should call GET /funds/invoices/:id/time-left", async () => {
      const mock = new MockTransport(makeFundingInvoiceTimeLeft());
      const resource = new FundsResource(mock.transport);

      await resource.invoiceTimeLeft("inv-001");

      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/invoices/inv-001/time-left");
    });
  });

  describe("tonDeposit()", () => {
    it("should return TON deposit state on success", async () => {
      const fixture = makeTonDepositState();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: TonDepositState = await resource.tonDeposit();

      expect(result.address).toBe(
        "EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF78p7Av",
      );
      expect(result.memoTag).toBe("123456");
    });

    it("should call GET /funds/ton/deposit", async () => {
      const mock = new MockTransport(makeTonDepositState());
      const resource = new FundsResource(mock.transport);

      await resource.tonDeposit();

      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/ton/deposit");
    });
  });

  describe("bybitState()", () => {
    it("should return Bybit state on success", async () => {
      const fixture = makeBybitState();
      const mock = new MockTransport(fixture);
      const resource = new FundsResource(mock.transport);

      const result: BybitState = await resource.bybitState();

      expect(result.recipientUid).toBe("bybit-uid-001");
      expect(result.linked).toBe(true);
      expect(result.yourUid).toBe("bybit-uid-002");
    });

    it("should call GET /funds/bybit/state", async () => {
      const mock = new MockTransport(makeBybitState());
      const resource = new FundsResource(mock.transport);

      await resource.bybitState();

      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/funds/bybit/state");
    });
  });

  describe("bybitAttach()", () => {
    it("should call POST /funds/bybit/attach with uid in body", async () => {
      const mock = new MockTransport(makeBybitState());
      const resource = new FundsResource(mock.transport);

      await resource.bybitAttach("bybit-uid-002");

      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/funds/bybit/attach");
      expect(mock.lastCall.options?.body).toEqual({ uid: "bybit-uid-002" });
    });
  });

  describe("bybitUnlink()", () => {
    it("should call POST /funds/bybit/unlink", async () => {
      const mock = new MockTransport(makeBybitState());
      const resource = new FundsResource(mock.transport);

      await resource.bybitUnlink();

      expect(mock.lastCall.method).toBe("POST");
      expect(mock.lastCall.path).toBe("/funds/bybit/unlink");
    });
  });
});
