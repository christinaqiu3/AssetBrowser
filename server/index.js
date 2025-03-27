
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const assetRoutes = require('./routes/assetRoutes');
const commitRoutes = require('./routes/commitRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Make S3 available to routes
app.locals.s3 = s3;
app.locals.s3BucketName = process.env.S3_BUCKET_NAME;

// API Routes
app.use('/api/assets', assetRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
