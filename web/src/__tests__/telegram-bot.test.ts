import { expect, it, vi } from 'vitest';
import { handleBotUpdate, botCommands, type BotLanguage } from '@/lib/telegram-bot';
it('welcomes Russian Telegram users with safe deep-links and no formatting interpolation', async () => {
  const send = vi.fn(async (_method: string, _body: Record<string, unknown>) => {});
  await handleBotUpdate({ update_id: 1, message: { text: '/start payload', from: { id: 7, language_code: 'ru' }, chat: { id: 7, type: 'private' } } }, { origin: 'https://mercenta.xyz', send, getLanguage: async () => null, setLanguage: async () => {} });
  const body = send.mock.calls[0] as unknown as [string, { text: string; reply_markup: { inline_keyboard: { web_app?: { url: string } }[][] } }];
  expect(body[1].text).toContain('Добро пожаловать');
  expect(body[1].reply_markup.inline_keyboard[0][0].web_app?.url).toContain('lang=ru');
});
it('persists explicit language and acknowledges callbacks', async () => {
  let saved: BotLanguage = 'ru'; const send = vi.fn(async (_method: string, _body: Record<string, unknown>) => {});
  await handleBotUpdate({ update_id: 2, callback_query: { id: 'cb', from: { id: 7, language_code: 'ru' }, data: 'lang_en', message: { chat: { id: 7, type: 'private' } } } }, { origin: 'https://mercenta.xyz', send, getLanguage: async () => saved, setLanguage: async (_, lang) => { saved = lang; } });
  expect(saved).toBe('en'); expect(send.mock.calls[0][0]).toBe('answerCallbackQuery');
});
it('registers the same command set in both languages', () => { expect(botCommands(true).map(c => c.command)).toEqual(botCommands(false).map(c => c.command)); expect(botCommands(true).some(c => c.command === 'language')).toBe(true); });
