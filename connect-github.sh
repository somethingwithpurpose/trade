#!/bin/bash

# Script to connect local repo to GitHub
# Usage: ./connect-github.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./connect-github.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME"
  echo "Example: ./connect-github.sh calelane edgelab"
  exit 1
fi

GITHUB_USER=$1
REPO_NAME=$2

echo "Connecting to GitHub repository: $GITHUB_USER/$REPO_NAME"

# Check if remote already exists
if git remote get-url origin > /dev/null 2>&1; then
  echo "Remote 'origin' already exists. Removing it first..."
  git remote remove origin
fi

# Add the remote
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git

echo ""
echo "Remote added successfully!"
echo ""
echo "To push your code, run:"
echo "  git push -u origin main"
echo ""
echo "Or if you prefer SSH:"
echo "  git remote set-url origin git@github.com:$GITHUB_USER/$REPO_NAME.git"
echo "  git push -u origin main"

