package enum

// OrdersType selects the order variant when creating a purchase.
type OrdersType string

const (
	OrdersShop OrdersType = "shop"
	OrdersDTU  OrdersType = "dtu"
)
