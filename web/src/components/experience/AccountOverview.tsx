'use client';
import {accountMoney} from '@/lib/account-format';
import {EmptyState,ListSkeleton} from './Primitives';
import {Download,ShieldCheck,Layers,Ticket,ArrowUpRight,CircleDollarSign} from 'lucide-react';

type Stats={totalOrders:number;shopOrders:number;directTopUpOrders:number;totalSpentUnits:string};

export function AccountOverview({
  stats,
  loading,
  period,
  onPeriod,
  ru=false,
  isMainnet=false
}:{
  stats:Stats|null;
  loading:boolean;
  period:string;
  onPeriod:(s:string)=>void;
  ru?:boolean;
  isMainnet?:boolean;
}){
  return (
    <section className="me-card me-account-overview" style={{
      background:'linear-gradient(180deg, rgba(16, 21, 29, 0.96) 0%, rgba(8, 11, 16, 0.98) 100%)',
      border:'1px solid rgba(178, 229, 255, 0.12)',
      borderRadius:'12px',
      padding:'24px 28px',
      boxShadow:'0 16px 40px rgba(0, 0, 0, 0.45)',
      marginBottom:'24px'
    }}>
      <header style={{
        display:'flex',
        alignItems:'flex-start',
        justifyContent:'space-between',
        gap:'20px',
        flexWrap:'wrap',
        marginBottom:'16px'
      }}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <span style={{
              display:'inline-flex',
              alignItems:'center',
              gap:'6px',
              fontSize:'10px',
              fontFamily:'monospace',
              letterSpacing:'0.1em',
              textTransform:'uppercase',
              fontWeight:700,
              color: isMainnet ? '#b2e5ff' : '#85debc',
              background: isMainnet ? 'rgba(56, 189, 248, 0.12)' : 'rgba(133, 222, 188, 0.12)',
              border: isMainnet ? '1px solid rgba(56, 189, 248, 0.28)' : '1px solid rgba(133, 222, 188, 0.28)',
              padding:'3px 9px',
              borderRadius:'9999px'
            }}>
              <span style={{
                width:'6px',
                height:'6px',
                borderRadius:'50%',
                background: isMainnet ? '#38bdf8' : '#85debc',
                boxShadow: isMainnet ? '0 0 8px #38bdf8' : '0 0 8px #85debc'
              }} />
              {isMainnet ? 'Arc Mainnet · 5042' : 'Arc Testnet · 50422'}
            </span>
            <span style={{fontSize:'10px',color:'var(--a-muted)',letterSpacing:'0.06em',textTransform:'uppercase',fontFamily:'monospace'}}>
              {ru ? 'Телеметрия счёта' : 'Account Telemetry'}
            </span>
          </div>

          <h2 style={{fontSize:'22px',fontWeight:600,letterSpacing:'-0.03em',color:'var(--a-ink)',margin:0}}>
            {ru ? 'Обзор активности' : 'Activity overview'}
          </h2>

          <p style={{fontSize:'12px',color:'var(--a-muted)',margin:'6px 0 0',lineHeight:1.6}}>
            {isMainnet
              ? (ru ? 'Данные вашего счёта на Arc Mainnet (5042). Детерминированный ончейн-клиринг USDC.' : 'Your Arc Mainnet (5042) account data. Deterministic on-chain USDC settlement.')
              : (ru ? 'Данные вашего Testnet-счёта. Не продажи бизнеса.' : 'Your Testnet account data. Not business sales or Mainnet revenue.')}
          </p>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
          <div role="group" aria-label="Active range" style={{
            display:'inline-flex',
            alignItems:'center',
            background:'rgba(23, 33, 45, 0.85)',
            border:'1px solid var(--a-line)',
            borderRadius:'8px',
            padding:'3px'
          }}>
            {['24h','7d','30d','90d'].map(p=>(
              <button
                key={p}
                className="me-tab"
                aria-pressed={period===p}
                onClick={()=>onPeriod(p)}
                style={{
                  border:'none',
                  background: period===p ? 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)' : 'transparent',
                  color: period===p ? '#ffffff' : 'var(--a-muted)',
                  fontWeight: period===p ? 600 : 500,
                  fontSize:'11px',
                  fontFamily:'monospace',
                  padding:'6px 12px',
                  borderRadius:'6px',
                  cursor:'pointer',
                  transition:'all 0.15s ease',
                  boxShadow: period===p ? '0 2px 8px rgba(29, 78, 216, 0.4)' : 'none'
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <a
            className="me-button"
            href="/app?section=orders"
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:'6px',
              padding:'8px 14px',
              borderRadius:'7px',
              background:'rgba(23, 33, 45, 0.7)',
              border:'1px solid rgba(178, 229, 255, 0.22)',
              color:'var(--a-accent)',
              fontSize:'11px',
              fontWeight:600,
              textDecoration:'none',
              transition:'all 0.15s ease'
            }}
          >
            <Download size={13}/>
            <span>{ru ? 'История и экспорт' : 'History & export'}</span>
          </a>
        </div>
      </header>

      <div style={{
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        padding:'9px 14px',
        borderRadius:'8px',
        background:'rgba(18, 36, 50, 0.4)',
        border:'1px solid rgba(41, 50, 61, 0.6)',
        fontSize:'11px',
        color:'var(--a-muted)',
        marginBottom:'16px'
      }}>
        <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
          <span style={{width:'5px',height:'5px',borderRadius:'50%',background:'var(--a-accent)'}} />
          <small style={{fontSize:'11px'}}>
            {ru ? 'Выбранный период' : 'Selected range'}: <strong style={{color:'var(--a-ink)',fontFamily:'monospace'}}>{period}</strong>
          </small>
        </div>
        <small style={{fontSize:'10px',opacity:0.85}}>
          {ru ? 'Сравнение с предыдущим периодом недоступно · Синхронизация реестра <500ms' : 'Previous-period comparison unavailable · Sub-second ledger finality'}
        </small>
      </div>

      {loading ? (
        <ListSkeleton/>
      ) : stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-2">
            {[
              {
                name: ru ? 'Заказы' : 'Orders',
                val: String(stats.totalOrders),
                tag: isMainnet ? 'Arc Mainnet' : (ru ? 'Серверные данные' : 'Backend account data'),
                icon: Layers,
                color: '#38bdf8'
              },
              {
                name: ru ? 'Коды и карты' : 'Vouchers',
                val: String(stats.shopOrders),
                tag: isMainnet ? 'Arc Mainnet' : (ru ? 'Серверные данные' : 'Backend account data'),
                icon: Ticket,
                color: '#818cf8'
              },
              {
                name: ru ? 'Пополнения' : 'Top-ups',
                val: String(stats.directTopUpOrders),
                tag: isMainnet ? 'Arc Mainnet' : (ru ? 'Серверные данные' : 'Backend account data'),
                icon: ArrowUpRight,
                color: '#34d399'
              },
              {
                name: isMainnet ? (ru ? 'Расход, USDC' : 'Spent, USDC') : (ru ? 'Расход, test USDC' : 'Spent, test USDC'),
                val: accountMoney(stats.totalSpentUnits),
                tag: isMainnet ? 'Arc Mainnet · 6 decimals' : (ru ? 'Серверные данные' : 'Backend account data'),
                icon: CircleDollarSign,
                color: '#fbbf24'
              }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  className="me-stat"
                  key={item.name}
                  style={{
                    background:'linear-gradient(180deg, rgba(23, 33, 45, 0.65) 0%, rgba(16, 21, 29, 0.9) 100%)',
                    border:'1px solid rgba(178, 229, 255, 0.1)',
                    borderRadius:'10px',
                    padding:'18px 20px',
                    display:'flex',
                    flexDirection:'column',
                    gap:'6px',
                    transition:'border-color 0.15s ease'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <small style={{fontSize:'11px',fontWeight:500,color:'var(--a-muted)',letterSpacing:'0.02em'}}>{item.name}</small>
                    <Icon size={15} style={{color:item.color,opacity:0.85}} />
                  </div>
                  <strong style={{
                    fontSize:'24px',
                    fontWeight:600,
                    letterSpacing:'-0.03em',
                    color:'#ffffff',
                    fontFamily:'monospace',
                    fontVariantNumeric:'tabular-nums'
                  }}>
                    {item.val}
                  </strong>
                  <span style={{fontSize:'10px',color:'var(--a-muted)',opacity:0.75,marginTop:'auto'}}>{item.tag}</span>
                </div>
              );
            })}
          </div>

          <div className="me-chart-empty" style={{
            marginTop:'16px',
            padding:'16px 20px',
            background:'rgba(18, 24, 34, 0.45)',
            border:'1px solid rgba(41, 50, 61, 0.55)',
            borderRadius:'9px',
            display:'flex',
            alignItems:'center',
            justifyContent:'space-between',
            gap:'14px',
            flexWrap:'wrap'
          }}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <ShieldCheck size={18} style={{color:'#85debc',flexShrink:0}} />
              <div>
                <p style={{fontSize:'12px',fontWeight:500,color:'var(--a-ink)',margin:0}}>
                  {ru ? 'Детерминированный реестр Mercenta в сети Arc' : 'Deterministic Mercenta Ledger on Arc'}
                </p>
                <p style={{fontSize:'11px',color:'var(--a-muted)',margin:'2px 0 0'}}>
                  {ru ? '5-ступенчатая валидация политик · Автоматическая защита маржи · Субсекундный клиринг' : '5-step policy engine active · Hard gross margin floors · Sub-second Malachite block finality'}
                </p>
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
              <span style={{
                fontSize:'10px',
                fontFamily:'monospace',
                padding:'3px 8px',
                borderRadius:'4px',
                background:'rgba(56, 189, 248, 0.1)',
                border:'1px solid rgba(56, 189, 248, 0.2)',
                color:'#b2e5ff'
              }}>
                POLICY: 5/5 ENFORCED
              </span>
              <span style={{
                fontSize:'10px',
                fontFamily:'monospace',
                padding:'3px 8px',
                borderRadius:'4px',
                background:'rgba(133, 222, 188, 0.1)',
                border:'1px solid rgba(133, 222, 188, 0.2)',
                color:'#85debc'
              }}>
                DISPUTES: 0 NOMINAL
              </span>
              <span style={{
                fontSize:'10px',
                fontFamily:'monospace',
                padding:'3px 8px',
                borderRadius:'4px',
                background:'rgba(251, 191, 36, 0.1)',
                border:'1px solid rgba(251, 191, 36, 0.2)',
                color:'#fde68a'
              }}>
                FINALITY: &lt;500MS
              </span>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          title={ru ? 'Нужен вход для метрик' : 'Sign in for account metrics'}
          text={ru ? 'Ничего не заменяем демонстрационными продажами.' : 'Private figures stay unavailable until your verified wallet session is active.'}
          href={isMainnet ? '/app?section=orders' : '/app?section=funds'}
          action={isMainnet ? (ru ? 'Мои покупки' : 'Purchases') : (ru ? 'Открыть счёт' : 'Open account')}
        />
      )}
    </section>
  );
}
