from enum import Enum


class BalanceCategory(str, Enum):
    FUNDING = "funding"
    REFUND = "refund"
    WITHDRAW = "withdraw"
    SHOP = "shop"
    DIRECT_TOP_UP = "direct-top-up"
