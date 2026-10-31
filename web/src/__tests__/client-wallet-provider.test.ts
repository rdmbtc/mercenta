import { beforeEach, expect, it, vi } from 'vitest';
import { createLocalProvider } from '@/lib/client-wallet-provider';
const mocks = vi.hoisted(() => ({ send: vi.fn(async () => '0x' + 'ab'.repeat(32)), chain: vi.fn(async () => 5042), gas: vi.fn(async () => 21000n), price: vi.fn(async () => 100n) }));
vi.mock('viem', async importOriginal => ({ ...await importOriginal<typeof import('viem')>(), createPublicClient: () => ({ estimateGas: mocks.gas, getGasPrice: mocks.price, getChainId: mocks.chain }), createWalletClient: () => ({ sendTransaction: mocks.send }) }));
const key = ('0x' + '78'.repeat(32)) as `0x${string}`;
const merchant = '0x58863e4a739da0e62c2eba258b7783e95d5c48ce';
beforeEach(() => { vi.clearAllMocks(); mocks.chain.mockResolvedValue(5042); });
it('sends only the reviewed exact transfer after explicit approval', async () => {
  const approve = vi.fn(async () => true);
  const local = createLocalProvider(key, 'mainnet', approve);
  await local.provider.request({ method: 'eth_sendTransaction', params: [{ from: local.address, to: merchant, value: '0xde0b6b3a7640000', expiresAt: Date.now() + 60000 }] });
  expect(approve).toHaveBeenCalledWith(expect.objectContaining({ kind: 'transaction', amount: '1', to: merchant, chain: 'Arc Mainnet (5042)' }));
  expect(mocks.send).toHaveBeenCalledWith({ to: merchant, value: 1000000000000000000n, gas: 21000n, gasPrice: 100n });
});
it('cancel, expired quote and wrong chain never broadcast', async () => {
  const local = createLocalProvider(key, 'mainnet', async () => false);
  const tx = { from: local.address, to: merchant, value: '0x1', expiresAt: Date.now() + 60000 };
  await expect(local.provider.request({ method: 'eth_sendTransaction', params: [tx] })).rejects.toThrow('cancelled');
  await expect(local.provider.request({ method: 'eth_sendTransaction', params: [{ ...tx, expiresAt: Date.now() - 1 }] })).rejects.toThrow('expired');
  mocks.chain.mockResolvedValue(5042002);
  await expect(local.provider.request({ method: 'eth_sendTransaction', params: [tx] })).rejects.toThrow('mismatch');
  expect(mocks.send).not.toHaveBeenCalled();
});
it('locking while confirmation is open invalidates that approval', async () => {
  let accept: (result: boolean) => void = () => {};
  let opened = false;
  const local = createLocalProvider(key, 'mainnet', () => new Promise(resolve => { accept = resolve; opened = true; }));
  const pending = local.provider.request({ method: 'eth_sendTransaction', params: [{ from: local.address, to: merchant, value: '0x1', expiresAt: Date.now() + 60000 }] });
  await vi.waitFor(() => expect(opened).toBe(true));
  local.lock(); accept(true);
  await expect(pending).rejects.toThrow('cancelled');
  expect(mocks.send).not.toHaveBeenCalled();
});
