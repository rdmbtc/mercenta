import argparse
import html
import json
import logging
import os
import re
import signal
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_CONFIG = {
    'name': 'Mercenta',
    'tagline': {'ru': 'Цифровые товары. Ваши правила.', 'en': 'Digital essentials. Your rules.'},
    'support': 'support@mercenta.xyz',
    'miniAppUrl': 'https://www.mercenta.xyz/tg',
    'theme': {'background': '#080b10', 'surface': '#10151d', 'accent': '#b2e5ff'},
}


def load_config(path=None):
    config = DEFAULT_CONFIG.copy() if path is None else json.loads(Path(path).read_text(encoding='utf-8-sig'))
    if not isinstance(config, dict):
        raise ValueError('Configuration must be an object')
    for key, maximum in [('name', 80), ('support', 160)]:
        if not isinstance(config.get(key), str) or not 1 <= len(config[key].strip()) <= maximum:
            raise ValueError('Invalid ' + key)
    support = config['support']
    if not (re.fullmatch(r'@[A-Za-z0-9_]{5,32}', support) or re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', support)):
        raise ValueError('Support must be an email or Telegram username')
    url = urllib.parse.urlsplit(config.get('miniAppUrl', ''))
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.fragment:
        raise ValueError('miniAppUrl must be an HTTPS URL without credentials or fragments')
    if not isinstance(config.get('tagline'), dict) or any(not isinstance(config['tagline'].get(lang), str) or len(config['tagline'][lang]) > 240 for lang in ('ru', 'en')):
        raise ValueError('Provide Russian and English taglines')
    theme = config.get('theme', {})
    if any(not re.fullmatch(r'#[a-fA-F0-9]{6}', theme.get(key, '')) for key in ('background', 'surface', 'accent')):
        raise ValueError('Theme values must be six-digit hex colors')
    return config


def screen_name(command):
    command = {'menu': 'start', 'catalog': 'shop', 'back': 'start', 'shop_back': 'start', 'shop_catalog': 'shop', 'shop_orders': 'orders', 'shop_support': 'help'}.get(command, command)
    if command.startswith('lang_'):
        return 'language'
    if command.startswith(('pay_', 'buy_')) or command == 'setmarkup':
        return 'payment_unavailable'
    return command if command in ('start', 'shop', 'wallet', 'orders', 'network', 'language', 'help', 'payment_unavailable') else 'help'


def render_message(command, language, config, private_chat=True, messages=None):
    messages = messages or json.loads((ROOT / 'messages.json').read_text(encoding='utf-8'))
    copy = messages[language]
    screen = screen_name(command)
    values = {'name': config['name'], 'support': config['support'], 'tagline': config['tagline'][language]}

    def fill(text):
        return re.sub(r'\{(name|support|tagline)\}', lambda match: html.escape(values[match[1]], quote=True), text)

    template = copy[screen]
    text = '<b>' + fill(template['title']) + '</b>\n\n' + fill(template['body']) + '\n\n<i>' + fill(template['note']) + '</i>'
    section = screen if screen in ('wallet', 'orders', 'help') else 'store'
    parsed = urllib.parse.urlsplit(config['miniAppUrl'])
    query = dict(urllib.parse.parse_qsl(parsed.query))
    query.update(lang=language, section=section)
    url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path or '/tg', urllib.parse.urlencode(query), ''))
    b = copy['buttons']
    launch_label = b['wallet'] if screen == 'wallet' else b['orders'] if screen == 'orders' else b['help'] if screen == 'help' else b['shop']
    launch = {'text': launch_label}
    launch.update({'web_app': {'url': url}} if private_chat else {'url': url})
    home = {'text': b['home'], 'callback_data': 'cmd_start'}

    def make_app_btn(label, **extra_query):
        q = dict(query)
        q.update(extra_query)
        btn_url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path or '/tg', urllib.parse.urlencode(q), ''))
        return {'text': label, 'web_app': {'url': btn_url}} if private_chat else {'text': label, 'url': btn_url}

    if screen == 'language':
        keyboard = [[{'text': ('✓ ' if language == 'ru' else '') + 'Русский', 'callback_data': 'lang_ru'}, {'text': ('✓ ' if language == 'en' else '') + 'English', 'callback_data': 'lang_en'}], [home]]
    elif screen == 'start':
        keyboard = [[launch], [{'text': b['wallet_short'], 'callback_data': 'cmd_wallet'}, {'text': b['orders'], 'callback_data': 'cmd_orders'}], [{'text': b['help_short'], 'callback_data': 'cmd_help'}, {'text': b['language'], 'callback_data': 'cmd_language'}]]
    elif screen == 'shop':
        if language == 'ru':
            keyboard = [
                [make_app_btn('🛍 Открыть полный каталог', section='store')],
                [
                    make_app_btn('🎮 Игры и ключи', section='store', category='gaming'),
                    make_app_btn('🎬 Подписки', section='store', category='streaming'),
                ],
                [
                    make_app_btn('💎 Telegram Stars', section='store', category='creator'),
                    make_app_btn('⚡ Донаты в игры', section='store', kind='direct_topup'),
                ],
                [
                    make_app_btn('🌐 Global', section='store', region='GLOB'),
                    make_app_btn('🇹🇷 Турция', section='store', region='TR'),
                    make_app_btn('🇺🇸 США', section='store', region='US'),
                ],
                [
                    make_app_btn('🇷🇺 СНГ', section='store', region='CIS'),
                    make_app_btn('🇪🇺 Европа', section='store', region='EU'),
                ],
                [
                    {'text': b['wallet_short'], 'callback_data': 'cmd_wallet'},
                    home,
                ],
            ]
        else:
            keyboard = [
                [make_app_btn('🛍 Open Full Catalog', section='store')],
                [
                    make_app_btn('🎮 Games & Keys', section='store', category='gaming'),
                    make_app_btn('🎬 Subscriptions', section='store', category='streaming'),
                ],
                [
                    make_app_btn('💎 Telegram Stars', section='store', category='creator'),
                    make_app_btn('⚡ Direct Top-Up', section='store', kind='direct_topup'),
                ],
                [
                    make_app_btn('🌐 Global', section='store', region='GLOB'),
                    make_app_btn('🇹🇷 Turkey', section='store', region='TR'),
                    make_app_btn('🇺🇸 US', section='store', region='US'),
                ],
                [
                    make_app_btn('🇷🇺 CIS', section='store', region='CIS'),
                    make_app_btn('🇪🇺 Europe', section='store', region='EU'),
                ],
                [
                    {'text': b['wallet_short'], 'callback_data': 'cmd_wallet'},
                    home,
                ],
            ]
    elif screen == 'help':
        keyboard = [[launch], [{'text': b['language'], 'callback_data': 'cmd_language'}, home]]
    else:
        keyboard = [[launch], [{'text': b['network'], 'callback_data': 'cmd_network'}, {'text': b['help_short'], 'callback_data': 'cmd_help'}], [home]]
    return {'text': text, 'parse_mode': 'HTML', 'reply_markup': {'inline_keyboard': keyboard}, 'link_preview_options': {'is_disabled': True}}


class TelegramError(RuntimeError):
    def __init__(self, method, code, unchanged=False):
        self.unchanged = unchanged
        super().__init__(f'Telegram {method} failed ({code})')


class Telegram:
    def __init__(self, token):
        self.token = token

    def call(self, method, payload=None):
        request = urllib.request.Request('https://api.telegram.org/bot' + self.token + '/' + method, data=json.dumps(payload or {}).encode(), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                data = json.load(response)
        except urllib.error.HTTPError as error:
            try:
                body = json.loads(error.read(8192))
            except (ValueError, OSError):
                body = {}
            raise TelegramError(method, error.code, body.get('description') == 'Bad Request: message is not modified') from None
        except (urllib.error.URLError, TimeoutError):
            raise RuntimeError('Telegram connection unavailable') from None
        if not data.get('ok'):
            raise TelegramError(method, data.get('error_code', 'unknown'), data.get('description') == 'Bad Request: message is not modified')
        return data['result']


class Store:
    def __init__(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('CREATE TABLE IF NOT EXISTS preferences (user_id INTEGER PRIMARY KEY, language TEXT NOT NULL)')
        self.db.execute('CREATE TABLE IF NOT EXISTS polling (id INTEGER PRIMARY KEY CHECK(id=1), next_offset INTEGER NOT NULL)')
        self.db.commit()

    def language(self, user):
        row = self.db.execute('SELECT language FROM preferences WHERE user_id=?', (user['id'],)).fetchone()
        return row[0] if row and row[0] in ('ru', 'en') else ('ru' if user.get('language_code', '').startswith('ru') else 'en')

    def set_language(self, user_id, language):
        with self.db:
            self.db.execute('INSERT INTO preferences VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET language=excluded.language', (user_id, language))

    def offset(self):
        row = self.db.execute('SELECT next_offset FROM polling WHERE id=1').fetchone()
        return row[0] if row else 0

    def advance(self, offset):
        with self.db:
            self.db.execute('INSERT INTO polling VALUES (1,?) ON CONFLICT(id) DO UPDATE SET next_offset=excluded.next_offset', (offset,))


def handle_update(update, api, store, config):
    callback = update.get('callback_query')
    message = (callback or {}).get('message') or update.get('message') or {}
    user = (callback or {}).get('from') or message.get('from') or {}
    chat = message.get('chat') or {}
    if not isinstance(user.get('id'), int) or not isinstance(chat.get('id'), int):
        return
    admin_value = os.environ.get('TELEGRAM_ADMIN_ID', '')
    if admin_value.isdigit():
        from support import handle_support, register_customer
        if chat.get('type') == 'private' and chat.get('id') == user['id']:
            register_customer(store, user)
        if handle_support(update, api, store, config, int(admin_value)):
            return
    if callback:
        try:
            api.call('answerCallbackQuery', {'callback_query_id': callback['id']})
        except TelegramError as error:
            if '(400)' not in str(error):
                raise
    language = store.language(user)
    data = (callback or {}).get('data', '')
    if data in ('lang_ru', 'lang_en'):
        language = data[-2:]
        store.set_language(user['id'], language)
    match = re.match(r'^/([a-z]+)(?:@[a-z0-9_]+)?(?:\s|$)', message.get('text', '').strip(), re.I)
    command = data.removeprefix('cmd_') if callback else (match[1].lower() if match else 'help')
    if admin_value.isdigit() and not callback and re.fullmatch(r'/start(?:@[A-Za-z0-9_]+)?\s+support', message.get('text', '').strip(), re.I):
        from support import handle_support
        support_update = dict(update, message=dict(message, text='/support'))
        if handle_support(support_update, api, store, config, int(admin_value)):
            return
    if admin_value.isdigit():
        from support import storefront_paused
        if command in ('shop', 'catalog') and storefront_paused(store):
            api.call('sendMessage', {'chat_id':chat['id'], 'text':'Витрина временно приостановлена. Поддержка: /support' if language == 'ru' else 'Bot storefront temporarily paused. Support: /support'})
            return
    rendered = render_message(command, language, config, chat.get('type') == 'private')
    if admin_value.isdigit() and screen_name(command) == 'help' and chat.get('type') == 'private':
        rendered['reply_markup']['inline_keyboard'].insert(0, [{'text':'Открыть обращение' if language == 'ru' else 'Open support ticket','callback_data':'sup:new'}, {'text':'Мои обращения' if language == 'ru' else 'My tickets','callback_data':'sup:list:open:0'}])
    if callback and message.get('message_id'):
        try:
            api.call('editMessageText', {'chat_id': chat['id'], 'message_id': message['message_id'], **rendered})
            return
        except TelegramError as error:
            if error.unchanged:
                return
            if '(400)' not in str(error):
                raise
    api.call('sendMessage', {'chat_id': chat['id'], **rendered})


def register(api, config):
    for language in ('', 'en', 'ru'):
        ru = language == 'ru'
        labels = [('start', 'Главное меню' if ru else 'Main menu'), ('shop', 'Каталог товаров' if ru else 'Browse products'), ('wallet', 'Кошелёк' if ru else 'Wallet'), ('orders', 'Мои покупки' if ru else 'My purchases'), ('network', 'Testnet и Mainnet'), ('language', 'Выбрать язык' if ru else 'Choose language'), ('help', 'Помощь' if ru else 'Help')]
        if os.environ.get('TELEGRAM_ADMIN_ID', '').isdigit():
            labels.extend([('support', 'Личное обращение' if ru else 'Private support ticket'), ('tickets', 'Мои обращения' if ru else 'My tickets'), ('cancel', 'Отменить ввод' if ru else 'Cancel input')])
        api.call('setMyCommands', {'commands': [{'command': c, 'description': d} for c, d in labels], 'language_code': language})
    if os.environ.get('TELEGRAM_ADMIN_ID', '').isdigit():
        api.call('setMyCommands', {'scope': {'type':'chat', 'chat_id':int(os.environ['TELEGRAM_ADMIN_ID'])}, 'commands': [{'command':'admin','description':'Управление магазином / Store administration'}, {'command':'tickets','description':'Обращения / Tickets'}, {'command':'cancel','description':'Отменить ввод / Cancel input'}, {'command':'start','description':'Главное меню / Main menu'}]})
    api.call('setChatMenuButton', {'menu_button': {'type': 'web_app', 'text': config['name'][:32], 'web_app': {'url': config['miniAppUrl']}}})


def token_from_environment():
    directory = os.environ.get('CREDENTIALS_DIRECTORY')
    token = (Path(directory) / 'bot-token').read_text(encoding='utf-8-sig').strip() if directory else os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    if not re.fullmatch(r'\d+:[A-Za-z0-9_-]+', token):
        raise ValueError('Configure TELEGRAM_BOT_TOKEN or systemd bot-token credential')
    return token


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    config = load_config(args.config or os.environ.get('SHOP_CONFIG'))
    if args.check:
        for language in ('ru', 'en'):
            render_message('start', language, config)
        print('Configuration and RU/EN message templates validated. No Telegram requests made.')
        return
    os.umask(0o077)
    api = Telegram(token_from_environment())
    api.call('getMe')
    if api.call('getWebhookInfo').get('url'):
        raise RuntimeError('Webhook is active. Polling refused; no webhook was deleted.')
    store = Store(os.environ.get('TELEGRAM_STATE_PATH', '/var/lib/mercenta-telegram/bot.sqlite3'))
    register(api, config)
    running = True

    def stop(*_):
        nonlocal running
        running = False

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    logging.info('Polling ready; SQLite preferences enabled')
    offset = store.offset()
    backoff = 4
    while running:
        try:
            if os.environ.get('TELEGRAM_ADMIN_ID', '').isdigit():
                from support import flush_outbox
                flush_outbox(api, store, limit=10)
            updates = api.call('getUpdates', {'offset': offset, 'timeout': 25, 'allowed_updates': ['message', 'callback_query']})
            for update in updates:
                if not running:
                    break
                try:
                    handle_update(update, api, store, config)
                except TelegramError as error:
                    if '(403)' not in str(error):
                        raise
                    logging.info('Recipient unavailable; update skipped without logging user data')
                offset = update['update_id'] + 1
                store.advance(offset)
            backoff = 4
        except Exception:
            logging.warning('Polling or delivery failed; retrying without logging request data')
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)
    store.db.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    try:
        main()
    except Exception:
        logging.error('Bot startup failed; check runtime, configuration and connectivity')
        raise SystemExit(1)
