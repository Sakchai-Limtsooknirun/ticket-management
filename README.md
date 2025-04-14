# Ticket Management System

A full-stack ticket management application built with React, TypeScript, and Node.js.

## Project Structure

```
├── src/                      # Frontend source code
│   ├── assets/              # Static assets (images, fonts, etc.)
│   ├── components/          # Reusable React components
│   ├── constants/           # Application constants
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── layouts/             # Page layout components
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── styles/              # Global styles and theme
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
│
├── backend/                 # Backend source code
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   ├── config/        # Configuration files
│   │   └── types/         # TypeScript type definitions
│   └── uploads/            # File uploads directory
│
├── public/                 # Static public assets
└── node_modules/          # Dependencies

## Setup Instructions

1. Clone the repository
2. Copy .env.example to .env and update the variables
3. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   ```

4. Start the development servers:
   ```bash
   # Start frontend (from root directory)
   npm start

   # Start backend (from backend directory)
   npm run dev
   ```

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