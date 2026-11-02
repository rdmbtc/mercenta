import json
import tempfile
import unittest
from pathlib import Path
import bot as polling


class FakeApi:
    def __init__(self):
        self.calls = []

    def call(self, method, payload):
        self.calls.append((method, payload))
        return True


class BotTests(unittest.TestCase):
    def test_brand_is_escaped(self):
        config = dict(polling.DEFAULT_CONFIG, name='<script>&store')
        rendered = polling.render_message('start', 'ru', config)
        self.assertIn('&lt;script&gt;&amp;store', rendered['text'])
        self.assertNotIn('<script>', rendered['text'])
        self.assertEqual(rendered['parse_mode'], 'HTML')

    def test_compact_home_and_section_links(self):
        for language in ('ru', 'en'):
            rendered = polling.render_message('start', language, polling.DEFAULT_CONFIG)
            self.assertEqual([len(row) for row in rendered['reply_markup']['inline_keyboard']], [1, 2, 2])
            wallet = polling.render_message('wallet', language, polling.DEFAULT_CONFIG)
            self.assertIn('section=wallet', wallet['reply_markup']['inline_keyboard'][0][0]['web_app']['url'])
            group = polling.render_message('wallet', language, polling.DEFAULT_CONFIG, False)
            self.assertIn('url', group['reply_markup']['inline_keyboard'][0][0])

    def test_fake_payment_callbacks_never_deliver_codes(self):
        for command in ('buy_steam', 'pay_crypto_steam', 'pay_stars_steam', 'setmarkup'):
            self.assertEqual(polling.screen_name(command), 'payment_unavailable')
            rendered = polling.render_message(command, 'en', polling.DEFAULT_CONFIG)
            self.assertIn('No funds charged', rendered['text'])
            self.assertNotIn('Payment Received', rendered['text'])

    def test_preferences_and_offset_are_durable(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'state.sqlite3'
            store = polling.Store(path)
            store.set_language(7, 'en')
            store.advance(42)
            store.db.close()
            restored = polling.Store(path)
            self.assertEqual(restored.language({'id': 7, 'language_code': 'ru'}), 'en')
            self.assertEqual(restored.offset(), 42)
            restored.db.close()

    def test_callback_updates_menu(self):
        with tempfile.TemporaryDirectory() as folder:
            store = polling.Store(Path(folder) / 'state.sqlite3')
            api = FakeApi()
            polling.handle_update({'callback_query': {'id': 'q', 'data': 'lang_ru', 'from': {'id': 7}, 'message': {'message_id': 5, 'chat': {'id': 7, 'type': 'private'}}}}, api, store, polling.DEFAULT_CONFIG)
            self.assertEqual([method for method, _ in api.calls], ['answerCallbackQuery', 'editMessageText'])
            self.assertEqual(store.language({'id': 7}), 'ru')
            store.db.close()

    def test_config_rejects_unsafe_urls(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'config.json'
            for url in ('http://example.com', 'https://user:pass@example.com', 'javascript:alert(1)'):
                path.write_text(json.dumps(dict(polling.DEFAULT_CONFIG, miniAppUrl=url)), encoding='utf-8')
                with self.assertRaises(ValueError):
                    polling.load_config(path)


if __name__ == '__main__':
    unittest.main()
