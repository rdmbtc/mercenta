import os
import unittest
from unittest.mock import patch
import orders


class OrderBridgeTests(unittest.TestCase):
    def test_missing_bridge_never_returns_fake_history(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, 'not configured'):
                orders.read_orders()

    def test_unsafe_endpoints_are_rejected(self):
        for endpoint in ('http://example.com/orders', 'https://user:pass@example.com/orders', 'https://example.com/orders?token=x'):
            with patch.dict(os.environ, {'TELEGRAM_ORDERS_ENDPOINT': endpoint}, clear=True):
                with self.assertRaises(RuntimeError):
                    orders.read_orders()

    def test_metadata_projection_excludes_codes(self):
        class Response:
            def __enter__(self):
                return self
            def __exit__(self, *_):
                pass
            def read(self, _):
                return b'{"network":"mainnet","orders":[{"order_id":"order-1","status":"FULFILLED","codes":["secret"],"codes_json":"secret","private_key":"secret"}]}'
        with patch.dict(os.environ, {'TELEGRAM_ORDERS_ENDPOINT':'https://example.com/admin/order-metadata', 'TELEGRAM_ORDERS_READ_KEY':'x'*32}, clear=True):
            with patch('urllib.request.urlopen', return_value=Response()):
                result = orders.read_orders()
        self.assertEqual(result[0]['order_id'], 'order-1')
        self.assertNotIn('secret', str(result))


if __name__ == '__main__':
    unittest.main()
