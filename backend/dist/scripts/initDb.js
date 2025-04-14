"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const initializeDatabase = async () => {
    try {
        await (0, database_1.connectDB)();
        // Clear existing data
        await User_1.default.deleteMany({});
        // Create test users
        const users = [
            {
                username: 'admin',
                email: 'admin@company.com',
                password: await bcryptjs_1.default.hash('password123', 10),
                fullName: 'Admin User',
                role: 'ADMIN',
                department: 'ENGINEERING',
                isActive: true,
            },
            {
                username: 'approver',
                email: 'approver@company.com',
                password: await bcryptjs_1.default.hash('password123', 10),
                fullName: 'Approver User',
                role: 'APPROVER',
                department: 'QUALITY',
                isActive: true,
            },
            {
                username: 'user',
                email: 'user@company.com',
                password: await bcryptjs_1.default.hash('password123', 10),
                fullName: 'Regular User',
                role: 'REQUESTER',
                department: 'PRODUCTION',
                isActive: true,
            }
        ];
        await User_1.default.insertMany(users);
        console.log('Test users created successfully');
        await (0, database_1.disconnectDB)();
        process.exit(0);
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};
initializeDatabase();
