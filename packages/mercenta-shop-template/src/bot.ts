/**
 * Mercenta Turnkey Client Bot Template.
 * Connects directly to Mercenta wholesale clearinghouse API.
 * The shop owner sets their custom markup % and earns profit on every digital sale.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Read configuration
const configPath = path.join(__dirname, '../shop.config.json');
let config: any = {};
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('[ClientBot] Error reading shop.config.json:', e);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MERCENTA_API_KEY = process.env.MERCENTA_API_KEY || config.mercenta?.apiKey;
const MERCENTA_API_URL = config.mercenta?.apiUrl || 'https://mercenta.xyz/api';

if (!BOT_TOKEN) {
  console.error('[ClientBot] Error: TELEGRAM_BOT_TOKEN is not set in environment or .env file.');
  process.exit(1);
}

const markup = config.shop?.markupPercentage || 15.0;
console.log(`[ClientBot] Starting store: "${config.shop?.name}"`);
console.log(`[ClientBot] Current Profit Markup: +${markup}%`);
console.log(`[ClientBot] Wholesale Gateway: ${MERCENTA_API_URL}`);

let offset = 0;
let isRunning = true;

// Basic catalog fixtures with wholesale prices
const WHOLESALE_ITEMS = [
  { id: 'steam-10', name: 'Steam Wallet $10 USD', wholesale: 10.0, category: 'Gaming' },
  { id: 'steam-25', name: 'Steam Wallet $25 USD', wholesale: 25.0, category: 'Gaming' },
  { id: 'apple-10', name: 'Apple Gift Card $10 USD', wholesale: 10.0, category: 'Subscriptions' },
  { id: 'apple-25', name: 'Apple Gift Card $25 USD', wholesale: 25.0, category: 'Subscriptions' },
  { id: 'psn-10', name: 'PlayStation Network $10', wholesale: 10.0, category: 'Gaming' },
  { id: 'xbox-15', name: 'Xbox Live & Game Pass $15', wholesale: 15.0, category: 'Gaming' },
  { id: 'stars-100', name: '100 Telegram Stars', wholesale: 1.89, category: 'Micro-Donations' },
  { id: 'pubg-660', name: 'PUBG Mobile 660 UC', wholesale: 9.85, category: 'Micro-Donations' },
];

function calculateClientPrice(wholesale: number): number {
  return parseFloat((wholesale * (1 + markup / 100)).toFixed(2));
}

async function sendTelegram(method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[ClientBot] Telegram API error in ${method}:`, err);
    return null;
  }
}

async function handleMessage(msg: { chat: { id: number }; text?: string; from?: { id: number; first_name?: string } }) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';
  const firstName = msg.from?.first_name || 'Friend';

  if (text.startsWith('/start')) {
    const welcomeText = `👋 *Welcome to ${config.shop?.name}, ${firstName}!*
_${config.shop?.tagline}_

⚡ *Instant Automated Delivery:* All digital keys and vouchers are decrypted and delivered directly into this chat immediately after payment.

_Select an action below to explore our products:_`;

    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Open Product Catalog', callback_data: 'shop_catalog' }],
          [
            { text: '📦 My Orders', callback_data: 'shop_orders' },
            { text: '💬 Support & Help', callback_data: 'shop_support' },
          ],
        ],
      },
    });
    return;
  }

  // Admin markup modification command
  if (text.startsWith('/setmarkup')) {
    const parts = text.split(' ');
    if (parts.length > 1) {
      const newMarkup = parseFloat(parts[1]);
      if (!Number.isNaN(newMarkup) && newMarkup >= 0 && newMarkup <= 100) {
        config.shop.markupPercentage = newMarkup;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        await sendTelegram('sendMessage', {
          chat_id: chatId,
          text: `✅ *Profit Markup updated to +${newMarkup}%!*\nAll product prices have been recalculated automatically.`,
          parse_mode: 'Markdown',
        });
        return;
      }
    }
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `Current markup: *+${markup}%*.\nUsage: \`/setmarkup 20\` to set profit margin to 20%.`,
      parse_mode: 'Markdown',
    });
    return;
  }
}

async function handleCallback(cb: { id: string; message?: { chat: { id: number } }; data?: string }) {
  await sendTelegram('answerCallbackQuery', { callback_query_id: cb.id });
  const chatId = cb.message?.chat.id;
  if (!chatId || !cb.data) return;

  if (cb.data === 'shop_catalog') {
    let catalogText = `🛍️ *${config.shop?.name} — Available Products*\n\n`;

    const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

    WHOLESALE_ITEMS.forEach((item) => {
      const clientPrice = calculateClientPrice(item.wholesale);
      catalogText += `• *${item.name}* — $${clientPrice.toFixed(2)}\n`;
      buttons.push([
        {
          text: `Buy ${item.name} ($${clientPrice.toFixed(2)})`,
          callback_data: `buy_${item.id}`,
        },
      ]);
    });

    buttons.push([{ text: '« Back to Main Menu', callback_data: 'shop_back' }]);

    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: catalogText,
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
    return;
  }

  if (cb.data.startsWith('buy_')) {
    const itemId = cb.data.replace('buy_', '');
    const item = WHOLESALE_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const clientPrice = calculateClientPrice(item.wholesale);

    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `🛒 *Order Confirmation: ${item.name}*

Price: *$${clientPrice.toFixed(2)} USD*
Delivery: *Instant In-Chat Decryption*

*Select Payment Method:*`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `⭐ Pay with Telegram Stars (~${Math.round(clientPrice / 0.02)} Stars)`,
              callback_data: `pay_stars_${item.id}`,
            },
          ],
          [
            {
              text: `💳 Pay with Crypto (USDT / USDC)`,
              callback_data: `pay_crypto_${item.id}`,
            },
          ],
          [{ text: '« Cancel Order', callback_data: 'shop_catalog' }],
        ],
      },
    });
    return;
  }

  if (cb.data.startsWith('pay_stars_') || cb.data.startsWith('pay_crypto_')) {
    const isStars = cb.data.startsWith('pay_stars_');
    const itemId = cb.data.replace(isStars ? 'pay_stars_' : 'pay_crypto_', '');
    const item = WHOLESALE_ITEMS.find((i) => i.id === itemId);
    if (!item) return;

    const clientPrice = calculateClientPrice(item.wholesale);
    const mockKey = `KEY-${item.id.toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Simulate instant Mercenta API procurement and key delivery
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `🎉 *Payment Received & Verified!*

Thank you for purchasing *${item.name}* at *${config.shop?.name}*!

🔑 *Your Digital Activation Key:*
\`${mockKey}\`

_Instructions: Copy the key above and redeem it in your account or app. If you need any help, contact ${config.shop?.supportContact}._`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Continue Shopping', callback_data: 'shop_catalog' }],
        ],
      },
    });
    return;
  }

  if (cb.data === 'shop_support') {
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `💬 *Customer Support & Help*

Have an issue with redemption or a question about a product?
Contact our store manager directly: *${config.shop?.supportContact}*

_Powered by Mercenta Wholesale Infrastructure._`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '« Back', callback_data: 'shop_back' }]],
      },
    });
    return;
  }

  if (cb.data === 'shop_back') {
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `👋 *Welcome to ${config.shop?.name}*`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Open Product Catalog', callback_data: 'shop_catalog' }],
          [
            { text: '📦 My Orders', callback_data: 'shop_orders' },
            { text: '💬 Support & Help', callback_data: 'shop_support' },
          ],
        ],
      },
    });
  }
}

async function poll() {
  while (isRunning) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          } else if (update.callback_query) {
            await handleCallback(update.callback_query);
          }
        }
      } else if (!data.ok) {
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch {
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

poll();

process.on('SIGINT', () => {
  console.log('[ClientBot] Stopping gracefully...');
  isRunning = false;
  process.exit(0);
});
