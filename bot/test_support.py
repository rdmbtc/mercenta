import sqlite3
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import support


class Api:
    def __init__(self):
        self.calls = []
        self.fail = False

    def call(self, method, payload):
        if self.fail and method == 'sendMessage':
            raise RuntimeError('offline')
        self.calls.append((method, payload))
        return True


class SupportTests(unittest.TestCase):
    def setUp(self):
        self.store = SimpleNamespace(db=sqlite3.connect(':memory:'))
        self.api = Api()
        self.seq = 0
        self.config = {}

    def tearDown(self):
        self.store.db.close()

    def send(self, actor, text='', data=None, **extra):
        self.seq += 1
        message = {'chat': {'id': actor, 'type': 'private'}, 'from': {'id': actor}, 'text': text, **extra}
        update = {'update_id': self.seq, 'message': message}
        if data is not None:
            update = {'update_id': self.seq, 'callback_query': {'id': str(self.seq), 'from': {'id': actor}, 'message': message, 'data': data}}
        self.last = update
        return support.handle_support(update, self.api, self.store, self.config, '99')

    def rows(self, sql, params=()):
        return self.store.db.execute(sql, params).fetchall()

    def ticket(self, actor, text='question'):
        self.send(actor, '/support')
        self.send(actor, text)
        return self.rows('SELECT MAX(id) FROM tickets')[0][0]

    def test_private_boundary_and_fallthrough(self):
        self.assertFalse(self.send(1, '/start'))
        self.assertFalse(self.send(1, data='cmd_start'))
        for chat in ({'id': -5, 'type': 'group'}, {'id': 2, 'type': 'private'}, {'id': 1, 'type': 'group'}):
            self.assertTrue(support.handle_support({'update_id': 10, 'message': {'chat': chat, 'from': {'id': 1}, 'text': '/support'}}, self.api, self.store, {}, 99))
        self.assertEqual(self.rows('SELECT * FROM users'), [])

    def test_every_admin_action_requires_privilege(self):
        self.ticket(1)
        for data in ('adm:list:open:0', 'adm:list:closed:0', 'adm:customers:0', 'adm:customer:1', 'adm:orders', 'adm:pause:1', 'adm:view:1:0', 'adm:reply:1', 'adm:close:1', 'adm:reopen:1'):
            self.send(2, data=data)
            self.assertEqual(self.api.calls[-1][1]['text'], 'Not authorized.')
        self.send(2, '/admin')
        self.assertEqual(self.rows('SELECT status FROM tickets'), [('open',)])
        self.assertFalse(support.storefront_paused(self.store))
        self.assertEqual(self.rows('SELECT * FROM compose_states'), [])

    def test_customer_cannot_read_reply_close_or_reopen_another_ticket(self):
        key = self.ticket(1, 'private A')
        self.ticket(2, 'private B')
        for action in ('view:1:0', 'reply:1', 'close:1', 'reopen:1'):
            before = len(self.api.calls)
            self.send(2, data='sup:' + action)
            texts = [p.get('text', '') for _, p in self.api.calls[before:]]
            self.assertFalse(any('private A' in t for t in texts))
        self.assertEqual(self.rows('SELECT status FROM tickets WHERE id=?', (key,)), [('open',)])
        self.assertEqual(self.rows('SELECT * FROM compose_states'), [])
        self.send(1, data='sup:close:1')
        self.assertEqual(self.rows('SELECT status FROM tickets WHERE id=1'), [('closed',)])

    def test_selected_ticket_and_per_actor_routing(self):
        a = self.ticket(1)
        b = self.ticket(2)
        self.send(99, data=f'adm:reply:{a}')
        self.send(2, data=f'sup:reply:{b}')
        self.send(99, 'reply for A')
        self.send(2, 'reply from B')
        self.assertEqual(self.rows('SELECT ticket_id,actor_id,text FROM ticket_messages ORDER BY id DESC LIMIT 2'), [(b, 2, 'reply from B'), (a, 99, 'reply for A')])
        delivered = [(p['chat_id'], p['text']) for m, p in self.api.calls if m == 'sendMessage']
        self.assertIn((1, f'Ticket #{a}\nreply for A'), delivered)
        self.assertNotIn((2, f'Ticket #{a}\nreply for A'), delivered)
        self.assertIn((99, f'Ticket #{b}\nreply from B'), delivered)

    def test_close_reopen_and_state_invalidation(self):
        key = self.ticket(1)
        self.send(1, data=f'sup:reply:{key}')
        self.send(99, data=f'adm:close:{key}')
        self.assertEqual(self.rows('SELECT * FROM compose_states'), [])
        self.assertFalse(self.send(1, 'not a reply'))
        self.send(99, data=f'adm:reopen:{key}')
        self.send(1, data=f'sup:reply:{key}')
        self.send(1, 'after reopen')
        self.assertEqual(self.rows('SELECT status FROM tickets'), [('open',)])
        self.assertEqual(len(self.rows('SELECT * FROM ticket_messages')), 2)

    def test_dedup_message_and_callback_and_retry_outbox(self):
        self.send(1, '/support')
        self.api.fail = True
        self.send(1, 'durable')
        duplicate = self.last
        pending = self.rows('SELECT COUNT(*) FROM outbox WHERE sent_at IS NULL')[0][0]
        self.assertGreater(pending, 0)
        self.assertTrue(support.handle_support(duplicate, self.api, self.store, {}, 99))
        self.assertEqual(len(self.rows('SELECT * FROM ticket_messages')), 1)
        self.assertEqual(self.rows('SELECT COUNT(*) FROM outbox WHERE sent_at IS NULL')[0][0], pending)
        self.api.fail = False
        support.flush_outbox(self.api, self.store)
        self.assertEqual(self.rows('SELECT COUNT(*) FROM outbox WHERE sent_at IS NULL'), [(0,)])
        self.send(99, data='adm:close:1')
        support.handle_support(self.last, self.api, self.store, {}, 99)
        self.assertEqual(self.rows("SELECT COUNT(*) FROM audit WHERE action='close'"), [(1,)])

    def test_admin_direct_message_creates_ticket_only_for_known_customer(self):
        self.ticket(1)
        self.send(99, '/admin')
        self.send(99, data='adm:customers:0')
        self.send(99, data='adm:customer:1234')
        self.assertEqual(self.rows('SELECT * FROM compose_states'), [])
        self.send(99, data='adm:customer:1')
        self.send(99, 'direct text')
        token = self.seq
        self.assertEqual(self.rows('SELECT owner_id FROM tickets'), [(1,)])
        self.send(2, data=f'adm:confirm_direct:{token}')
        self.assertEqual(len(self.rows('SELECT * FROM tickets')), 1)
        self.send(99, data=f'adm:confirm_direct:{token}')
        self.assertEqual(self.rows('SELECT owner_id FROM tickets ORDER BY id'), [(1,), (1,)])
        self.assertEqual(self.rows('SELECT actor_id,text FROM ticket_messages ORDER BY id DESC LIMIT 1'), [(99, 'direct text')])

    def test_expiry_cancel_attachments_and_bounds(self):
        self.send(1, '/support')
        for text, extras in [('caption', {'photo': [{}]}), ('x' * 2001, {}), ('', {}), ('hello', {'voice': {}})]:
            self.send(1, text, **extras)
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        self.store.db.execute('UPDATE compose_states SET expires_at=0')
        self.store.db.commit()
        self.send(1, 'expired')
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        self.send(1, '/support')
        self.send(1, '/cancel')
        self.assertFalse(self.send(1, 'cancelled'))

    def test_rate_limit_and_pagination(self):
        with patch.object(support, 'RATE_MAX', 10):
            for _ in range(7):
                self.ticket(1)
        self.send(1, '/tickets')
        self.assertTrue(any(b['callback_data'] == 'sup:list:open:1' for row in self.api.calls[-1][1]['reply_markup']['inline_keyboard'] for b in row))
        self.send(1, data='sup:list:open:1')
        self.assertIn('page 2', self.api.calls[-1][1]['text'])
        self.send(1, '/support')
        self.send(1, 'limited')
        self.assertEqual(len(self.rows('SELECT * FROM tickets')), 7)
        self.assertIn('limit', self.api.calls[-1][1]['text'])

    def test_pause_orders_provider_and_no_admin_id_default(self):
        self.send(99, data='adm:pause:1')
        self.assertTrue(support.storefront_paused(self.store))
        self.send(99, data='adm:pause:0')
        self.assertFalse(support.storefront_paused(self.store))
        with patch.dict('sys.modules', {'orders': SimpleNamespace(read_orders=lambda wallet=None: (_ for _ in ()).throw(RuntimeError('unconfigured')))}):
            self.send(99, data='adm:orders')
        self.assertIn('authoritative integration unavailable', self.api.calls[-1][1]['text'])
        self.config['support_metadata_provider'] = lambda customer: 'local metadata'
        self.send(99, data='adm:orders')
        self.assertIn('local metadata', self.api.calls[-1][1]['text'])
        self.config['support_metadata_provider'] = lambda customer: [{'order_id': '<plain>', 'activation_code': 'secret-code'}]
        self.send(99, data='adm:orders')
        self.assertIn('<plain>', self.api.calls[-1][1]['text'])
        self.assertNotIn('secret-code', self.api.calls[-1][1]['text'])
        self.assertNotIn('parse_mode', self.api.calls[-1][1])
        for admin_id in (None, '', True, 'invalid'):
            self.seq += 1
            support.handle_support({'update_id': self.seq, 'message': {'chat': {'id': 99, 'type': 'private'}, 'from': {'id': 99}, 'text': '/admin'}}, self.api, self.store, {}, admin_id)
            self.assertEqual(self.api.calls[-1][1]['text'], 'Not authorized.')

    def test_registration_no_notifications_and_russian_preferences(self):
        self.assertTrue(support.register_customer(self.store, {'id': 1, 'first_name': 'Customer'}))
        self.assertFalse(support.register_customer(self.store, {'id': True}))
        self.assertEqual(self.api.calls, [])
        self.assertEqual(self.rows('SELECT * FROM outbox'), [])
        self.store.db.execute('CREATE TABLE preferences(user_id INTEGER PRIMARY KEY,language TEXT)')
        self.store.db.execute("INSERT INTO preferences VALUES (1,'ru')")
        self.store.db.commit()
        self.send(1, '/support')
        self.assertIn('Отправьте вопрос', self.api.calls[-1][1]['text'])
        self.send(1, 'Customer: original text')
        self.assertIn('Сообщение сохранено', self.api.calls[-1][1]['text'])
        self.assertEqual(self.rows('SELECT text FROM ticket_messages'), [('Customer: original text',)])
        self.send(1, '/tickets')
        self.assertIn('Открытые обращения', self.api.calls[-1][1]['text'])
        self.send(1, '/cancel')
        self.assertEqual(self.api.calls[-1][1]['text'], 'Ввод сообщения отменён.')

    def test_direct_preview_cancel_expiry_and_private_confirmation(self):
        support.register_customer(self.store, {'id': 1})
        self.send(99, data='adm:customer:1')
        self.send(99, 'draft')
        token = self.seq
        self.send(99, '/cancel')
        self.send(99, data=f'adm:confirm_direct:{token}')
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        self.send(99, data='adm:customer:1')
        self.send(99, 'draft 2')
        token = self.seq
        self.seq += 1
        group = {'update_id': self.seq, 'callback_query': {'id': 'group', 'from': {'id': 99}, 'data': f'adm:confirm_direct:{token}', 'message': {'chat': {'id': -1, 'type': 'group'}}}}
        self.assertTrue(support.handle_support(group, self.api, self.store, {}, 99))
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        self.store.db.execute('UPDATE compose_states SET expires_at=0')
        self.store.db.commit()
        self.send(99, data=f'adm:confirm_direct:{token}')
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        self.send(99, data='adm:cancel_direct')
        self.assertEqual(self.rows('SELECT * FROM compose_states'), [])

    def test_transaction_rolls_back_on_dispatch_failure(self):
        self.send(1, '/support')
        with patch.object(support, '_audit', side_effect=RuntimeError('db failure')):
            with self.assertRaises(RuntimeError):
                self.send(1, 'rollback')
        self.assertEqual(self.rows('SELECT * FROM tickets'), [])
        support.handle_support(self.last, self.api, self.store, {}, 99)
        self.assertEqual(len(self.rows('SELECT * FROM ticket_messages')), 1)


if __name__ == '__main__':
    unittest.main()
