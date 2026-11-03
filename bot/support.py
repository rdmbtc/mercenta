"""Private Telegram support, independent of polling and payment integrations.

Call handle_support before the storefront handler. Pass the environment-derived
admin ID explicitly (None disables admin access). Call flush_outbox periodically
as well as on updates to retry delivery while idle. Delivery is at-least-once:
a crash after Telegram accepts a send can repeat a notification, never a record.
The pause flag applies only to a bot storefront that checks storefront_paused;
it does not disable the web app, checkout, or any external service.
Optional config['support_metadata_provider'] is a trusted local callable taking
one customer ID (or None for the overview) and returning plain-text metadata.
"""

import json
import re
import time

MAX_TEXT = 2000
PAGE_SIZE = 5
COMPOSE_TTL = 900
RATE_WINDOW = 60
RATE_MAX = 5


def _schema(db):
    statements = (
        'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, updated_at REAL NOT NULL)',
        "CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('open','closed')), created_at REAL NOT NULL, updated_at REAL NOT NULL)",
        'CREATE TABLE IF NOT EXISTS ticket_messages (id INTEGER PRIMARY KEY, ticket_id INTEGER NOT NULL, actor_id INTEGER NOT NULL, update_id INTEGER NOT NULL UNIQUE, text TEXT NOT NULL, created_at REAL NOT NULL)',
        'CREATE TABLE IF NOT EXISTS compose_states (actor_id INTEGER PRIMARY KEY, action TEXT NOT NULL, ticket_id INTEGER, expires_at REAL NOT NULL)',
        'CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, actor_id INTEGER NOT NULL, action TEXT NOT NULL, ticket_id INTEGER, update_id INTEGER NOT NULL, created_at REAL NOT NULL)',
        'CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY, payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at REAL)',
        'CREATE TABLE IF NOT EXISTS support_updates (update_id INTEGER PRIMARY KEY, created_at REAL NOT NULL)',
        'CREATE TABLE IF NOT EXISTS support_flags (name TEXT PRIMARY KEY, value INTEGER NOT NULL)',
        'CREATE TABLE IF NOT EXISTS support_drafts (actor_id INTEGER PRIMARY KEY, token INTEGER NOT NULL, text TEXT NOT NULL)',
        'CREATE INDEX IF NOT EXISTS support_ticket_owner ON tickets(owner_id, status, id)',
        'CREATE INDEX IF NOT EXISTS support_message_ticket ON ticket_messages(ticket_id, id)',
        'CREATE INDEX IF NOT EXISTS support_message_rate ON ticket_messages(actor_id, created_at)',
        'CREATE INDEX IF NOT EXISTS support_outbox_pending ON outbox(sent_at, id)',
    )
    for statement in statements:
        db.execute(statement)


def _admin_id(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, str) and re.fullmatch(r'[1-9][0-9]{0,18}', value):
        return int(value)
    return None


def register_customer(store, user):
    """Register a Telegram actor without sending or scheduling notifications.

    Caller must supply the authenticated Telegram `from` object, not callback
    parameters. This helper deliberately does not initiate support composition.
    """
    actor = user.get('id') if isinstance(user, dict) else None
    if type(actor) is not int or not 0 < actor <= 9223372036854775807:
        return False
    with store.db:
        _schema(store.db)
        name = str(user.get('first_name') or user.get('username') or actor)[:100]
        store.db.execute('INSERT OR REPLACE INTO users VALUES (?,?,?)', (actor, name, time.time()))
    return True


def _translate(db, actor, text):
    exists = db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='preferences'").fetchone()
    preference = db.execute('SELECT language FROM preferences WHERE user_id=?', (actor,)).fetchone() if exists else None
    if not preference or preference[0] != 'ru':
        return text
    exact = {
        'Composition cancelled.': 'Ввод сообщения отменён.',
        'Send a text question. /cancel to stop.': 'Отправьте вопрос текстом. Для отмены: /cancel.',
        'Ticket actions': 'Действия с обращением',
        'Ticket unavailable or action not permitted.': 'Обращение недоступно или действие запрещено.',
        'Action unavailable.': 'Действие недоступно.',
        'Composition expired. Use /support or select Reply again.': 'Время ввода истекло. Используйте /support или снова нажмите «Ответить».',
        'Message limit reached. Try again in one minute.': 'Лимит сообщений. Повторите через минуту.',
        'Ticket unavailable or closed.': 'Обращение недоступно или закрыто.',
        'Invalid composition. Use /cancel.': 'Недопустимое состояние ввода. Используйте /cancel.',
        'Reply': 'Ответить', 'Close': 'Закрыть', 'View ticket': 'Открыть обращение',
        'Previous': 'Назад', 'Next': 'Далее', 'Newer': 'Новее', 'Older': 'Старее',
        'New ticket': 'Новое обращение', 'Open': 'Открытые', 'Closed': 'Закрытые',
    }
    if text in exact:
        return exact[text]
    replacements = (
        ('Send your question as text (1–', 'Отправьте вопрос текстом (1–'),
        (' characters). /cancel to stop.', ' символов). Для отмены: /cancel.'),
        ('Text only, 1–', 'Только текст, 1–'), (' characters. Use /cancel to stop.', ' символов. Для отмены: /cancel.'),
        ('Reply to ticket #', 'Ответьте на обращение №'), (' with text. /cancel to stop.', ' текстом. Для отмены: /cancel.'),
        ('Message saved in ticket #', 'Сообщение сохранено в обращении №'),
        ('Open tickets', 'Открытые обращения'), ('Closed tickets', 'Закрытые обращения'),
        (' — page ', ' — страница '), ('\nNo tickets.', '\nОбращений нет.'),
        ('Customer: ', 'Клиент: '), ('Support: ', 'Поддержка: '), ('Ticket #', 'Обращение №'),
        (' — open', ' — открыто'), (' — closed', ' — закрыто'),
    )
    for source, target in replacements:
        text = text.replace(source, target)
    return re.sub(r'^(Обращение №\d+) (closed|open)\.$', lambda m: m[1] + (' закрыто.' if m[2] == 'closed' else ' открыто.'), text)


def _send(db, actor, text, buttons=()):
    # Translate only interface text; ticket body content is never rewritten.
    if '\n' in text and re.match(r'^Ticket #\d+\n', text):
        heading, body = text.split('\n', 1)
        text = _translate(db, actor, heading) + '\n' + body
    elif text.startswith(('Customer: ', 'Support: ')):
        heading, body = text.split(': ', 1)
        text = _translate(db, actor, heading + ': ') + body
    else:
        text = _translate(db, actor, text)
    payload = {'chat_id': actor, 'text': text[:4000]}
    if buttons:
        payload['reply_markup'] = {'inline_keyboard': [
            [{'text': _translate(db, actor, label), 'callback_data': data} for label, data in row]
            for row in buttons
        ]}
    db.execute('INSERT INTO outbox(payload) VALUES (?)', (json.dumps(payload),))


def flush_outbox(api, store, limit=25):
    """Retry pending notifications; failed recipients do not block other sends."""
    db = store.db
    with db:
        _schema(db)
    rows = db.execute('SELECT id,payload FROM outbox WHERE sent_at IS NULL ORDER BY attempts,id LIMIT ?',
                      (max(1, min(int(limit), 100)),)).fetchall()
    for key, payload in rows:
        try:
            result = api.call('sendMessage', json.loads(payload))
            if result is False or (isinstance(result, dict) and result.get('ok') is False):
                raise RuntimeError('Delivery rejected')
        except Exception:
            with db:
                db.execute('UPDATE outbox SET attempts=attempts+1 WHERE id=?', (key,))
        else:
            with db:
                db.execute('UPDATE outbox SET attempts=attempts+1,sent_at=? WHERE id=?', (time.time(), key))


def storefront_paused(store):
    with store.db:
        _schema(store.db)
    row = store.db.execute("SELECT value FROM support_flags WHERE name='storefront_paused'").fetchone()
    return bool(row and row[0])


def _state(db, actor, action, ticket=None):
    db.execute('INSERT OR REPLACE INTO compose_states VALUES (?,?,?,?)',
               (actor, action, ticket, time.time() + COMPOSE_TTL))


def _ticket(db, key, actor, admin):
    # Keep ownership in SQL, including all reply and mutation paths.
    return db.execute('SELECT id,owner_id,status FROM tickets WHERE id=? AND (?=1 OR owner_id=?)',
                      (key, int(admin), actor)).fetchone()


def _audit(db, actor, action, ticket, update_id):
    db.execute('INSERT INTO audit(actor_id,action,ticket_id,update_id,created_at) VALUES (?,?,?,?,?)',
               (actor, action, ticket, update_id, time.time()))


def _panel(db, actor):
    paused = db.execute("SELECT value FROM support_flags WHERE name='storefront_paused'").fetchone()
    _send(db, actor, 'Private admin. Storefront flag is bot-only; external checkout is unaffected.', [
        [('Open tickets', 'adm:list:open:0'), ('Closed tickets', 'adm:list:closed:0')],
        [('Customers', 'adm:customers:0'), ('Orders', 'adm:orders')],
        [('Resume bot storefront' if paused and paused[0] else 'Pause bot storefront',
          'adm:pause:0' if paused and paused[0] else 'adm:pause:1')],
    ])


def _page(value):
    return min(int(value), 1000000) if re.fullmatch(r'[0-9]{1,7}', value) else None


def _list(db, actor, admin, status, page):
    rows = db.execute('SELECT id,owner_id FROM tickets WHERE status=? AND (?=1 OR owner_id=?) ORDER BY id DESC LIMIT ? OFFSET ?',
                      (status, int(admin), actor, PAGE_SIZE + 1, page * PAGE_SIZE)).fetchall()
    prefix = 'adm' if admin else 'sup'
    buttons = [[(f'Ticket #{key}' + (f' — customer {owner}' if admin else ''), f'{prefix}:view:{key}:0')]
               for key, owner in rows[:PAGE_SIZE]]
    nav = []
    if page:
        nav.append(('Previous', f'{prefix}:list:{status}:{page - 1}'))
    if len(rows) > PAGE_SIZE:
        nav.append(('Next', f'{prefix}:list:{status}:{page + 1}'))
    if nav:
        buttons.append(nav)
    if not admin:
        buttons.append([('New ticket', 'sup:new'), ('Open', 'sup:list:open:0'), ('Closed', 'sup:list:closed:0')])
    _send(db, actor, f'{status.title()} tickets — page {page + 1}' + ('' if rows else '\nNo tickets.'), buttons)


def _view(db, actor, admin, ticket, page):
    key, owner, status = ticket
    rows = db.execute('SELECT actor_id,text FROM ticket_messages WHERE ticket_id=? ORDER BY id DESC LIMIT ? OFFSET ?',
                      (key, PAGE_SIZE + 1, page * PAGE_SIZE)).fetchall()
    prefix = 'adm' if admin else 'sup'
    # One bounded Telegram message per record, never HTML-interpreted.
    _send(db, actor, f'Ticket #{key} — {status} — page {page + 1}')
    for sender, text in reversed(rows[:PAGE_SIZE]):
        _send(db, actor, f'{"Customer" if sender == owner else "Support"}: {text}')
    buttons = []
    if status == 'open':
        buttons.append([('Reply', f'{prefix}:reply:{key}'), ('Close', f'{prefix}:close:{key}')])
    elif admin:
        buttons.append([('Reopen', f'adm:reopen:{key}')])
    nav = []
    if page:
        nav.append(('Newer', f'{prefix}:view:{key}:{page - 1}'))
    if len(rows) > PAGE_SIZE:
        nav.append(('Older', f'{prefix}:view:{key}:{page + 1}'))
    if nav:
        buttons.append(nav)
    _send(db, actor, 'Ticket actions', buttons)


def _dispatch(db, actor, admin, admin_id, update_id, text, data, config, attachment):
    if data.startswith('adm:') or text == '/admin':
        if not admin:
            _audit(db, actor, 'admin_denied', None, update_id)
            _send(db, actor, 'Not authorized.')
            return
    if text == '/cancel':
        db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
        db.execute('DELETE FROM support_drafts WHERE actor_id=?', (actor,))
        _send(db, actor, 'Composition cancelled.')
        return
    if text == '/admin':
        db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
        _panel(db, actor)
        return
    if text in ('/support', '/tickets'):
        db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
        if text == '/support':
            _state(db, actor, 'new')
            _send(db, actor, f'Send your question as text (1–{MAX_TEXT} characters). /cancel to stop.')
        else:
            _list(db, actor, False, 'open', 0)
        return
    if data:
        parts = data.split(':')
        is_admin_action = parts[0] == 'adm'
        action = parts[1] if len(parts) > 1 else ''
        if data == 'sup:new':
            _state(db, actor, 'new')
            _send(db, actor, 'Send a text question. /cancel to stop.')
            return
        if len(parts) == 3 and action == 'confirm_direct' and is_admin_action and re.fullmatch(r'[0-9]{1,19}', parts[2]):
            pending = db.execute('SELECT s.ticket_id,s.expires_at,d.text FROM compose_states s JOIN support_drafts d ON d.actor_id=s.actor_id WHERE s.actor_id=? AND s.action=\'direct_confirm\' AND d.token=?', (actor, int(parts[2]))).fetchone()
            if pending and pending[1] > time.time():
                customer, _, draft = pending
                _state(db, actor, 'direct', customer)
                _dispatch(db, actor, admin, admin_id, update_id, draft, '', config, False)
                db.execute('DELETE FROM support_drafts WHERE actor_id=?', (actor,))
            else:
                _send(db, actor, 'Direct-message preview expired. Select the customer again.')
            return
        if data == 'adm:cancel_direct':
            db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
            db.execute('DELETE FROM support_drafts WHERE actor_id=?', (actor,))
            _send(db, actor, 'Composition cancelled.')
            return
        if data == 'adm:orders':
            provider = config.get('support_metadata_provider')
            try:
                if not callable(provider):
                    from orders import read_orders
                    provider = read_orders
                value = provider(None)
                if isinstance(value, list):
                    fields = ('tx_hash', 'order_id', 'wallet', 'product_name', 'option_name', 'amount_usdc', 'quantity', 'status', 'created_at')
                    safe = [{k: row[k] for k in fields if k in row and isinstance(row[k], (str, int, float, bool, type(None)))}
                            for row in value[:25] if isinstance(row, dict)]
                    metadata = json.dumps(safe, ensure_ascii=True)[:3000]
                elif isinstance(value, str):
                    metadata = value[:3000]
                else:
                    raise RuntimeError('Invalid metadata')
                _send(db, actor, 'Authoritative Mainnet order metadata (not linked to Telegram customer identities):\n' + metadata)
            except Exception:
                _send(db, actor, 'Orders: authoritative integration unavailable until bridge connected. No payment or order history is inferred.')
            return
        if len(parts) == 3 and action == 'pause' and is_admin_action and parts[2] in ('0', '1'):
            db.execute("INSERT OR REPLACE INTO support_flags VALUES ('storefront_paused',?)", (int(parts[2]),))
            _audit(db, actor, 'bot_pause_' + parts[2], None, update_id)
            _panel(db, actor)
            return
        if len(parts) == 3 and action == 'customers' and is_admin_action:
            page = _page(parts[2])
            if page is not None:
                rows = db.execute('SELECT id,name FROM users WHERE id!=? ORDER BY id LIMIT ? OFFSET ?',
                                  (admin_id, PAGE_SIZE + 1, page * PAGE_SIZE)).fetchall()
                buttons = [[(f'{name[:40]} ({key})', f'adm:customer:{key}')] for key, name in rows[:PAGE_SIZE]]
                nav = []
                if page:
                    nav.append(('Previous', f'adm:customers:{page - 1}'))
                if len(rows) > PAGE_SIZE:
                    nav.append(('Next', f'adm:customers:{page + 1}'))
                if nav:
                    buttons.append(nav)
                _send(db, actor, f'Customers — page {page + 1}', buttons)
                return
        if len(parts) == 4 and action == 'list' and parts[2] in ('open', 'closed'):
            page = _page(parts[3])
            if page is not None:
                _list(db, actor, is_admin_action, parts[2], page)
                return
        if len(parts) == 3 and action == 'customer' and is_admin_action and re.fullmatch(r'[1-9][0-9]{0,17}', parts[2]):
            customer = int(parts[2])
            if customer != admin_id and db.execute('SELECT 1 FROM users WHERE id=?', (customer,)).fetchone():
                _state(db, actor, 'direct_preview', customer)
                _send(db, actor, f'Compose text for customer {customer}. You will preview and confirm before sending. /cancel to stop.')
                return
        if action in ('view', 'reply', 'close', 'reopen') and len(parts) == (4 if action == 'view' else 3) and re.fullmatch(r'[1-9][0-9]{0,17}', parts[2]):
            key = int(parts[2])
            ticket = _ticket(db, key, actor, is_admin_action)
            if ticket:
                if action == 'view' and _page(parts[3]) is not None:
                    _view(db, actor, is_admin_action, ticket, _page(parts[3]))
                    return
                if action == 'reply' and ticket[2] == 'open':
                    _state(db, actor, 'reply_admin' if is_admin_action else 'reply', key)
                    _send(db, actor, f'Reply to ticket #{key} with text. /cancel to stop.')
                    return
                if action in ('close', 'reopen') and (action != 'reopen' or is_admin_action):
                    status = 'closed' if action == 'close' else 'open'
                    db.execute('UPDATE tickets SET status=?,updated_at=? WHERE id=? AND (?=1 OR owner_id=?)',
                               (status, time.time(), key, int(is_admin_action), actor))
                    db.execute('DELETE FROM compose_states WHERE ticket_id=? AND action IN (\'reply\',\'reply_admin\')', (key,))
                    _audit(db, actor, action, key, update_id)
                    _send(db, actor, f'Ticket #{key} {status}.')
                    recipient = ticket[1] if is_admin_action else admin_id
                    if recipient and recipient != actor:
                        _send(db, recipient, f'Ticket #{key} {status}.')
                    return
            _send(db, actor, 'Ticket unavailable or action not permitted.')
            return
        _send(db, actor, 'Action unavailable.')
        return
    state = db.execute('SELECT action,ticket_id,expires_at FROM compose_states WHERE actor_id=?', (actor,)).fetchone()
    if not state:
        return
    action, key, expiry = state
    if expiry <= time.time():
        db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
        _send(db, actor, 'Composition expired. Use /support or select Reply again.')
        return
    if attachment or not text or len(text) > MAX_TEXT or text.startswith('/'):
        _send(db, actor, f'Text only, 1–{MAX_TEXT} characters. Use /cancel to stop.')
        return
    if action == 'direct_preview' and admin:
        db.execute('INSERT OR REPLACE INTO support_drafts VALUES (?,?,?)', (actor, update_id, text))
        _state(db, actor, 'direct_confirm', key)
        _send(db, actor, f'Preview to customer {key}:\n{text}\n\nConfirm to send as a new ticket.', [[('Confirm send', f'adm:confirm_direct:{update_id}'), ('Cancel', 'adm:cancel_direct')]])
        return
    if action == 'direct_confirm':
        _send(db, actor, 'Use Confirm send, or /cancel. No message has been sent.')
        return
    count = db.execute('SELECT COUNT(*) FROM ticket_messages WHERE actor_id=? AND created_at>?',
                       (actor, time.time() - RATE_WINDOW)).fetchone()[0]
    if count >= RATE_MAX:
        _send(db, actor, 'Message limit reached. Try again in one minute.')
        return
    now = time.time()
    if action in ('new', 'direct'):
        if action == 'direct' and (not admin or not db.execute('SELECT 1 FROM users WHERE id=?', (key,)).fetchone()):
            _send(db, actor, 'Not authorized.')
            return
        owner = key if action == 'direct' else actor
        key = db.execute("INSERT INTO tickets(owner_id,status,created_at,updated_at) VALUES (?,'open',?,?)", (owner, now, now)).lastrowid
    elif action in ('reply', 'reply_admin'):
        ticket = _ticket(db, key, actor, action == 'reply_admin' and admin)
        if not ticket or ticket[2] != 'open' or (action == 'reply_admin' and not admin):
            db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
            _send(db, actor, 'Ticket unavailable or closed.')
            return
        owner = ticket[1]
    else:
        _send(db, actor, 'Invalid composition. Use /cancel.')
        return
    db.execute('INSERT INTO ticket_messages(ticket_id,actor_id,update_id,text,created_at) VALUES (?,?,?,?,?)', (key, actor, update_id, text, now))
    db.execute('UPDATE tickets SET updated_at=? WHERE id=?', (now, key))
    db.execute('DELETE FROM compose_states WHERE actor_id=?', (actor,))
    _audit(db, actor, 'message', key, update_id)
    recipient = owner if action in ('direct', 'reply_admin') else admin_id
    if recipient and recipient != actor:
        prefix = 'adm' if recipient == admin_id else 'sup'
        _send(db, recipient, f'Ticket #{key}\n{text}', [[('View ticket', f'{prefix}:view:{key}:0')]])
    _send(db, actor, f'Message saved in ticket #{key}.', [[('View ticket', f'{"adm" if admin else "sup"}:view:{key}:0')]])


def handle_support(update, api, store, config, admin_id):
    """Return True for support-owned updates, including denied/invalid requests."""
    if not isinstance(update, dict):
        return False
    callback = update.get('callback_query') or {}
    message = callback.get('message') if callback else update.get('message')
    message = message or {}
    user = callback.get('from') if callback else message.get('from')
    user = user or {}
    actor = user.get('id')
    chat = message.get('chat') or {}
    data = callback.get('data', '')
    raw = message.get('text', '') if not callback else ''
    raw = raw if isinstance(raw, str) else ''
    command = re.match(r'^/(admin|support|tickets|cancel)(?:@[A-Za-z0-9_]+)?(?:\s|$)', raw, re.I)
    text = '/' + command[1].lower() if command else raw.strip()
    owned = bool(command or (isinstance(data, str) and data.startswith(('sup:', 'adm:'))))
    if type(actor) is not int or actor <= 0 or chat.get('type') != 'private' or chat.get('id') != actor:
        return owned
    if callback and not owned:
        return False
    db = store.db
    with db:
        _schema(db)
    state = db.execute('SELECT 1 FROM compose_states WHERE actor_id=?', (actor,)).fetchone()
    update_id = update.get('update_id')
    valid_update_id = type(update_id) is int and 0 <= update_id <= 9223372036854775807
    duplicate = valid_update_id and db.execute('SELECT 1 FROM support_updates WHERE update_id=?', (update_id,)).fetchone()
    if not owned and not state and not duplicate:
        flush_outbox(api, store)
        return False
    if type(update_id) is not int or not 0 <= update_id <= 9223372036854775807:
        return True
    admin_id = _admin_id(admin_id)
    admin = admin_id is not None and actor == admin_id
    # BEGIN IMMEDIATE serializes dedup, ownership checks, state, messages and outbox.
    with db:
        db.execute('BEGIN IMMEDIATE')
        fresh = db.execute('INSERT OR IGNORE INTO support_updates VALUES (?,?)', (update_id, time.time())).rowcount
        if fresh:
            name = str(user.get('first_name') or user.get('username') or actor)[:100]
            db.execute('INSERT OR REPLACE INTO users VALUES (?,?,?)', (actor, name, time.time()))
            attachment = any(k in message for k in ('photo', 'document', 'video', 'audio', 'voice', 'sticker', 'animation', 'video_note', 'contact', 'location', 'poll', 'paid_media', 'forward_origin'))
            _dispatch(db, actor, admin, admin_id, update_id, text, data if callback else '', config or {}, attachment)
    if callback and callback.get('id'):
        try:
            api.call('answerCallbackQuery', {'callback_query_id': callback['id']})
        except Exception:
            pass
    flush_outbox(api, store)
    return True
