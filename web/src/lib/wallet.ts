"use client";

/**
 * MetaMask wallet helpers for app.mercenta.xyz.
 * No external deps beyond viem. EIP-1193 window.ethereum only.
 */
import { verifyMessage, stringToHex, isAddress } from "viem";

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function hasWallet(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

export async function connectWallet(): Promise<`0x${string}`> {
  if (!hasWallet()) throw new Error("NO_WALLET");
  const eth = window.ethereum!;
  const accounts = (await eth.request({
    method: "eth_requestAccounts",
  })) as string[];
  if (!accounts || !isAddress(accounts[0] ?? "")) throw new Error("NO_ACCOUNTS");
  return accounts[0] as `0x${string}`;
}

export function truncateAddress(addr: string, compact = false): string {
  if (addr.length <= 11) return addr;
  return compact ? `${addr.slice(0, 4)}…${addr.slice(-3)}` : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export interface SignInResult {
  address: string;
  expiresAtMs: number;
}

/** Full sign-in flow: nonce -> personal_sign -> verify -> session cookie set. */
export async function signInWithWallet(address: `0x${string}`): Promise<SignInResult> {
  const nonceRes = await fetch("/api/auth/nonce", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!nonceRes.ok) { const d = await nonceRes.json().catch(() => ({})); throw new Error(d.code ?? d.error ?? "NONCE_FAILED"); }
  const { nonce } = (await nonceRes.json()) as { nonce: string };

  const issuedAt = Date.now();
  const message = [
    "Mercenta wants you to sign in.",
    "",
    "Address: " + address.toLowerCase(),
    "Nonce: " + nonce,
    "Issued: " + new Date(issuedAt).toISOString(),
    "",
    "Signing proves wallet ownership. It does NOT authorize any payment or transfer.",
  ].join("\n");

  const eth = window.ethereum!;
  const signature = (await eth.request({
    method: "personal_sign",
    params: [stringToHex(message), address],
  })) as `0x${string}`;

  // Local pre-check (server re-verifies authoritatively)
  const valid = await verifyMessage({ address, message, signature });
  if (!valid) throw new Error("SIGNATURE_MISMATCH");

  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ address, nonce, signature, issuedAt }),
  });
  if (!verifyRes.ok) { const d = await verifyRes.json().catch(() => ({})); throw new Error(d.code ?? d.error ?? "VERIFY_FAILED"); }
  return (await verifyRes.json()) as SignInResult;
}

/** Fetch current session from the hub. */
export async function fetchSession(): Promise<{ authenticated: boolean; address: string | null }> {
  const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
  if (!res.ok) return { authenticated: false, address: null };
  const data = (await res.json()) as { authenticated: boolean; address: string | null };
  return data;
}

export async function signOut(): Promise<void> {
  // Client-side clear; server cookie expires on its own (24h TTL).
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}

export const ARC_MAINNET_CONFIG = {
  chainId: "0x13b2",
  chainName: "Arc Mainnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.arc.io"],
  blockExplorerUrls: ["https://explorer.arc.io"],
};

export const ARC_TESTNET_CONFIG = {
  chainId: "0x4cef52",
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

/**
 * Ensures the connected wallet is on the correct Arc network (Arc Mainnet by default, or Arc Testnet).
 * If the user's wallet is currently on Ethereum Mainnet or another chain, prompts an automatic switch.
 */
export async function ensureArcChain(isMainnet: boolean = true): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum?.request) return false;
  const targetChainId = isMainnet ? "0x13b2" : "0x4cef52";
  const chainConfig = isMainnet ? ARC_MAINNET_CONFIG : ARC_TESTNET_CONFIG;

  try {
    const current = (await window.ethereum.request({ method: "eth_chainId" })) as string;
    if (typeof current === "string" && current.toLowerCase() === targetChainId.toLowerCase()) {
      return true;
    }
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
    return true;
  } catch (switchError) {
    if ((switchError as { code?: number })?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [chainConfig],
        });
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

