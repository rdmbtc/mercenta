import Redis from 'ioredis';
import type { BotLanguage } from './telegram-bot';
let redis: Redis | undefined;
async function store() {
  const url = process.env.TELEGRAM_REDIS_URL || process.env.REDIS_URL;
  if (!url) throw new Error('TELEGRAM_PREFERENCE_STORE_NOT_CONFIGURED');
  redis ??= new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
  if (redis.status === 'wait') await redis.connect();
  return redis;
}
export async function getBotLanguage(id: number): Promise<BotLanguage | null> {
  const value = await (await store()).get(`mercenta:telegram:language:${id}`);
  return value === 'ru' || value === 'en' ? value : null;
}
export async function setBotLanguage(id: number, language: BotLanguage) { await (await store()).set(`mercenta:telegram:language:${id}`, language); }
export async function claimBotUpdate(id: number) { return await (await store()).set(`mercenta:telegram:update:${id}`, 'processing', 'EX', 60, 'NX') === 'OK'; }
export async function completeBotUpdate(id: number) { await (await store()).set(`mercenta:telegram:update:${id}`, 'done', 'EX', 86400); }
export async function releaseBotUpdate(id: number) { await (await store()).del(`mercenta:telegram:update:${id}`); }
