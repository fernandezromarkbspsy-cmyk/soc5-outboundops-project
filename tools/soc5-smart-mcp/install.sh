#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
mkdir -p "$SCRIPT_DIR/bin"
cd "$SCRIPT_DIR"
go mod download
go test ./...
go build -o "$SCRIPT_DIR/bin/smart-mcp" ./cmd/smart-mcp
printf 'Built: %s\n' "$SCRIPT_DIR/bin/smart-mcp"
