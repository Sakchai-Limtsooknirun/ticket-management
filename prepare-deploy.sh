#!/bin/bash

# Prepare Deployment Script
echo "Preparing application for deployment..."

# Frontend Build
echo "Building frontend..."
npm run build

# Backend Build
echo "Building backend..."
cd backend
npm run build
cd ..

# Create necessary directories
mkdir -p build/backend

# Copy backend build to main build directory
cp -r backend/dist/* build/backend/
cp backend/package.json build/backend/
cp backend/Procfile build/backend/

echo "Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Upload your code to GitHub"
echo "2. Connect your repository to your deployment platforms"
echo "3. Deploy backend on Render/Railway with these settings:"
echo "   - Root Directory: backend"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "4. Deploy frontend on Netlify/Vercel with these settings:"
echo "   - Base Directory: / (root)"
echo "   - Build Command: npm run build"
echo "   - Publish Directory: build"
echo "5. Set environment variables as specified in DEPLOYMENT.md"
echo ""
echo "See DEPLOYMENT.md for more detailed instructions." 