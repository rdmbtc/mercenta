package enum

// TransactionStatus represents the status of a purchase transaction.
type TransactionStatus string

const (
	TransactionInProgress         TransactionStatus = "in_progress"
	TransactionCompleted          TransactionStatus = "completed"
	TransactionPartiallyCompleted TransactionStatus = "partially_completed"
	TransactionCancelled          TransactionStatus = "cancelled"
)
