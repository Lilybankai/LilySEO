# LilySEO Frontend Test Script
# This script runs linting, type-checking, and unit tests

# Set error action preference to stop on first error
$ErrorActionPreference = "Stop"

Write-Host "=== LilySEO Frontend Test Runner ===" -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "> node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Function to run a command and check for errors
function Run-Command {
    param (
        [string]$Message,
        [scriptblock]$Command
    )
    
    Write-Host "> $Message..." -ForegroundColor Yellow
    try {
        & $Command
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ $Message failed with exit code $LASTEXITCODE" -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "✓ $Message completed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ $Message failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Run ESLint
Run-Command -Message "Running ESLint" -Command {
    npx eslint . --ext .js,.jsx,.ts,.tsx
}

# Run TypeScript type checking
Run-Command -Message "Running TypeScript type check" -Command {
    npx tsc --noEmit
}

# Run the unit tests with coverage for specific utilities
Write-Host "> Running utility tests..." -ForegroundColor Yellow

# Toast Utils Tests
Run-Command -Message "Running Toast Utility Tests" -Command {
    npx jest src/lib/toast-utils.test.ts
}

# Date Utils Tests
Run-Command -Message "Running Date Utility Tests" -Command {
    npx jest src/lib/date-utils.test.ts
}

# Run all unit tests with coverage if specific utility tests pass
Write-Host "> Running all tests with coverage..." -ForegroundColor Yellow
npx jest --coverage

Write-Host "=== All tests completed successfully ===" -ForegroundColor Green
