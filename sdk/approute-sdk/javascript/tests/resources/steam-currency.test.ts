import { describe, it, expect } from "vitest";
import { SteamCurrencyResource } from "../../src/resources/steamCurrency.js";
import { MockTransport } from "../support/index.js";
import { makeSteamCurrencyRatesResponse } from "../factories/index.js";
import type { SteamCurrencyRatesResponse } from "../../src/models/index.js";

describe("SteamCurrencyResource", () => {
  describe("rates()", () => {
    it("should return exchange rates on success", async () => {
      const fixture = makeSteamCurrencyRatesResponse();
      const mock = new MockTransport(fixture);
      const resource = new SteamCurrencyResource(mock.transport);

      const result: SteamCurrencyRatesResponse = await resource.rates();

      expect(result.baseCurrencyCode).toBe("USD");
      expect(result.items).toHaveLength(2);
      expect(result.items[0].quoteCurrencyCode).toBe("RUB");
      expect(result.items[0].rate).toBe("92.50");
      expect(result.items[0].providerCreatedAt).toBe("2026-03-01T12:00:00Z");
      expect(result.items[1].quoteCurrencyCode).toBe("EUR");
      expect(result.items[1].rate).toBe("0.92");
      expect(result.items[1].providerCreatedAt).toBeNull();
    });

    it("should call GET /steam-currency/rates without params when no options", async () => {
      const mock = new MockTransport(makeSteamCurrencyRatesResponse());
      const resource = new SteamCurrencyResource(mock.transport);

      await resource.rates();

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/steam-currency/rates");
      expect(mock.lastCall.options).toBeUndefined();
    });

    it("should pass quotes as query parameter", async () => {
      const mock = new MockTransport(makeSteamCurrencyRatesResponse());
      const resource = new SteamCurrencyResource(mock.transport);

      await resource.rates({ quotes: ["RUB", "EUR"] });

      expect(mock.callCount).toBe(1);
      expect(mock.lastCall.method).toBe("GET");
      expect(mock.lastCall.path).toBe("/steam-currency/rates");
      expect(mock.lastCall.options?.params).toEqual({
        quotes: ["RUB", "EUR"],
      });
    });

    it("should not pass params when quotes is undefined", async () => {
      const mock = new MockTransport(makeSteamCurrencyRatesResponse());
      const resource = new SteamCurrencyResource(mock.transport);

      await resource.rates({});

      expect(mock.lastCall.options).toBeUndefined();
    });

    it("should handle nullable fields in rate items", async () => {
      const fixture = makeSteamCurrencyRatesResponse();
      const mock = new MockTransport(fixture);
      const resource = new SteamCurrencyResource(mock.transport);

      const result = await resource.rates();
      const eurRate = result.items[1];

      expect(eurRate.fetchedAt).toBeNull();
      expect(eurRate.providerCreatedAt).toBeNull();
    });
  });
});
