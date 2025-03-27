
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    // Note: In production, we'd exclude passwords
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all authors (for the filter dropdown)
router.get('/authors', async (req, res) => {
  try {
    const users = await User.find().select('fullName');
    const authors = users.map(user => user.fullName);
    res.json({ authors });
  } catch (error) {
    console.error('Failed to fetch authors:', error);
    res.status(500).json({ error: 'Failed to fetch author list' });
  }
});

// Get a user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error(`Failed to fetch user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { pennId, fullName, password } = req.body;
    
    // Check if user with pennId already exists
    const existingUser = await User.findOne({ pennId });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this Penn ID already exists' });
    }
    
    const newUser = new User({
      pennId,
      fullName,
      password
    });
    
    await newUser.save();
    
    // Don't return the password
    const userWithoutPassword = {
      _id: newUser._id,
      pennId: newUser.pennId,
      fullName: newUser.fullName
    };
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const { pennId, fullName, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields if provided
    if (pennId) user.pennId = pennId;
    if (fullName) user.fullName = fullName;
    if (password) user.password = password;
    
    await user.save();
    
    // Don't return the password
    const userWithoutPassword = {
      _id: user._id,
      pennId: user.pennId,
      fullName: user.fullName
    };
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error(`Failed to update user ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
