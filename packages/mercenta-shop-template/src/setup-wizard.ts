import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
const path = new URL('../shop.config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
const prompt = createInterface({ input: process.stdin, output: process.stdout });
try {
  const ask = async (label: string, current: string) => (await prompt.question(`${label} [${current}]: `)).trim() || current;
  config.name = await ask('Store name / Название магазина', config.name);
  config.tagline.ru = await ask('Описание RU', config.tagline.ru);
  config.tagline.en = await ask('Tagline EN', config.tagline.en);
  config.support = await ask('Support email or @username', config.support);
  config.miniAppUrl = await ask('HTTPS Mini App URL', config.miniAppUrl);
  const url = new URL(config.miniAppUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Use an HTTPS Mini App URL without credentials or fragments.');
  if (!config.name.trim() || config.name.length > 80) throw new Error('Store name must contain 1–80 characters.');
  if (!/^@[A-Za-z0-9_]{5,32}$/.test(config.support) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.support)) throw new Error('Enter a support email or Telegram username.');
  await writeFile(path, JSON.stringify(config, null, 2) + '\n');
  console.log('Public branding saved. No token or API key was requested or written. Configure TELEGRAM_BOT_TOKEN through your shell/process manager. This starter does not collect payments or apply merchant markup.');
} finally { prompt.close(); }
