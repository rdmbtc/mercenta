package approute_test

import (
	"time"

	"github.com/approute/public-api-sdk-go/enum"
	"github.com/approute/public-api-sdk-go/model"
)

// ── Timestamps ───────────────────────────────────────────────────

var (
	fixedTime          = time.Date(2026, 3, 1, 12, 0, 0, 0, time.UTC)
	fixedCreated       = time.Date(2026, 3, 1, 10, 0, 0, 0, time.UTC)
	fixedExpires       = time.Date(2026, 3, 1, 11, 0, 0, 0, time.UTC)
	fixedProvider      = time.Date(2026, 3, 1, 8, 0, 0, 0, time.UTC)
	fixedFetched       = time.Date(2026, 3, 1, 8, 1, 0, 0, time.UTC)
	fixedVoucherExpiry = time.Date(2027, 12, 31, 23, 59, 59, 0, time.UTC)
)

// ── Accounts ─────────────────────────────────────────────────────

func newAccountActivity(opts ...func(*model.AccountActivity)) model.AccountActivity {
	a := model.AccountActivity{
		ID:        "act-1",
		Currency:  "USD",
		Amount:    -10.00,
		Operation: "purchase",
		CreatedAt: fixedTime,
	}
	for _, opt := range opts {
		opt(&a)
	}
	return a
}

func newAccount(opts ...func(*model.Account)) model.Account {
	a := model.Account{
		Currency:       "USD",
		Balance:        150.50,
		Available:      120.00,
		OverdraftLimit: 0,
		RecentActivity: []model.AccountActivity{newAccountActivity()},
	}
	for _, opt := range opts {
		opt(&a)
	}
	return a
}

func newAccountListResponse(items ...model.Account) model.AccountListResponse {
	if items == nil {
		items = []model.Account{}
	}
	return model.AccountListResponse{Items: items}
}

func newAccountTransaction(opts ...func(*model.AccountTransaction)) model.AccountTransaction {
	a := model.AccountTransaction{
		ID:            "txn-1",
		Currency:      "USD",
		TransactionID: "tid-abc",
		Category:      enum.BalanceShop,
		Balance:       140.50,
		Amount:        -10.00,
		OrderID:       "ord-123",
		Description:   strPtr("Product purchase"),
		CreatedAt:     fixedTime,
	}
	for _, opt := range opts {
		opt(&a)
	}
	return a
}

func newAccountTransactionPage(opts ...func(*model.AccountTransactionPage)) model.AccountTransactionPage {
	p := model.AccountTransactionPage{
		TotalCount: 1,
		Items:      []model.AccountTransaction{newAccountTransaction()},
	}
	for _, opt := range opts {
		opt(&p)
	}
	return p
}

// ── Products ─────────────────────────────────────────────────────

func newProductItem(opts ...func(*model.ProductItem)) model.ProductItem {
	p := model.ProductItem{
		ID:        "item-1",
		Name:      strPtr("10 USD"),
		Nominal:   10.00,
		Price:     10.50,
		Currency:  "USD",
		Available: true,
		Stock:     intPtr(100),
	}
	for _, opt := range opts {
		opt(&p)
	}
	return p
}

func newProductFieldValidation(opts ...func(*model.ProductFieldValidation)) model.ProductFieldValidation {
	v := model.ProductFieldValidation{
		Pattern: strPtr(`^\+?[0-9]{10,15}$`),
		Message: strPtr("Enter a valid phone number"),
	}
	for _, opt := range opts {
		opt(&v)
	}
	return v
}

func newProductField(opts ...func(*model.ProductField)) model.ProductField {
	v := newProductFieldValidation()
	f := model.ProductField{
		Key:        "phone",
		Type:       "text",
		Required:   true,
		Label:      strPtr("Phone Number"),
		Validation: &v,
	}
	for _, opt := range opts {
		opt(&f)
	}
	return f
}

func newProduct(opts ...func(*model.Product)) model.Product {
	p := model.Product{
		ID:              "prod-1",
		Name:            strPtr("Steam Wallet 10 USD"),
		Type:            enum.ProductVoucher,
		ImageURL:        strPtr("https://cdn.example.com/steam10.png"),
		CountryCode:     strPtr("US"),
		CategoryName:    strPtr("Gaming"),
		SubcategoryName: strPtr("Steam"),
		Items:           []model.ProductItem{newProductItem()},
		Fields:          []model.ProductField{},
	}
	for _, opt := range opts {
		opt(&p)
	}
	return p
}

func newProductListResponse(items ...model.Product) model.ProductListResponse {
	if items == nil {
		items = []model.Product{}
	}
	return model.ProductListResponse{Items: items, HasNext: false}
}

func newProductStockItem(opts ...func(*model.ProductStockItem)) model.ProductStockItem {
	s := model.ProductStockItem{
		ItemID: "item-1",
		Stock:  intPtr(100),
	}
	for _, opt := range opts {
		opt(&s)
	}
	return s
}

func newProductStockResponse(items ...model.ProductStockItem) model.ProductStockResponse {
	if items == nil {
		items = []model.ProductStockItem{}
	}
	return model.ProductStockResponse{ProductID: "prod-1", Items: items}
}

func newItemLookupRequestItem(opts ...func(*model.ItemLookupRequestItem)) model.ItemLookupRequestItem {
	r := model.ItemLookupRequestItem{
		ServiceID: "svc-1",
		ItemID:    "item-1",
	}
	for _, opt := range opts {
		opt(&r)
	}
	return r
}

func newItemLookupRow(opts ...func(*model.ItemLookupRow)) model.ItemLookupRow {
	item := newProductItem()
	r := model.ItemLookupRow{
		ServiceID: "svc-1",
		ItemID:    "item-1",
		Found:     true,
		Item:      &item,
	}
	for _, opt := range opts {
		opt(&r)
	}
	return r
}

// newItemLookupResponse builds a mixed 3-row response by default:
//   - row 0: hit on svc-1/item-1
//   - row 1: service_not_found on svc-missing/item-1
//   - row 2: item_not_found on svc-1/item-missing
//
// Same shape the backend returns for partial misses.
func newItemLookupResponse(rows ...model.ItemLookupRow) model.ItemLookupResponse {
	if rows == nil {
		rows = []model.ItemLookupRow{
			newItemLookupRow(),
			newItemLookupRow(func(r *model.ItemLookupRow) {
				r.ServiceID = "svc-missing"
				r.ItemID = "item-1"
				r.Found = false
				r.Item = nil
				r.Error = "service_not_found"
			}),
			newItemLookupRow(func(r *model.ItemLookupRow) {
				r.ServiceID = "svc-1"
				r.ItemID = "item-missing"
				r.Found = false
				r.Item = nil
				r.Error = "item_not_found"
			}),
		}
	}
	return model.ItemLookupResponse{Items: rows}
}

// ── Orders ───────────────────────────────────────────────────────

func newVoucher(opts ...func(*model.Voucher)) model.Voucher {
	v := model.Voucher{
		Pin:          "ABCD-EFGH-1234",
		SerialNumber: strPtr("SN-001"),
		Expiration:   timePtr(fixedVoucherExpiry),
	}
	for _, opt := range opts {
		opt(&v)
	}
	return v
}

func newPurchaseResult(opts ...func(*model.PurchaseResult)) model.PurchaseResult {
	r := model.PurchaseResult{
		Vouchers: []model.Voucher{newVoucher()},
	}
	for _, opt := range opts {
		opt(&r)
	}
	return r
}

func newPurchaseResponse(opts ...func(*model.PurchaseResponse)) model.PurchaseResponse {
	result := newPurchaseResult()
	r := model.PurchaseResponse{
		TransactionUUID: "txn-uuid-abc",
		OrderID:         strPtr("ord-001"),
		Status:          enum.TransactionCompleted,
		Price:           10.50,
		Currency:        "USD",
		Result:          &result,
	}
	for _, opt := range opts {
		opt(&r)
	}
	return r
}

func newDtuCheckResponse(opts ...func(*model.DtuCheckResponse)) model.DtuCheckResponse {
	d := model.DtuCheckResponse{
		CanRecharge:    boolPtr(true),
		Price:          floatPtr(5.00),
		Currency:       strPtr("USD"),
		ProviderStatus: strPtr("available"),
	}
	for _, opt := range opts {
		opt(&d)
	}
	return d
}

func newTransactionListItem(opts ...func(*model.TransactionListItem)) model.TransactionListItem {
	item := model.TransactionListItem{
		TransactionUUID: "txn-uuid-abc",
		OrderID:         strPtr("ord-001"),
		Status:          enum.TransactionCompleted,
		ProductID:       strPtr("prod-1"),
		ItemID:          strPtr("item-1"),
		ProductName:     strPtr("Steam Wallet 10 USD"),
		ItemName:        strPtr("10 USD"),
		Quantity:        1,
		Amount:          floatPtr(10.50),
		Currency:        "USD",
		ServerTime:      timePtr(fixedTime),
		Vouchers: []model.Voucher{
			{Pin: "ABCD-EFGH-1234"},
		},
	}
	for _, opt := range opts {
		opt(&item)
	}
	return item
}

func newTransactionListResponse(items ...model.TransactionListItem) model.TransactionListResponse {
	if items == nil {
		items = []model.TransactionListItem{}
	}
	return model.TransactionListResponse{
		Page: model.TransactionPage{
			Items:   items,
			HasNext: false,
		},
	}
}

// ── Funds ────────────────────────────────────────────────────────

func newFundingMethod(opts ...func(*model.FundingMethod)) model.FundingMethod {
	m := model.FundingMethod{
		Code:                  enum.FundingUSDT_TRC20,
		Name:                  "USDT (TRC-20)",
		MinAmount:             10.00,
		Commission:            0.00,
		Address:               "TXyz...abc",
		TTLMinutes:            60,
		ConfirmationsRequired: 20,
	}
	for _, opt := range opts {
		opt(&m)
	}
	return m
}

func newFundingMethodsResponse(items ...model.FundingMethod) model.FundingMethodsResponse {
	if items == nil {
		items = []model.FundingMethod{}
	}
	return model.FundingMethodsResponse{Items: items}
}

func newFundingInvoice(opts ...func(*model.FundingInvoice)) model.FundingInvoice {
	inv := model.FundingInvoice{
		ID:                    "inv-001",
		MethodCode:            enum.FundingUSDT_TRC20,
		AmountExpected:        50.00,
		Commission:            0.00,
		Credited:              0.00,
		Address:               "TXyz...abc",
		Status:                enum.FundingPending,
		ConfirmationsRequired: intPtr(20),
		Confirmations:         intPtr(0),
		CreatedAt:             fixedCreated,
		ExpiresAt:             fixedExpires,
	}
	for _, opt := range opts {
		opt(&inv)
	}
	return inv
}

func newFundingInvoiceList(items ...model.FundingInvoice) model.FundingInvoiceList {
	if items == nil {
		items = []model.FundingInvoice{}
	}
	return model.FundingInvoiceList{Items: items, Total: len(items)}
}

func newFundingInvoiceTimeLeft(opts ...func(*model.FundingInvoiceTimeLeft)) model.FundingInvoiceTimeLeft {
	tl := model.FundingInvoiceTimeLeft{
		InvoiceID:   "inv-001",
		ExpiresAt:   fixedExpires,
		SecondsLeft: 1800,
		Expired:     false,
	}
	for _, opt := range opts {
		opt(&tl)
	}
	return tl
}

func newTonDepositState(opts ...func(*model.TonDepositState)) model.TonDepositState {
	s := model.TonDepositState{
		Address: "UQAbc...xyz",
		MemoTag: "12345",
	}
	for _, opt := range opts {
		opt(&s)
	}
	return s
}

func newBybitState(opts ...func(*model.BybitState)) model.BybitState {
	s := model.BybitState{
		RecipientUID: "bybit-uid-001",
		Linked:       true,
		YourUID:      strPtr("my-uid-001"),
	}
	for _, opt := range opts {
		opt(&s)
	}
	return s
}

// ── Steam Currency ───────────────────────────────────────────────

func newSteamCurrencyRate(opts ...func(*model.SteamCurrencyRate)) model.SteamCurrencyRate {
	r := model.SteamCurrencyRate{
		QuoteCurrencyCode: "KZT",
		Rate:              "475.50",
		ProviderCreatedAt: timePtr(fixedProvider),
		FetchedAt:         timePtr(fixedFetched),
	}
	for _, opt := range opts {
		opt(&r)
	}
	return r
}

func newSteamCurrencyRatesResponse(items ...model.SteamCurrencyRate) model.SteamCurrencyRatesResponse {
	if items == nil {
		items = []model.SteamCurrencyRate{}
	}
	return model.SteamCurrencyRatesResponse{
		BaseCurrencyCode: "USD",
		Items:            items,
	}
}
