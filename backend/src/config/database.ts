import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    console.log(`🔗 URI: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-management'}`);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket-management');
    
    console.log('\n✅ MongoDB Connected:');
    console.log(`🏠 Host: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);
    console.log(`🔢 Port: ${conn.connection.port}`);
    console.log(`🪲 Debug Mode: ${mongoose.get('debug') ? 'Enabled' : 'Disabled'}`);
    
    // Log database information
    const dbInfo = await mongoose.connection.db.admin().serverInfo();
    console.log(`\n📊 MongoDB Server Info:`);
    console.log(`📌 Version: ${dbInfo.version}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Available Collections (${collections.length}):`);
    collections.forEach((coll, index) => {
      console.log(`${index + 1}. ${coll.name}`);
    });
    
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error);
  }
}; 