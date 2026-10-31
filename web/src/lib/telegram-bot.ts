export type BotLanguage = 'ru' | 'en';
export type BotUpdate = { update_id: number; message?: { text?: string; from?: { id: number; language_code?: string }; chat: { id: number; type?: string } }; callback_query?: { id: string; from: { id: number; language_code?: string }; data?: string; message?: { chat: { id: number; type?: string } } } };
export const botCommands = (ru: boolean) => [
  ['start', ru ? 'Начать и открыть меню' : 'Welcome and main menu'],
  ['shop', ru ? 'Каталог товаров' : 'Browse products'],
  ['wallet', ru ? 'Кошелёк и пополнение' : 'Wallet and funding'],
  ['orders', ru ? 'Мои покупки' : 'My purchases'],
  ['network', ru ? 'Testnet и Mainnet' : 'Testnet and Mainnet'],
  ['language', ru ? 'Выбрать язык' : 'Choose language'],
  ['help', ru ? 'Помощь и поддержка' : 'Help and support'],
].map(([command, description]) => ({ command, description }));
export async function telegramRequest(token: string, method: string, payload: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  if (!response.ok || data.ok !== true) throw new Error(`TELEGRAM_${method}_FAILED_${response.status}`);
  return data.result;
}
export async function handleBotUpdate(update: BotUpdate, options: { origin: string; send: (method: string, payload: Record<string, unknown>) => Promise<unknown>; getLanguage: (id: number) => Promise<BotLanguage | null>; setLanguage: (id: number, language: BotLanguage) => Promise<void> }) {
  const callback = update.callback_query;
  const user = callback?.from ?? update.message?.from;
  const chat = callback?.message?.chat ?? update.message?.chat;
  if (!user || !chat) return;
  if (callback) await options.send('answerCallbackQuery', { callback_query_id: callback.id });
  let lang = await options.getLanguage(user.id) ?? (user.language_code?.toLowerCase().startsWith('ru') ? 'ru' : 'en');
  if (callback?.data === 'lang_ru' || callback?.data === 'lang_en') {
    lang = callback.data === 'lang_ru' ? 'ru' : 'en';
    await options.setLanguage(user.id, lang);
  }
  const ru = lang === 'ru';
  const raw = update.message?.text?.trim() ?? '';
  const command = callback?.data?.replace(/^cmd_/, '') ?? raw.match(/^\/([a-z]+)(?:@[a-z0-9_]+)?(?:\s|$)/i)?.[1]?.toLowerCase() ?? 'help';
  const section = ['wallet', 'orders', 'help'].includes(command) ? command : command === 'policy' ? 'policy' : 'store';
  const url = new URL('/tg', options.origin); url.searchParams.set('lang', lang); url.searchParams.set('section', section);
  const launch = { text: ru ? 'Открыть Mercenta' : 'Open Mercenta', ...(chat.type === 'private' ? { web_app: { url: url.toString() } } : { url: url.toString() }) };
  let text = ru
    ? 'Добро пожаловать в Mercenta!\n\nИгровые карты, подписки и цифровые товары с оплатой USDC. Создайте зашифрованный кошелёк на устройстве или подключите свой.\n\nTestnet: тестовые средства и неактивируемая выдача. Mainnet: реальные USDC, оплата только после вашего подтверждения.'
    : 'Welcome to Mercenta!\n\nBrowse gaming cards, subscriptions and digital goods with USDC. Create an encrypted wallet on your device or connect your own.\n\nTestnet uses test funds and non-redeemable delivery. Mainnet uses real USDC with your explicit payment approval.';
  if (command === 'wallet') text = ru ? 'Кошелёк создаётся и шифруется на вашем устройстве. Сохраните пароль и резервную копию. Никому не отправляйте приватный ключ.' : 'Your wallet is created and encrypted on your device. Keep your password and backup. Never send anyone your private key.';
  else if (command === 'orders') text = ru ? 'Мои покупки доступны после входа в Mini App. Проверяйте статус существующего заказа перед повторной оплатой.' : 'Sign in to the Mini App to view purchases. Check an existing order before paying again.';
  else if (command === 'network') text = ru ? 'В Mini App доступны две сети: Arc Testnet (5042002) для тестов и Arc Mainnet (5042) для реальных USDC. Балансы разделены.' : 'Switch inside the Mini App: Arc Testnet (5042002) for testing, Arc Mainnet (5042) for real USDC. Balances are separate.';
  else if (command === 'language' || callback?.data?.startsWith('lang_')) text = ru ? 'Язык: русский. Выберите язык интерфейса:' : 'Language: English. Choose your interface language:';
  else if (command === 'help' || !['start', 'menu', 'shop', 'catalog', 'policy'].includes(command)) text = ru ? 'Команды: /shop /wallet /orders /network /language /help\n\nПоддержка: support@mercenta.xyz. Укажите номер заказа, но не отправляйте ключи, пароли или коды активации.' : 'Commands: /shop /wallet /orders /network /language /help\n\nSupport: support@mercenta.xyz. Include your order reference, never private keys, passwords or activation codes.';
  await options.send('sendMessage', { chat_id: chat.id, text, reply_markup: { inline_keyboard: [[launch], [{ text: ru ? 'Каталог' : 'Store', callback_data: 'cmd_shop' }, { text: ru ? 'Кошелёк' : 'Wallet', callback_data: 'cmd_wallet' }], [{ text: ru ? 'Покупки' : 'Purchases', callback_data: 'cmd_orders' }, { text: ru ? 'Помощь' : 'Help', callback_data: 'cmd_help' }], [{ text: 'Русский', callback_data: 'lang_ru' }, { text: 'English', callback_data: 'lang_en' }]] } });
}
