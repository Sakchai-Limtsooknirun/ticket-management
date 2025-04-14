// Script to check MongoDB connection and query tickets with TypeScript
import { MongoClient, Db, Document } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connection URI from .env file
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chemreq';

// Debug output
console.log(`Attempting to connect to MongoDB at: ${uri}`);

async function checkMongo(): Promise<void> {
  const client = new MongoClient(uri);
  
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // Get database and collections
    const db: Db = client.db();
    console.log(`Using database: ${db.databaseName}`);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(coll => {
      console.log(` - ${coll.name}`);
    });
    
    // Query tickets collection
    if (collections.some(coll => coll.name === 'tickets')) {
      const ticketsCollection = db.collection('tickets');
      
      // Enable MongoDB profiler to see the query
      await db.command({ profile: 2 });
      
      // Count tickets
      const totalTickets = await ticketsCollection.countDocuments();
      console.log(`\nTotal tickets in database: ${totalTickets}`);
      
      // Get sample tickets
      const tickets: Document[] = await ticketsCollection.find({}).limit(5).toArray();
      
      console.log('\nSample tickets:');
      if (tickets.length === 0) {
        console.log('No tickets found in the database.');
      } else {
        tickets.forEach((ticket, index) => {
          console.log(`\nTicket ${index + 1}:`);
          console.log(` - ID: ${ticket._id}`);
          console.log(` - Title: ${ticket.title}`);
          console.log(` - Status: ${ticket.status}`);
          console.log(` - Requester: ${ticket.requesterId}`);
          console.log(` - Created: ${ticket.createdAt}`);
        });
      }
      
      // Get status breakdown
      const statusCounts = await ticketsCollection.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray();
      
      console.log('\nTickets by status:');
      if (statusCounts.length === 0) {
        console.log('No status information available.');
      } else {
        statusCounts.forEach(status => {
          console.log(` - ${status._id || 'null'}: ${status.count}`);
        });
      }
      
      // Perform query with date filtering to test the issue
      console.log('\nTesting date filtering query:');
      
      // Date range (similar to what frontend might send)
      const startDate = new Date('2023-01-01');
      const endDate = new Date();
      
      const dateFilterQuery = {
        requestDate: { 
          $gte: startDate, 
          $lte: endDate 
        }
      };
      
      console.log(`Query filter: ${JSON.stringify(dateFilterQuery, null, 2)}`);
      
      const dateFilteredTickets = await ticketsCollection.find(dateFilterQuery).limit(5).toArray();
      console.log(`Found ${dateFilteredTickets.length} tickets with date filter`);
      
      // Check fields in tickets to understand schema
      if (tickets.length > 0) {
        console.log('\nTicket object structure:');
        const sampleTicket = tickets[0];
        console.log(JSON.stringify(sampleTicket, null, 2));
        
        console.log('\nAvailable date fields:');
        const dateFields = Object.keys(sampleTicket).filter(key => {
          const value = sampleTicket[key];
          return value instanceof Date || 
                 (typeof value === 'string' && !isNaN(Date.parse(value)));
        });
        console.log(dateFields);
      }
      
      // Check the MongoDB profile log
      console.log('\nMongoDB query profile:');
      const profileData = await db.command({ profile: -1 });
      console.log(profileData);
      
      const profilerData = await db.collection('system.profile').find({}).toArray();
      console.log('\nRecent queries:');
      profilerData.forEach((query, i) => {
        console.log(`\nQuery ${i + 1}:`);
        console.log(` - Operation: ${query.op}`);
        console.log(` - Namespace: ${query.ns}`);
        console.log(` - Query: ${JSON.stringify(query.query || query.command || {})}`);
        console.log(` - Duration: ${query.millis}ms`);
      });
    } else {
      console.log('\nNo tickets collection found in the database!');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the function
checkMongo().catch(console.error); 