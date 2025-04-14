# Ticket Management System

A full-stack ticket management application built with React, TypeScript, and Node.js.

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ticket-management.git
   cd ticket-management
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in the root directory
   - Copy `backend/.env.example` to `backend/.env`

4. **Run the development servers**
   ```bash
   # Run backend server
   cd backend
   npm run dev

   # In a new terminal, run frontend server
   cd ..
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## Deployment

This application can be deployed using various platforms. We recommend using Render for the backend and Netlify/Vercel for the frontend.

### Automated Deployment

1. **Push your code to GitHub**

2. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

3. **Follow the prompts to complete deployment**

### Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on manually deploying to:
- Render
- Netlify
- Vercel
- Railway

## Project Structure

```
├── src/                   # Frontend source code
├── backend/               # Backend source code
├── public/                # Static public assets
├── render.yaml            # Render deployment configuration
├── netlify.toml           # Netlify deployment configuration
├── vercel.json            # Vercel deployment configuration
├── DEPLOYMENT.md          # Detailed deployment guide
├── LARGE_FILES.md         # Guide for handling large files
└── deploy.sh              # Deployment script
```

## Environment Variables

See `.env.example` and `backend/.env.example` for required environment variables.

## Available Scripts

### Frontend
- `npm start`: Start development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run lint`: Run linter

### Backend
- `npm run dev`: Start development server
- `npm start`: Start production server
- `npm test`: Run tests
- `npm run build`: Build TypeScript code

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - React Router
  - Axios
  - CSS Modules

- Backend:
  - Node.js
  - Express
  - TypeScript
  - MongoDB
  - JWT Authentication

## Contributing

1. Create a new branch
2. Make your changes
3. Submit a pull request

## License

MIT