"use client";

import { useEffect, useRef, useState } from "react";
import { CASES, ORDER, POLICY, evaluatePolicy, percent, tone, usdc, type PolicyResult } from "@/lib/policy";

const VIDEO_SRC = "/videos/mercenta-vault.mp4";
const POSTER_SRC = "/videos/mercenta-vault-poster.jpg";
const LOAD_TIMEOUT_MS = 9000;

/** Half-width of a chapter crossfade, in story progress. Adjacent fades overlap, so no frame is ever empty. */
const FADE = 0.06;
/** Below roughly one frame of film there is nothing worth seeking to. */
const SEEK_STEP = 0.035;
/** A seek that never reports back must not lock the pipeline. */
const SEEK_WATCHDOG_MS = 900;
/** Interpolation rate of the animation progress toward the scroll target. */
const EASE = 0.18;
/** Progress closer than this is treated as settled: the frame loop stops instead of spinning. */
const SETTLED = 0.0004;

type Chapter = {
  id: string;
  index: string;
  from: number;
  to: number;
  kicker: string;
  title: string;
  lead: string;
  body: "intent" | "checks" | "decision" | "receipt";
};

const CHAPTERS: Chapter[] = [
  {
    id: "intent",
    index: "01",
    from: 0,
    to: 0.26,
    kicker: "Act 01 · Order intent",
    title: "A buying agent asks for 250 compute hours.",
    lead: "The agent submits an intent — listing, quantity, supplier, price. Nothing is committed yet: no balance is touched and no supplier purchase exists.",
    body: "intent",
  },
  {
    id: "checks",
    index: "02",
    from: 0.26,
    to: 0.55,
    kicker: "Act 02 · Deterministic checks",
    title: "Five rules run in a fixed order.",
    lead: "Amount against Available to spend, supplier cost against the balance free after Reserved, Gross margin against the floor, supplier status, then the auto-approval limit. Same inputs, same decision, every time.",
    body: "checks",
  },
  {
    id: "decision",
    index: "03",
    from: 0.55,
    to: 0.8,
    kicker: "Act 03 · Authorization boundary",
    title: "Agent decision",
    lead: "The boundary is drawn by the rules, not by the model. Step through the three outcomes for this order: all checks pass, a check fails, or a check holds for a human.",
    body: "decision",
  },
  {
    id: "receipt",
    index: "04",
    from: 0.8,
    to: 1,
    kicker: "Act 04 · Settlement and receipt",
    title: "Settled, delivered, written to one record.",
    lead: "Settlement and delivery land on the same order record, so what was paid and what came back can be inspected together instead of reconciled after the fact.",
    body: "receipt",
  },
];

const LAST = CHAPTERS.length - 1;

const OUTCOMES = [
  { id: "cleared", label: "Cleared", source: CASES.order },
  { id: "blocked", label: "Policy blocked", source: CASES.uncertain },
  { id: "approval", label: "Human approval required", source: CASES.overLimit },
] as const;

const OUTCOME_DETAIL: Record<string, string> = {
  cleared: "Every check passed. The supplier purchase is authorised and the order proceeds to settlement.",
  blocked: "A failed check stops the order. No supplier purchase is submitted and no funds move.",
  approval: "A held check pauses execution and queues the intent for a human decision.",
};

function fmtTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  return (m < 10 ? "0" + m : String(m)) + ":" + (s < 10 ? "0" + s : String(s));
}

function ChipRow() {
  return (
    <p className="film-chiprow">
      <span className="chip chip--accent">Illustrative order</span>
      <span className="chip">No live funds</span>
      <span className="chip">Pre-launch preview</span>
    </p>
  );
}

function CheckList({ result }: { result: PolicyResult }) {
  return (
    <ul className="checklist">
      {result.checks.map((check) => (
        <li key={check.label} className={"check-row check-" + check.state}>
          <span className="check-mark" aria-hidden="true">
            {check.state === "pass" ? "✓" : check.state === "hold" ? "!" : "×"}
          </span>
          <span className="check-label">{check.label}</span>
          <span className="check-note">{check.note}</span>
        </li>
      ))}
    </ul>
  );
}

function IntentCard() {
  const rows: Array<[string, string]> = [
    ["Order", ORDER.id],
    ["Listing", ORDER.listing + " · " + ORDER.sku],
    ["Quantity", ORDER.units + " " + ORDER.unit],
    ["Supplier", ORDER.supplier],
    ["Amount", usdc(CASES.order.amount)],
    ["Status", "Proposed · nothing committed"],
  ];
  return (
    <dl className="intent-card">
      {rows.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DecisionConsole() {
  const [selected, setSelected] = useState<string>(OUTCOMES[0].id);
  const current = OUTCOMES.find((outcome) => outcome.id === selected) ?? OUTCOMES[0];
  const result = evaluatePolicy(current.source.amount, current.source.cost, current.source.supplier);
  const marginWidth = Math.max(0, Math.min(1, result.margin / 0.4)) * 100;
  return (
    <div className="decision-console">
      <div className="decision-picker" role="group" aria-label="Choose an agent decision outcome">
        {OUTCOMES.map((outcome) => (
          <button
            key={outcome.id}
            type="button"
            className={"decision-tab tone-" + tone(evaluatePolicy(outcome.source.amount, outcome.source.cost, outcome.source.supplier).decision) + (outcome.id === selected ? " is-active" : "")}
            aria-pressed={outcome.id === selected}
            onClick={() => setSelected(outcome.id)}
          >
            {outcome.label}
          </button>
        ))}
      </div>
      <div className="decision-head">
        <div>
          <p className="field-label">Agent decision</p>
          <p className={"decision-value tone-" + tone(result.decision)} aria-live="polite">
            {result.decision}
          </p>
        </div>
        <div className="decision-margin">
          <p className="field-label">Gross margin</p>
          <p className="decision-value">
            {percent(result.margin)} <small>floor {percent(POLICY.grossMarginFloor)}</small>
          </p>
          <span className={"margin-meter tone-" + tone(result.decision)} aria-hidden="true">
            <span style={{ width: marginWidth.toFixed(1) + "%" }} />
            <span className="margin-floor" style={{ left: ((POLICY.grossMarginFloor / 0.4) * 100).toFixed(1) + "%" }} />
          </span>
        </div>
      </div>
      <CheckList result={result} />
      <p className="decision-detail">{OUTCOME_DETAIL[current.id]}</p>
      <p className="note">
        Evaluated in the browser with the configuration above. No order is submitted and no funds move.
      </p>
    </div>
  );
}

function Receipt() {
  const fee = CASES.order.amount * 0.015;
  const rows: Array<[string, string, string?]> = [
    ["Order", ORDER.id],
    ["Line item", ORDER.listing + " · " + ORDER.units + " " + ORDER.unit],
    ["Supplier", ORDER.supplier],
    ["Supplier purchase", usdc(CASES.order.cost)],
    ["Platform fee", usdc(fee) + " · 1.5% illustrative"],
    ["Network fee", "Pass-through of the settlement network cost"],
    ["Settlement asset", "USDC"],
    ["Network coverage", "Arc · Base · Solana — planned"],
    ["Agent decision", "Cleared", "tone-ok"],
    ["Delivery", "Fulfilled", "tone-ok"],
  ];
  return (
    <div className="receipt">
      <div className="receipt-head">
        <p className="receipt-title">Order receipt</p>
        <span className="chip">Illustrative</span>
      </div>
      <dl className="receipt-rows">
        {rows.map(([term, value, valueTone]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd className={valueTone}>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="receipt-total">
        <span>Order value</span>
        <b>{usdc(CASES.order.amount)}</b>
      </p>
      <p className="receipt-stamp" aria-hidden="true">
        Fulfilled
      </p>
      <p className="note">
        Illustrative record. Intent, checks, authorisation, settlement and delivery are written against the same order,
        so the payment and the delivery can be inspected together. Nothing in this preview submits an order or moves
        funds, and network coverage is planned.
      </p>
    </div>
  );
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  if (chapter.body === "intent") {
    return (
      <>
        <ChipRow />
        <IntentCard />
      </>
    );
  }
  if (chapter.body === "checks") {
    const result = evaluatePolicy(CASES.order.amount, CASES.order.cost, CASES.order.supplier);
    return (
      <>
        <dl className="film-stats">
          <div>
            <dt>Available to spend</dt>
            <dd>
              {usdc(POLICY.availableToSpend)}
            </dd>
          </div>
          <div>
            <dt>Reserved</dt>
            <dd>
              {usdc(POLICY.reserved)}
            </dd>
          </div>
          <div>
            <dt>Gross margin</dt>
            <dd>
              floor <b>{percent(POLICY.grossMarginFloor)}</b>
            </dd>
          </div>
        </dl>
        <CheckList result={result} />
      </>
    );
  }
  if (chapter.body === "decision") {
    return <DecisionConsole />;
  }
  return <Receipt />;
}

function ChapterContent({ chapter }: { chapter: Chapter }) {
  return (
    <div className="film-card">
      <p className="kicker">{chapter.kicker}</p>
      <h2 className="film-title">{chapter.title}</h2>
      <p className="film-lead">{chapter.lead}</p>
      <ChapterBody chapter={chapter} />
    </div>
  );
}

export default function OrderJourney() {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const panelsRef = useRef<Array<HTMLDivElement | null>>([]);
  const barRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Cached media can finish loading before React attaches its handlers, so readiness is
     also sampled once on mount; otherwise a healthy film would fall into the timeout state. */
  useEffect(() => {
    if (status !== "loading") return;
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      setStatus("ready");
      return;
    }
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "loading" ? "error" : current));
    }, LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [status, attempt]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
    const smooth = (value: number) => {
      const t = clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };

    let frame = 0;
    let target = 0;
    let current = -1;
    let pending: number | null = null;
    let inFlight = false;
    let watchdog = 0;

    /* One seek in flight at a time. Further scrolls only overwrite the pending target,
       so the film converges on the latest position instead of queueing stale seeks. */
    const flush = () => {
      if (pending === null || inFlight) return;
      const video = videoRef.current;
      if (!video || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const want = clamp(pending, 0, video.duration - 0.04);
      pending = null;
      if (Math.abs(video.currentTime - want) < SEEK_STEP) return;
      inFlight = true;
      try {
        video.currentTime = want;
      } catch {
        inFlight = false;
        return;
      }
      watchdog = window.setTimeout(() => {
        inFlight = false;
        flush();
      }, SEEK_WATCHDOG_MS);
    };

    const onSeeked = () => {
      window.clearTimeout(watchdog);
      inFlight = false;
      flush();
    };

    const paint = (progress: number) => {
      const video = videoRef.current;
      const duration = video && Number.isFinite(video.duration) ? video.duration : 0;
      if (duration > 0) pending = progress * duration;

      for (let i = 0; i <= LAST; i += 1) {
        const chapter = CHAPTERS[i];
        const panel = panelsRef.current[i];
        if (!panel) continue;
        const rise = i === 0 ? 1 : smooth((progress - (chapter.from - FADE)) / (2 * FADE));
        const fall = i === LAST ? 1 : smooth((chapter.to + FADE - progress) / (2 * FADE));
        const opacity = Math.min(rise, fall);
        panel.style.opacity = opacity.toFixed(3);
        panel.style.transform = "translate3d(0," + ((1 - opacity) * 18).toFixed(2) + "px,0)";
        panel.inert = opacity < 0.5;
      }

      if (barRef.current) barRef.current.style.transform = "scaleX(" + progress.toFixed(4) + ")";
      if (timeRef.current) {
        timeRef.current.textContent =
          duration > 0 ? fmtTime(progress * duration) + " / " + fmtTime(duration) : Math.round(progress * 100) + "%";
      }

      const next = progress >= 1 ? LAST : Math.max(0, CHAPTERS.findIndex((chapter) => progress < chapter.to));
      setActive((previous) => (previous === next ? previous : next));
    };

    const step = () => {
      frame = 0;
      const delta = target - current;
      if (Math.abs(delta) < SETTLED) {
        current = target;
        paint(current);
        flush();
        return;
      }
      current += delta * EASE;
      paint(current);
      flush();
      frame = window.requestAnimationFrame(step);
    };

    const read = () => {
      const rect = root.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      target = span > 0 ? clamp(-rect.top / span, 0, 1) : 1;
    };

    const request = () => {
      read();
      if (!frame) frame = window.requestAnimationFrame(step);
    };

    read();
    current = target;
    paint(current);
    flush();

    const video = videoRef.current;
    video?.addEventListener("seeked", onSeeked);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      video?.removeEventListener("seeked", onSeeked);
      window.clearTimeout(watchdog);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced, status]);

  const ready = () => {
    videoRef.current?.pause();
    setStatus((current) => (current === "loading" ? "ready" : current));
  };

  /* One bounded retry: a partially cached entry can fail when the browser revalidates it. */
  const failed = () => {
    if (attempt === 0) {
      setAttempt(1);
      setStatus("loading");
      return;
    }
    setStatus("error");
  };

  if (reduced) {
    return (
      <section className="film film--static" id="order-journey" aria-label="One illustrative order, from intent to receipt">
        <p className="sr-only">
          Animation is off because reduced motion is enabled. The four acts are shown as static sections; the decision
          console and the receipt stay interactive.
        </p>
        {CHAPTERS.map((chapter) => (
          <article key={chapter.id} className="film-block">
            <ChapterContent chapter={chapter} />
          </article>
        ))}
      </section>
    );
  }

  return (
    <section className="film" id="order-journey" ref={rootRef} aria-label="One illustrative order, from intent to receipt">
      <div className="film-stage">
        <div className="film-media" aria-hidden="true">
          {status !== "error" && (
            <video
              ref={videoRef}
              className="film-video"
              key={attempt}
              src={attempt === 0 ? VIDEO_SRC : VIDEO_SRC + "?retry=" + attempt}
              poster={POSTER_SRC}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              tabIndex={-1}
              onLoadedMetadata={ready}
              onLoadedData={ready}
              onError={failed}
            />
          )}
        </div>
        <div className="film-veil" aria-hidden="true" />
        {CHAPTERS.map((chapter, i) => (
          <div
            key={chapter.id}
            className="film-panel"
            data-chapter={chapter.id}
            ref={(element) => {
              panelsRef.current[i] = element;
            }}
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <ChapterContent chapter={chapter} />
          </div>
        ))}
        {status === "loading" && (
          <p className="film-status" role="status">
            Loading the film
          </p>
        )}
        {status === "error" && (
          <p className="film-status" role="status">
            Film unavailable — the order journey is shown without it.
          </p>
        )}
        <div className="film-chrome">
          <a className="film-skip" href="#policy">
            Skip the film — open the interactive demo
          </a>
          <div className="film-hud" aria-hidden="true">
            <span className="film-count">
              {CHAPTERS[active].index} / {CHAPTERS[LAST].index}
            </span>
            <span className="film-bar">
              <span className="film-bar-fill" ref={barRef} />
            </span>
            <span className="film-time" ref={timeRef}>
              00:00
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
