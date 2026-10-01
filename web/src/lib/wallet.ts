"use client";

/**
 * MetaMask wallet helpers for app.mercenta.xyz.
 * No external deps beyond viem. EIP-1193 window.ethereum only.
 */
import { verifyMessage } from "viem";

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
  if (!accounts || accounts.length === 0) throw new Error("NO_ACCOUNTS");
  return accounts[0] as `0x${string}`;
}

export function truncateAddress(addr: string): string {
  return addr.length <= 11 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
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
  if (!nonceRes.ok) throw new Error("NONCE_FAILED");
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
    params: [message, address],
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
  if (!verifyRes.ok) throw new Error("VERIFY_FAILED");
  return (await verifyRes.json()) as SignInResult;
}

/** Fetch current session from the hub. */
export async function fetchSession(): Promise<{ authenticated: boolean; address: string | null }> {
  const res = await fetch("/api/me", { credentials: "same-origin" });
  if (!res.ok) return { authenticated: false, address: null };
  const data = (await res.json()) as { authenticated: boolean; address: string | null };
  return data;
}

export async function signOut(): Promise<void> {
  // Client-side clear; server cookie expires on its own (24h TTL).
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
}
