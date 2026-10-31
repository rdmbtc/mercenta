import { describe, expect, it } from 'vitest';
import { encryptWallet, decryptWallet, parseVault } from '@/lib/client-wallet-vault';
import { createLocalProvider } from '@/lib/client-wallet-provider';
import { stringToHex, verifyMessage } from 'viem';
const key = ('0x' + '12'.repeat(32)) as `0x${string}`;
const password = 'test-only-long-password';
describe('client wallet vault', () => {
  it('encrypts and restores without raw secrets in the envelope', async () => {
    const vault = await encryptWallet(password, key);
    expect(JSON.stringify(vault)).not.toContain(key);
    expect(JSON.stringify(vault)).not.toContain(password);
    expect(await decryptWallet(parseVault(JSON.stringify(vault)), password)).toBe(key);
    const second = await encryptWallet(password, key);
    expect(second.iv).not.toBe(vault.iv); expect(second.salt).not.toBe(vault.salt);
  });
  it('rejects wrong password, tampering and altered address', async () => {
    const vault = await encryptWallet(password, key);
    await expect(decryptWallet(vault, 'wrong')).rejects.toThrow();
    await expect(decryptWallet({ ...vault, ciphertext: (vault.ciphertext[0] === '0' ? '1' : '0') + vault.ciphertext.slice(1) }, password)).rejects.toThrow();
    await expect(decryptWallet({ ...vault, address: '0x' + '34'.repeat(20) }, password)).rejects.toThrow();
    expect(() => parseVault(JSON.stringify({ ...vault, iterations: 1 }))).toThrow();
  });
  it('requires a strong minimum password', async () => { await expect(encryptWallet('short', key)).rejects.toThrow(); });
});
describe('local wallet signing', () => {
  const message = 'Mercenta wants you to sign in.\n\nSigning proves wallet ownership. It does NOT authorize any payment or transfer.';
  it('only signs after approval and stops signing after lock', async () => {
    const local = createLocalProvider(key, 'testnet', async () => true);
    const signature = await local.provider.request({ method: 'personal_sign', params: [stringToHex(message), local.address] }) as `0x${string}`;
    expect(await verifyMessage({ address: local.address, message, signature })).toBe(true);
    local.lock();
    await expect(local.provider.request({ method: 'eth_accounts' })).rejects.toThrow('locked');
  });
  it('rejects declined and arbitrary signatures without a transfer', async () => {
    const local = createLocalProvider(key, 'mainnet', async () => false);
    await expect(local.provider.request({ method: 'personal_sign', params: [stringToHex(message), local.address] })).rejects.toThrow('cancelled');
    await expect(local.provider.request({ method: 'personal_sign', params: [stringToHex('arbitrary signature'), local.address] })).rejects.toThrow('Unsupported');
    await expect(local.provider.request({ method: 'eth_sendTransaction', params: [{ from: local.address, to: local.address, value: '0x1' }] })).rejects.toThrow('Unsupported');
  });
});
