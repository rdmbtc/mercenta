import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export const VAULT_KEY = 'mercenta_client_wallet_v1';
export const LEGACY_KEY = 'mercenta_arc_non_custodial_wallet_v1';
const ITERATIONS = 600_000;
export type WalletVault = { version: 1; address: string; salt: string; iv: string; ciphertext: string; iterations: number };
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const bytes = (value: string) => Uint8Array.from(value.match(/../g)!, part => parseInt(part, 16));
const metadata = (vault: Omit<WalletVault, 'ciphertext'>) => encoder.encode(JSON.stringify([vault.version, vault.address, vault.salt, vault.iv, vault.iterations]));

export function parseVault(raw: string): WalletVault {
  if (raw.length > 4096) throw new Error('Invalid wallet backup.');
  const v = JSON.parse(raw);
  if (!v || v.version !== 1 || v.iterations !== ITERATIONS || typeof v.address !== 'string' || !/^0x[a-f0-9]{40}$/.test(v.address) || typeof v.salt !== 'string' || !/^[a-f0-9]{32}$/.test(v.salt) || typeof v.iv !== 'string' || !/^[a-f0-9]{24}$/.test(v.iv) || typeof v.ciphertext !== 'string' || !/^[a-f0-9]{164}$/.test(v.ciphertext)) throw new Error('Invalid wallet backup.');
  return { version: 1, address: v.address, iterations: ITERATIONS, salt: v.salt, iv: v.iv, ciphertext: v.ciphertext };
}

async function derive(password: string, salt: Uint8Array) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure browser cryptography is unavailable. Use HTTPS.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptWallet(password: string, key: `0x${string}` = generatePrivateKey()): Promise<WalletVault> {
  if (password.length < 12) throw new Error('Use a password of at least 12 characters.');
  const account = privateKeyToAccount(key);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const envelope = { version: 1 as const, address: account.address.toLowerCase(), salt: hex(salt), iv: hex(iv), iterations: ITERATIONS };
  const aes = await derive(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: metadata(envelope) }, aes, encoder.encode(key));
  return { ...envelope, ciphertext: hex(new Uint8Array(ciphertext)) };
}

export async function decryptWallet(vault: WalletVault, password: string): Promise<`0x${string}`> {
  const valid = parseVault(JSON.stringify(vault));
  try {
    const key = await derive(password, bytes(valid.salt));
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(valid.iv), additionalData: metadata(valid) }, key, bytes(valid.ciphertext));
    const privateKey = new TextDecoder().decode(plaintext) as `0x${string}`;
    if (privateKeyToAccount(privateKey).address.toLowerCase() !== valid.address) throw new Error();
    return privateKey;
  } catch { throw new Error('Incorrect password or damaged wallet backup.'); }
}

export function persistVault(vault: WalletVault) {
  const raw = JSON.stringify(parseVault(JSON.stringify(vault)));
  localStorage.setItem(VAULT_KEY, raw);
  if (localStorage.getItem(VAULT_KEY) !== raw) throw new Error('Wallet could not be saved. Do not deposit funds.');
}
