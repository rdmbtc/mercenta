from enum import Enum


class ProductType(str, Enum):
    VOUCHER = "voucher"
    DIRECT_TOPUP = "direct_topup"
