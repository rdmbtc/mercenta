/**
 * Mercenta Official Telegram Bot — Standalone VPS Polling Runner.
 * Zero-dependency long-polling engine. Can run under systemd, PM2, or Docker.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mercenta.xyz';
const TWA_URL = `${APP_URL}/tg`;

if (!BOT_TOKEN) {
  console.error('[MercentaBot] Error: TELEGRAM_BOT_TOKEN is not set in environment.');
  process.exit(1);
}

console.log('[MercentaBot] Starting standalone polling engine for @mercenta_bot...');
console.log(`[MercentaBot] WebApp URL target: ${TWA_URL}`);

let offset = 0;
let isRunning = true;

async function sendTelegram(method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[MercentaBot] Error in ${method}:`, err);
    return null;
  }
}

async function handleMessage(msg: { chat: { id: number }; text?: string; from?: { first_name?: string } }) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';
  const firstName = msg.from?.first_name || 'Partner';

  if (text.startsWith('/start') || text.startsWith('/menu')) {
    const welcomeText = `⚡ *Welcome to Mercenta, ${firstName}!*
_Autonomous Digital Commerce Gateway on Arc Network_

Buy wholesale gaming keys, platform vouchers, streaming subscriptions, and AI compute tokens with *native USDC*.

🛡️ *Hardware-Grade 5 Policy Engine* (Margin protection)
⚡ *Sub-Second Arc Malachite Settlement* (0% chargeback risk)
💳 *Instant Non-Custodial EVM Wallet* (Arc 5042)
🌐 *Multi-Chain Top Up* (Arc, Base, Solana & Card Onramp)

_Tap below to launch the full Web App or browse using inline buttons:_`;

    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚡ Launch Mercenta Store (TWA)', web_app: { url: TWA_URL } }],
          [
            { text: '🛍️ Browse Catalog', callback_data: 'cmd_catalog' },
            { text: '💳 Arc Wallet & Top Up', callback_data: 'cmd_wallet' },
          ],
          [
            { text: '🛡️ Policy Guardrails', callback_data: 'cmd_policy' },
            { text: 'ℹ️ Help & Support', callback_data: 'cmd_help' },
          ],
          [
            { text: '🏪 Launch Your Own TG Shop (1-Click)', url: 'https://github.com/rdmbtc/mercenta' },
          ],
        ],
      },
    });
  }
}

async function handleCallback(cb: { id: string; message?: { chat: { id: number } }; data?: string }) {
  await sendTelegram('answerCallbackQuery', { callback_query_id: cb.id });
  const chatId = cb.message?.chat.id;
  if (!chatId || !cb.data) return;

  if (cb.data === 'cmd_catalog') {
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `🛍️ *Mercenta Digital Catalog Categories:*

1. *Gaming Keys & Platform Vouchers:* Steam, PlayStation, Xbox, Roblox, Valorant.
2. *Streaming & Media Subscriptions:* Apple, Spotify, Discord Nitro.
3. *Creator & Game Micro-Donations:* Telegram Stars, Telegram Premium, PUBG Mobile UC.
4. *Developer API & Token Bundles:* Wholesale LLM token bundles for AI agents.
5. *Cloud Compute & GPU Vouchers:* Dedicated H100 / A100 GPU compute hours.

_All items settled in USDC with instant digital code reveal._`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Open Store (Full Experience)', web_app: { url: TWA_URL } }]],
      },
    });
  } else if (cb.data === 'cmd_wallet') {
    await sendTelegram('sendMessage', {
      chat_id: chatId,
      text: `💳 *Arc Wallet & Multi-Chain Liquidity:*

• *Arc Mainnet:* Chain ID 5042
• *Settlement Currency:* Native USDC
• *Security:* Non-custodial client encryption (Viem)
• *Onramp Portal:* ${APP_URL}/onramp
• *Bridge:* https://bridge.arc.io`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '⚡ Open My Wallet', web_app: { url: TWA_URL } }]],
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
        console.warn('[MercentaBot] Telegram error:', data.description);
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (e) {
      console.error('[MercentaBot] Polling network error:', e);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

poll();

process.on('SIGINT', () => {
  console.log('[MercentaBot] Stopping gracefully...');
  isRunning = false;
  process.exit(0);
});
