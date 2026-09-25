package enum

// BalanceCategory represents a balance-transaction category.
type BalanceCategory string

const (
	BalanceFunding     BalanceCategory = "funding"
	BalanceRefund      BalanceCategory = "refund"
	BalanceWithdraw    BalanceCategory = "withdraw"
	BalanceShop        BalanceCategory = "shop"
	BalanceDirectTopUp BalanceCategory = "direct-top-up"
)
