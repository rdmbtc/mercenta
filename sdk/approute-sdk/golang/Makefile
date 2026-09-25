.PHONY: all build vet test test-race lint cover clean

all: vet test-race build

build:
	go build ./...

vet:
	go vet ./...

test:
	go test ./...

test-race:
	go test -race -v ./...

lint:
	golangci-lint run ./...

cover:
	go test -race -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

clean:
	rm -f coverage.out coverage.html
