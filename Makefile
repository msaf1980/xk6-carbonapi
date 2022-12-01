K6_VERSION ?= "v0.41.0"
XK6_GETENV_VERSION ?= "v0.0.5"
XK6_STATSITE_VERSION ?= "v0.2.0"
XK6_OUT_CH_VERSION ?= "v0.0.2"

MAKEFLAGS += --silent

all: clean format test build integrations

## help: Prints a list of available build targets.
help:
	echo "Usage: make <OPTIONS> ... <TARGETS>"
	echo ""
	echo "Available targets are:"
	echo ''
	sed -n 's/^##//p' ${PWD}/Makefile | column -t -s ':' | sed -e 's/^/ /'
	echo
	echo "Targets run by default are: `sed -n 's/^all: //p' ./Makefile | sed -e 's/ /, /g' | sed -e 's/\(.*\), /\1, and /'`"

## clean: Removes any previously created build artifacts.
clean:
	rm -f ./k6

prep:
	go install go.k6.io/xk6/cmd/xk6@latest

## build: Builds a custom 'k6' with the local extension. 
build:
	xk6 build ${K6_VERSION} --with $(shell go list -m)=. --with github.com/msaf1980/xk6-getenv@${XK6_GETENV_VERSION} --with github.com/msaf1980/xk6-statsite@${XK6_STATSITE_VERSION} --with github.com/msaf1980/xk6-output-clickhouse@${XK6_OUT_CH_VERSION}

## format: Applies Go formatting to code.
format:
	go fmt ./...

## test: Executes any unit tests.
test:
	go test -cover -race

integrations:
	./k6 run --out statsite --no-color --no-usage-report tests/test.js

.PHONY: build clean format help test
