#!/bin/bash

# This script helps deploy the LilySEO frontend to Coolify

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# Display current git status
echo "Current Git Status:"
git status

# Stage all changes
git add .

# Commit changes
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"

# Push to the repository
git push

echo "Changes pushed to the repository."
echo "Coolify should automatically detect the changes and start the deployment process if configured for automatic deployments."
echo ""
echo "If not configured for automatic deployments, please manually trigger a deployment in the Coolify dashboard." 