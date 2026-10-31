// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { initialTelegramLanguage } from '@/components/telegram/tg-locale';
afterEach(() => { localStorage.clear(); history.replaceState(null, '', '/'); vi.unstubAllGlobals(); });
it('honors saved locale before deep-link locale', () => { history.replaceState(null, '', '/tg?lang=ru'); expect(initialTelegramLanguage()).toBe('ru'); localStorage.setItem('mercenta-telegram-language', 'en'); expect(initialTelegramLanguage()).toBe('en'); });
it('ignores invalid locale and uses Telegram preference', () => { history.replaceState(null, '', '/tg?lang=invalid'); Object.defineProperty(window, 'Telegram', { configurable: true, value: { WebApp: { initDataUnsafe: { user: { language_code: 'ru-RU' } } } } }); expect(initialTelegramLanguage()).toBe('ru'); delete (window as Window & { Telegram?: unknown }).Telegram; });
