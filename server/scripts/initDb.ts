import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from '../models/Asset';
import Commit from '../models/Commit';
import CommitFile from '../models/CommitFile';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  {
    pennId: 'user1',
    fullName: 'John Doe',
    password: 'password123'
  },
  {
    pennId: 'user2',
    fullName: 'Jane Smith',
    password: 'password456'
  }
];

const sampleAssets = [
  {
    assetId: 1,
    assetName: 'redApple',
    keywords: ['fruit', 'red', 'food'],
    checkedOut: false,
    latestCommitId: 'commit1',
    lastApprovedId: 'commit1'
  },
  {
    assetId: 2,
    assetName: 'blueChair',
    keywords: ['furniture', 'blue', 'chair'],
    checkedOut: true,
    latestCommitId: 'commit2',
    lastApprovedId: 'commit2'
  }
];

const sampleCommits = [
  {
    commitId: 'commit1',
    pennKey: 'user1',
    versionNum: '01.00.00',
    notes: 'Initial commit for redApple',
    prevCommitId: null,
    commitDate: new Date().toISOString(),
    hasMaterials: true,
    state: ['approved', 'latest']
  },
  {
    commitId: 'commit2',
    pennKey: 'user2',
    versionNum: '01.00.00',
    notes: 'Initial commit for blueChair',
    prevCommitId: null,
    commitDate: new Date().toISOString(),
    hasMaterials: true,
    state: ['approved', 'latest']
  }
];

const sampleCommitFiles = [
  {
    commitId: 'commit1',
    'redApple.usda': 'file1',
    'thumbnail.png': 'file2',
    'redApple_lod1.usd': 'file3'
  },
  {
    commitId: 'commit2',
    'blueChair.usda': 'file4',
    'thumbnail.png': 'file5',
    'blueChair_blueMat.usd': 'file6'
  }
];

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fernc:spring25cs7000@cis7000-database.fdliv.mongodb.net/cis7000_mongoDB';

async function initDb() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if collections already have data
    const assetCount = await Asset.countDocuments();
    const commitCount = await Commit.countDocuments();
    const userCount = await User.countDocuments();
    const commitFileCount = await CommitFile.countDocuments();

    console.log(`Existing data: ${assetCount} assets, ${commitCount} commits, ${userCount} users, ${commitFileCount} commit files`);

    if (assetCount === 0) {
      console.log('Inserting sample assets...');
      await Asset.insertMany(sampleAssets);
      console.log('Sample assets inserted');
    }

    if (commitCount === 0) {
      console.log('Inserting sample commits...');
      await Commit.insertMany(sampleCommits);
      console.log('Sample commits inserted');
    }

    if (userCount === 0) {
      console.log('Inserting sample users...');
      await User.insertMany(sampleUsers);
      console.log('Sample users inserted');
    }

    if (commitFileCount === 0) {
      console.log('Inserting sample commit files...');
      await CommitFile.insertMany(sampleCommitFiles);
      console.log('Sample commit files inserted');
    }

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initDb();
