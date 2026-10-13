'use client';
import {useEffect,useRef,useState} from 'react';
import {Bot,Search,ArrowUpRight,ShieldCheck,Send,Wallet,Zap} from 'lucide-react';
import {mainnetGuidance,checkoutDetail} from '@/lib/mainnet-assistant';
import {sourceLiveMainnetProducts} from '@/lib/mainnet-live-catalog';
import type {QuickSelectProduct} from '@/lib/mainnet-quick-select';
import './mainnet-assistant.css';

export function MainnetAssistant({wallet,onConnect,ru=false,profitOnly=false}:{wallet:string|null;onConnect:()=>void;ru?:boolean;profitOnly?:boolean}){
  const [mode,setMode]=useState<'source'|'chat'>(profitOnly?'chat':'source');
  const [goal,setGoal]=useState('');
  const [budget,setBudget]=useState('10');
  const [region,setRegion]=useState('ANY');
  const [products,setProducts]=useState<QuickSelectProduct[]|null>(null);
  const [error,setError]=useState('');
  const [input,setInput]=useState('');
  const [turns,setTurns]=useState<{q:string;a:string}[]>([]);
  const output=useRef<HTMLDivElement>(null);
  const searchGeneration=useRef(0);
  const [searching,setSearching]=useState(false);

  useEffect(()=>{
    searchGeneration.current++;
    setSearching(false);
    setProducts(null);
    setTurns([]);
    setError('');
    setInput('');
  },[wallet]);

  const source=async(overrideGoal?:string,overrideBudget?:string)=>{
    const g=overrideGoal??goal;
    const b=overrideBudget??budget;
    const generation=++searchGeneration.current;
    setError('');
    setProducts(null);
    setSearching(true);
    try{
      if(!g.trim())throw Error('ENTER_PRODUCT');
      const result=await sourceLiveMainnetProducts(g,b,region);
      if(generation===searchGeneration.current)setProducts(result);
    }catch{
      if(generation===searchGeneration.current){
        setError(ru?'Не удалось подобрать актуальные варианты. Проверьте товар, лимит и соединение; попробуйте снова. Ничего не списано.':'Could not find current options. Check the product, budget and connection, then retry. No funds were moved.');
      }
    }finally{
      if(generation===searchGeneration.current)setSearching(false);
    }
  };

  useEffect(()=>{
    try{
      const d=JSON.parse(sessionStorage.getItem('mercenta-agent-draft')??'null');
      if(d?.mode==='mainnet'&&typeof d.goal==='string')setGoal(d.goal.slice(0,200));
    }catch{}
  },[]);

  const send=(q=input)=>{
    if(!q.trim())return;
    setTurns(t=>[...t,{q:q.trim(),a:mainnetGuidance(q,ru)}]);
    setInput('');
  };

  useEffect(()=>{
    output.current?.lastElementChild?.scrollIntoView({block:'nearest',behavior:'auto'});
  },[turns.length]);

  const prompts = ru ? [
    'Закупка для создателя до 2 USDC',
    'Показать баланс счёта',
    'Рассчитать комиссии сети Arc',
    'Комиссии сети',
    'Объяснить 5-уровневый Policy Engine',
    'Подобрать ваучер Steam'
  ] : [
    'Plan a creator purchase under 2 USDC',
    'Show my balance',
    'Calculate gas fees on Arc',
    'Gas & finality',
    'Explain 5-step Policy Engine',
    'Source Steam voucher'
  ];

  return (
    <section className="mn-assistant" aria-labelledby="mainnet-assistant-title">
      <header className="mn-as-header">
        <div>
          <span className="mn-as-kicker"><Zap size={13}/>{ru?'MERCENTA / АВТОНОМНЫЙ ОПЕРАТОР ЗАКУПОК':'MERCENTA / AUTONOMOUS BUSINESS OPERATOR'}</span>
          <h2 id="mainnet-assistant-title">{ru?'От запроса — к проверенной закупке на Arc.':'From intent to policy-checked purchase on Arc.'}</h2>
          <p>{ru?'Задайте товар и бюджет. Агент проверит каталог и 5 правил безопасности. Подтвердите заказ в 1 клик.':'Set product and budget. The operator checks live catalog and 5 policy gates. Confirm checkout in 1 click.'}</p>
        </div>
        <span className="mn-as-network">Arc Mainnet · 5042</span>
      </header>

      {/* 5-Step Policy Engine Strip */}
      <div className="mn-policy-strip" aria-label="Active Policy Envelope">
        <div className="mn-policy-item">
          <span className="mn-policy-label"><span/>01 Spend Cap</span>
          <span className="mn-policy-value">≤ 100.00 USDC / 24h</span>
        </div>
        <div className="mn-policy-item">
          <span className="mn-policy-label"><span/>02 Margin Floor</span>
          <span className="mn-policy-value">≥ 15.0% Gross Margin</span>
        </div>
        <div className="mn-policy-item">
          <span className="mn-policy-label"><span/>03 Counterparty</span>
          <span className="mn-policy-value">100% Verified SLAs</span>
        </div>
        <div className="mn-policy-item">
          <span className="mn-policy-label"><span/>04 Velocity Cap</span>
          <span className="mn-policy-value">≤ 3 orders / min</span>
        </div>
        <div className="mn-policy-item">
          <span className="mn-policy-label"><span/>05 Human Gate</span>
          <span className="mn-policy-value">&gt; Auto-limit Escalation</span>
        </div>
      </div>

      <div className="mn-as-navigation">
        <div
          role="tablist"
          onKeyDown={e=>{
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
            e.preventDefault();
            const next=e.key==='Home'?'source':e.key==='End'?'chat':mode==='source'?'chat':'source';
            setMode(next);
            document.getElementById(next+'-tab')?.focus();
          }}
          aria-label={ru?'Режим помощника':'Assistant mode'}
        >
          <button
            id="source-tab"
            type="button"
            role="tab"
            aria-selected={mode==='source'}
            aria-controls="source-panel"
            onClick={()=>setMode('source')}
          >
            <Search size={17}/>
            {ru?'Подбор товаров':'Sourcing'}
          </button>
          <button
            id="chat-tab"
            type="button"
            role="tab"
            aria-selected={mode==='chat'}
            aria-controls="chat-panel"
            onClick={()=>setMode('chat')}
          >
            <Bot size={17}/>
            {ru?'Консультант':'Commerce Copilot'}
          </button>
        </div>
        <span>{ru?'Каждая покупка требует вашего подтверждения':'You approve every purchase with explicit wallet signature'}</span>
      </div>

      <div className="mn-as-safety">
        <ShieldCheck size={18}/>
        <p>{ru?'Детерминированная безопасность: подключение кошелька не разрешает автоматическое списание. Оплата производится в USDC на Arc Mainnet.':'Deterministic safety: connecting a wallet never authorizes automatic debits. Sourced items settle in USDC on Arc Mainnet.'}</p>
      </div>

      {mode==='source' ? (
        <div id="source-panel" role="tabpanel" aria-labelledby="source-tab" className="mn-as-source">
          <form onSubmit={e=>{e.preventDefault();void source();}}>
            <h3>{ru?'Что найти для вас?':'What can we source for you?'}</h3>
            <p>{ru?'Актуальные варианты в пределах лимита. Перед оплатой checkout проверит итоговую цену.':'Search live catalogue options within your limit. Checkout verifies final onchain price before payment.'}</p>
            <label>
              {ru?'Товар или сервис':'Product or service'}
              <input
                disabled={searching}
                value={goal}
                maxLength={200}
                onChange={e=>{setGoal(e.target.value);setProducts(null);}}
                placeholder={ru?'Например, Steam, Telegram Stars или Spotify':'e.g. Steam, Telegram Stars, Roblox, Spotify'}
                required
              />
            </label>

            <div className="mn-as-examples">
              {['Steam','Telegram Stars','Roblox','Spotify','Apple'].map(item=>(
                <button
                  type="button"
                  key={item}
                  onClick={()=>{
                    setGoal(item);
                    setProducts(null);
                    void source(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mn-as-fields">
              <label>
                {ru?'Лимит, USDC':'Spending limit · USDC'}
                <input
                  disabled={searching}
                  inputMode="decimal"
                  value={budget}
                  maxLength={20}
                  onChange={e=>{setBudget(e.target.value);setProducts(null);}}
                  required
                />
              </label>
              <label>
                {ru?'Регион':'Region'}
                <select
                  disabled={searching}
                  value={region}
                  onChange={e=>{setRegion(e.target.value);setProducts(null);}}
                >
                  <option value="ANY">{ru?'Все регионы':'Any region'}</option>
                  {['GLOBAL','US','EU','GB','TR','AE','KZ','IN','NG'].map(r=><option key={r}>{r}</option>)}
                </select>
              </label>
            </div>

            <button className="mn-as-primary" type="submit" disabled={searching}>
              <Search size={18}/>
              {searching?(ru?'Проверяем каталог…':'Checking catalogue…'):(ru?'Найти варианты':'Find options')}
            </button>
            {error&&<p role="alert" className="mn-as-error">{error}</p>}
          </form>

          <div className="mn-as-results" aria-live="polite">
            {products===null ? (
              <div className="mn-as-empty">
                <Search size={32}/>
                <h3>{ru?'Точные варианты, без лишнего.':'A focused shortlist. No guesswork.'}</h3>
                <p>{ru?'Задайте товар, бюджет и регион. Ничего не списывается.':'Set a product, budget and region. Searching never moves funds.'}</p>
                <span>{ru?'Актуальный каталог · котировка перед оплатой':'Live catalogue · final quote at checkout'}</span>
              </div>
            ) : products.length ? (
              <>
                <div className="mn-as-result-title">
                  <h3>{ru?'Найденные варианты':'Your shortlist'}</h3>
                  <span>{products.length} {ru?'вариантов':products.length===1?'option':'options'}</span>
                </div>
                {products.map(p=>(
                  <article key={p.id}>
                    <div>
                      <span>{p.country} · {p.kind==='Direct Top-Up'?'Top-up':'Voucher'} · <small style={{color:'#10b981',fontWeight:600}}>✓ 5/5 Policy Passed</small></span>
                      <h4>{p.name}</h4>
                      <p>{p.price} <small>USDC</small></p>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button
                        type="button"
                        onClick={()=>window.dispatchEvent(new CustomEvent('mercenta-open-checkout',{detail:checkoutDetail(p)}))}
                      >
                        {ru?'Проверить':'Review'}
                        <ArrowUpRight size={15}/>
                      </button>
                      <button
                        type="button"
                        className="mn-as-buy-btn"
                        onClick={()=>window.dispatchEvent(new CustomEvent('mercenta-open-checkout',{detail:checkoutDetail(p)}))}
                      >
                        {ru?'Купить (USDC)':'Buy (USDC)'}
                        <ArrowUpRight size={15}/>
                      </button>
                    </div>
                  </article>
                ))}
                <p className="mn-as-footnote">{ru?'Лимит относится к одному товару без комиссии. Покупка требует отдельного подтверждения в кошельке.':'Limit applies to one item, excluding gas. Purchase requires separate wallet signature.'}</p>
              </>
            ) : (
              <div className="mn-as-empty">
                <h3>{ru?'Пока нет совпадений':'No matching options'}</h3>
                <p>{ru?'Попробуйте другой товар, регион или лимит.':'Try another product, region or spending limit.'}</p>
                <a href="/app?section=shop">{ru?'Открыть каталог':'Browse the full catalogue'}<ArrowUpRight size={16}/></a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab" className="mn-as-chat">
          <div className="mn-as-chat-label">
            <Bot size={18}/>
            {ru?'ИИ-консультант Mercenta · Детерминированный Policy Engine':'Mercenta AI Copilot · Policy Engine Guidance'}
          </div>

          <div className="mn-as-messages" ref={output} aria-live="polite">
            {!turns.length ? (
              <div className="mn-as-chat-welcome">
                <h3>{profitOnly?(ru?'Контроль бюджета на Mainnet':'Mainnet budget controls'):(ru?'Уверенность перед покупкой.':'Clarity before you commit.')}</h3>
                <p>{ru?'Спросите о покупке, бюджете или сети Arc. Чат консультирует и помогает подготовить закупку.':'Ask about checkout, budgets, or Arc network finality. Chat guides your procurement flow.'}</p>
              </div>
            ) : (
              turns.map((t,i)=>(
                <div key={i} className="mn-as-turn">
                  <p className="mn-as-question">{t.q}</p>
                  <div>
                    <span>Mercenta · {ru?'Консультация':'Guidance'}</span>
                    <p>{t.a}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mn-as-prompts">
            {prompts.map(q=>(
              <button key={q} type="button" onClick={()=>send(q)}>{q}</button>
            ))}
          </div>

          <form onSubmit={e=>{e.preventDefault();send();}} className="mn-as-compose">
            <textarea
              aria-label={ru?'Сообщение консультанту':'Message Commerce Copilot'}
              value={input}
              maxLength={2000}
              onChange={e=>setInput(e.target.value)}
              placeholder={ru?'Что хотите узнать или подготовить?':'What would you like to source or know?'}
              rows={2}
            />
            <button
              type="submit"
              className="mn-as-primary"
              disabled={!input.trim()}
              aria-label={ru?'Отправить сообщение':'Send message'}
            >
              <Send size={18}/>
            </button>
          </form>
        </div>
      )}

      {!wallet && (
        <footer className="mn-as-connect">
          <Wallet size={18}/>
          <span>{ru?'Просматривайте без входа. Подключите кошелёк для прямого расчёта в USDC на Arc Mainnet.':'Explore without signing in. Connect a wallet for direct USDC settlement on Arc Mainnet.'}</span>
          <button type="button" onClick={onConnect}>
            {ru?'Подключить кошелёк':'Connect wallet'}
            <ArrowUpRight size={16}/>
          </button>
        </footer>
      )}
    </section>
  );
}
