from enum import Enum


class FundingMethodCode(str, Enum):
    USDT_TRC20 = "USDT_TRC20"
    USDT_BEP20 = "USDT_BEP20"
    USDT_TON = "USDT_TON"
    USDT_BYBIT = "USDT_BYBIT"


class FundingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMING = "confirming"
    SUCCESS = "success"
    FAIL = "fail"
    EXPIRED = "expired"
