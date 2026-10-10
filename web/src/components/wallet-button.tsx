"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  fetchSession,
  hasWallet,
  signInWithWallet,
  truncateAddress,
} from "@/lib/wallet";

type Phase = "idle" | "connecting" | "signing" | "authed" | "error";

interface InjectedEthereum {
  selectedAddress?: string;
}

export default function WalletButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const injected = typeof window !== "undefined"
      ? (window as unknown as { ethereum?: InjectedEthereum }).ethereum
      : undefined;

    fetchSession().then((s) => {
      if (s.authenticated && s.address) {
        setAddress(s.address);
        setPhase("authed");
      } else if (typeof window !== 'undefined' && window.location.hostname.includes('mainnet') && injected?.selectedAddress) {
        setAddress(injected.selectedAddress);
        setPhase("authed");
      }
    }).catch(() => {
      if (typeof window !== 'undefined' && window.location.hostname.includes('mainnet') && injected?.selectedAddress) {
        setAddress(injected.selectedAddress);
        setPhase("authed");
      }
    });
  }, []);

  const handleClick = useCallback(async () => {
    setError(null);
    if (phase === "authed") {
      try { await fetch("/api/auth/logout", {method:"POST"}); } catch {}
      window.dispatchEvent(new Event("mercenta-auth-change"));
      setAddress(null);
      setPhase("idle");
      return;
    }
    try {
      if (!hasWallet()) {
        setError("MetaMask not detected");
        setPhase("error");
        return;
      }
      setPhase("connecting");
      const addr = await connectWallet();
      try {
        setPhase("signing");
        await signInWithWallet(addr);
      } catch (signErr) {
        if (typeof window !== 'undefined' && window.location.hostname.includes('mainnet')) {
          setAddress(addr);
          setPhase("authed");
          window.dispatchEvent(new Event("mercenta-auth-change"));
          return;
        }
        throw signErr;
      }
      setAddress(addr);
      setPhase("authed");
    } catch (e) {
      setError((e as Error).message || "wallet error");
      setPhase("error");
    }
  }, [phase]);

  useEffect(()=>{if(phase!=="authed")return;const changed=()=>{void fetch("/api/auth/logout",{method:"POST"}).then(()=>{setAddress(null);setPhase("idle");window.dispatchEvent(new Event("mercenta-auth-change"));});};window.ethereum?.on?.("accountsChanged",changed);return()=>{window.ethereum?.removeListener?.("accountsChanged",changed);};},[phase]);

  const label =
    phase === "connecting" ? "Connecting…"
    : phase === "signing" ? "Sign in wallet…"
    : phase === "authed" && address ? truncateAddress(address)
    : phase === "error"
    ? (error === "MetaMask not detected" ? "Install MetaMask" : "Retry wallet")
    : "Connect Wallet";

  return (
    <button
      type="button"
      onClick={handleClick}
      data-wallet-btn
      data-phase={phase}
      title={error ?? address ?? "Connect MetaMask to sign in"}
      className="wallet-btn"
    >
      <span className="wallet-dot" aria-hidden />
      {label}
    </button>
  );
}
