# PowerShell script to test Docker build locally

# Stop and remove any existing containers
Write-Host "Stopping and removing any existing containers..." -ForegroundColor Yellow
docker-compose down

# Clean up any build caches (optional)
Write-Host "Cleaning up Docker build cache..." -ForegroundColor Yellow
docker builder prune -f

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Green
docker-compose build --no-cache

# If the build succeeded, start the container
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting container..." -ForegroundColor Green
    docker-compose up
} else {
    Write-Host "Build failed. Please check the logs above for errors." -ForegroundColor Red
} 