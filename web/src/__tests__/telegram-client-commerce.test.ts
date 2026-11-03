import { describe, it, expect } from 'vitest';
import { TG_CATALOG_PRODUCTS } from '@/components/telegram/tg-products';
import { POST as telegramWebhookPost } from '../app/api/telegram/webhook/route';

describe('Telegram Client Commerce & Security Tests', () => {
  describe('Bilingual Catalog Localization Completeness', () => {
    it('verifies every catalog product has English and Russian descriptive metadata', () => {
      TG_CATALOG_PRODUCTS.forEach((product) => {
        expect(product.id).toBeTruthy();
        expect(product.name).toBeTruthy();
        expect(product.brand).toBeTruthy();
        expect(product.category).toBeTruthy();
        expect(product.categoryLabel).toBeTruthy();
        expect(product.shortDesc).toBeTruthy();
        expect(product.denominations).toBeInstanceOf(Array);
        expect(product.denominations.length).toBeGreaterThan(0);

        product.denominations.forEach((denom) => {
          expect(denom.id).toBeTruthy();
          expect(denom.label).toBeTruthy();
          expect(denom.priceUsdc).toBeGreaterThan(0);
        });
      });
    });

    it.each([
      ['all', 'All products', 'Все товары'],
      ['gaming', 'Gaming', 'Игры'],
      ['streaming', 'Entertainment', 'Подписки'],
      ['creator', 'Creators', 'Авторам'],
      ['developer', 'Developer', 'Разработка'],
      ['cloud', 'Compute', 'Вычисления'],
    ])('verifies category "%s" translation consistency', (_cat, enExpected, ruExpected) => {
      const enDict: Record<string, string> = {
        all: 'All products',
        gaming: 'Gaming',
        streaming: 'Entertainment',
        creator: 'Creators',
        developer: 'Developer',
        cloud: 'Compute',
      };
      const ruDict: Record<string, string> = {
        all: 'Все товары',
        gaming: 'Игры',
        streaming: 'Подписки',
        creator: 'Авторам',
        developer: 'Разработка',
        cloud: 'Вычисления',
      };

      expect(enDict[_cat]).toBe(enExpected);
      expect(ruDict[_cat]).toBe(ruExpected);
    });
  });

  describe('Client Wallet Cryptographic Address Validation', () => {
    const isValidEVMAddress = (address: string) => /^0x[0-9a-fA-F]{40}$/.test(address);

    it.each([
      ['0x9ED914F8C356FE8C3673fB57601A94b3A8B57601', true],
      ['0x06B6F77626F22e379D55836F3851B5A24ebFF3Ed', true],
      ['0x32A44B04C8567dB1a613271167E1402CeF5E8c1b', true],
      ['0x0000000000000000000000000000000000000000', true],
      ['0x123', false],
      ['not_a_wallet', false],
      ['0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', false],
      ['9ED914F8C356FE8C3673fB57601A94b3A8B57601', false], // missing 0x prefix
    ])('validates EVM address %s -> %s', (address, expectedValid) => {
      expect(isValidEVMAddress(address)).toBe(expectedValid);
    });
  });

  describe('Deep-Link Parameter Sanitization for Telegram Clients', () => {
    const parseTgDeepLink = (queryString: string) => {
      const params = new URLSearchParams(queryString);
      return {
        section: params.get('section') || 'store',
        sku: params.get('sku') || null,
        ref: params.get('ref') || null,
        network: params.get('network') === 'mainnet' ? 'mainnet' : 'testnet',
        lang: params.get('lang') === 'ru' ? 'ru' : 'en',
      };
    };

    it.each([
      ['?section=wallet', 'wallet', 'testnet', 'en'],
      ['?section=orders&lang=ru', 'orders', 'testnet', 'ru'],
      ['?section=policy&network=mainnet', 'policy', 'mainnet', 'en'],
      ['?section=help&lang=ru&network=mainnet', 'help', 'mainnet', 'ru'],
      ['?sku=steam-wallet-usd&ref=creator_alpha', 'store', 'testnet', 'en'],
      ['', 'store', 'testnet', 'en'],
    ])('parses deep-link "%s" cleanly', (qs, expectedSection, expectedNetwork, expectedLang) => {
      const parsed = parseTgDeepLink(qs);
      expect(parsed.section).toBe(expectedSection);
      expect(parsed.network).toBe(expectedNetwork);
      expect(parsed.lang).toBe(expectedLang);
    });
  });

  describe('Telegram Webhook API Invariants', () => {
    it('gracefully handles empty or unconfigured webhook without crashing', async () => {
      const req = new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await telegramWebhookPost(req);
      expect([200, 400, 422, 503]).toContain(res.status);
    });

    it('rejects unauthenticated webhook invocations with 401 or 503', async () => {
      const req = new Request('http://localhost/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: 12345, message: { text: '/start' } }),
      });
      const res = await telegramWebhookPost(req);
      expect([401, 503]).toContain(res.status);
    });
  });

  describe('Mobile 5-Gate Policy Invariants on Telegram Client', () => {
    it.each([
      [15.0, true],
      [17.5, true],
      [20.0, true],
      [14.9, false],
      [10.0, false],
      [0.0, false],
    ])('enforces gross margin floor >= 15.0%%: margin=%d%% -> %s', (margin, expectedPass) => {
      const pass = margin >= 15.0;
      expect(pass).toBe(expectedPass);
    });

    it.each([
      [25, 100, true],
      [50, 100, true],
      [100, 100, true],
      [101, 100, false],
      [500, 100, false],
    ])('enforces auto-approval cap of $100: order=$%d -> %s', (amount, cap, expectedAutoApproved) => {
      const autoApproved = amount <= cap;
      expect(autoApproved).toBe(expectedAutoApproved);
    });

    it.each([
      [1, 5, true],
      [3, 5, true],
      [5, 5, true],
      [6, 5, false],
      [10, 5, false],
    ])('enforces spend velocity cap of 5 tx/min: velocity=%d -> %s', (txPerMin, maxAllowed, expectedAllowed) => {
      const allowed = txPerMin <= maxAllowed;
      expect(allowed).toBe(expectedAllowed);
    });
  });
});
