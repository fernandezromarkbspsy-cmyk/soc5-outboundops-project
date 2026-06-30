$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BinDir = Join-Path $ScriptDir "bin"
$ExecutablePath = Join-Path $BinDir "smart-mcp.exe"

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    throw "Go is not installed or is not available in PATH."
}

New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

Push-Location $ScriptDir

try {
    $env:GOTOOLCHAIN = "auto"

    Write-Host "Go environment:"
    go version

    Write-Host "Setting required Go version..."
    go mod edit -go=1.25.0

    Write-Host "Resolving dependencies and generating go.sum..."
    go mod tidy

    Write-Host "Verifying downloaded modules..."
    go mod verify

    Write-Host "Running tests..."
    go test ./...

    Write-Host "Building SMART MCP..."
    go build -o $ExecutablePath ./cmd/smart-mcp

    if (-not (Test-Path $ExecutablePath)) {
        throw "Build completed without creating smart-mcp.exe."
    }

    Write-Host ""
    Write-Host "SMART MCP successfully built:"
    Write-Host $ExecutablePath
}
finally {
    Pop-Location
}