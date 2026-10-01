"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
type Recommendation = {
  id: string;
  name: string;
  category: string;
  price: string;
  currency: string;
};
type Reply = {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
};
export function AIAssistantWidget({
  scope = "general",
  onSelectProduct,
  onOpenEarn,
  onOpenBorrow,
}: {
  scope?: "catalog" | "treasury" | "general";
  onSelectProduct?: (id: string) => void;
  onOpenEarn?: () => void;
  onOpenBorrow?: () => void;
}) {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [remaining, setRemaining] = useState<number | null>(null),
    [mode, setMode] = useState("Checking advisor"),
    [messages, setMessages] = useState<Reply[]>([
      {
        role: "assistant",
        content:
          "I can help compare digital resources and treasury options. I propose; your policy decides. I never sign a transaction or move funds.",
      },
    ]);
  const end = useRef<HTMLDivElement>(null),
    field = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    fetch("/api/backend/agent/quota")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setRemaining(d.quota.remaining);
        setMode(
          d.mode === "llm-advisor"
            ? "LLM Model Provider"
            : "Rule-based advisor",
        );
      })
      .catch(() => setMode("Backend unavailable"));
  }, []);
  useEffect(() => {
    if (open) {
      field.current?.focus();
      end.current?.scrollIntoView({ block: "nearest" });
    }
  }, [open]);
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" });
  }, [messages, open]);
  async function send(text = input) {
    const query = text.trim();
    if (!query || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: query }]);
    try {
      const r = await fetch("/api/backend/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          message: query,
          contextScope: scope,
        }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error("Advisor unavailable. Please try again later.");
      if (d.quota) setRemaining(d.quota.remaining);
      setMode(
        d.mode === "llm-advisor"
          ? "LLM Model Provider"
          : d.mode === "rules-advisor"
            ? "Rule-based advisor"
            : d.mode === "limit"
              ? "Free limit reached"
              : "Provider unavailable",
      );
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: d.message ?? "No response available.",
          recommendations: d.recommendations,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Advisor unavailable.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  const prompts =
    scope === "catalog"
      ? ["H100 inference cluster for one week", "Steam wallet code for Europe"]
      : ["Explain Earn USDC", "Borrow against cirBTC"];
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div className="mp ml-assistant-root">
      {open && (
        <section
          className="ml-chat"
          role="dialog"
          aria-label="Mercenta advisor"
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
        >
          <header>
            <div>
              <span className="ml-chat-icon">
                <Bot size={23} />
              </span>
              <span>
                <strong>Mercenta advisor</strong>
                <small>{mode} · proposal only</small>
              </span>
            </div>
            <button
              className="mp-icon-button"
              aria-label="Close advisor"
              onClick={close}
            >
              <X size={20} />
            </button>
          </header>
          <div className="ml-chat-quota">
            <ShieldCheck size={16} />
            {remaining === null
              ? "Quota unavailable"
              : `${remaining} / 10 Free Consultations Remaining`}
          </div>
          <div className="ml-chat-thread" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={"ml-chat-message " + m.role}>
                <span>{m.role === "assistant" ? "MERCENTA" : "YOU"}</span>
                <p>{m.content}</p>
                {m.recommendations?.map((p) => (
                  <article className="ml-chat-product" key={p.id}>
                    <small>{p.category}</small>
                    <strong>{p.name}</strong>
                    <span>
                      {p.price} {p.currency}
                    </span>
                    {onSelectProduct ? (
                      <button
                        onClick={() => {
                          onSelectProduct(p.id);
                          close();
                        }}
                      >
                        Select resource <ArrowRight size={15} />
                      </button>
                    ) : (
                      <a href={"/catalog?search=" + encodeURIComponent(p.name)}>
                        Explore resource <ArrowRight size={15} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            ))}
            {busy && <p className="ml-chat-loading">Preparing a proposal…</p>}
            <div ref={end} />
          </div>
          <div className="ml-chat-prompts">
            {prompts.map((p) => (
              <button
                key={p}
                disabled={busy || remaining === 0}
                onClick={() => void send(p)}
              >
                {p}
                <ArrowRight size={14} />
              </button>
            ))}
            {scope === "treasury" && (
              <div>
                <button onClick={onOpenEarn}>Open Earn</button>
                <button onClick={onOpenBorrow}>Open Borrow</button>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label
              className="ml-visually-hidden"
              htmlFor={"ml-chat-input-" + scope}
            >
              Ask the advisor
            </label>
            <input
              ref={field}
              id={"ml-chat-input-" + scope}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              placeholder={
                remaining === 0
                  ? "Free limit reached"
                  : "Ask about resources or liquidity…"
              }
              disabled={busy || remaining === 0}
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || remaining === 0}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>
          <footer>No transaction signing. No balance changes.</footer>
        </section>
      )}
      <button
        ref={trigger}
        className="ml-chat-trigger"
        aria-expanded={open}
        aria-label="Open Mercenta advisor"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare size={21} />
        <span>
          Ask Mercenta
          <small>
            {remaining === null
              ? "10 free consultations"
              : `${remaining} / 10 free remaining`}
          </small>
        </span>
        <span className="ml-dot" />
      </button>
    </div>
  );
}
