import {beforeEach, describe, expect, it, vi} from 'vitest';

const state = vi.hoisted(() => ({receipt: null as unknown}));

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: () => ({
      getTransactionReceipt: async () => {
        if (state.receipt === 'THROW') throw new Error('receipt not found');
        return state.receipt;
      },
    }),
  };
});

const {POST} = await import('@/app/api/x402/order/route');

const ROUTER = '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed';
const USDC = '0x3600000000000000000000000000000000000000';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const BUYER = '0x1111111111111111111111111111111111111111';
const topic = (a: string) => '0x' + '0'.repeat(24) + a.slice(2).toLowerCase();
const units = (n: bigint) => '0x' + n.toString(16).padStart(64, '0');

function receipt(to: string, value: bigint) {
  return {
    status: 'success',
    to,
    blockNumber: 42n,
    logs: [{address: USDC, topics: [TRANSFER, topic(BUYER), topic(ROUTER)], data: units(value)}],
  };
}

async function post(body: Record<string, unknown>) {
  const res = await POST(new Request('http://localhost/api/x402/order', {method: 'POST', body: JSON.stringify(body)}));
  return {status: res.status, json: await res.json() as Record<string, any>};
}

describe('x402 order delivery requires a verified payment', () => {
  beforeEach(() => { state.receipt = null; });

  it('challenges when no payment proof is supplied', async () => {
    const {status, json} = await post({productId: 'gaming-steam-voucher'});
    expect(status).toBe(402);
    expect(json.challenge.recipient).toBe(ROUTER);
  });

  it('rejects unknown products instead of falling back to a default price', async () => {
    const {status, json} = await post({productId: 'free-money', txHash: '0x' + 'a'.repeat(64)});
    expect(status).toBe(400);
    expect(json.error).toBe('UNKNOWN_PRODUCT');
  });

  it('never delivers when the receipt is unavailable', async () => {
    state.receipt = 'THROW';
    const {status, json} = await post({txHash: '0x' + 'b'.repeat(64)});
    expect(status).toBe(202);
    expect(json.error).toBe('PAYMENT_PENDING');
    expect(json.itemCode).toBeUndefined();
  });

  it('rejects a payment sent to any other recipient', async () => {
    state.receipt = receipt(BUYER, 5_000000n);
    const {status, json} = await post({txHash: '0x' + 'c'.repeat(64)});
    expect(status).toBe(402);
    expect(json.error).toBe('PAYMENT_RECIPIENT_MISMATCH');
  });

  it('rejects an underpaid transfer', async () => {
    state.receipt = receipt(ROUTER, 1_000000n);
    const {status, json} = await post({txHash: '0x' + 'd'.repeat(64)});
    expect(status).toBe(402);
    expect(json.error).toBe('PAYMENT_AMOUNT_MISMATCH');
  });

  it('accepts a direct ERC-20 transfer, where the transaction target is the token', async () => {
    state.receipt = receipt(USDC, 4_990000n);
    const {status, json} = await post({productId: 'roblox-voucher', txHash: '0x' + 'f'.repeat(64)});
    expect(status).toBe(200);
    expect(json.settlement.verifiedTransfer).toBe(true);
  });

  it('delivers exactly once per payment hash', async () => {
    state.receipt = receipt(ROUTER, 5_000000n);
    const txHash = '0x' + 'e'.repeat(64);
    const first = await post({productId: 'gaming-steam-voucher', txHash});
    expect(first.status).toBe(200);
    expect(first.json.settlement.verifiedTransfer).toBe(true);
    expect(first.json.itemCode).toMatch(/^MCT-ARC-/);

    const replay = await post({productId: 'gaming-steam-voucher', txHash});
    expect(replay.status).toBe(409);
    expect(replay.json.error).toBe('PAYMENT_ALREADY_SETTLED');
  });
});
