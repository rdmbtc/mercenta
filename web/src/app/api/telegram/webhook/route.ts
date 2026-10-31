import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { handleBotUpdate, telegramRequest, type BotUpdate } from '@/lib/telegram-bot';
import { claimBotUpdate, completeBotUpdate, releaseBotUpdate, getBotLanguage, setBotLanguage } from '@/lib/telegram-store';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN, secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return NextResponse.json({ error: 'BOT_NOT_CONFIGURED' }, { status: 503 });
  const supplied = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (Buffer.byteLength(supplied) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  let update: BotUpdate;
  try { update = await req.json(); if (!Number.isSafeInteger(update.update_id)) throw new Error(); }
  catch { return NextResponse.json({ error: 'INVALID_UPDATE' }, { status: 400 }); }
  let claimed = false;
  try {
    claimed = await claimBotUpdate(update.update_id);
    if (!claimed) return NextResponse.json({ ok: true });
    await handleBotUpdate(update, { origin: process.env.NEXT_PUBLIC_APP_URL || 'https://mercenta.xyz', send: (method, body) => telegramRequest(token, method, body), getLanguage: getBotLanguage, setLanguage: setBotLanguage });
    await completeBotUpdate(update.update_id);
    return NextResponse.json({ ok: true });
  } catch {
    if (claimed) await releaseBotUpdate(update.update_id).catch(() => {});
    console.error('Telegram update delivery failed; configuration or Telegram API needs attention.');
    return NextResponse.json({ error: 'BOT_DELIVERY_FAILED' }, { status: 503 });
  }
}
