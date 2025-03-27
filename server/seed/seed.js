
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Asset = require('../models/Asset');
const Commit = require('../models/Commit');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Commit.deleteMany({});
    
    console.log('Existing data cleared');
    
    // Create users
    const users = [
      { pennId: "js123", fullName: "James Smith", password: "password" },
      { pennId: "ej456", fullName: "Emily Johnson", password: "password" },
      { pennId: "mb789", fullName: "Michael Brown", password: "password" },
      { pennId: "sw012", fullName: "Sarah Wilson", password: "password" }
    ];
    
    const createdUsers = [];
    
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
    }
    
    console.log(`${createdUsers.length} users created`);
    
    // Create assets and commits
    const assets = [];
    const commits = [];
    
    for (let i = 0; i < 20; i++) {
      // Create asset
      const asset = new Asset({
        assetName: `Asset ${i + 1}`,
        keywords: ["3D", "Model", "Character", "Environment", "Prop", "Texture", "Animation"]
          .filter((_, ki) => ki % (i % 3 + 2) === 0),
        checkedOut: i % 5 === 0,
        checkedOutBy: i % 5 === 0 ? createdUsers[i % 4]._id : null,
        assetState: "Active",
        commitId: i + 1, // Will be updated after commits are created
        thumbnailUrl: `https://placekitten.com/400/${300 + (i % 5) * 10}`,
      });
      
      const savedAsset = await asset.save();
      assets.push(savedAsset);
      
      // Create commits for this asset
      for (let j = 0; j < 2 + (i % 3); j++) {
        const commitId = commits.length + 1;
        const versionNum = j === 0 
          ? `01.00.00` 
          : `01.${j.toString().padStart(2, '0')}.00`;
          
        const commit = new Commit({
          commitId,
          pennKey: createdUsers[(i + j) % 4].pennId,
          versionNum,
          description: `Update to ${savedAsset.assetName}`,
          prevCommitId: j === 0 ? null : commits[commits.length - 1].commitId,
          commitDate: new Date(Date.now() - ((commits.length + 1) * 43200000)),
          hasMaterials: j % 3 === 0,
          assetId: savedAsset._id
        });
        
        const savedCommit = await commit.save();
        commits.push(savedCommit);
        
        // Update asset with latest commit ID if this is the last commit
        if (j === 2 + (i % 3) - 1) {
          savedAsset.commitId = savedCommit.commitId;
          await savedAsset.save();
        }
      }
    }
    
    console.log(`${assets.length} assets created`);
    console.log(`${commits.length} commits created`);
    
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
