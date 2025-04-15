Write-Host "=== LilySEO Frontend Test Runner ===" -ForegroundColor Cyan

# Install dependencies if needed
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run Toast Utils Tests
Write-Host "Running Toast Utility Tests..." -ForegroundColor Yellow
npx jest src/lib/toast-utils.test.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "Toast Utility Tests failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Toast Utility Tests passed" -ForegroundColor Green

# Run Date Utils Tests
Write-Host "Running Date Utility Tests..." -ForegroundColor Yellow
npx jest src/lib/date-utils.test.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "Date Utility Tests failed" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "Date Utility Tests passed" -ForegroundColor Green

Write-Host "All utility tests completed successfully" -ForegroundColor Green 