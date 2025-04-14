"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const tickets_1 = __importDefault(require("./routes/tickets"));
const auth_1 = __importDefault(require("./routes/auth"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const mongooseDebug_1 = require("./middleware/mongooseDebug");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Enable Mongoose query debugging
(0, mongooseDebug_1.setupMongooseDebug)();
// Middleware
app.use((0, cors_1.default)({
    // Allow all origins in production or specific ones in development
    origin: process.env.NODE_ENV === 'production'
        ? true
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Connect to MongoDB
(0, database_1.connectDB)();
// Create uploads directory if it doesn't exist
const fs_1 = __importDefault(require("fs"));
const uploadDir = 'uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir);
}
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static('uploads'));
// Routes
app.use('/api/tickets', tickets_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/users', userRoutes_1.default);
// Basic route for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Ticket Management System API',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
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
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port or kill the process using this port.`);
        process.exit(1);
    }
    else {
        console.error('Server error:', err);
    }
});
