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
import { checkoutAsset } from './controllers/assetController';

// Import functions
import checkOutAsset from './models/checkOutAsset';
// import addAsset from './models/addAsset';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = "mongodb+srv://fernc:spring25cs7000@cis7000-database.fdliv.mongodb.net/";
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

// Asset schema definition
const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  keywords: { type: [String], default: [] },
  checkedOut: { type: Boolean, default: false },
  latestCommitID: { type: Number, required: true },
  lastApprovedID: { type: Number, required: true }
});

const Asset = mongoose.model("Asset", assetSchema);

// Routes
app.use('/api/assets', assetRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
// app.get('/', (req, res) => {
//   res.send('Asset Management API is running');
// });

// Route: Get All Assets (for the homepage / thumbnails page)
app.get('/assets', async (req, res) => {
  try {
    const assets = await Asset.find({}).limit(10); // Get a list of assets (thumbnails, etc.)
    res.json(assets);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    }    
  }
});

// Route: Check Out an Asset (change checkedOut status)
app.put('/assets/checkout/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const asset = await checkOutAsset(name);
    res.json(asset); // Send the updated asset as a response
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Route: Check In an Asset

// Route: Get Asset Details (for when a user clicks to view full asset info)
app.get('/assets/:name', async (req, res) => {
  try {
    const asset = await Asset.findOne({ id: req.params.name });

    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(asset); // Return full asset details (name, keywords, commit history, etc.)
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: "Unknown error" });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;