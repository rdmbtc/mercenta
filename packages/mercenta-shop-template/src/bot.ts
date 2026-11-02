import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('../bot.py', import.meta.url));
const result = spawnSync(process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), [script, '--config', fileURLToPath(new URL('../shop.config.json', import.meta.url))], { stdio: 'inherit', env: { ...process.env, TELEGRAM_STATE_PATH: process.env.TELEGRAM_STATE_PATH || 'data/bot.sqlite3' } });
if (result.error) { console.error('Python 3.10+ is required. Set PYTHON to its executable.'); process.exitCode = 1; }
else process.exitCode = result.status ?? 1;
