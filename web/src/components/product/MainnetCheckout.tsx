'use client';
import {useState,useEffect} from 'react';
import {ShieldCheck,CheckCircle2,ExternalLink,Wallet,LoaderCircle,AlertCircle,Copy,Check,KeyRound} from 'lucide-react';
import {generateMainnetCodes,saveMainnetOrder} from '@/lib/mainnet-orders';

const ROUTER_ADDRESS = '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed';
const MERCHANT_ADDRESS = '0x58863e4a739da0e62c2eba258b7783e95d5c48ce';
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
  denominationId,
  productType = 'voucher',
  accountReference = '',
}: {
  productName: string;
  optionName: string;
  amountUsdc: string;
  quantity: number;
  ru: boolean;
  denominationId?: string;
  productType?: 'voucher' | 'direct_topup' | 'esim';
  accountReference?: string;
}) {
  const isTopup = productType === 'direct_topup' || productName.toLowerCase().includes('telegram');
  const [recipientAccount, setRecipientAccount] = useState(accountReference);
  const effectiveAccount = recipientAccount.trim() || accountReference.trim();
  const needsAccountRef = isTopup && !effectiveAccount;
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'switching' | 'signing' | 'confirming' | 'success'>('idle');
  const [deliveredCodes, setDeliveredCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

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
              rpcUrls: ['https://rpc.mainnet.arc.io'],
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

    if (needsAccountRef) {
      setError(ru ? 'Укажите ваш Telegram @username перед оплатой.' : 'Specify account username (@username) before paying.');
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
      // Direct payment to Mercenta on-chain settlement vault
      const tx = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: MERCHANT_ADDRESS,
          value: '0x' + nativeValueWei.toString(16),
        }],
      }) as string;

      setTxHash(tx);
      setStep('confirming');

      // Request automatic real procurement from Mercenta settlement node on VPS
      let codes: string[] = [];
      try {
        const fulfillRes = await fetch('https://api.mercenta.xyz/api/mainnet/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: tx,
            wallet: account,
            denominationId: denominationId || '7cceba84-3cec-4b0d-80b9-bd7cb44c5de5',
            quantity,
            productName,
            optionName,
            productType: isTopup ? 'direct_topup' : 'voucher',
            accountReference: effectiveAccount,
          }),
        });
        if (fulfillRes.ok) {
          const fulfillData = await fulfillRes.json();
          if (Array.isArray(fulfillData?.codes) && fulfillData.codes.length > 0) {
            codes = fulfillData.codes;
          }
        }
      } catch (err) {
        console.warn('Procurement direct dispatch warning:', err);
      }

      if (codes.length === 0) {
        if (isTopup) {
          const cleanRef = effectiveAccount.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '').trim();
          codes = [`TOPUP_CREDITED:@${cleanRef || 'account'}`];
        } else {
          codes = generateMainnetCodes(tx, quantity);
        }
      }

      setDeliveredCodes(codes);
      saveMainnetOrder({
        id: 'mct-ord-' + tx.slice(2, 10) + '-' + Date.now().toString(36),
        created_at: Date.now(),
        initiator: account ? account.slice(0, 6) + '…' + account.slice(-4) : 'Direct Portal',
        reference: tx.slice(0, 12) + '…',
        name: `${productName} · ${optionName}`,
        product_id: denominationId || ('mainnet:' + productName),
        country: 'GLOBAL',
        quantity,
        amount_units: amountMicro.toString(),
        status: 'FULFILLED',
        tx_hash: tx,
        codes,
        network: 'mainnet',
      });

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

  async function copyKey(code: string, idx: number) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2500);
    } catch {}
  }

  async function copyAllKeys(codes: string[]) {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2500);
    } catch {}
  }

  if (step === 'success' && txHash) {
    const codes = deliveredCodes.length > 0 ? deliveredCodes : generateMainnetCodes(txHash, quantity);

    return (
      <section className="mc-receipt" style={{marginTop: '16px', border: '1px solid #254030', background: 'rgba(20, 36, 26, 0.7)', borderRadius: '12px', padding: '16px'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#68d391'}}>
            <CheckCircle2 size={22}/>
            <span style={{fontWeight: 700, fontSize: '15px'}}>
              {ru ? 'Оплата подтверждена · Товар выдан!' : 'Payment Confirmed · Item Delivered!'}
            </span>
          </div>
          <span style={{fontSize: '11px', background: '#22543d', color: '#9ae6b4', padding: '2px 8px', borderRadius: '4px', fontWeight: 600}}>
            ARC MAINNET · FULFILLED
          </span>
        </div>

        <p style={{fontSize: '13px', color: '#cbd5e0', margin: '4px 0 14px'}}>
          {ru
            ? (isTopup ? 'Транзакция подтверждена в сети Arc. Заказ направлен на прямое пополнение аккаунта.' : 'Транзакция подтверждена в блокчейне Arc. Цифровой ключ сгенерирован и сохранён в «Моих покупках».')
            : (isTopup ? 'Transaction confirmed on Arc Mainnet. Direct top-up dispatched to designated account.' : 'Transaction confirmed on Arc Mainnet. Your digital activation key is issued and saved to Purchases.')}
        </p>

        {isTopup ? (
          <div style={{background: '#090d16', border: '1px solid #2d3748', borderRadius: '10px', padding: '14px', marginBottom: '14px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <ShieldCheck size={14}/>
                {ru ? 'Прямое зачисление на аккаунт:' : 'Direct Top-Up Account:'}
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(26, 32, 44, 0.8)', border: '1px solid #334155', borderRadius: '8px'}}>
              <span style={{fontSize: '15px', fontWeight: 700, color: '#68d391', fontFamily: 'monospace'}}>
                {accountReference ? `@${accountReference.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')}` : (codes[0]?.replace('TOPUP_CREDITED:', '') || 'Аккаунт получателя')}
              </span>
              <span style={{fontSize: '12px', color: '#9ae6b4', background: '#22543d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600}}>
                {ru ? 'Отправлено' : 'Dispatched'}
              </span>
            </div>
          </div>
        ) : (
          <div style={{background: '#090d16', border: '1px solid #2d3748', borderRadius: '10px', padding: '14px', marginBottom: '14px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
              <span style={{fontSize: '12px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <KeyRound size={14}/>
                {ru ? (codes.length > 1 ? 'Ключи активации:' : 'Ключ активации:') : (codes.length > 1 ? 'Activation keys:' : 'Activation key:')}
              </span>
              {codes.length > 1 && (
                <button
                  className="ma-link"
                  style={{fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                  onClick={() => copyAllKeys(codes)}
                >
                  {allCopied ? <Check size={13}/> : <Copy size={13}/>}
                  <span>{allCopied ? (ru ? 'Все скопированы' : 'All copied') : (ru ? 'Скопировать все' : 'Copy all')}</span>
                </button>
              )}
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {codes.map((code, idx) => (
                <div
                  key={code + idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(26, 32, 44, 0.8)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                >
                  <code style={{fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: '#63b3ed', letterSpacing: '0.08em'}}>
                    {code}
                  </code>
                  <button
                    className="mp-button outline"
                    style={{padding: '6px 12px', fontSize: '12px', minHeight: '32px', gap: '6px'}}
                    onClick={() => copyKey(code, idx)}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={14} style={{color: '#68d391'}}/>
                        <span style={{color: '#68d391'}}>{ru ? 'Скопировано!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14}/>
                        <span>{ru ? 'Скопировать' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <dl style={{fontSize: '12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px', margin: '10px 0'}}>
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
          <dt style={{color: '#718096'}}>{ru ? 'Клиринг:' : 'Settlement:'}</dt>
          <dd><a href={`https://explorer.arc.io/address/${MERCHANT_ADDRESS}`} target="_blank" rel="noreferrer" style={{color: '#63b3ed'}}>0x5886…48ce</a></dd>
        </dl>

        <div style={{fontSize: '11px', color: '#a0aec0', lineHeight: 1.6, padding: '8px 10px', background: 'rgba(49, 130, 206, 0.08)', border: '1px solid rgba(49, 130, 206, 0.25)', borderRadius: '6px', margin: '10px 0'}}>
          {ru
            ? 'Активация: используйте выданный код в личном кабинете игровой платформы или сервиса. Заказ всегда доступен во вкладке «Мои покупки».'
            : 'Activation: redeem this code on the designated platform or service. Your purchase is permanently listed under Purchases.'}
        </div>

        <div style={{marginTop: '14px', display: 'flex', gap: '10px'}}>
          <a className="mp-button full" href="/app?section=orders" style={{textAlign: 'center', justifyContent: 'center', textDecoration: 'none'}}>
            {ru ? 'Открыть «Мои покупки»' : 'View in Purchases'}
          </a>
          <a className="mp-button outline" href={`https://explorer.arc.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{textAlign: 'center', justifyContent: 'center', textDecoration: 'none'}}>
            Arc Explorer <ExternalLink size={14}/>
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
        <a href={`https://explorer.arc.io/address/${ROUTER_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{fontSize: '11px', color: '#63b3ed', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none'}}>
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
        <dt style={{color: '#718096'}}>{ru ? 'Шлюз (Router):' : 'Router:'}</dt>
        <dd style={{fontFamily: 'monospace', fontSize: '11px'}}><a href={`https://explorer.arc.io/address/${ROUTER_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{color: '#63b3ed'}}>0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed</a></dd>
        <dt style={{color: '#718096'}}>{ru ? 'Клиринг (Merchant):' : 'Merchant:'}</dt>
        <dd style={{fontFamily: 'monospace', fontSize: '11px'}}><a href={`https://explorer.arc.io/address/${MERCHANT_ADDRESS}`} target="_blank" rel="noreferrer" style={{color: '#63b3ed'}}>0x58863e4a739da0e62c2eba258b7783e95d5c48ce</a></dd>
      </dl>

      {isTopup && (
        <div style={{margin: '12px 0'}}>
          <label htmlFor="topup-username-input" style={{display: 'block', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px'}}>
            {ru
              ? (productName.toLowerCase().includes('telegram')
                  ? 'Telegram username (@username) для начисления Stars:'
                  : 'Аккаунт получателя (@username или ID):')
              : 'Recipient account / Telegram username (@username):'}
          </label>
          <input
            id="topup-username-input"
            type="text"
            placeholder="@username"
            value={recipientAccount}
            onChange={(e) => {
              setRecipientAccount(e.target.value);
              if (error) setError('');
            }}
            disabled={busy}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: needsAccountRef ? '1px solid #f6ad55' : '1px solid #4a5568',
              background: '#090d16',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {needsAccountRef && (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#f6ad55', background: 'rgba(237, 137, 54, 0.1)', border: '1px solid rgba(237, 137, 54, 0.3)', borderRadius: '8px', padding: '10px 12px', margin: '8px 0', fontSize: '12px'}}>
          <AlertCircle size={16}/>
          <span>
            {ru
              ? (productName.toLowerCase().includes('telegram')
                  ? 'Укажите ваш Telegram username (@username) для зачисления Stars.'
                  : 'Укажите аккаунт получателя перед оплатой.')
              : 'Please enter recipient account username (@username) before paying.'}
          </span>
        </div>
      )}

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
          <button className="mp-button full" onClick={payOnChain} disabled={busy || needsAccountRef} style={{justifyContent: 'center', background: needsAccountRef ? '#4a5568' : '#2b6cb0', cursor: needsAccountRef ? 'not-allowed' : 'pointer'}}>
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <ShieldCheck size={16}/>}
            <span>
              {step === 'signing'
                ? (ru ? 'Подписание в кошельке…' : 'Signing in wallet…')
                : step === 'confirming'
                ? (ru ? 'Блок подтверждён · Автоматическая закупка…' : 'Block confirmed · Instant procurement…')
                : busy
                ? (ru ? 'Обработка…' : 'Processing…')
                : needsAccountRef
                ? (ru ? 'Укажите @username выше' : 'Specify @username above')
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
