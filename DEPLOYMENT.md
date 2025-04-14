# Deployment Guide

This document provides step-by-step instructions for deploying the Ticket Management application to various platforms.

## Prerequisites

1. GitHub account
2. MongoDB Atlas account
3. Account on at least one of: Render, Vercel, Netlify, or Railway

## Database Setup (MongoDB Atlas)

1. Create a free MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (Free tier M0 is sufficient)
3. Under "Database Access", create a new database user with password authentication
4. Under "Network Access", add a new IP address (0.0.0.0/0 to allow access from anywhere)
5. Get your connection string from "Connect" > "Connect your application"
6. Replace the placeholders in the connection string with your username and password

## Backend Deployment

### Option 1: Render

1. Create an account on [Render](https://render.com/)
2. Connect your GitHub repository
3. Create a new Web Service and select your repository
4. Configure:
   - Name: ticket-management-api (or your preferred name)
   - Root Directory: backend
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add environment variables:
   - `PORT`: 10000
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production
6. Deploy

### Option 2: Railway

1. Create an account on [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Create a new project from your repository
4. Configure:
   - Root Directory: backend
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add the same environment variables as listed above
6. Deploy

## Frontend Deployment

### Option 1: Netlify

1. Create an account on [Netlify](https://www.netlify.com/)
2. Connect your GitHub repository
3. Configure:
   - Base directory: / (root)
   - Build command: `npm run build`
   - Publish directory: build
4. Add environment variables:
   - `REACT_APP_API_URL`: Your backend URL (from Render or Railway)
5. Deploy

### Option 2: Vercel

1. Create an account on [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Create React App
   - Root Directory: / (root)
4. Add environment variables:
   - `REACT_APP_API_URL`: Your backend URL (from Render or Railway)
5. Deploy

## Post-Deployment

1. Test your application by navigating to the frontend URL
2. Check that all features work correctly with the production database
3. If needed, seed your database with initial data

## Troubleshooting

- If your backend can't connect to MongoDB Atlas, check the network access settings
- If CORS errors occur, verify that your frontend is using the correct backend URL
- For deployment issues, check the logs in your respective platform dashboards 