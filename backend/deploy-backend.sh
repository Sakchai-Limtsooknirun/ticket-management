#!/bin/bash

echo "Preparing backend for deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install --no-audit --prefer-offline

# Build the application
echo "Building application..."
npm run build

echo "Backend prepared for deployment."
echo "Upload the following files to your hosting provider:"
echo "- dist/ folder"
echo "- package.json"
echo "- .npmrc"
echo "- .env.production (renamed to .env)"

echo "After uploading, run 'npm start' to start the server." 