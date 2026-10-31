import { handleBotUpdate, telegramRequest, type BotUpdate, type BotLanguage } from '../web/src/lib/telegram-bot.ts';
import { readFile, writeFile, rename } from 'node:fs/promises';
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://mercenta.xyz';
const statePath = process.env.TELEGRAM_STATE_PATH || './telegram-state.json';
let state: { offset: number; languages: Record<string, BotLanguage> } = { offset: 0, languages: {} };
try { state = JSON.parse(await readFile(statePath, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
async function save() { await writeFile(statePath + '.tmp', JSON.stringify(state), { mode: 0o600 }); await rename(statePath + '.tmp', statePath); }
const info = await telegramRequest(token, 'getWebhookInfo', {});
if (info.url) throw new Error('Webhook is configured. Stop polling or explicitly configure polling transport; no webhook was deleted.');
console.log('Mercenta bot polling started.');
let running = true;
process.on('SIGINT', () => { running = false; });
process.on('SIGTERM', () => { running = false; });
while (running) {
  try {
    const updates = await telegramRequest(token, 'getUpdates', { offset: state.offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }) as BotUpdate[];
    for (const update of updates) {
      await handleBotUpdate(update, { origin, send: (method, body) => telegramRequest(token, method, body), getLanguage: async id => state.languages[id] ?? null, setLanguage: async (id, language) => { state.languages[id] = language; await save(); } });
      state.offset = update.update_id + 1; await save();
    }
  } catch { console.error('Telegram polling failed. Check network, token and state file permissions.'); await new Promise(resolve => setTimeout(resolve, 4000)); }
}
