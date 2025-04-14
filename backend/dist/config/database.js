"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        console.log('\n🔌 Connecting to MongoDB...');
        console.log(`🔗 URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-management'}`);
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-management');
        console.log('\n✅ MongoDB Connected:');
        console.log(`🏠 Host: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);
        console.log(`🔢 Port: ${conn.connection.port}`);
        console.log(`🪲 Debug Mode: ${mongoose_1.default.get('debug') ? 'Enabled' : 'Disabled'}`);
        // Log database information
        const dbInfo = await mongoose_1.default.connection.db.admin().serverInfo();
        console.log(`\n📊 MongoDB Server Info:`);
        console.log(`📌 Version: ${dbInfo.version}`);
        // List all collections
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        console.log(`\n📚 Available Collections (${collections.length}):`);
        collections.forEach((coll, index) => {
            console.log(`${index + 1}. ${coll.name}`);
        });
    }
    catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('✅ MongoDB Disconnected Successfully');
    }
    catch (error) {
        console.error('❌ MongoDB Disconnection Error:', error);
    }
};
exports.disconnectDB = disconnectDB;
