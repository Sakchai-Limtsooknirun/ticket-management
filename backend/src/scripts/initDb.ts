import { connectDB, disconnectDB } from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const initializeDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});

    // Create test users
    const users = [
      {
        username: 'admin',
        email: 'admin@company.com',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Admin User',
        role: 'ADMIN',
        department: 'ENGINEERING',
        isActive: true,
      },
      {
        username: 'approver',
        email: 'approver@company.com',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Approver User',
        role: 'APPROVER',
        department: 'QUALITY',
        isActive: true,
      },
      {
        username: 'user',
        email: 'user@company.com',
        password: await bcrypt.hash('password123', 10),
        fullName: 'Regular User',
        role: 'REQUESTER',
        department: 'PRODUCTION',
        isActive: true,
      }
    ];

    await User.insertMany(users);
    console.log('Test users created successfully');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 