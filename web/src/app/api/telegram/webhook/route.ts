import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

async function sendTelegramRequest(token: string, method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error in ${method}:`, err);
    return null;
  }
}

export async function POST(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Validate secret header if configured
  if (secretToken) {
    const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
    if (headerSecret !== secretToken) {
      return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 });
    }
  }

  if (!botToken) {
    return NextResponse.json({ warning: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 200 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://mercenta.xyz';
  const twaUrl = `${appOrigin}/tg`;

  // 1. Handle incoming text messages
  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const userFirstName = update.message.from?.first_name || 'Partner';

    if (text.startsWith('/start') || text.startsWith('/menu')) {
      const welcomeText = `⚡ *Welcome to Mercenta, ${userFirstName}!*
_Autonomous Digital Commerce Gateway on Arc Network_

Buy wholesale gaming keys, platform vouchers, streaming subscriptions, and AI compute tokens with *native USDC*.

🛡️ *Hardware-Grade 5 Policy Engine* (Margin protection)
⚡ *Sub-Second Arc Malachite Settlement* (0% chargeback risk)
💳 *Instant Non-Custodial EVM Wallet* (Arc 5042)
🌐 *Multi-Chain Top Up* (Arc, Base, Solana & Card Onramp)

_Tap below to launch the full Web App or browse using inline buttons:_`;

      await sendTelegramRequest(botToken, 'sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⚡ Launch Mercenta Store (TWA)',
                web_app: { url: twaUrl },
              },
            ],
            [
              { text: '🛍️ Browse Catalog', callback_data: 'cmd_catalog' },
              { text: '💳 Arc Wallet & Top Up', callback_data: 'cmd_wallet' },
            ],
            [
              { text: '🛡️ Policy Guardrails', callback_data: 'cmd_policy' },
              { text: 'ℹ️ Help & Support', callback_data: 'cmd_help' },
            ],
            [
              {
                text: '🏪 Launch Your Own TG Shop (1-Click)',
                url: 'https://github.com/rdmbtc/mercenta',
              },
            ],
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (text === '/catalog') {
      await sendTelegramRequest(botToken, 'sendMessage', {
        chat_id: chatId,
        text: '🛍️ *Mercenta Wholesale Digital Catalog*\n\nExplore real-time inventory protected by deterministic margin checks:',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚡ Open Interactive Catalog (TWA)', web_app: { url: twaUrl } }],
            [
              { text: '🎮 Gaming Keys', callback_data: 'cat_gaming' },
              { text: '📺 Subscriptions', callback_data: 'cat_sub' },
            ],
            [
              { text: '⭐ Telegram Stars / UC', callback_data: 'cat_stars' },
              { text: '💻 Cloud GPU Vouchers', callback_data: 'cat_compute' },
            ],
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (text === '/wallet') {
      await sendTelegramRequest(botToken, 'sendMessage', {
        chat_id: chatId,
        text: `💳 *Mercenta Non-Custodial Arc Wallet*

Every Mercenta user receives an automatic Arc EVM wallet (Chain ID 5042) generated client-side with full private key ownership.

*Deposit Options Supported:*
• *Arc USDC*: Native Malachite transfers with zero-gas overhead.
• *Base USDC*: Cross-chain deposits via Base.
• *Solana USDC*: SPL token routing.
• *Credit/Debit Card*: Direct Onramp via Apple Pay / Cards.
• *Arc Bridge*: https://bridge.arc.io

_Open the Web App to view your personal QR code and export keys:_`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⚡ Open Wallet & Top Up', web_app: { url: twaUrl } }],
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }
  }

  // 2. Handle callback queries (Inline button clicks)
  if (update.callback_query?.data) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat.id;
    const data = cb.data;

    // Acknowledge callback immediately
    await sendTelegramRequest(botToken, 'answerCallbackQuery', {
      callback_query_id: cb.id,
    });

    if (chatId && data) {
      if (data === 'cmd_catalog' || data.startsWith('cat_')) {
        await sendTelegramRequest(botToken, 'sendMessage', {
          chat_id: chatId,
          text: `🛍️ *Mercenta Digital Catalog Categories:*

1. *Gaming Keys & Platform Vouchers:* Steam, PlayStation, Xbox, Roblox, Valorant, Nintendo.
2. *Streaming & Media Subscriptions:* Apple, Spotify, Discord Nitro, Tinder.
3. *Creator & Game Micro-Donations:* Telegram Stars, Telegram Premium, PUBG UC, Free Fire Diamonds.
4. *Developer API & Token Bundles:* Wholesale LLM token pools for AI agents.
5. *Cloud Compute & GPU Vouchers:* Dedicated H100 / A100 GPU compute hours.

_All orders are settled in USDC with instant digital voucher reveal._`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚡ Open Store (Full Experience)', web_app: { url: twaUrl } }],
            ],
          },
        });
      } else if (data === 'cmd_wallet') {
        await sendTelegramRequest(botToken, 'sendMessage', {
          chat_id: chatId,
          text: `💳 *Arc Wallet & Multi-Chain Liquidity:*

• *Arc Mainnet:* Chain ID 5042
• *Settlement Currency:* Native USDC
• *Security:* Non-custodial client encryption (Viem)
• *Onramp Portal:* https://mercenta.xyz/onramp
• *Bridge:* https://bridge.arc.io`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚡ Open My Wallet', web_app: { url: twaUrl } }],
            ],
          },
        });
      } else if (data === 'cmd_policy') {
        await sendTelegramRequest(botToken, 'sendMessage', {
          chat_id: chatId,
          text: `🛡️ *Mercenta 5-Gate Policy Engine:*

1. *Gross Margin Floor:* Enforces positive margins (>=2.5%) before any transaction executes.
2. *Auto-Approval Ceiling:* Caps single-transaction exposure.
3. *Velocity Guardrails:* Limits transactions per minute to prevent runaway loops.
4. *Dispute Reserve:* Automatically sets aside tax and reserve liquidity.
5. *Supplier Status:* Validates supplier uptime and inventory availability.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚙️ Configure Policy & API Keys', web_app: { url: twaUrl } }],
            ],
          },
        });
      } else if (data === 'cmd_help') {
        await sendTelegramRequest(botToken, 'sendMessage', {
          chat_id: chatId,
          text: `ℹ️ *Mercenta Support & Infrastructure Docs:*

• *Documentation:* https://docs.mercenta.xyz
• *Uptime & Latency (<25ms):* https://status.mercenta.xyz
• *Contract Explorer:* https://explorer.arc.io/address/0x06b67adf8d63c8c35a6beda42a3bb93d485af3ed
• *Support Bot / Chat:* @mercentaxyz on X or submit a ticket in the Web App`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚡ Open Support in TWA', web_app: { url: twaUrl } }],
            ],
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Mercenta Official Telegram Bot Webhook',
    endpoint: '/api/telegram/webhook',
    twaUrl: '/tg',
  });
}
