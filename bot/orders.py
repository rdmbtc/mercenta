import json
import os
import urllib.parse
import urllib.request
from pathlib import Path


def read_orders(wallet=None, offset=0):
    endpoint = os.environ.get('TELEGRAM_ORDERS_ENDPOINT', '')
    parsed = urllib.parse.urlsplit(endpoint)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise RuntimeError('Authoritative order integration is not configured')
    directory = os.environ.get('CREDENTIALS_DIRECTORY')
    key_path = Path(directory) / 'orders-read-key' if directory else None
    key = key_path.read_text(encoding='utf-8-sig').strip() if key_path and key_path.is_file() else os.environ.get('TELEGRAM_ORDERS_READ_KEY', '')
    if len(key) < 32:
        raise RuntimeError('Authoritative order integration is not configured')
    query = {'offset': str(offset)}
    if wallet:
        query['wallet'] = wallet
    request = urllib.request.Request(endpoint + '?' + urllib.parse.urlencode(query), headers={'X-Mercenta-Orders-Read': key, 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            raw = response.read(128001)
        if len(raw) > 128000:
            raise ValueError()
        data = json.loads(raw)
        if data.get('network') != 'mainnet' or not isinstance(data.get('orders'), list) or len(data['orders']) > 25:
            raise ValueError()
        fields = ('tx_hash', 'order_id', 'wallet', 'product_name', 'option_name', 'amount_usdc', 'quantity', 'status', 'created_at')
        return [{field: row.get(field) for field in fields} for row in data['orders'] if isinstance(row, dict)]
    except Exception:
        raise RuntimeError('Authoritative order history is temporarily unavailable') from None
