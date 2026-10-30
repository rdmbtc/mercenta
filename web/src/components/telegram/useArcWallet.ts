'use client';

import { useState, useEffect, useCallback } from 'react';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export interface ArcWalletState {
  address: string;
  privateKey: string;
  isLoaded: boolean;
  balanceUsdc: number;
}

const STORAGE_KEY = 'mercenta_arc_non_custodial_wallet_v1';
const BALANCE_KEY = 'mercenta_arc_balance_v1';

export function useArcWallet() {
  const [wallet, setWallet] = useState<ArcWalletState>({
    address: '',
    privateKey: '',
    isLoaded: false,
    balanceUsdc: 25.0, // Initial sandbox demo balance for smooth testing
  });

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    try {
      const tg = typeof window !== 'undefined' ? (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void } } } })?.Telegram?.WebApp : null;
      if (tg?.HapticFeedback) {
        if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      }
    } catch {
      // Haptics fail silently on non-touch devices
    }
  }, []);

  // Initialize or restore wallet
  useEffect(() => {
    try {
      let savedPk = localStorage.getItem(STORAGE_KEY);
      const savedBal = localStorage.getItem(BALANCE_KEY);

      if (!savedPk) {
        // Generate new non-custodial EVM / Arc key
        savedPk = generatePrivateKey();
        localStorage.setItem(STORAGE_KEY, savedPk);
      }

      const account = privateKeyToAccount(savedPk as `0x${string}`);
      const initialBalance = savedBal ? parseFloat(savedBal) : 25.0;

      setWallet({
        address: account.address,
        privateKey: savedPk,
        isLoaded: true,
        balanceUsdc: Number.isNaN(initialBalance) ? 25.0 : initialBalance,
      });

      // Try Telegram CloudStorage sync if available
      const tg = (window as unknown as { Telegram?: { WebApp?: { CloudStorage?: { setItem: (k: string, v: string) => void } } } })?.Telegram?.WebApp;
      if (tg?.CloudStorage) {
        tg.CloudStorage.setItem('mercenta_arc_address', account.address);
      }
    } catch (err) {
      console.error('Failed to initialize Arc Wallet:', err);
    }
  }, []);

  const updateBalance = useCallback((deltaUsdc: number) => {
    setWallet((prev) => {
      const newBal = Math.max(0, prev.balanceUsdc + deltaUsdc);
      localStorage.setItem(BALANCE_KEY, newBal.toFixed(2));
      return { ...prev, balanceUsdc: newBal };
    });
  }, []);

  const setExactBalance = useCallback((newBalance: number) => {
    setWallet((prev) => {
      localStorage.setItem(BALANCE_KEY, newBalance.toFixed(2));
      return { ...prev, balanceUsdc: newBalance };
    });
  }, []);

  const resetWallet = useCallback(() => {
    const newPk = generatePrivateKey();
    const account = privateKeyToAccount(newPk);
    localStorage.setItem(STORAGE_KEY, newPk);
    localStorage.setItem(BALANCE_KEY, '25.00');
    setWallet({
      address: account.address,
      privateKey: newPk,
      isLoaded: true,
      balanceUsdc: 25.0,
    });
    triggerHaptic('success');
  }, [triggerHaptic]);

  return {
    wallet,
    updateBalance,
    setExactBalance,
    resetWallet,
    triggerHaptic,
  };
}
