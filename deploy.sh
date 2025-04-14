#!/bin/bash

# Deployment script for Ticket Management System

echo "Starting deployment process..."

# Step 1: Build the frontend
echo "Building frontend..."
npm run build

# Step 2: Build the backend
echo "Building backend..."
cd backend
npm run build
cd ..

# Step 3: Deploy to Render (if Render CLI is installed)
if command -v render &> /dev/null
then
    echo "Deploying to Render..."
    render deploy --yaml render.yaml
else
    echo "Render CLI not found. Manual deployment required."
    echo "Please deploy to Render by connecting your GitHub repository at https://dashboard.render.com/"
fi

# Step 4: Deploy to Netlify (if Netlify CLI is installed)
if command -v netlify &> /dev/null
then
    echo "Deploying frontend to Netlify..."
    netlify deploy --prod
else
    echo "Netlify CLI not found. Manual deployment required."
    echo "Please deploy to Netlify by connecting your GitHub repository at https://app.netlify.com/"
fi

echo "Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. If using manual deployment, go to Render and Netlify dashboards to connect your repository"
echo "2. Set up the environment variables in Render dashboard for MONGODB_URI"
echo "3. Verify your backend API is working by visiting the /api endpoint"
echo "4. Verify your frontend is correctly connected to the backend" 