'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bot, Search, ArrowUpRight, ShieldCheck, Send, Wallet, CheckCircle2 } from 'lucide-react';
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
    const q = query.toLowerCase().trim();
    const matches: QuickSelectProduct[] = [];
    if (/^(hi|hello|hey|yo|greetings|start|привет|здравствуй|хай|салам)\b/i.test(q)) {
      const stars = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('telegram stars'));
      const steam = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('steam'));
      const apple = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('apple'));
      if (stars) matches.push(stars);
      if (apple) matches.push(apple);
      if (steam) matches.push(steam);
      return matches;
    }
    if (/steam|стим/.test(q)) {
      const steam = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('steam'));
      if (steam) matches.push(steam);
    }
    if (/creator|stars|звезд|создател|telegram/.test(q)) {
      const stars = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('telegram stars'));
      const apple = mainnetQuickSelect.find(p => p.name.toLowerCase().includes('apple'));
      if (stars && !matches.some(m => m.id === stars.id)) matches.push(stars);
      if (apple && !matches.some(m => m.id === apple.id)) matches.push(apple);
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
    if (matches.length === 0) {
      const words = q.split(/\s+/).filter(w => w.length > 2);
      for (const p of mainnetQuickSelect) {
        if (words.some(w => p.name.toLowerCase().includes(w) || p.category.toLowerCase().includes(w))) {
          matches.push(p);
          if (matches.length >= 3) break;
        }
      }
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
    <>
      {/* Top Metric Cards matching Funds layout */}
      <div className="ma-stats">
        <article>
          <span>{ru ? '01 · Лимит расходов' : '01 · 24h Spend Cap'}</span>
          <strong>≤ 100.00<small> USDC</small></strong>
          <p>{ru ? 'Детерминированный 24h лимит расходов' : 'Deterministic 24h spending limit'}</p>
        </article>
        <article>
          <span>{ru ? '02 · Минимальная маржа' : '02 · Margin Floor'}</span>
          <strong>≥ 15.0%<small> Gross</small></strong>
          <p>{ru ? 'Защита валовой маржи мерчанта' : 'Guaranteed gross margin protection'}</p>
        </article>
        <article>
          <span>{ru ? '03 · Policy Engine' : '03 · Policy Engine'}</span>
          <strong>5 / 5<small> Passed</small></strong>
          <p>{ru ? 'Мгновенный расчёт на Arc (< 1с) · 100% SLA' : 'Instant settlement on Arc (< 1s) · 100% SLA'}</p>
        </article>
      </div>

      {/* Safety Info Bar matching Funds layout */}
      <div className="ux-funding-info">
        <ShieldCheck size={18} />
        <div>
          <b>{ru ? 'Детерминированная безопасность на Arc Mainnet' : 'Deterministic Safety on Arc Mainnet'}</b>
          <p>
            {ru
              ? 'Подключение кошелька не разрешает автоматические списания. Все покупки требуют явной подписи в кошельке и проводятся в USDC.'
              : 'Connecting a wallet never authorizes automatic debits. Sourced items settle in USDC on Arc Mainnet with your explicit wallet signature.'}
          </p>
        </div>
        <details>
          <summary>{ru ? 'Параметры безопасности' : 'Safety boundaries'}</summary>
          <p>
            {ru
              ? '5-уровневый Policy Engine: лимит скорости ≤ 3 заказов/мин, 100% SLA поставщиков, ручная эскалация для крупных заказов.'
              : '5-step Policy Engine: velocity cap ≤ 3 orders/min, 100% verified SLA, human gate escalation above limits.'}
          </p>
        </details>
      </div>

      {/* Main Panel matching Funds / Orders panel */}
      <section className="ma-panel">
        <div className="ma-panel-title">
          <div>
            <h2>{mode === 'source' ? (ru ? 'Подбор товаров' : 'Sourcing') : (ru ? 'Консультант' : 'Commerce Copilot')}</h2>
            <p>
              {mode === 'source'
                ? (ru ? 'Поиск вариантов в каталоге в пределах лимита. Перед оплатой checkout проверит финальную цену.' : 'Search live catalogue options within your limit. Checkout verifies final onchain price before payment.')
                : (ru ? 'Интеллектуальный оператор по закупкам, бюджету и сети Arc.' : 'Conversational operator for sourcing, budgets, and settlement on Arc.')}
            </p>
          </div>
          <div role="tablist" aria-label={ru ? 'Режим ассистента' : 'Assistant mode'} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              id="source-tab"
              type="button"
              role="tab"
              className={mode === 'source' ? 'ma-button' : 'ma-button secondary'}
              aria-selected={mode === 'source'}
              onClick={() => setMode('source')}
            >
              <Search size={15} />
              <span>{ru ? 'Подбор товаров' : 'Sourcing'}</span>
            </button>
            <button
              id="chat-tab"
              type="button"
              role="tab"
              className={mode === 'chat' ? 'ma-button' : 'ma-button secondary'}
              aria-selected={mode === 'chat'}
              onClick={() => setMode('chat')}
            >
              <Bot size={15} />
              <span>{ru ? 'Консультант' : 'Commerce Copilot'}</span>
            </button>
          </div>
        </div>

        {mode === 'source' ? (
          <div>
            <form
              className="ma-filters"
              onSubmit={e => {
                e.preventDefault();
                void source();
              }}
            >
              <div style={{ width: '100%', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--a-muted)', marginRight: '4px' }}>
                  {ru ? 'Быстрый выбор:' : 'Quick select:'}
                </span>
                {['Steam', 'Telegram Stars', 'Roblox', 'Spotify', 'Apple'].map(item => (
                  <button
                    type="button"
                    key={item}
                    className="ma-pill"
                    style={{ cursor: 'pointer' }}
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

              <label>
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

              <label>
                <span>{ru ? 'Лимит расходов (USDC)' : 'Spending limit · USDC'}</span>
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

              <label>
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
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="ma-button" type="submit" disabled={searching}>
                  <Search size={15} />
                  <span>{searching ? (ru ? 'Проверяем каталог…' : 'Checking catalogue…') : (ru ? 'Найти варианты' : 'Find options')}</span>
                </button>
              </div>

              {error && <p role="alert" className="ma-error" style={{ width: '100%' }}>{error}</p>}
            </form>

            {products === null ? (
              <div className="ma-empty">
                <Search size={28} />
                <h3>{ru ? 'Точные варианты, без лишнего.' : 'A focused shortlist. No guesswork.'}</h3>
                <p>{ru ? 'Задайте товар, бюджет и регион. Ничего не списывается.' : 'Set a product, budget and region. Searching never moves funds.'}</p>
              </div>
            ) : products.length ? (
              <>
                <div className="ma-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{ru ? 'Товар' : 'Product'}</th>
                        <th>{ru ? 'Регион / Тип' : 'Region / Type'}</th>
                        <th>{ru ? 'Policy Gate' : 'Policy Gate'}</th>
                        <th>{ru ? 'Цена (USDC)' : 'Price (USDC)'}</th>
                        <th style={{ textAlign: 'right' }}>{ru ? 'Действия' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <b>{p.name}</b>
                          </td>
                          <td>
                            <span className="ma-pill">{p.country} · {p.kind === 'Direct Top-Up' ? 'TOP-UP' : 'VOUCHER'}</span>
                          </td>
                          <td>
                            <span className="ma-pill" style={{ color: 'var(--a-accent)', background: 'var(--a-subtle)' }}>
                              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                              5/5 Policy Passed
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '13px' }}>{p.price}</strong> <small style={{ color: 'var(--a-muted)' }}>USDC</small>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="ma-link"
                                onClick={() => handleCheckoutOpen(p)}
                              >
                                {ru ? 'Проверить' : 'Review'}
                                <ArrowUpRight size={13} />
                              </button>
                              <button
                                type="button"
                                className="ma-button"
                                style={{ padding: '7px 12px', fontSize: '11px' }}
                                onClick={() => handleCheckoutOpen(p)}
                              >
                                {ru ? 'Купить (USDC)' : 'Buy (USDC)'}
                                <ArrowUpRight size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--a-muted)', marginTop: '16px' }}>
                  {ru
                    ? 'Лимит относится к одному товару без комиссии. Покупка требует отдельного подтверждения в кошельке.'
                    : 'Limit applies to one item, excluding gas. Purchase requires separate wallet signature.'}
                </p>
              </>
            ) : (
              <div className="ma-empty">
                <h3>{ru ? 'Пока нет совпадений' : 'No matching options'}</h3>
                <p>{ru ? 'Попробуйте другой товар, регион или лимит.' : 'Try another product, region or spending limit.'}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="ag-chat" style={{ padding: 0, background: 'transparent', border: 'none' }}>
            <div className="ag-messages" ref={output} aria-live="polite">
              {!turns.length ? (
                <div className="ag-welcome">
                  <h2>{profitOnly ? (ru ? 'Контроль бюджета на Mainnet' : 'Mainnet budget controls') : (ru ? 'Уверенность перед покупкой.' : 'Clarity before you commit.')}</h2>
                  <p>
                    {ru
                      ? 'Спросите о покупке, бюджете или сети Arc. Чат консультирует и помогает подготовить закупку.'
                      : 'Ask about checkout, budgets, or Arc network finality. Chat guides your procurement flow and surfaces 1-click checkouts.'}
                  </p>
                </div>
              ) : (
                turns.map((t, i) => (
                  <div key={i} className="ag-turn">
                    <div className="ag-user">{t.q}</div>
                    <div className="ag-answer">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Bot size={15} style={{ color: 'var(--a-accent)' }} />
                        <b style={{ color: 'var(--a-accent)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          MERCENTA · {ru ? 'КОНСУЛЬТАЦИЯ И ПОДБОР' : 'GUIDANCE & SOURCING'}
                        </b>
                      </span>
                      <p>{t.a}</p>
                      {t.items && t.items.length > 0 && (
                        <div style={{ margin: '14px 0', display: 'grid', gap: '8px' }}>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--a-muted)', fontWeight: 600 }}>
                            {ru ? 'ПРЯМОЙ ЗАКАЗ НА ARC MAINNET' : 'MATCHED ITEMS ON ARC MAINNET'}
                          </span>
                          {t.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--a-bg)', border: '1px solid var(--a-line)', borderRadius: '8px' }}>
                              <div>
                                <span className="ma-pill" style={{ marginRight: '8px' }}>{item.country} · {item.kind === 'Direct Top-Up' ? 'TOP-UP' : 'VOUCHER'}</span>
                                <b style={{ color: 'var(--a-ink)', fontSize: '12px' }}>{item.name}</b>
                                <span style={{ marginLeft: '12px', color: 'var(--a-accent)', fontWeight: 600 }}>{item.price} USDC</span>
                              </div>
                              <button
                                type="button"
                                className="ma-button"
                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                onClick={() => handleCheckoutOpen(item)}
                              >
                                <span>{ru ? 'Купить (USDC)' : 'Buy (USDC)'}</span>
                                <ArrowUpRight size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ag-chips">
              {prompts.map(q => (
                <button key={q} type="button" onClick={() => send(q)}>
                  <span>{q}</span>
                </button>
              ))}
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                send();
              }}
              className="ag-compose"
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
                className="ma-button"
                disabled={!input.trim()}
                aria-label={ru ? 'Отправить сообщение' : 'Send message'}
              >
                <Send size={15} />
              </button>
            </form>
            <small style={{ display: 'block', marginTop: '10px', fontSize: '10px', color: 'var(--a-muted)' }}>
              {ru ? 'Автономный консультант · Расчёты в USDC на Arc Mainnet (5042) · Подтверждение квитанцией' : 'Autonomous Copilot · USDC settlement on Arc Mainnet (5042) · Verified receipt execution'}
            </small>
          </div>
        )}
      </section>

      {!wallet && (
        <div className="ma-notice" style={{ marginTop: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={16} />
            <span>
              {ru
                ? 'Просматривайте без входа. Подключите кошелёк для прямого расчёта в USDC на Arc Mainnet.'
                : 'Explore without signing in. Connect a wallet for direct USDC settlement on Arc Mainnet.'}
            </span>
          </div>
          <button type="button" className="ma-link" onClick={onConnect}>
            <span>{ru ? 'Подключить кошелёк' : 'Connect wallet'}</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </>
  );
}
