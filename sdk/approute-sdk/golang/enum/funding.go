package enum

// FundingMethodCode identifies a deposit method.
type FundingMethodCode string

const (
	FundingUSDT_TRC20 FundingMethodCode = "USDT_TRC20"
	FundingUSDT_BEP20 FundingMethodCode = "USDT_BEP20"
	FundingUSDT_TON   FundingMethodCode = "USDT_TON"
	FundingUSDT_BYBIT FundingMethodCode = "USDT_BYBIT"
)

// FundingStatus represents the lifecycle status of a funding invoice.
type FundingStatus string

const (
	FundingPending    FundingStatus = "pending"
	FundingConfirming FundingStatus = "confirming"
	FundingSuccess    FundingStatus = "success"
	FundingFail       FundingStatus = "fail"
	FundingExpired    FundingStatus = "expired"
)
