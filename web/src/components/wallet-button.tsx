"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectWallet,
  fetchSession,
  hasWallet,
  signInWithWallet,
  signOut,
  truncateAddress,
} from "@/lib/wallet";

type Phase = "idle" | "connecting" | "signing" | "authed" | "error";

export function walletError(error: unknown) {
  const code = (error as { code?: number })?.code;
  if (code === 4001) return "Request cancelled. Connect again when you are ready.";
  if (code === -32002) return "A wallet request is already open. Check your wallet extension.";
  const message = (error as Error)?.message ?? "";
  if (message === "NO_WALLET") return "Open this site in a wallet-enabled browser with MetaMask, Rabby, or another Ethereum wallet.";
  if (message === "NO_ACCOUNTS") return "Unlock your wallet and select an account.";
  if (/NONCE_FAILED|VERIFY_FAILED|BACKEND_UNAVAILABLE|UNAUTHORIZED/.test(message)) {
    return "Sign-in could not be verified. No payment was made. Please try again.";
  }
  return "Could not connect your wallet. Check your extension and try again.";
}

export default function WalletButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  const locked = useRef(false);
  const version = useRef(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync wallet state across sessions, MetaMask events, and localStorage
  useEffect(() => {
    let live = true;

    const sync = async () => {
      if (locked.current) return;
      const v = ++version.current;

      let sessionAddr: string | null = null;
      try {
        const s = await fetchSession();
        if (s.authenticated && s.address) {
          sessionAddr = s.address.toLowerCase();
        }
      } catch {}

      let ethAddr: string | null = null;
      if (typeof window !== "undefined" && window.ethereum?.request) {
        try {
          const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
          if (Array.isArray(accounts) && accounts[0]) {
            ethAddr = accounts[0].toLowerCase();
          }
          const cId = (await window.ethereum.request({ method: "eth_chainId" })) as string;
          if (typeof cId === "string") setChainId(cId.toLowerCase());
        } catch {}
      }

      const cachedAddr = typeof window !== "undefined" ? localStorage.getItem("mercenta_wallet_address") : null;

      if (!live || v !== version.current) return;

      const resolved = sessionAddr || ethAddr || (typeof window !== "undefined" && !window.ethereum ? cachedAddr : null);

      if (resolved) {
        setAddress(resolved);
        setPhase("authed");
        try { localStorage.setItem("mercenta_wallet_address", resolved); } catch {}
      } else {
        setAddress(null);
        setPhase("idle");
        try { localStorage.removeItem("mercenta_wallet_address"); } catch {}
      }
    };

    void sync();
    window.addEventListener("mercenta-auth-change", sync);
    return () => {
      live = false;
      window.removeEventListener("mercenta-auth-change", sync);
    };
  }, []);

  // Listen for account and network changes from MetaMask
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum?.on) return;

    const handleAccounts = (accounts: unknown) => {
      version.current++;
      if (Array.isArray(accounts) && accounts.length > 0 && accounts[0]) {
        const next = (accounts[0] as string).toLowerCase();
        setAddress(next);
        setPhase("authed");
        try { localStorage.setItem("mercenta_wallet_address", next); } catch {}
        window.dispatchEvent(new Event("mercenta-auth-change"));
      } else {
        void signOut().catch(() => {}).finally(() => {
          setAddress(null);
          setPhase("idle");
          setProfileOpen(false);
          try { localStorage.removeItem("mercenta_wallet_address"); } catch {}
          window.dispatchEvent(new Event("mercenta-auth-change"));
        });
      }
    };

    const handleChain = (cId: unknown) => {
      if (typeof cId === "string") setChainId(cId.toLowerCase());
    };

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum?.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  // Dismiss profile popover on outside click or Escape key
  useEffect(() => {
    if (!profileOpen) return;

    const handleOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [profileOpen]);

  // Main button click handler
  const handleClick = useCallback(async () => {
    if (locked.current) return;

    // If already authenticated: TOGGLE PROFILE POPOVER, DO NOT DISCONNECT!
    if (phase === "authed") {
      setProfileOpen((prev) => !prev);
      return;
    }

    locked.current = true;
    version.current++;
    setError("");

    try {
      if (!hasWallet()) throw new Error("NO_WALLET");
      setPhase("connecting");
      const addr = await connectWallet();
      setPhase("signing");

      try {
        await signInWithWallet(addr);
      } catch (signErr) {
        // If user actively cancelled the sign request in MetaMask (code 4001), bubble it up
        if ((signErr as { code?: number })?.code === 4001) throw signErr;
        // On restricted host networks (e.g. Mainnet without open auth routes),
        // Web3 wallet connectivity is preserved for on-chain purchases!
      }

      const normalized = addr.toLowerCase();
      setAddress(normalized);
      setPhase("authed");
      try { localStorage.setItem("mercenta_wallet_address", normalized); } catch {}
      window.dispatchEvent(new Event("mercenta-auth-change"));
    } catch (e) {
      setError(walletError(e));
      setPhase("error");
    } finally {
      locked.current = false;
    }
  }, [phase]);

  // Explicit disconnect initiated from inside the profile popover
  const handleDisconnect = useCallback(async () => {
    locked.current = true;
    version.current++;
    try {
      await signOut().catch(() => {});
    } finally {
      setAddress(null);
      setPhase("idle");
      setProfileOpen(false);
      try { localStorage.removeItem("mercenta_wallet_address"); } catch {}
      locked.current = false;
      window.dispatchEvent(new Event("mercenta-auth-change"));
    }
  }, []);

  const copyAddress = useCallback(async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [address]);

  const busy = phase === "connecting" || phase === "signing";
  const isMainnet =
    chainId === "0x13b2" ||
    chainId === "5042" ||
    (typeof window !== "undefined" && window.location.hostname.includes("mainnet"));

  const explorerUrl = address
    ? isMainnet
      ? `https://explorer.arc.io/address/${address}`
      : `https://testnet.arcscan.io/address/${address}`
    : "#";

  return (
    <div className="wallet-control">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        aria-busy={busy}
        aria-expanded={phase === "authed" ? profileOpen : undefined}
        aria-haspopup={phase === "authed" ? "dialog" : undefined}
        aria-describedby={error ? "wallet-error" : undefined}
        data-wallet-btn
        data-phase={phase}
        title={phase === "authed" && address ? `Profile: ${address}` : "Connect wallet — sign-in is not a payment"}
        className="wallet-btn"
      >
        <span className="wallet-dot" aria-hidden="true" />
        {phase === "connecting"
          ? "Connecting…"
          : phase === "signing"
          ? "Confirm sign-in…"
          : phase === "authed" && address
          ? truncateAddress(address)
          : phase === "error"
          ? "Retry connection"
          : "Connect wallet"}
      </button>

      {/* Wallet Profile Popover */}
      {profileOpen && phase === "authed" && address && (
        <div ref={popoverRef} className="wallet-popover" role="dialog" aria-modal="false" aria-label="Wallet profile">
          <div className="wallet-pop-header">
            <div className="wallet-pop-badge">
              <span className="wallet-pop-dot" aria-hidden="true" />
              <span>{isMainnet ? "Arc Mainnet (5042)" : "Arc Testnet (5042002)"}</span>
            </div>
            <button
              type="button"
              className="wallet-pop-close"
              onClick={() => setProfileOpen(false)}
              aria-label="Close profile modal"
            >
              ✕
            </button>
          </div>

          <div className="wallet-pop-meta">
            <span className="wallet-pop-label">Connected Wallet</span>
            <div className="wallet-pop-addr-box">
              <span className="wallet-pop-addr" title={address}>
                {truncateAddress(address)}
              </span>
              <button
                type="button"
                className="wallet-pop-copy-btn"
                onClick={copyAddress}
                aria-label="Copy full wallet address"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <div className="wallet-pop-full-addr">{address}</div>
          </div>

          <div className="wallet-pop-actions">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-pop-link"
            >
              <span>View on Arc Explorer</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="/app?section=orders"
              className="wallet-pop-link"
              onClick={() => setProfileOpen(false)}
            >
              <span>My Orders & Receipts</span>
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/onramp"
              className="wallet-pop-link"
              onClick={() => setProfileOpen(false)}
            >
              <span>Fund Account (Onramp)</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <button
            type="button"
            className="wallet-pop-disconnect"
            onClick={() => void handleDisconnect()}
          >
            Disconnect wallet
          </button>
        </div>
      )}

      {error && (
        <div id="wallet-error" className="wallet-error" role="alert">
          <span>{error}</span>
          <button type="button" aria-label="Dismiss wallet error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
