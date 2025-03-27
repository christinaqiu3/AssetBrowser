
const express = require('express');
const router = express.Router();
const Commit = require('../models/Commit');
const User = require('../models/User');

// Get all commits
router.get('/', async (req, res) => {
  try {
    const commits = await Commit.find().sort({ commitId: -1 });
    res.json(commits);
  } catch (error) {
    console.error('Failed to fetch commits:', error);
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

// Get commits for specific asset
router.get('/asset/:assetId', async (req, res) => {
  try {
    const commits = await Commit.find({ assetId: req.params.assetId })
      .sort({ commitId: -1 });
    
    // Add author information
    const commitsWithDetails = await Promise.all(commits.map(async (commit) => {
      const user = await User.findOne({ pennId: commit.pennKey });
      return {
        ...commit.toObject(),
        authorName: user ? user.fullName : 'Unknown'
      };
    }));
    
    res.json(commitsWithDetails);
  } catch (error) {
    console.error(`Failed to fetch commits for asset ${req.params.assetId}:`, error);
    res.status(500).json({ error: 'Failed to fetch asset commits' });
  }
});

// Get a specific commit
router.get('/:commitId', async (req, res) => {
  try {
    const commit = await Commit.findOne({ commitId: req.params.commitId });
    
    if (!commit) {
      return res.status(404).json({ error: 'Commit not found' });
    }
    
    // Get author information
    const user = await User.findOne({ pennId: commit.pennKey });
    const commitWithDetails = {
      ...commit.toObject(),
      authorName: user ? user.fullName : 'Unknown'
    };
    
    res.json(commitWithDetails);
  } catch (error) {
    console.error(`Failed to fetch commit ${req.params.commitId}:`, error);
    res.status(500).json({ error: 'Failed to fetch commit' });
  }
});

module.exports = router;
