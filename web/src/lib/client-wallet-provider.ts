import { createPublicClient, createWalletClient, defineChain, http, hexToString, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ARC_MAINNET_CONFIG, ARC_TESTNET_CONFIG, type Eip1193Provider } from './wallet';
import type { NetworkMode } from './network-profile';

export type LocalApproval = { kind: 'message'; message: string } | { kind: 'transaction'; chain: string; to: string; amount: string; fee: string; total: string };
export function createLocalProvider(key: `0x${string}`, network: NetworkMode, approve: (request: LocalApproval) => Promise<boolean>) {
  let account: ReturnType<typeof privateKeyToAccount> | null = privateKeyToAccount(key);
  const config = network === 'mainnet' ? ARC_MAINNET_CONFIG : ARC_TESTNET_CONFIG;
  const chain = defineChain({ id: Number(config.chainId), name: config.chainName, nativeCurrency: config.nativeCurrency, rpcUrls: { default: { http: [config.rpcUrls[0]] } } });
  const publicClient = createPublicClient({ chain, transport: http() });
  const provider: Eip1193Provider = {
    async request({ method, params }) {
      const signer = account;
      if (!signer) throw new Error('Wallet is locked.');
      const values = Array.isArray(params) ? params : [];
      if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [signer.address];
      if (method === 'eth_chainId') return config.chainId;
      if (method === 'wallet_switchEthereumChain') {
        if (Number((values[0] as { chainId?: string })?.chainId) !== chain.id) throw new Error('Switch network in Mercenta first.');
        return null;
      }
      if (method === 'personal_sign') {
        if (String(values[1]).toLowerCase() !== signer.address.toLowerCase()) throw new Error('Wallet mismatch.');
        const message = hexToString(values[0] as `0x${string}`);
        if (!message.startsWith('Mercenta wants you to sign in.\n') || !message.includes('Signing proves wallet ownership. It does NOT authorize any payment or transfer.')) throw new Error('Unsupported signing request.');
        if (!await approve({ kind: 'message', message }) || account !== signer) throw new Error('Signing cancelled.');
        return signer.signMessage({ message });
      }
      if (method === 'eth_getBalance') {
        if (String(values[0]).toLowerCase() !== signer.address.toLowerCase()) throw new Error('Wallet mismatch.');
        return '0x' + (await publicClient.getBalance({ address: signer.address })).toString(16);
      }
      if (method === 'eth_getTransactionReceipt') {
        try { const receipt = await publicClient.getTransactionReceipt({ hash: values[0] as `0x${string}` }); return { ...receipt, status: receipt.status === 'success' ? '0x1' : '0x0' }; } catch { return null; }
      }
      if (method === 'eth_sendTransaction') {
        const tx = values[0] as { from?: string; to?: string; value?: string; data?: string; expiresAt?: number };
        if (network !== 'mainnet' || tx.from?.toLowerCase() !== signer.address.toLowerCase() || tx.to?.toLowerCase() !== '0x58863e4a739da0e62c2eba258b7783e95d5c48ce' || tx.data || !/^0x[0-9a-f]+$/i.test(tx.value ?? '')) throw new Error('Unsupported transaction.');
        const value = BigInt(tx.value!);
        if (value <= 0n) throw new Error('Invalid transfer amount.');
        const to = tx.to as `0x${string}`;
        const [gas, gasPrice, actualChain] = await Promise.all([publicClient.estimateGas({ account: signer, to, value }), publicClient.getGasPrice(), publicClient.getChainId()]);
        if (actualChain !== chain.id) throw new Error('RPC network mismatch.');
        if (account !== signer) throw new Error('Wallet locked; transfer cancelled.');
        const fee = gas * gasPrice;
        if (!Number.isFinite(tx.expiresAt) || tx.expiresAt! <= Date.now()) throw new Error('Quote expired.');
        const deadline = Math.min(Date.now() + 90_000, tx.expiresAt!);
        if (!await approve({ kind: 'transaction', chain: `${chain.name} (${chain.id})`, to, amount: formatEther(value), fee: formatEther(fee), total: formatEther(value + fee) }) || account !== signer || Date.now() > deadline) throw new Error('Transfer cancelled or confirmation expired.');
        const client = createWalletClient({ account: signer, chain, transport: http() });
        return client.sendTransaction({ to, value, gas, gasPrice });
      }
      throw new Error('Unsupported wallet method.');
    },
  };
  return { provider, address: account.address, lock: () => { account = null; } };
}
