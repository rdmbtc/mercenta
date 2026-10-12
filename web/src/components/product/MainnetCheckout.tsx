'use client';
import {useState, useEffect, useRef} from 'react';
import {ShieldCheck, CheckCircle2, ExternalLink, Wallet, LoaderCircle, AlertCircle, Copy, Check, KeyRound} from 'lucide-react';
import {saveMainnetOrder, getMainnetOrders, syncRemoteOrders, mainnetAmountUnits, mainnetAmountDisplay, providerDeliveryCodes} from '@/lib/mainnet-orders';

const ROUTER_ADDRESS = '0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed';
const MERCHANT_ADDRESS = '0x58863e4a739da0e62c2eba258b7783e95d5c48ce';
const ARC_MAINNET_CHAIN_ID_HEX = '0x13b2'; // 5042 in hex

type Provider = {
  request: (args: {method: string; params?: unknown[]}) => Promise<unknown>;
  selectedAddress?: string;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
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
  initialAccount = null,
}: {
  productName: string;
  optionName: string;
  amountUsdc: string;
  quantity: number;
  ru: boolean;
  denominationId?: string;
  productType?: 'voucher' | 'direct_topup' | 'esim';
  accountReference?: string;
  initialAccount?: string | null;
}) {
  const isTopup = productType === 'direct_topup' || productName.toLowerCase().includes('telegram');
  const [recipientAccount, setRecipientAccount] = useState(accountReference);
  const effectiveAccount = recipientAccount.trim() || accountReference.trim();
  const needsAccountRef = isTopup && !effectiveAccount;

  const [account, setAccount] = useState<string | null>(() => {
    if (initialAccount) return initialAccount.toLowerCase();
    if (typeof window !== 'undefined') {
      const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
      if (eth?.selectedAddress) return eth.selectedAddress.toLowerCase();
    }
    return null;
  });

  const [chainId, setChainId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'idle' | 'switching' | 'signing' | 'confirming' | 'pending' | 'success'>('idle');
  const [deliveredCodes, setDeliveredCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const paymentClaim = useRef(false);
  const submittedHash = useRef<string | null>(null);
  let amountMicro = 0n;
  try { amountMicro = BigInt(mainnetAmountUnits(amountUsdc, quantity)); } catch {}
  const totalPriceUsdc = mainnetAmountDisplay(amountMicro.toString());
  const nativeValueWei = amountMicro * 1_000_000_000_000n; // 6 decimals -> 18 decimals

  useEffect(() => {
    if (initialAccount) {
      setAccount(initialAccount.toLowerCase());
    }
  }, [initialAccount]);

  useEffect(() => {
    if (!account || submittedHash.current || !denominationId) return;
    const pending = getMainnetOrders(account).find(o => o.status === 'PENDING' && o.product_id === denominationId && o.quantity === quantity && o.amount_units === amountMicro.toString());
    if (pending) {submittedHash.current = pending.tx_hash;setTxHash(pending.tx_hash);setStep('pending');}
  }, [account, denominationId, quantity, amountMicro]);

  useEffect(() => {
    if (accountReference && !recipientAccount) {
      setRecipientAccount(accountReference);
    }
  }, [accountReference, recipientAccount]);

  useEffect(() => {
    const eth = (window as unknown as {ethereum?: Provider})?.ethereum;
    if (!eth) return;

    if (eth.selectedAddress && !account) {
      setAccount(eth.selectedAddress.toLowerCase());
    }

    eth.request({method: 'eth_accounts'}).then((accs) => {
      if (Array.isArray(accs) && accs[0]) setAccount((accs[0] as string).toLowerCase());
    }).catch(() => {});

    eth.request({method: 'eth_chainId'}).then((id) => {
      if (typeof id === 'string') setChainId(id.toLowerCase());
    }).catch(() => {});

    const handleAccounts = (accs: unknown) => {
      if (Array.isArray(accs) && accs.length > 0) {
        setAccount((accs[0] as string).toLowerCase());
      } else {
        setAccount(null);
      }
    };

    const handleChain = (cId: unknown) => {
      if (typeof cId === 'string') setChainId(cId.toLowerCase());
    };

    eth.on?.('accountsChanged', handleAccounts);
    eth.on?.('chainChanged', handleChain);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccounts);
      eth.removeListener?.('chainChanged', handleChain);
    };
  }, [account]);

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
        const addr = accounts[0].toLowerCase();
        setAccount(addr);
        window.dispatchEvent(new Event('mercenta-auth-change'));
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
    if (paymentClaim.current || submittedHash.current) return;
    if (amountMicro <= 0n || !denominationId) {
      setError(ru ? 'Нет действительной цены или варианта товара. Обновите каталог.' : 'A valid price and product option are required. Refresh the catalogue.');
      return;
    }
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

    paymentClaim.current = true;
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

      paymentClaim.current = true;
      setStep('signing');
      const tx = await eth.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: MERCHANT_ADDRESS,
          value: '0x' + nativeValueWei.toString(16),
        }],
      }) as string;

      if (!/^0x[a-f0-9]{64}$/i.test(tx)) throw new Error('INVALID_TRANSACTION_HASH');
      submittedHash.current = tx;
      setTxHash(tx);
      setStep('confirming');
      saveMainnetOrder({id:'mct-ord-'+tx.slice(2),created_at:Date.now(),initiator:account,initiator_address:account.toLowerCase(),reference:tx,name:`${productName} · ${optionName}`,product_id:denominationId,country:'GLOBAL',quantity,amount_units:amountMicro.toString(),status:'PENDING',tx_hash:tx,codes:[],network:'mainnet',delivery_source:'unconfirmed'});

      // Request automatic real procurement from Mercenta settlement node on VPS
      let codes: string[] = [];
      try {
        const fulfillRes = await fetch('https://api.mercenta.xyz/api/mainnet/fulfill', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            txHash: tx,
            wallet: account,
            denominationId,
            quantity,
            productName,
            optionName,
            productType: isTopup ? 'direct_topup' : 'voucher',
            accountReference: effectiveAccount,
          }),
        });
        if (fulfillRes.ok) {
          const fulfillData = await fulfillRes.json();
          codes = providerDeliveryCodes(fulfillData?.codes);
        }
      } catch (err) {
        console.warn('Procurement direct dispatch warning:', err);
      }

      setDeliveredCodes(codes);
      saveMainnetOrder({
        id: 'mct-ord-' + tx.slice(2, 10) + '-' + Date.now().toString(36),
        created_at: Date.now(),
        initiator: account ? account.slice(0, 6) + '…' + account.slice(-4) : 'Direct Portal',
        initiator_address: account.toLowerCase(),
        reference: tx.slice(0, 12) + '…',
        name: `${productName} · ${optionName}`,
        product_id: denominationId || ('mainnet:' + productName),
        country: 'GLOBAL',
        quantity,
        amount_units: amountMicro.toString(),
        status: codes.length ? 'FULFILLED' : 'PENDING',
        tx_hash: tx,
        codes,
        network: 'mainnet',
        delivery_source: codes.length ? 'provider_response' : 'unconfirmed',
      });

      setStep(codes.length ? 'success' : 'pending');
    } catch (e: unknown) {
      const msg = (e as {message?: string})?.message || '';
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setError(ru ? 'Транзакция отменена в кошельке.' : 'Transaction was cancelled in wallet.');
      } else {
        setError(ru ? 'Ошибка отправки транзакции. Проверьте баланс USDC сети Arc.' : 'Transaction failed. Check Arc USDC balance.');
      }
      setStep(submittedHash.current ? 'pending' : 'idle');
    } finally {
      paymentClaim.current = false;
      setBusy(false);
    }
  }

  async function refreshDelivery() {
    if (!account || !txHash || busy) return;
    setBusy(true);
    try {
      await syncRemoteOrders(account);
      const order = getMainnetOrders(account).find(o => o.tx_hash.toLowerCase() === txHash.toLowerCase());
      if (order?.delivery_source === 'provider_response' && order.codes.length) {setDeliveredCodes(order.codes);setStep('success');}
    } finally {setBusy(false);}
  }

  if (step === 'pending' && txHash) return (
    <section className="mc-receipt" aria-live="polite">
      <span className="mc-kicker">ARC MAINNET / DELIVERY PENDING</span>
      <h3>{ru ? 'Перевод отправлен. Проверяем выдачу.' : 'Transfer submitted. Delivery pending.'}</h3>
      <p>{ru ? 'Подтверждение оплаты и выдачи пока не получено. Не платите повторно. Хеш сохранён в покупках; обновление статуса не отправляет деньги.' : 'Payment and delivery confirmation are not yet available. Do not pay again. The hash is saved in Purchases; checking status never sends another payment.'}</p>
      <dl><div><dt>USDC</dt><dd>{totalPriceUsdc}</dd></div><div><dt>Transaction</dt><dd style={{overflowWrap:'anywhere'}}>{txHash}</dd></div></dl>
      <button type="button" className="mp-button outline full" onClick={refreshDelivery} disabled={busy}>{busy ? <LoaderCircle size={16}/> : null}{ru ? 'Проверить выдачу' : 'Check delivery'}</button>
      <a className="mp-button outline full" href={`https://explorer.arc.io/tx/${txHash}`} target="_blank" rel="noreferrer">Arc Explorer <ExternalLink size={14}/></a>
      <a className="mp-button outline full" href="/app?section=orders">{ru ? 'Открыть покупки' : 'Open Purchases'}</a>
      <a href="/support">{ru ? 'Связаться с поддержкой' : 'Contact support'}</a>
    </section>
  );

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
    const codes = deliveredCodes;

    return (
      <section
        className="mc-receipt"
        style={{
          marginTop: '16px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'linear-gradient(180deg, #090f1d 0%, #060a12 100%)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8'
            }}>
              <CheckCircle2 size={18} />
            </span>
            <div>
              <h4 style={{margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em'}}>
                {ru ? 'Выдача получена от провайдера' : 'Delivery received from provider'}
              </h4>
              <span style={{fontSize: '11px', color: '#64748b'}}>
                {ru ? 'Оплата и выдача проверяются отдельно' : 'Payment and delivery are separate records'}
              </span>
            </div>
          </div>
          <span style={{
            fontSize: '11px',
            background: 'rgba(56, 189, 248, 0.08)',
            color: '#7dd3fc',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '3px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            letterSpacing: '0.06em'
          }}>
            ARC MAINNET · FULFILLED
          </span>
        </div>

        <p style={{fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px'}}>
          {ru
            ? (isTopup ? 'Провайдер сообщил о выдаче пополнения. Проверьте баланс аккаунта получателя.' : 'Код получен от провайдера и сохранён в покупках.')
            : (isTopup ? 'Provider reports top-up delivery. Check the recipient account balance.' : 'Your provider-issued activation key is saved to Purchases. A transfer alone does not prove redemption.')}
        </p>

        {isTopup ? (
          <div style={{background: '#04070e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
              <span style={{fontSize: '12px', fontWeight: 600, color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em'}}>
                <ShieldCheck size={14} style={{color: '#38bdf8'}}/>
                {ru ? 'АККАУНТ ЗАЧИСЛЕНИЯ' : 'RECIPIENT ACCOUNT'}
              </span>
              <span style={{fontSize: '11px', color: '#85debc', background: 'rgba(133, 222, 188, 0.1)', border: '1px solid rgba(133, 222, 188, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600}}>
                {ru ? 'Зачислено' : 'Credited'}
              </span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px'}}>
              <span style={{fontSize: '16px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', letterSpacing: '0.04em'}}>
                {effectiveAccount ? `@${effectiveAccount.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '')}` : (codes[0]?.replace('TOPUP_CREDITED:', '') || '@username')}
              </span>
              <span style={{fontSize: '12px', color: '#94a3b8'}}>
                {productName}
              </span>
            </div>
          </div>
        ) : (
          <div style={{background: '#04070e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px'}}>
              <span style={{fontSize: '12px', fontWeight: 600, color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em'}}>
                <KeyRound size={14} style={{color: '#38bdf8'}}/>
                {ru ? (codes.length > 1 ? 'КЛЮЧИ АКТИВАЦИИ' : 'КЛЮЧ АКТИВАЦИИ') : (codes.length > 1 ? 'ACTIVATION KEYS' : 'ACTIVATION KEY')}
              </span>
              {codes.length > 1 && (
                <button
                  className="ma-link"
                  style={{fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8'}}
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
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <code style={{fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#b2e5ff', letterSpacing: '0.08em'}}>
                    {code}
                  </code>
                  <button
                    className="mp-button outline"
                    style={{padding: '6px 12px', fontSize: '12px', minHeight: '32px', gap: '6px', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.15)'}}
                    onClick={() => copyKey(code, idx)}
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={14} style={{color: '#85debc'}}/>
                        <span style={{color: '#85debc'}}>{ru ? 'Скопировано!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} style={{color: '#7dd3fc'}}/>
                        <span>{ru ? 'Скопировать' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '13px', margin: '14px 0', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)'}}>
          <dt style={{color: '#64748b'}}>{ru ? 'Товар:' : 'Item:'}</dt>
          <dd style={{fontWeight: 600, color: '#e2e8f0'}}>{productName} · {optionName}</dd>
          <dt style={{color: '#64748b'}}>{ru ? 'Сумма:' : 'Amount:'}</dt>
          <dd style={{fontWeight: 700, color: '#b2e5ff'}}>{totalPriceUsdc} USDC</dd>
          <dt style={{color: '#64748b'}}>Tx Hash:</dt>
          <dd style={{wordBreak: 'break-all'}}>
            <a href={`https://explorer.arc.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={{color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none'}}>
              {txHash.slice(0, 10)}…{txHash.slice(-8)} <ExternalLink size={12}/>
            </a>
          </dd>
          <dt style={{color: '#64748b'}}>{ru ? 'Клиринг:' : 'Settlement:'}</dt>
          <dd>
            <a href={`https://explorer.arc.io/address/${MERCHANT_ADDRESS}`} target="_blank" rel="noreferrer" style={{color: '#38bdf8', textDecoration: 'none'}}>
              0x5886…48ce
            </a>
          </dd>
        </dl>

        <div style={{fontSize: '11px', color: '#94a3b8', lineHeight: 1.5, padding: '10px 12px', background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.16)', borderRadius: '8px', margin: '14px 0'}}>
          {ru
            ? (isTopup ? 'Начисление: звёзды Telegram зачисляются напрямую на баланс указанного аккаунта. Заказ сохранён в «Моих покупках».' : 'Активация: используйте выданный код в личном кабинете платформы. Заказ сохранён в «Моих покупках».')
            : (isTopup ? 'Credit: Telegram Stars are credited directly to the specified account. Your order is listed under Purchases.' : 'Activation: redeem this code on the designated platform. Your order is listed under Purchases.')}
        </div>

        <div style={{marginTop: '16px', display: 'flex', gap: '10px'}}>
          <a
            className="mp-button full"
            href="/app?section=orders"
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            {ru ? 'Открыть «Мои покупки»' : 'View in Purchases'}
          </a>
          <a
            className="mp-button outline"
            href={`https://explorer.arc.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{
              textAlign: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
            }}
          >
            Arc Explorer <ExternalLink size={14}/>
          </a>
        </div>
      </section>
    );
  }

  const isArcMainnet = chainId === ARC_MAINNET_CHAIN_ID_HEX;

  return (
    <section
      className="mc-checkout"
      style={{
        marginTop: '16px',
        border: '1px solid rgba(56, 189, 248, 0.22)',
        background: 'linear-gradient(180deg, #090f1d 0%, #060a12 100%)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '18px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', display: 'inline-block'}}/>
          <h4 style={{margin: 0, fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: '#f8fafc'}}>
            ARC MAINNET · DIRECT MERCHANT PAYMENT
          </h4>
        </div>
        <a href={`https://explorer.arc.io/address/${ROUTER_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{fontSize: '11px', color: '#7dd3fc', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none'}}>
          {ru ? 'Контракт верифицирован' : 'Verified exact match'} <ExternalLink size={11}/>
        </a>
      </div>

      <dl style={{display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: '13px', margin: '12px 0', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)'}}>
        <dt style={{color: '#64748b'}}>{ru ? 'Товар:' : 'Item:'}</dt>
        <dd style={{fontWeight: 600, color: '#e2e8f0'}}>{productName} ({optionName})</dd>
        <dt style={{color: '#64748b'}}>{ru ? 'Количество:' : 'Qty:'}</dt>
        <dd style={{color: '#f8fafc'}}>{quantity}</dd>
        <dt style={{color: '#64748b'}}>{ru ? 'К оплате:' : 'Amount:'}</dt>
        <dd style={{fontWeight: 700, color: '#b2e5ff', fontSize: '15px'}}>{totalPriceUsdc} USDC</dd>
        <dt style={{color: '#64748b'}}>{ru ? 'Контракт (не используется этим переводом):' : 'Contract (not used by this transfer):'}</dt>
        <dd style={{fontFamily: 'monospace', fontSize: '11px'}}><a href={`https://explorer.arc.io/address/${ROUTER_ADDRESS}#code`} target="_blank" rel="noreferrer" style={{color: '#38bdf8', textDecoration: 'none'}}>0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed</a></dd>
        <dt style={{color: '#64748b'}}>{ru ? 'Клиринг (Merchant):' : 'Merchant:'}</dt>
        <dd style={{fontFamily: 'monospace', fontSize: '11px'}}><a href={`https://explorer.arc.io/address/${MERCHANT_ADDRESS}`} target="_blank" rel="noreferrer" style={{color: '#38bdf8', textDecoration: 'none'}}>0x58863e4a739da0e62c2eba258b7783e95d5c48ce</a></dd>
      </dl>

      {isTopup && (
        <div style={{margin: '14px 0'}}>
          <label htmlFor="topup-username-input" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px'}}>
            <span>
              {ru
                ? (productName.toLowerCase().includes('telegram')
                    ? 'Telegram username для начисления Stars:'
                    : 'Имя аккаунта получателя (@username или ID):')
                : 'Recipient account / Telegram username (@username):'}
              <span style={{color: '#f87171', marginLeft: '4px'}}>*</span>
            </span>
          </label>
          <input
            id="topup-username-input"
            type="text"
            placeholder="@username (например @durov)"
            value={recipientAccount}
            onChange={(e) => {
              setRecipientAccount(e.target.value);
              if (error) setError('');
            }}
            disabled={busy}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: needsAccountRef ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(56, 189, 248, 0.3)',
              background: '#04070e',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <p style={{margin: '6px 0 0', fontSize: '11px', color: '#94a3b8'}}>
            {ru
              ? (productName.toLowerCase().includes('telegram')
                  ? 'Звёзды зачисляются напрямую на этот Telegram-аккаунт через официальный шлюз Fragment.'
                  : 'Пополнение будет зачислено напрямую на указанный аккаунт.')
              : 'Direct top-up will be credited to this designated account.'}
          </p>
        </div>
      )}

      {needsAccountRef && (
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '10px 12px', margin: '10px 0', fontSize: '12px'}}>
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
        <div role="alert" style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', margin: '10px 0'}}>
          <AlertCircle size={14}/>
          <span>{error}</span>
        </div>
      )}

      <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
        {!account ? (
          <button
            className="mp-button full"
            onClick={connectWallet}
            disabled={busy}
            style={{
              justifyContent: 'center',
              background: '#1d4ed8',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <Wallet size={16}/>}
            <span>{ru ? 'Подключить кошелёк для оплаты' : 'Connect wallet to pay'}</span>
          </button>
        ) : !isArcMainnet ? (
          <button
            className="mp-button full"
            onClick={switchNetwork}
            disabled={busy}
            style={{
              justifyContent: 'center',
              background: '#b45309',
              color: '#ffffff',
              fontWeight: 600,
            }}
          >
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <ShieldCheck size={16}/>}
            <span>{ru ? 'Переключить кошелёк на Arc Mainnet' : 'Switch wallet to Arc Mainnet'}</span>
          </button>
        ) : (
          <button
            className="mp-button full"
            onClick={payOnChain}
            disabled={busy || needsAccountRef || amountMicro <= 0n || !denominationId}
            style={{
              justifyContent: 'center',
              background: needsAccountRef ? 'rgba(255, 255, 255, 0.06)' : '#1d4ed8',
              color: needsAccountRef ? '#64748b' : '#ffffff',
              cursor: needsAccountRef ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              boxShadow: needsAccountRef ? 'none' : '0 4px 14px rgba(29, 78, 216, 0.4)',
            }}
          >
            {busy ? <LoaderCircle size={16} className="mn-identity-spinner"/> : <ShieldCheck size={16}/>}
            <span>
              {step === 'signing'
                ? (ru ? 'Подписание в кошельке…' : 'Signing in wallet…')
                : step === 'confirming'
                ? (ru ? 'Перевод отправлен · Проверяем выдачу…' : 'Transfer submitted · Checking delivery…')
                : busy
                ? (ru ? 'Обработка…' : 'Processing…')
                : needsAccountRef
                ? (ru ? 'Укажите @username выше' : 'Specify @username above')
                : (ru ? `Оплатить ${totalPriceUsdc} USDC в Arc Mainnet` : `Pay ${totalPriceUsdc} USDC on Arc Mainnet`)}
            </span>
          </button>
        )}
      </div>

      <p style={{fontSize: '11px', color: '#64748b', margin: '12px 0 0', textAlign: 'center'}}>
        {ru
          ? 'Этот перевод отправляет нативный USDC напрямую продавцу на Arc (5042), не через контракт MercentaCheckout. Выдача подтверждается отдельно.'
          : 'This flow sends native USDC directly to the merchant on Arc (5042), not through the MercentaCheckout contract. Delivery requires separate confirmation.'}
      </p>
    </section>
  );
}
