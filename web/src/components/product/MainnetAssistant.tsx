'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bot, Search, ArrowUpRight, ShieldCheck, Send, Wallet, Zap, CheckCircle2 } from 'lucide-react';
import { mainnetGuidance, checkoutDetail } from '@/lib/mainnet-assistant';
import { sourceLiveMainnetProducts } from '@/lib/mainnet-live-catalog';
import { mainnetQuickSelect, type QuickSelectProduct } from '@/lib/mainnet-quick-select';
import './mainnet-assistant.css';

interface ChatTurn {
  q: string;
  a: string;
  items?: QuickSelectProduct[];
}

export function MainnetAssistant({
  wallet,
  onConnect,
  ru = false,
  profitOnly = false,
}: {
  wallet: string | null;
  onConnect: () => void;
  ru?: boolean;
  profitOnly?: boolean;
}) {
  const [mode, setMode] = useState<'source' | 'chat'>(profitOnly ? 'chat' : 'source');
  const [goal, setGoal] = useState('');
  const [budget, setBudget] = useState('10');
  const [region, setRegion] = useState('ANY');
  const [products, setProducts] = useState<QuickSelectProduct[] | null>(null);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const output = useRef<HTMLDivElement>(null);
  const searchGeneration = useRef(0);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    searchGeneration.current++;
    setSearching(false);
    setProducts(null);
    setTurns([]);
    setError('');
    setInput('');
  }, [wallet]);

  const source = async (overrideGoal?: string, overrideBudget?: string) => {
    const g = overrideGoal ?? goal;
    const b = overrideBudget ?? budget;
    const generation = ++searchGeneration.current;
    setError('');
    setProducts(null);
    setSearching(true);
    try {
      if (!g.trim()) throw Error('ENTER_PRODUCT');
      const result = await sourceLiveMainnetProducts(g, b, region);
      if (generation === searchGeneration.current) setProducts(result);
    } catch {
      if (generation === searchGeneration.current) {
        setError(
          ru
            ? 'Не удалось подобрать актуальные варианты. Проверьте товар, лимит и соединение; попробуйте снова. Ничего не списано.'
            : 'Could not find current options. Check the product, budget and connection, then retry. No funds were moved.'
        );
      }
    } finally {
      if (generation === searchGeneration.current) setSearching(false);
    }
  };

  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem('mercenta-agent-draft') ?? 'null');
      if (d?.mode === 'mainnet' && typeof d.goal === 'string') setGoal(d.goal.slice(0, 200));
    } catch {}
  }, []);

  // Match quick products from catalogue for conversational requests
  const matchCopilotProducts = (query: string): QuickSelectProduct[] => {
    const q = query.toLowerCase();
    const matches: QuickSelectProduct[] = [];
    if (/steam|стим/.test(q)) {
      const steam = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('steam'));
      if (steam) matches.push(steam);
    }
    if (/creator|stars|звезд|создател/.test(q)) {
      const stars = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('telegram stars'));
      const apple = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('apple'));
      if (stars) matches.push(stars);
      if (apple) matches.push(apple);
    }
    if (/apple|itunes/.test(q) && !matches.some(m => m.name.toLowerCase().includes('apple'))) {
      const apple = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('apple'));
      if (apple) matches.push(apple);
    }
    if (/roblox|роблокс/.test(q)) {
      const roblox = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('roblox'));
      if (roblox) matches.push(roblox);
    }
    if (/spotify|спотифай/.test(q)) {
      const spotify = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('spotify'));
      if (spotify) matches.push(spotify);
    }
    if (/xbox/.test(q)) {
      const xbox = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('xbox'));
      if (xbox) matches.push(xbox);
    }
    if (/psn|playstation/.test(q)) {
      const psn = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('playstation'));
      if (psn) matches.push(psn);
    }
    return matches.slice(0, 3);
  };

  const send = (q = input) => {
    if (!q.trim()) return;
    const cleanQ = q.trim();
    const answer = mainnetGuidance(cleanQ, ru);
    const items = matchCopilotProducts(cleanQ);
    setTurns(t => [...t, { q: cleanQ, a: answer, items: items.length > 0 ? items : undefined }]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  useEffect(() => {
    output.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [turns.length]);

  const prompts = ru
    ? [
        'Закупка для создателя до 2 USDC',
        'Показать баланс счёта',
        'Рассчитать комиссии сети Arc',
        'Комиссии сети',
        'Объяснить 5-уровневый Policy Engine',
        'Подобрать ваучер Steam',
      ]
    : [
        'Plan a creator purchase under 2 USDC',
        'Show my balance',
        'Calculate gas fees on Arc',
        'Gas & finality',
        'Explain 5-step Policy Engine',
        'Source Steam voucher',
      ];

  const handleCheckoutOpen = (p: QuickSelectProduct) => {
    window.dispatchEvent(
      new CustomEvent('mercenta-open-checkout', { detail: checkoutDetail(p) })
    );
  };

  return (
    <section className="mn-assistant" aria-labelledby="mainnet-assistant-title">
      {/* Institutional Top Header */}
      <header className="mn-as-header">
        <div className="mn-as-header-copy">
          <div className="mn-as-meta">
            <span className="mn-as-kicker">
              <Zap size={13} strokeWidth={2.2} />
              {ru ? 'MERCENTA / АВТОНОМНЫЙ ОПЕРАТОР ЗАКУПОК' : 'MERCENTA / AUTONOMOUS BUSINESS OPERATOR'}
            </span>
          </div>
          <h2 id="mainnet-assistant-title">
            {ru ? 'От запроса — к проверенной закупке на Arc.' : 'From intent to policy-checked purchase on Arc.'}
          </h2>
          <p>
            {ru
              ? 'Задайте товар и бюджет. Агент проверит каталог и 5 правил безопасности. Подтвердите заказ в 1 клик.'
              : 'Set product and budget. The operator checks live catalog and 5 policy gates. Confirm checkout in 1 click.'}
          </p>
        </div>
        <div className="mn-as-badge">
          <span className="mn-beacon" />
          <span>Arc Mainnet · 5042</span>
        </div>
      </header>

      {/* 5-Step Policy Engine Strip (Matching .mx-policy-envelope / .mx-path) */}
      <div className="mn-policy-strip" aria-label="Active Policy Envelope">
        <div className="mn-policy-item">
          <div className="mn-policy-meta">
            <span className="mn-policy-beacon" />
            <span className="mn-policy-num">01 Spend Cap</span>
          </div>
          <div className="mn-policy-value">≤ 100.00 USDC / 24h</div>
        </div>
        <div className="mn-policy-item">
          <div className="mn-policy-meta">
            <span className="mn-policy-beacon" />
            <span className="mn-policy-num">02 Margin Floor</span>
          </div>
          <div className="mn-policy-value">≥ 15.0% Gross Margin</div>
        </div>
        <div className="mn-policy-item">
          <div className="mn-policy-meta">
            <span className="mn-policy-beacon" />
            <span className="mn-policy-num">03 Counterparty</span>
          </div>
          <div className="mn-policy-value">100% Verified SLAs</div>
        </div>
        <div className="mn-policy-item">
          <div className="mn-policy-meta">
            <span className="mn-policy-beacon" />
            <span className="mn-policy-num">04 Velocity Cap</span>
          </div>
          <div className="mn-policy-value">≤ 3 orders / min</div>
        </div>
        <div className="mn-policy-item">
          <div className="mn-policy-meta">
            <span className="mn-policy-beacon" />
            <span className="mn-policy-num">05 Human Gate</span>
          </div>
          <div className="mn-policy-value">&gt; Auto-limit Escalation</div>
        </div>
      </div>

      {/* Navigation Segmented Bar */}
      <div className="mn-as-navigation">
        <div
          className="mn-as-tabs"
          role="tablist"
          onKeyDown={e => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const next = e.key === 'Home' ? 'source' : e.key === 'End' ? 'chat' : mode === 'source' ? 'chat' : 'source';
            setMode(next);
            document.getElementById(next + '-tab')?.focus();
          }}
          aria-label={ru ? 'Режим помощника' : 'Assistant mode'}
        >
          <button
            id="source-tab"
            type="button"
            role="tab"
            className={mode === 'source' ? 'is-active' : ''}
            aria-selected={mode === 'source'}
            aria-controls="source-panel"
            onClick={() => setMode('source')}
          >
            <Search size={15} />
            <span>{ru ? 'Подбор товаров' : 'Sourcing'}</span>
          </button>
          <button
            id="chat-tab"
            type="button"
            role="tab"
            className={mode === 'chat' ? 'is-active' : ''}
            aria-selected={mode === 'chat'}
            aria-controls="chat-panel"
            onClick={() => setMode('chat')}
          >
            <Bot size={15} />
            <span>{ru ? 'Консультант' : 'Commerce Copilot'}</span>
          </button>
        </div>
        <span className="mn-as-subnote">
          {ru ? 'Каждая покупка требует вашего подтверждения' : 'You approve every purchase with explicit wallet signature'}
        </span>
      </div>

      {/* Hardware-Grade Deterministic Safety Notice */}
      <div className="mn-as-safety">
        <ShieldCheck size={16} />
        <p>
          {ru
            ? 'Детерминированная безопасность: подключение кошелька не разрешает автоматическое списание. Оплата производится в USDC на Arc Mainnet.'
            : 'Deterministic safety: connecting a wallet never authorizes automatic debits. Sourced items settle in USDC on Arc Mainnet.'}
        </p>
      </div>

      {mode === 'source' ? (
        <div id="source-panel" role="tabpanel" aria-labelledby="source-tab" className="mn-as-source">
          <form
            className="mn-as-form"
            onSubmit={e => {
              e.preventDefault();
              void source();
            }}
          >
            <h3>{ru ? 'Что найти для вас?' : 'What can we source for you?'}</h3>
            <p>
              {ru
                ? 'Актуальные варианты в пределах лимита. Перед оплатой checkout проверит итоговую цену.'
                : 'Search live catalogue options within your limit. Checkout verifies final onchain price before payment.'}
            </p>

            <label className="mn-field-label">
              <span>{ru ? 'Товар или сервис' : 'Product or service'}</span>
              <input
                disabled={searching}
                value={goal}
                maxLength={200}
                onChange={e => {
                  setGoal(e.target.value);
                  setProducts(null);
                }}
                placeholder={ru ? 'Например, Steam, Telegram Stars или Spotify' : 'e.g. Steam, Telegram Stars, Roblox, Spotify'}
                required
              />
            </label>

            <div className="mn-as-examples">
              {['Steam', 'Telegram Stars', 'Roblox', 'Spotify', 'Apple'].map(item => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
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
              <label className="mn-field-label">
                <span>{ru ? 'Лимит, USDC' : 'Spending limit · USDC'}</span>
                <input
                  disabled={searching}
                  inputMode="decimal"
                  value={budget}
                  maxLength={20}
                  onChange={e => {
                    setBudget(e.target.value);
                    setProducts(null);
                  }}
                  required
                />
              </label>
              <label className="mn-field-label">
                <span>{ru ? 'Регион' : 'Region'}</span>
                <select
                  disabled={searching}
                  value={region}
                  onChange={e => {
                    setRegion(e.target.value);
                    setProducts(null);
                  }}
                >
                  <option value="ANY">{ru ? 'Все регионы' : 'Any region'}</option>
                  {['GLOBAL', 'US', 'EU', 'GB', 'TR', 'AE', 'KZ', 'IN', 'NG'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            </div>

            <button className="mn-as-primary" type="submit" disabled={searching}>
              <Search size={16} />
              <span>{searching ? (ru ? 'Проверяем каталог…' : 'Checking catalogue…') : (ru ? 'Найти варианты' : 'Find options')}</span>
            </button>
            {error && <p role="alert" className="mn-as-error">{error}</p>}
          </form>

          {/* Sourcing Shortlist Results */}
          <div className="mn-as-results" aria-live="polite">
            {products === null ? (
              <div className="mn-as-empty">
                <Search size={28} />
                <h3>{ru ? 'Точные варианты, без лишнего.' : 'A focused shortlist. No guesswork.'}</h3>
                <p>{ru ? 'Задайте товар, бюджет и регион. Ничего не списывается.' : 'Set a product, budget and region. Searching never moves funds.'}</p>
                <span className="mn-as-empty-tag">{ru ? 'Актуальный каталог · котировка перед оплатой' : 'Live catalogue · final quote at checkout'}</span>
              </div>
            ) : products.length ? (
              <div className="mn-as-card-list">
                <div className="mn-as-result-title">
                  <span className="mn-as-res-kicker">{ru ? 'НАЙДЕННЫЕ ВАРИАНТЫ' : 'SOURCING SHORTLIST'}</span>
                  <span className="mn-as-res-count">{products.length} {ru ? 'вариантов' : products.length === 1 ? 'option' : 'options'}</span>
                </div>
                {products.map(p => (
                  <article key={p.id} className="mn-item-card">
                    <div className="mn-item-info">
                      <div className="mn-item-meta">
                        <span className="mn-item-tag">{p.country} · {p.kind === 'Direct Top-Up' ? 'TOP-UP' : 'VOUCHER'}</span>
                        <span className="mn-item-policy-badge">
                          <CheckCircle2 size={11} />
                          <span>5/5 Policy Passed</span>
                        </span>
                      </div>
                      <h4 className="mn-item-title">{p.name}</h4>
                      <div className="mn-item-price">
                        <strong>{p.price}</strong>
                        <small>USDC</small>
                      </div>
                    </div>
                    <div className="mn-item-actions">
                      <button
                        type="button"
                        className="mn-btn-review"
                        onClick={() => handleCheckoutOpen(p)}
                      >
                        <span>{ru ? 'Проверить' : 'Review'}</span>
                        <ArrowUpRight size={14} />
                      </button>
                      <button
                        type="button"
                        className="mn-btn-buy"
                        onClick={() => handleCheckoutOpen(p)}
                      >
                        <span>{ru ? 'Купить (USDC)' : 'Buy (USDC)'}</span>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                <p className="mn-as-footnote">
                  {ru
                    ? 'Лимит относится к одному товару без комиссии. Покупка требует отдельного подтверждения в кошельке.'
                    : 'Limit applies to one item, excluding gas. Purchase requires separate wallet signature.'}
                </p>
              </div>
            ) : (
              <div className="mn-as-empty">
                <h3>{ru ? 'Пока нет совпадений' : 'No matching options'}</h3>
                <p>{ru ? 'Попробуйте другой товар, регион или лимит.' : 'Try another product, region or spending limit.'}</p>
                <a href="/app?section=shop" className="mn-as-empty-link">
                  <span>{ru ? 'Открыть каталог' : 'Browse the full catalogue'}</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Commerce Copilot (Intelligent Conversational Operator) */
        <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab" className="mn-as-chat">
          <div className="mn-as-chat-header">
            <Bot size={16} />
            <span>{ru ? 'MERCENTA COMMERCE COPILOT · 5-STEP POLICY ENGINE' : 'MERCENTA COMMERCE COPILOT · 5-STEP POLICY ENGINE'}</span>
          </div>

          <div className="mn-as-messages" ref={output} aria-live="polite">
            {!turns.length ? (
              <div className="mn-as-chat-welcome">
                <span className="mn-as-kicker">{ru ? 'СИСТЕМА ГОТОВА' : 'READY TO SOURCE'}</span>
                <h3>{profitOnly ? (ru ? 'Контроль бюджета на Mainnet' : 'Mainnet budget controls') : (ru ? 'Уверенность перед покупкой.' : 'Clarity before you commit.')}</h3>
                <p>
                  {ru
                    ? 'Спросите о покупке, бюджете или сети Arc. Чат консультирует и помогает подготовить закупку.'
                    : 'Ask about checkout, budgets, or Arc network finality. Chat guides your procurement flow and surfaces 1-click checkouts.'}
                </p>
              </div>
            ) : (
              turns.map((t, i) => (
                <div key={i} className="mn-as-turn">
                  <div className="mn-as-question-box">
                    <p className="mn-as-question">{t.q}</p>
                  </div>
                  <div className="mn-as-answer-box">
                    <span className="mn-as-agent-label">MERCENTA · {ru ? 'КОНСУЛЬТАЦИЯ И ПОДБОР' : 'GUIDANCE & SOURCING'}</span>
                    <p className="mn-as-answer-text">{t.a}</p>

                    {/* Sourced items directly in Copilot */}
                    {t.items && t.items.length > 0 && (
                      <div className="mn-copilot-items">
                        <span className="mn-copilot-items-label">{ru ? 'ПРЯМОЙ ЗАКАЗ НА ARC MAINNET' : 'MATCHED ITEMS ON ARC MAINNET'}</span>
                        {t.items.map(item => (
                          <div key={item.id} className="mn-item-card mn-item-card-mini">
                            <div className="mn-item-info">
                              <span className="mn-item-tag">{item.country} · {item.kind === 'Direct Top-Up' ? 'TOP-UP' : 'VOUCHER'}</span>
                              <h4 className="mn-item-title">{item.name}</h4>
                              <div className="mn-item-price">
                                <strong>{item.price}</strong>
                                <small>USDC</small>
                              </div>
                            </div>
                            <div className="mn-item-actions">
                              <button
                                type="button"
                                className="mn-btn-buy"
                                onClick={() => handleCheckoutOpen(item)}
                              >
                                <span>{ru ? 'Купить (USDC)' : 'Buy (USDC)'}</span>
                                <ArrowUpRight size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Prompts Bar */}
          <div className="mn-as-prompts">
            {prompts.map(q => (
              <button key={q} type="button" onClick={() => send(q)}>
                <span>{q}</span>
                <ArrowUpRight size={12} />
              </button>
            ))}
          </div>

          {/* Compose Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              send();
            }}
            className="mn-as-compose"
          >
            <textarea
              aria-label={ru ? 'Сообщение консультанту' : 'Message Commerce Copilot'}
              value={input}
              maxLength={2000}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ru ? 'Что хотите узнать или подготовить? (Enter для отправки)' : 'What would you like to source or know? (Enter to send)'}
              rows={2}
            />
            <button
              type="submit"
              className="mn-as-primary mn-btn-send"
              disabled={!input.trim()}
              aria-label={ru ? 'Отправить сообщение' : 'Send message'}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Footer Wallet Notice */}
      {!wallet && (
        <footer className="mn-as-connect">
          <Wallet size={16} />
          <span>
            {ru
              ? 'Просматривайте без входа. Подключите кошелёк для прямого расчёта в USDC на Arc Mainnet.'
              : 'Explore without signing in. Connect a wallet for direct USDC settlement on Arc Mainnet.'}
          </span>
          <button type="button" className="mn-btn-connect" onClick={onConnect}>
            <span>{ru ? 'Подключить кошелёк' : 'Connect wallet'}</span>
            <ArrowUpRight size={14} />
          </button>
        </footer>
      )}
    </section>
  );
}
