import { describe, it, expect } from 'vitest';
import { GET } from '../app/api/liquidity/crosschain-quote/route';

describe('Universal Cross-Chain Top-Up API (/api/liquidity/crosschain-quote)', () => {
  describe('Supported Network Discovery', () => {
    it('returns all 5 supported chains on any GET request', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.supportedChains).toBeInstanceOf(Array);
      expect(data.supportedChains.length).toBe(5);

      const chainIds = data.supportedChains.map((c: { id: string }) => c.id);
      expect(chainIds).toContain('base');
      expect(chainIds).toContain('arbitrum');
      expect(chainIds).toContain('solana');
      expect(chainIds).toContain('ethereum');
      expect(chainIds).toContain('polygon');
    });

    it('identifies Base Mainnet as the recommended fast route', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote?source=base');
      const res = await GET(req);
      const data = await res.json();
      const baseEntry = data.supportedChains.find((c: { id: string }) => c.id === 'base');
      expect(baseEntry.recommended).toBe(true);
      expect(baseEntry.estimatedSeconds).toBe(30);
    });
  });

  describe('Route-Specific Quotes & Net Received Calculations', () => {
    it.each([
      ['base', 100, 0.05, 99.95, 30, 'Base Mainnet', 8453],
      ['arbitrum', 250, 0.05, 249.95, 40, 'Arbitrum One', 42161],
      ['solana', 500, 0.15, 499.85, 75, 'Solana Mainnet', 'solana-mainnet'],
      ['ethereum', 1000, 0.50, 999.50, 120, 'Ethereum Mainnet', 1],
      ['polygon', 150, 0.05, 149.95, 50, 'Polygon PoS', 137],
    ])(
      'calculates quote for source="%s" with amount=%d USDC',
      async (source, amount, expectedFee, expectedNet, expectedSecs, expectedName, expectedChainId) => {
        const req = new Request(
          `http://localhost/api/liquidity/crosschain-quote?source=${source}&amount=${amount}`
        );
        const res = await GET(req);
        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data.route.sourceChain).toBe(source);
        expect(data.route.sourceChainName).toBe(expectedName);
        expect(data.route.sourceChainId).toBe(expectedChainId);
        expect(data.requestedAmountUsdc).toBe(amount);
        expect(data.route.bridgeFeeUsdc).toBe(expectedFee);
        expect(data.route.estimatedSeconds).toBe(expectedSecs);
        expect(data.netReceivedUsdc).toBeCloseTo(expectedNet, 4);
        expect(data.destinationChain).toBe('Arc Mainnet');
        expect(data.destinationChainId).toBe(5042);
        expect(data.route.protocol).toContain('CCTP V2');
      }
    );
  });

  describe('Destination Wallet Binding', () => {
    it('binds destination_wallet address when provided', async () => {
      const dest = '0x9ED914F8C356FE8C3673fB57601A94b3A8B5760';
      const req = new Request(
        `http://localhost/api/liquidity/crosschain-quote?source=base&amount=100&destination_wallet=${dest}`
      );
      const res = await GET(req);
      const data = await res.json();
      expect(data.destinationWallet).toBe(dest);
    });

    it('defaults to zero address when destination_wallet is omitted', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote?source=base&amount=50');
      const res = await GET(req);
      const data = await res.json();
      expect(data.destinationWallet).toBe('0x0000000000000000000000000000000000000000');
    });
  });

  describe('Resilience & Boundary Values', () => {
    it.each([
      ['BASE', 'base'],
      ['ArBiTrUm', 'arbitrum'],
      ['sOlAnA', 'solana'],
      ['ETHEREUM', 'ethereum'],
      ['PoLyGoN', 'polygon'],
    ])('normalizes mixed case source parameter: "%s" -> "%s"', async (input, expected) => {
      const req = new Request(`http://localhost/api/liquidity/crosschain-quote?source=${input}`);
      const res = await GET(req);
      const data = await res.json();
      expect(data.route.sourceChain).toBe(expected);
    });

    it('gracefully falls back to Base when unknown chain requested', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote?source=unknown_network_xyz');
      const res = await GET(req);
      const data = await res.json();
      expect(data.route.sourceChain).toBe('base');
    });

    it('defaults amount to 50 when amount param is missing or empty', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote?source=base');
      const res = await GET(req);
      const data = await res.json();
      expect(data.requestedAmountUsdc).toBe(50);
      expect(data.netReceivedUsdc).toBe(49.95); // 50 - 0.05
    });

    it('prevents negative netReceived when amount is smaller than bridge fee', async () => {
      const req = new Request('http://localhost/api/liquidity/crosschain-quote?source=ethereum&amount=0.10');
      const res = await GET(req);
      const data = await res.json();
      // Ethereum bridge fee is 0.50, so amount 0.10 - 0.50 = max(0, -0.40) = 0
      expect(data.netReceivedUsdc).toBe(0);
    });
  });

  describe('Multi-Client Batch Quotes (Simulating 15 Client Threads)', () => {
    it('concurrently serves quotes to 15 different clients across different source chains', async () => {
      const clientRequests = [
        { source: 'base', amount: 50 },
        { source: 'base', amount: 150 },
        { source: 'base', amount: 500 },
        { source: 'arbitrum', amount: 75 },
        { source: 'arbitrum', amount: 200 },
        { source: 'arbitrum', amount: 1000 },
        { source: 'solana', amount: 100 },
        { source: 'solana', amount: 300 },
        { source: 'solana', amount: 1500 },
        { source: 'ethereum', amount: 500 },
        { source: 'ethereum', amount: 2500 },
        { source: 'polygon', amount: 25 },
        { source: 'polygon', amount: 120 },
        { source: 'polygon', amount: 600 },
        { source: 'base', amount: 2500 },
      ];

      const responses = await Promise.all(
        clientRequests.map((cr) =>
          GET(
            new Request(
              `http://localhost/api/liquidity/crosschain-quote?source=${cr.source}&amount=${cr.amount}`
            )
          ).then((r) => r.json())
        )
      );

      expect(responses.length).toBe(15);
      responses.forEach((res, i) => {
        const cr = clientRequests[i];
        expect(res.route.sourceChain).toBe(cr.source);
        expect(res.requestedAmountUsdc).toBe(cr.amount);
        expect(res.netReceivedUsdc).toBe(Math.max(0, cr.amount - res.route.bridgeFeeUsdc));
      });
    });
  });
});
