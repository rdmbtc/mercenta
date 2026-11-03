import messages from './bot-messages.json';
import {
  isTelegramAdmin,
  renderAdminDashboardView,
  renderAdminOrdersView,
  renderAdminOrderDetailView,
  renderAdminStatsView,
  notifyAdminsNewOrder,
} from './telegram-admin';

export type BotLanguage = 'ru' | 'en';
export type BotUpdate = {
  update_id: number;
  message?: {
    text?: string;
    from?: { id: number; language_code?: string; username?: string };
    chat: { id: number; type?: string };
  };
  callback_query?: {
    id: string;
    from: { id: number; language_code?: string; username?: string };
    data?: string;
    message?: { message_id?: number; chat: { id: number; type?: string } };
  };
};
export type BotBrand = { name: string; support: string; tagline?: Partial<Record<BotLanguage, string>> };

export const botCommands = (ru: boolean) => [
  ['start', ru ? 'Начать и открыть меню' : 'Welcome and main menu'],
  ['shop', ru ? 'Каталог товаров' : 'Browse products'],
  ['wallet', ru ? 'Кошелёк и пополнение' : 'Wallet and funding'],
  ['orders', ru ? 'Мои покупки' : 'My purchases'],
  ['admin', ru ? 'Панель управления (заказы и статистика)' : 'Admin console (orders & stats)'],
  ['network', ru ? 'Testnet и Mainnet' : 'Testnet and Mainnet'],
  ['language', ru ? 'Выбрать язык' : 'Choose language'],
  ['help', ru ? 'Помощь и поддержка' : 'Help and support'],
].map(([command, description]) => ({ command, description }));

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderBotMessage(
  command: string,
  lang: BotLanguage,
  origin: string,
  privateChat: boolean,
  brand: BotBrand = { name: 'Mercenta', support: 'support@mercenta.xyz' },
  isAdmin = false
) {
  const copy = messages[lang];
  const aliases: Record<string, string> = { menu: 'start', catalog: 'shop', back: 'start' };
  command = aliases[command] ?? command;
  if (command.startsWith('lang_')) command = 'language';
  if (command.startsWith('pay_') || command.startsWith('buy_') || command === 'setmarkup') command = 'payment_unavailable';
  const screen = ['start','shop','wallet','orders','network','language','help','payment_unavailable'].includes(command) ? command : 'help';
  const template = copy[screen as 'start'];
  const values = { name: brand.name, support: brand.support, tagline: brand.tagline?.[lang] ?? copy.defaultTagline };
  const fill = (text: string) => text.replace(/\{(name|support|tagline)\}/g, (_, key: keyof typeof values) => escapeHtml(values[key]));
  const title = fill(template.title), body = fill(template.body), note = fill(template.note);
  const section = ['wallet','orders','help'].includes(screen) ? screen : 'store';
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('INVALID_MINI_APP_URL');
  if (url.pathname === '/') url.pathname = '/tg';
  url.searchParams.set('lang', lang); url.searchParams.set('section', section);
  const buttons = copy.buttons;
  const launchText = screen === 'wallet' ? buttons.wallet : screen === 'orders' ? buttons.orders : buttons.shop;
  const launch = { text: launchText, ...(privateChat ? { web_app: { url: url.toString() } } : { url: url.toString() }) };
  const back = { text: buttons.home, callback_data: 'cmd_start' };
  const keyboard = screen === 'language'
    ? [[{text: (lang === 'ru' ? '✓ ' : '') + 'Русский', callback_data:'lang_ru'}, {text:(lang === 'en' ? '✓ ' : '') + 'English',callback_data:'lang_en'}],[back]]
    : screen === 'start'
      ? [
          [launch],
          [{text:buttons.wallet_short,callback_data:'cmd_wallet'},{text:buttons.orders,callback_data:'cmd_orders'}],
          ...(isAdmin ? [[{text: buttons.admin || (lang === 'ru' ? '⚙️ Админ-панель' : '⚙️ Admin Console'), callback_data:'cmd_admin'}]] : []),
          [{text:buttons.help_short,callback_data:'cmd_help'},{text:buttons.language,callback_data:'cmd_language'}]
        ]
      : screen === 'help'
        ? [[{text:buttons.help, ...(privateChat ? {web_app:{url:new URL(url.toString().replace('section=store','section=help')).toString()}} : {url:url.toString()})}],[{text:buttons.language,callback_data:'cmd_language'},back]]
        : [[launch],[{text:buttons.network,callback_data:'cmd_network'},{text:buttons.help_short,callback_data:'cmd_help'}],[back]];
  return { text: `<b>${title}</b>\n\n${body}\n\n<i>${note}</i>`, parse_mode: 'HTML' as const, reply_markup: { inline_keyboard: keyboard }, link_preview_options: { is_disabled: true } };
}

export async function telegramRequest(token: string, method: string, payload: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
  const data = await response.json();
  if (!response.ok || data.ok !== true) {
    if (data.error_code === 400 && data.description === 'Bad Request: message is not modified') return null;
    throw new Error(`TELEGRAM_${method}_FAILED_${response.status}`);
  }
  return data.result;
}

export async function handleBotUpdate(
  update: BotUpdate,
  options: {
    origin: string;
    brand?: BotBrand;
    send: (method: string, payload: Record<string, unknown>) => Promise<unknown>;
    getLanguage: (id: number) => Promise<BotLanguage | null>;
    setLanguage: (id: number, language: BotLanguage) => Promise<void>;
  }
) {
  const callback = update.callback_query;
  const user = callback?.from ?? update.message?.from;
  const chat = callback?.message?.chat ?? update.message?.chat;
  if (!user || !chat) return;
  if (callback) await options.send('answerCallbackQuery', { callback_query_id: callback.id });
  let lang = await options.getLanguage(user.id) ?? (user.language_code?.toLowerCase().startsWith('ru') ? 'ru' : 'en');
  if (callback?.data === 'lang_ru' || callback?.data === 'lang_en') { lang = callback.data === 'lang_ru' ? 'ru' : 'en'; await options.setLanguage(user.id, lang); }
  const raw = update.message?.text?.trim() ?? '';
  const command = callback?.data?.replace(/^cmd_/, '') ?? raw.match(/^\/([a-z0-9_]+)(?:@[a-z0-9_]+)?(?:\s|$)/i)?.[1]?.toLowerCase() ?? 'help';
  const isAdmin = isTelegramAdmin(user.id, user.username);

  let rendered: { text: string; parse_mode: 'HTML'; reply_markup?: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string; web_app?: { url: string } }>> }; link_preview_options?: { is_disabled: boolean } };

  if (command.startsWith('admin')) {
    if (!isAdmin) {
      rendered = {
        text: lang === 'ru'
          ? `🔒 <b>Доступ ограничен</b>\n\nПанель управления доступна только администраторам Mercenta.\nВаш Telegram ID: <code>${user.id}</code>.`
          : `🔒 <b>Access Restricted</b>\n\nAdmin panel is only accessible to authorized Mercenta operators.\nYour Telegram ID: <code>${user.id}</code>.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: lang === 'ru' ? '🔙 Главное меню' : '🔙 Main Menu', callback_data: 'cmd_start' }]],
        },
        link_preview_options: { is_disabled: true },
      };
    } else if (command === 'admin') {
      rendered = renderAdminDashboardView(user.id, lang, options.origin);
    } else if (command.startsWith('admin_order_')) {
      const orderId = command.replace('admin_order_', '');
      rendered = renderAdminOrderDetailView(orderId, lang);
    } else if (command.startsWith('admin_orders')) {
      const pageMatch = command.match(/^admin_orders_(\d+)$/);
      const page = pageMatch ? parseInt(pageMatch[1], 10) : 0;
      rendered = renderAdminOrdersView(lang, page);
    } else if (command === 'admin_stats') {
      rendered = renderAdminStatsView(lang);
    } else if (command === 'admin_test_notify') {
      await notifyAdminsNewOrder({
        orderId: 'test-' + Math.random().toString(16).slice(2, 10),
        productId: 'gaming-steam-voucher',
        productName: 'Steam Wallet Card (Test Alert)',
        customerWallet: '0x58863e4a739da0e62c2eba258b7783e95d5c48ce',
        telegramUsername: user.username ? `@${user.username}` : undefined,
        amountUsdc: '50.000000',
        txHash: '0x' + 'a'.repeat(64),
        status: 'FULFILLED',
        network: 'Arc Mainnet (5042)',
        policyReasonHash: '0x0392b65b',
      });
      rendered = {
        text: lang === 'ru'
          ? `✅ <b>Тестовое уведомление успешно отправлено!</b>\nПроверьте входящие сообщения от бота.`
          : `✅ <b>Test notification dispatched!</b>\nCheck incoming messages from the bot.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: lang === 'ru' ? '📦 История покупок' : '📦 Purchase History', callback_data: 'cmd_admin_orders' }],
            [{ text: lang === 'ru' ? '⚙️ Админ-панель' : '⚙️ Admin Console', callback_data: 'cmd_admin' }],
          ],
        },
        link_preview_options: { is_disabled: true },
      };
    } else {
      rendered = renderAdminDashboardView(user.id, lang, options.origin);
    }
  } else {
    rendered = renderBotMessage(command, lang, options.origin, chat.type === 'private', options.brand, isAdmin);
  }

  if (callback?.message?.message_id) {
    try {
      await options.send('editMessageText', { chat_id: chat.id, message_id: callback.message.message_id, ...rendered });
      return;
    } catch {
      /* Older or deleted messages require a fresh menu. */
    }
  }
  await options.send('sendMessage', { chat_id: chat.id, ...rendered });
}
