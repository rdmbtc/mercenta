'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export type TgLanguage = 'ru' | 'en';
const Locale = createContext<{ lang: TgLanguage; choose: (language: TgLanguage) => void }>({ lang: 'en', choose: () => {} });
export function initialTelegramLanguage(): TgLanguage {
  let saved: string | null = null;
  try { saved = localStorage.getItem('mercenta-telegram-language'); } catch {}
  if (saved === 'ru' || saved === 'en') return saved;
  const query = new URLSearchParams(location.search).get('lang');
  if (query === 'ru' || query === 'en') return query;
  const telegram = (window as Window & { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } }).Telegram;
  return telegram?.WebApp?.initDataUnsafe?.user?.language_code?.startsWith('ru') ? 'ru' : 'en';
}
export function TgLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<TgLanguage>('en');
  useEffect(() => { setLang(initialTelegramLanguage()); }, []);
  const choose = (language: TgLanguage) => { setLang(language); try { localStorage.setItem('mercenta-telegram-language', language); } catch {} };
  return <Locale.Provider value={{ lang, choose }}>{children}</Locale.Provider>;
}
export function useTgLocale() { const state = useContext(Locale); return { ...state, ru: state.lang === 'ru', t: (en: string, ru: string) => state.lang === 'ru' ? ru : en }; }
