import mongoose from 'mongoose';

/**
 * Enable detailed Mongoose/MongoDB query logging
 */
export const setupMongooseDebug = () => {
  // Set mongoose debug mode to log all queries
  mongoose.set('debug', (collectionName: string, methodName: string, ...methodArgs: any[]) => {
    const queryInfo = {
      timestamp: new Date().toISOString(),
      collection: collectionName,
      operation: methodName,
      query: methodArgs[0] || {},
      options: methodArgs[1] || {},
    };
    
    console.log('\n🔍 MONGODB QUERY:');
    console.log(JSON.stringify(queryInfo, null, 2));
    
    // For find operations, log the query in a more readable format
    if (methodName === 'find' || methodName === 'findOne') {
      console.log('\n📋 Query Conditions:');
      console.log(JSON.stringify(queryInfo.query, null, 2));
      
      if (queryInfo.options.sort) {
        console.log('\n📊 Sort Options:');
        console.log(JSON.stringify(queryInfo.options.sort, null, 2));
      }
      
      if (queryInfo.options.skip || queryInfo.options.limit) {
        console.log('\n🔢 Pagination:');
        console.log(`Skip: ${queryInfo.options.skip || 0}, Limit: ${queryInfo.options.limit || 'none'}`);
      }
    }
    
    console.log('----------------------------------');
  });
  
  console.log('MongoDB query debugging enabled');
}; 