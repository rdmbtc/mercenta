'use client';
import {useState,useEffect} from 'react';
import {ShieldCheck,CheckCircle2,ExternalLink,Wallet,LoaderCircle,AlertCircle} from 'lucide-react';

const CONTRACT_ADDRESS = '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed';
const ARC_MAINNET_CHAIN_ID_HEX = '0x13b2'; // 5042 in hex

type Provider = {
  request: (args: {method: string; params?: unknown[]}) => Promise<unknown>;
};

export function MainnetCheckout({
  productName,
  optionName,
  amountUsdc,
  quantity,
  ru,
}: {
  productName: string;
  optionName: string;
  amountUsdc: string;
  quantity: number;
  ru: boolean;
}) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'switching' | 'signing' | 'confirming' | 'success'>('idle');

  const parsedPrice = parseFloat(amountUsdc) || 0;
  const totalPriceUsdc = (parsedPrice * quantity).toFixed(2);
  // 1 USDC = 10^18 native gas tokens or 10^6 ERC-20 on Arc
  // In native value for Arc payment: value in wei (18 decimals)
  const amountMicro = BigInt(Math.round(parseFloat(totalPriceUsdc) * 1_000_000));
  const nativeValueWei = amountMicro * 1_000_000_000_000n; // 6 decimals -> 18 decimals

  useEffect(() => {
    const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
    if (!eth) return;
    eth.request({method: 'eth_accounts'}).then((accs) => {
      if (Array.isArray(accs) && accs[0]) setAccount((accs[0] as string).toLowerCase());
    }).catch(() => {});
    eth.request({method: 'eth_chainId'}).then((id) => {
      if (typeof id === 'string') setChainId(id.toLowerCase());
    }).catch(() => {});
  }, []);

  async function connectWallet() {
    setError('');
    const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
    if (!eth) {
      setError(ru ? 'MetaMask или Rabby кошелёк не обнаружен.' : 'No Web3 wallet (MetaMask / Rabby) detected.');
      return;
    }
    setBusy(true);
    try {
      const accounts = await eth.request({method: 'eth_requestAccounts'}) as string[];
      if (Array.isArray(accounts) && accounts[0]) {
        setAccount(accounts[0].toLowerCase());
      }
      const cId = await eth.request({method: 'eth_chainId'}) as string;
      setChainId(cId.toLowerCase());
    } catch {
      setError(ru ? 'Не удалось подключить кошелёк.' : 'Could not connect wallet.');
    } finally {
      setBusy(false);
    }
  }

  async function switchNetwork() {
    const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
    if (!eth) return false;
    setStep('switching');
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{chainId: ARC_MAINNET_CHAIN_ID_HEX}],
      });
      setChainId(ARC_MAINNET_CHAIN_ID_HEX);
      return true;
    } catch (switchError) {
      if ((switchError as {code?: number})?.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ARC_MAINNET_CHAIN_ID_HEX,
              chainName: 'Arc Mainnet',
              nativeCurrency: {name: 'USDC', symbol: 'USDC', decimals: 18},
              rpcUrls: ['https://rpc.arc.network'],
              blockExplorerUrls: ['https://explorer.arc.io'],
            }],
          });
          setChainId(ARC_MAINNET_CHAIN_ID_HEX);
          return true;
        } catch {
          setError(ru ? 'Не удалось добавить Arc Mainnet в кошелёк.' : 'Could not add Arc Mainnet to wallet.');
          return false;
        }
      }
      setError(ru ? 'Переключите сеть на Arc Mainnet (5042).' : 'Please switch to Arc Mainnet (5042).');
      return false;
    }
  }

  async function payOnChain() {
    setError('');
    const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
    if (!eth || !account) {
      await connectWallet();
      return;
    }

    setBusy(true);
    try {
      const currentChain = (await eth.request({method: 'eth_chainId'}) as string).toLowerCase();
      if (currentChain !== ARC_MAINNET_CHAIN_ID_HEX) {
        const switched = await switchNetwork();
        if (!switched) {
          setBusy(false);
          setStep('idle');
          return;
        }
      }

      setStep('signing');
      // Direct payment to Mercenta on-chain gateway
      const tx = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: CONTRACT_ADDRESS,
          value: '0x' + nativeValueWei.toString(16),
        }],
      }) as string;

      setTxHash(tx);
      setStep('success');
    } catch (e: unknown) {
      const msg = (e as {message?: string})?.message || '';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError(ru ? 'Транзакция отменена в кошельке.' : 'Transaction was cancelled in wallet.');
      } else {
        setError(ru ? 'Ошибка отправки транзакции. Проверьте баланс USDC сети Arc.' : 'Transaction failed. Check Arc USDC balance.');
      }
      setStep('idle');
    } finally {
      setBusy(false);
    }
  }

  if (step === 'success' && txHash) {
    return (
      <section className="mc-receipt" style={{marginTop: '16px', border: '1px solid #254030', background: 'rgba(24, 45, 30, 0.4)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#68d391', marginBottom: '8px'}}>
          <CheckCircle2 size={22}/>
          <span style={{fontWeight: 700, fontSize: '15px'}}>{ru ? 'Оплата отправлена в Arc Mainnet!' : 'Payment Submitted on Arc Mainnet!'}</span>
        </div>
        <p style={{fontSize: '13px', color: '#a0aec0', margin: '4px 0 14px'}}>
          {ru
            ? 'Транзакция зафиксирована в блокчейне. Товар резервируется для выдачи.'
            : 'Transaction registered on-chain. Order item is being processed for delivery.'}
        </p>
        <dl style={{fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px'}}>
          <dt style={{color: '#718096'}}>{ru ? 'Товар:' : 'Product:'}</dt>
          <dd style={{fontWeight: 600}}>{productName} · {optionName}</dd>
          <dt style={{color: '#718096'}}>{ru ? 'Сумма:' : 'Total:'}</dt>
          <dd style={{fontWeight: 600, color: '#68d391'}}>{totalPriceUsdc} USDC</dd>
          <dt style={{color: '#718096'}}>Tx Hash:</dt>
          <dd style={{wordBreak: 'break-all'}}>
            <a href={`https://explorer.arc.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{color: '#63b3ed', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
              {txHash.slice(0, 10)}…{txHash.slice(-8)} <ExternalLink size={12}/>
            </a>
          </dd>
          <dt style={{color: '#718096'}}>{ru ? 'Контракт:' : 'Contract:'}</dt>
          <dd><a href={`https://explorer.arc.io/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{color: '#63b3ed'}}>0x06b6…3ed</a></dd>
        </dl>
        <div style={{marginTop: '16px', display: 'flex', gap: '10px'}}>
          <a className="mp-button full" href={`https://explorer.arc.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{textAlign: 'center', justifyContent: 'center', textDecoration: 'none'}}>
            {ru ? 'Проверить в Arc Explorer' : 'View on Arc Explorer'} <ExternalLink size={14}/>
          </a>
        </div>
      </section>
    );
  }

  const isArcMainnet = chainId === ARC_MAINNET_CHAIN_ID_HEX;

  return (
    <section className="mc-checkout" style={{marginTop: '16px', border: '1px solid #1a365d', background: 'rgba(10, 25, 47, 0.45)', borderRadius: '12px', padding: '16px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#48bb78', display: 'inline-block'}}/>
          <h4 style={{margin: 0, fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em'}}>
            ARC MAINNET · ON-CHAIN GATEWAY
          </h4>
        </div>
        <a href={`https://explorer.arc.io/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{fontSize: '11px', color: '#63b3ed', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none'}}>
          {ru ? 'Контракт верифицирован' : 'Verified exact match'} <ExternalLink size={11}/>
        </a>
      </div>

      <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '13px', margin: '10px 0'}}>
        <dt style={{color: '#718096'}}>{ru ? 'Товар:' : 'Item:'}</dt>
        <dd style={{fontWeight: 600}}>{productName} ({optionName})</dd>
        <dt style={{color: '#718096'}}>{ru ? 'Количество:' : 'Qty:'}</dt>
        <dd>{quantity}</dd>
        <dt style={{color: '#718096'}}>{ru ? 'К оплате:' : 'Amount:'}</dt>
        <dd style={{fontWeight: 700, color: '#48bb78', fontSize: '15px'}}>{totalPriceUsdc} USDC</dd>
        <dt style={{color: '#718096'}}>{ru ? 'Контракт шлюза:' : 'Router:'}</dt>
        <dd style={{fontFamily: 'monospace', fontSize: '11px'}}>0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed</dd>
      </dl>

      {error && (
        <div role="alert" style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#fc8181', fontSize: '12px', margin: '8px 0'}}>
          <AlertCircle size={14}/>
          <span>{error}</span>
        </div>
      )}

      <div style={{marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
        {!account ? (
          <button className="mp-button full" onClick={connectWallet} disabled={busy} style={{justifyContent: 'center'}}>
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <Wallet size={16}/>}
            <span>{ru ? 'Подключить кошелёк для оплаты' : 'Connect wallet to pay'}</span>
          </button>
        ) : !isArcMainnet ? (
          <button className="mp-button full" onClick={switchNetwork} disabled={busy} style={{justifyContent: 'center', background: '#d69e2e'}}>
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <ShieldCheck size={16}/>}
            <span>{ru ? 'Переключить кошелёк на Arc Mainnet' : 'Switch wallet to Arc Mainnet'}</span>
          </button>
        ) : (
          <button className="mp-button full" onClick={payOnChain} disabled={busy} style={{justifyContent: 'center', background: '#2b6cb0'}}>
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <ShieldCheck size={16}/>}
            <span>
              {busy
                ? (ru ? 'Подтверждение транзакции…' : 'Awaiting confirmation…')
                : (ru ? `Оплатить ${totalPriceUsdc} USDC в Arc Mainnet` : `Pay ${totalPriceUsdc} USDC on Arc Mainnet`)}
            </span>
          </button>
        )}
      </div>

      <p style={{fontSize: '11px', color: '#718096', margin: '10px 0 0', textAlign: 'center'}}>
        {ru
          ? 'Транзакция отправляется на смарт-контракт MercentaCheckout (Chain ID 5042). Без скрытых списаний.'
          : 'Payment sent to MercentaCheckout router (Chain ID 5042). Non-custodial on-chain settlement.'}
      </p>
    </section>
  );
}
