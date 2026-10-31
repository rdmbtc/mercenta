import { botCommands, telegramRequest } from '../web/src/lib/telegram-bot.ts';
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://mercenta.xyz';
const url = new URL('/tg', origin);
if (url.protocol !== 'https:') throw new Error('Telegram Web Apps require HTTPS');
const info = await telegramRequest(token, 'getWebhookInfo', {});
console.log(JSON.stringify({ webhookConfigured: !!info.url, pendingUpdates: info.pending_update_count, lastError: info.last_error_message ? 'Telegram reports a delivery error' : null }));
if (process.argv.includes('--inspect')) process.exit(0);
for (const language of ['', 'en', 'ru']) {
  const ru = language === 'ru';
  await telegramRequest(token, 'setMyCommands', { commands: botCommands(ru), language_code: language });
  await telegramRequest(token, 'setMyDescription', { description: ru ? 'Mercenta: цифровые товары, зашифрованный кошелёк и USDC на Arc. Testnet и Mainnet разделены. Начните с /start.' : 'Mercenta: digital goods, an encrypted wallet and USDC on Arc. Separate Testnet and Mainnet. Start with /start.', language_code: language });
  await telegramRequest(token, 'setMyShortDescription', { short_description: ru ? 'Цифровые товары и USDC на Arc. /start' : 'Digital goods and USDC on Arc. /start', language_code: language });
}
await telegramRequest(token, 'setChatMenuButton', { menu_button: { type: 'web_app', text: 'Mercenta', web_app: { url: url.toString() } } });
if (process.argv.includes('--webhook')) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !(process.env.TELEGRAM_REDIS_URL || process.env.REDIS_URL)) throw new Error('Webhook secret and Redis must be configured before enabling webhook transport');
  await telegramRequest(token, 'setWebhook', { url: new URL('/api/telegram/webhook', origin).toString(), secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: false });
}
console.log('Localized bot commands, descriptions and Mini App menu configured.');
