import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import routes
import assetRoutes from './routes/assetRoutes';
import commitRoutes from './routes/commitRoutes';
import userRoutes from './routes/userRoutes';

// Import S3 verification
import { verifyS3Connection } from './utils/s3';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fernc:spring25cs7000@cis7000-database.fdliv.mongodb.net/cis7000_mongoDB';
const MONGODB_URI = '';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB database: cis7000_mongoDB');
    
    // Diagnostic: List all collections in the database
    if (mongoose.connection.db) {
      mongoose.connection.db.listCollections().toArray()
        .then(collections => {
          console.log('📊 Available collections in database:');
          collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
          });
          
          // Check if our expected collections exist
          const expectedCollections = ['assets', 'commits', 'commitfiles', 'users'];
          const missingCollections = expectedCollections.filter(
            expected => !collections.some(c => c.name === expected)
          );
          
          if (missingCollections.length > 0) {
            console.warn('⚠️ Warning: Some expected collections are missing:', missingCollections);
            console.log('ℹ️ You may need to initialize your database with test data');
          }
        })
        .catch(err => console.error('❌ Error listing collections:', err));
    } else {
      console.error('❌ Database connection exists but db object is undefined');
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Verify S3 Connection
verifyS3Connection()
  .then(isConnected => {
    if (!isConnected) {
      console.warn('⚠️ S3 connection issue detected. Some file operations may fail.');
    }
  });

// Routes
app.use('/api/assets', assetRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Asset Management API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;