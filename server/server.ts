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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asset-management';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
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