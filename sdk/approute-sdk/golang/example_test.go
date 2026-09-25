package approute_test

import (
	"fmt"
	"time"

	approute "github.com/approute/public-api-sdk-go"
)

func ExampleNewClient() {
	client := approute.NewClient("sk_live_your_api_key")
	fmt.Printf("client created: %v\n", client != nil)
	// Output: client created: true
}

func ExampleNewClient_withOptions() {
	client := approute.NewClient("sk_live_your_api_key",
		approute.WithBaseURL("https://custom-api.example.com/api/v1"),
		approute.WithTimeout(10*time.Second),
		approute.WithMaxRetries(5),
	)
	fmt.Printf("client created: %v\n", client != nil)
	// Output: client created: true
}
