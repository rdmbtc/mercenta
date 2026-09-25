package enum

// ProductType represents the type of a catalog product.
type ProductType string

const (
	ProductVoucher     ProductType = "voucher"
	ProductDirectTopup ProductType = "direct_topup"
)
