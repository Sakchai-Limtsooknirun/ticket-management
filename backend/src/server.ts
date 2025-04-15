import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import ticketRoutes from './routes/tickets';
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import { setupMongooseDebug } from './middleware/mongooseDebug';

dotenv.config();

const app = express();

// Enable Mongoose query debugging
setupMongooseDebug();

// Middleware
app.use(cors({
  // Allow all origins in production or specific ones in development
  origin: process.env.NODE_ENV === 'production' 
    ? true 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Create uploads directory if it doesn't exist
import fs from 'fs';
import path from 'path';
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({ 
    message: 'Ticket Management System API',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 5001;

// Make sure no other process is using the port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port or kill the process using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
}); 