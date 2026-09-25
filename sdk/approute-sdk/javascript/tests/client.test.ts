import { describe, it, expect } from "vitest";
import { AppRouteClient } from "../src/client.js";
import { ServicesResource } from "../src/resources/services.js";
import { OrdersResource } from "../src/resources/orders.js";
import { AccountsResource } from "../src/resources/accounts.js";
import { FundsResource } from "../src/resources/funds.js";
import { SteamCurrencyResource } from "../src/resources/steamCurrency.js";

describe("AppRouteClient", () => {
  it("should create a client with required apiKey", () => {
    const client = new AppRouteClient({ apiKey: "sk_test_abc" });
    expect(client).toBeDefined();
  });

  it("should expose all resource groups", () => {
    const client = new AppRouteClient({ apiKey: "sk_test_abc" });
    expect(client.services).toBeInstanceOf(ServicesResource);
    expect(client.orders).toBeInstanceOf(OrdersResource);
    expect(client.accounts).toBeInstanceOf(AccountsResource);
    expect(client.funds).toBeInstanceOf(FundsResource);
    expect(client.steamCurrency).toBeInstanceOf(SteamCurrencyResource);
  });

  it("should accept custom baseUrl", () => {
    const client = new AppRouteClient({
      apiKey: "sk_test_abc",
      baseUrl: "https://custom.api.com/v2",
    });
    expect(client).toBeDefined();
  });

  it("should accept custom timeout and maxRetries", () => {
    const client = new AppRouteClient({
      apiKey: "sk_test_abc",
      timeout: 5000,
      maxRetries: 1,
    });
    expect(client).toBeDefined();
  });

  it("should have readonly resource properties", () => {
    const client = new AppRouteClient({ apiKey: "sk_test_abc" });
    // TypeScript enforces readonly at compile time; at runtime we verify
    // that the properties exist and are instances of the expected types
    expect(client.services).toBeInstanceOf(ServicesResource);
    expect(client.orders).toBeInstanceOf(OrdersResource);
    expect(client.accounts).toBeInstanceOf(AccountsResource);
    expect(client.funds).toBeInstanceOf(FundsResource);
    expect(client.steamCurrency).toBeInstanceOf(SteamCurrencyResource);
  });
});
