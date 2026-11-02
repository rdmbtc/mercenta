import { expect, it, vi } from 'vitest';
import { handleBotUpdate, renderBotMessage, botCommands, type BotLanguage } from '@/lib/telegram-bot';
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
it('escapes custom branding and keeps the home keyboard compact', () => {
  const rendered = renderBotMessage('start', 'en', 'https://mercenta.xyz', true, {name:'<brand>&',support:'support@example.com'});
  expect(rendered.text).toContain('&lt;brand&gt;&amp;');
  expect(rendered.reply_markup.inline_keyboard.map(row => row.length)).toEqual([1,2,2]);
  expect(rendered.parse_mode).toBe('HTML');
});
it('edits callback messages instead of adding duplicate menus', async () => {
  const send = vi.fn<(method:string,body:Record<string,unknown>)=>Promise<unknown>>().mockResolvedValue(null);
  await handleBotUpdate({update_id:3,callback_query:{id:'cb',from:{id:7},data:'cmd_wallet',message:{message_id:9,chat:{id:7,type:'private'}}}}, {origin:'https://mercenta.xyz',send,getLanguage:async()=> 'en',setLanguage:async()=>{}});
  expect(send.mock.calls.map(call=>call[0])).toEqual(['answerCallbackQuery','editMessageText']);
});
it('legacy fake payment callbacks never report success', () => {
  for(const command of ['buy_steam','pay_stars_steam','pay_crypto_steam','setmarkup']) {
    expect(renderBotMessage(command,'en','https://mercenta.xyz',true).text).toContain('No funds charged');
  }
});
