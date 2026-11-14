"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";

const THEME = {
  "--cb-bg": "rgba(255, 255, 255, 0.06)",
  "--cb-bg-hover": "rgba(255, 255, 255, 0.1)",
  "--cb-text": "rgba(255, 255, 255, 0.85)",
  "--cb-strong": "#ffffff",
  "--cb-placeholder": "rgba(255, 255, 255, 0.4)",
  "--cb-muted": "rgba(255, 255, 255, 0.5)",
  "--cb-key": "rgba(255, 255, 255, 0.08)",
  "--cb-key-on": "rgba(56, 189, 248, 0.25)",
} as CSSProperties;

const PRESS = { stiffness: 520, damping: 34, mass: 0.6 };
const openSpring = (bounce: number) => ({
  type: "spring" as const,
  stiffness: 300,
  damping: 34 - (Math.min(100, Math.max(0, bounce)) / 100) * 20,
});
const SWAP = { duration: 0.18, ease: [0.23, 1, 0.32, 1] } as const;

type Modifier = "mod" | "ctrl" | "alt" | "shift";
const MODIFIERS: Modifier[] = ["mod", "ctrl", "alt", "shift"];
const MAC: Record<Modifier, string> = { mod: "⌘", ctrl: "⌃", alt: "⌥", shift: "⇧" };
const PC: Record<Modifier, string> = { mod: "Ctrl", ctrl: "Ctrl", alt: "Alt", shift: "Shift" };

function parse(shortcut: string) {
  const parts = shortcut.toLowerCase().split("+").map((p) => p.trim()).filter(Boolean);
  const modifiers = parts.filter((p): p is Modifier => MODIFIERS.includes(p as Modifier));
  const key = parts.find((p) => !MODIFIERS.includes(p as Modifier)) ?? "k";
  return { modifiers, key };
}

const isKey = (e: KeyboardEvent, key: string) =>
  e.key.toLowerCase() === key || e.code === `Key${key.toUpperCase()}` || e.code === `Digit${key}`;

const noSubscribe = () => () => {};
function readIsMac() {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? navigator.platform);
}

function isDown(m: Modifier, e: KeyboardEvent, mac: boolean) {
  if (m === "mod") return mac ? e.metaKey : e.ctrlKey;
  if (m === "ctrl") return e.ctrlKey;
  if (m === "alt") return e.altKey;
  return e.shiftKey;
}

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

function Key({ label, on = false }: { label: string; on?: boolean }) {
  return (
    <kbd
      data-on={on || undefined}
      style={{
        display: "inline-flex",
        height: "20px",
        minWidth: "20px",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "5px",
        background: on ? "var(--cb-key-on)" : "var(--cb-key)",
        padding: "0 6px",
        fontSize: "10px",
        fontFamily: "var(--font-mono, monospace)",
        fontWeight: 600,
        color: on ? "var(--cb-strong)" : "var(--cb-muted)",
        transition: "all 0.12s ease",
      }}
    >
      {label}
    </kbd>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0, color: "var(--cb-muted)" }} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export interface CommandButtonProps {
  children?: ReactNode;
  shortcut?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  width?: number;
  bounce?: number;
  autoClose?: number;
  className?: string;
  style?: CSSProperties;
}

export default function CommandButton({
  children = "Search protocol...",
  shortcut = "mod+k",
  placeholder = "Search catalog, policy, or tokens...",
  onSearch,
  width = 320,
  bounce = 30,
  autoClose,
  className = "",
  style,
}: CommandButtonProps) {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const mac = useSyncExternalStore(noSubscribe, readIsMac, () => null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [held, setHeld] = useState<{ mods: Modifier[]; key: boolean }>({ mods: [], key: false });

  const pressTarget = useMotionValue(1);
  const scale = useSpring(pressTarget, PRESS);
  const press = useCallback((down: boolean) => pressTarget.set(down && !reduce ? 0.97 : 1), [pressTarget, reduce]);

  const { modifiers, key } = parse(shortcut);
  const live = useRef({ modifiers, key, open });
  useLayoutEffect(() => {
    live.current = { modifiers, key, open };
  });

  const takeFocus = useRef(false);

  const openWith = (trusted: boolean) => {
    takeFocus.current = trusted;
    setOpen(true);
  };
  const close = () => {
    if (!live.current.open) return;
    setOpen(false);
    setQuery("");
    input.current?.blur();
  };

  const handleSearch = (q: string) => {
    if (onSearch) {
      onSearch(q);
    } else {
      router.push(`/catalog?q=${encodeURIComponent(q)}`);
    }
    close();
  };

  useEffect(() => {
    if (mac === null) return;
    const sync = (e: KeyboardEvent, down: boolean) => {
      const { modifiers, key } = live.current;
      const next = { mods: modifiers.filter((m) => isDown(m, e, mac)), key: down && isKey(e, key) };
      setHeld((cur) => (cur.key === next.key && cur.mods.join() === next.mods.join() ? cur : next));
      press(next.key || next.mods.length > 0);
    };
    const onDown = (e: KeyboardEvent) => {
      const { modifiers, key, open } = live.current;
      if (open) return;
      if (!modifiers.some((m) => m !== "shift") && typing(e.target)) return;
      sync(e, true);
      if (!e.repeat && modifiers.every((m) => isDown(m, e, mac)) && isKey(e, key)) {
        e.preventDefault();
        openWith(e.isTrusted);
      }
    };
    const onUp = (e: KeyboardEvent) => sync(e, false);
    const release = () => {
      setHeld({ mods: [], key: false });
      press(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", release);
    };
  }, [mac, press]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  useEffect(() => {
    if (!open || !autoClose || query) return;
    const t = setTimeout(() => close(), autoClose);
    return () => clearTimeout(t);
  }, [open, autoClose, query]);

  const labels = mac === false ? PC : MAC;

  return (
    <motion.div
      ref={root}
      layout
      transition={{ layout: reduce ? { duration: 0 } : openSpring(bounce) }}
      style={{
        ...THEME,
        ...style,
        scale,
        borderRadius: 20,
        width: open ? width : "auto",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      onPointerDown={() => {
        if (open) return;
        press(true);
      }}
      onPointerUp={() => press(false)}
      onPointerLeave={() => press(false)}
      className={`relative flex h-9 items-center overflow-hidden bg-[var(--cb-bg)] text-xs font-medium text-[var(--cb-text)] transition-colors duration-150 ${
        open ? "" : "hover:bg-[var(--cb-bg-hover)] hover:border-sky-500/30"
      } ${className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.div
            key="field"
            className="flex w-full items-center gap-2 pl-3 pr-2"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)", transition: { ...SWAP, delay: 0.06 } }}
            exit={{ opacity: 0, filter: "blur(4px)", transition: SWAP }}
            onAnimationStart={() => takeFocus.current && input.current?.focus({ preventScroll: true })}
          >
            <SearchIcon />
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") close();
                if (e.key === "Enter" && query.trim()) handleSearch(query.trim());
              }}
              onBlur={() => !query && close()}
              placeholder={placeholder}
              aria-label={placeholder}
              className="min-w-0 flex-1 bg-transparent text-[var(--cb-strong)] text-xs outline-none placeholder:text-[var(--cb-placeholder)]"
            />
            <button
              type="button"
              onClick={close}
              className="cursor-pointer"
              title="Close search"
            >
              <Key label="Esc" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            type="button"
            aria-keyshortcuts={[...modifiers.map((m) => (m === "mod" ? (mac ? "Meta" : "Control") : m[0].toUpperCase() + m.slice(1))), key.toUpperCase()].join("+")}
            aria-expanded={false}
            onClick={(e) => openWith(e.isTrusted)}
            className="flex h-9 cursor-pointer select-none items-center gap-2.5 whitespace-nowrap pl-3 pr-2 outline-none"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)", transition: { ...SWAP, delay: 0.06 } }}
            exit={{ opacity: 0, filter: "blur(4px)", transition: SWAP }}
          >
            <SearchIcon />
            <span>{children}</span>
            <span aria-hidden="true" className={`flex items-center gap-1 transition-opacity duration-200 ${mac === null ? "opacity-0" : ""}`}>
              {modifiers.map((m) => (
                <Key key={m} label={labels[m]} on={held.mods.includes(m)} />
              ))}
              <Key label={key.length === 1 ? key.toUpperCase() : key} on={held.key} />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
