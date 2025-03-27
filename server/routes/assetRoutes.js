
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Asset = require('../models/Asset');
const Commit = require('../models/Commit');
const User = require('../models/User');
const { generateThumbnailUrl, generateDownloadUrl } = require('../utils/s3Utils');

// Helper function to combine asset with details (matches frontend expectations)
const getAssetWithDetails = async (asset, s3, bucketName) => {
  // Get the latest commit for this asset
  const latestCommit = await Commit.findOne({ commitId: asset.commitId });
  
  // Get the first commit (creator) for this asset
  const firstCommit = await Commit.findOne({ assetId: asset._id })
    .sort({ commitId: 1 })
    .limit(1);
  
  // Get user data
  const creator = firstCommit ? await User.findOne({ pennId: firstCommit.pennKey }) : null;
  const lastModifiedBy = latestCommit ? await User.findOne({ pennId: latestCommit.pennKey }) : null;
  const checkedOutByUser = asset.checkedOutBy ? await User.findById(asset.checkedOutBy) : null;
  
  // Generate thumbnail URL
  const thumbnailUrl = await generateThumbnailUrl(s3, bucketName, asset._id);
  
  return {
    id: asset.id || `asset-${asset._id}`,
    name: asset.assetName,
    thumbnailUrl: thumbnailUrl,
    version: latestCommit?.versionNum || "01.00.00",
    creator: creator?.fullName || "Unknown",
    lastModifiedBy: lastModifiedBy?.fullName || "Unknown",
    checkedOutBy: checkedOutByUser?.fullName || null,
    isCheckedOut: asset.checkedOut,
    materials: latestCommit?.hasMaterials || false,
    keywords: asset.keywords,
    description: latestCommit?.description || "No description available",
    createdAt: firstCommit?.commitDate || asset.createdAt,
    updatedAt: latestCommit?.commitDate || asset.updatedAt,
  };
};

// Get all assets with optional filtering
router.get('/', async (req, res) => {
  try {
    const { search, author, checkedInOnly, sortBy } = req.query;
    let query = {};
    
    // Apply search filter
    if (search) {
      query.$or = [
        { assetName: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Apply checked-in filter
    if (checkedInOnly === 'true') {
      query.checkedOut = false;
    }
    
    // First get all assets matching the query
    let assets = await Asset.find(query);
    
    // Get details for each asset
    const s3 = req.app.locals.s3;
    const bucketName = req.app.locals.s3BucketName;
    
    let assetsWithDetails = await Promise.all(
      assets.map(asset => getAssetWithDetails(asset, s3, bucketName))
    );
    
    // Apply author filter after getting details
    if (author) {
      assetsWithDetails = assetsWithDetails.filter(asset => 
        asset.creator === author
      );
    }
    
    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'name':
          assetsWithDetails.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'author':
          assetsWithDetails.sort((a, b) => a.creator.localeCompare(b.creator));
          break;
        case 'updated':
          assetsWithDetails.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          break;
        case 'created':
          assetsWithDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        default:
          break;
      }
    }
    
    res.json({ assets: assetsWithDetails });
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// Get a single asset by ID
router.get('/:id', async (req, res) => {
  try {
    const idParts = req.params.id.split('-');
    const assetObjectId = idParts.length > 1 ? idParts[1] : req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assetObjectId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    
    const asset = await Asset.findById(assetObjectId);
    
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    const s3 = req.app.locals.s3;
    const bucketName = req.app.locals.s3BucketName;
    
    const assetWithDetails = await getAssetWithDetails(asset, s3, bucketName);
    
    res.json({ asset: assetWithDetails });
  } catch (error) {
    console.error(`Failed to fetch asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch asset details" });
  }
});

// Check out an asset
router.post('/:id/checkout', async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res.status(400).json({ error: "User name is required" });
    }
    
    const idParts = req.params.id.split('-');
    const assetObjectId = idParts.length > 1 ? idParts[1] : req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assetObjectId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    
    const asset = await Asset.findById(assetObjectId);
    
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    if (asset.checkedOut) {
      const checkedOutByUser = asset.checkedOutBy ? await User.findById(asset.checkedOutBy) : null;
      return res.status(400).json({ 
        error: `Asset is already checked out by ${checkedOutByUser?.fullName || 'another user'}` 
      });
    }
    
    // Find user by name
    const user = await User.findOne({ fullName: userName });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Update the asset
    asset.checkedOut = true;
    asset.checkedOutBy = user._id;
    await asset.save();
    
    const s3 = req.app.locals.s3;
    const bucketName = req.app.locals.s3BucketName;
    
    const assetWithDetails = await getAssetWithDetails(asset, s3, bucketName);
    
    res.json({ asset: assetWithDetails });
  } catch (error) {
    console.error(`Failed to check out asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to check out asset" });
  }
});

// Check in an asset
router.post('/:id/checkin', async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res.status(400).json({ error: "User name is required" });
    }
    
    const idParts = req.params.id.split('-');
    const assetObjectId = idParts.length > 1 ? idParts[1] : req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assetObjectId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    
    const asset = await Asset.findById(assetObjectId);
    
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    if (!asset.checkedOut) {
      return res.status(400).json({ error: "Asset is not checked out" });
    }
    
    // Find user by name
    const user = await User.findOne({ fullName: userName });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Verify the user who's checking in is the one who checked out
    const checkedOutByUser = await User.findById(asset.checkedOutBy);
    if (!checkedOutByUser || checkedOutByUser.pennId !== user.pennId) {
      return res.status(403).json({ 
        error: `Asset is checked out by ${checkedOutByUser?.fullName || 'another user'}, not you` 
      });
    }
    
    // Get the last commit
    const lastCommit = await Commit.findOne({ commitId: asset.commitId });
    if (!lastCommit) {
      return res.status(404).json({ error: "Could not find the last commit" });
    }
    
    // Update version (simplified)
    const versionParts = lastCommit.versionNum.split('.');
    const minorVersion = parseInt(versionParts[1]) + 1;
    const newVersion = `${versionParts[0]}.${minorVersion.toString().padStart(2, '0')}.00`;
    
    // Create a new commit
    const maxCommitIdDoc = await Commit.findOne().sort({ commitId: -1 }).limit(1);
    const newCommitId = maxCommitIdDoc ? maxCommitIdDoc.commitId + 1 : 1;
    
    const newCommit = new Commit({
      commitId: newCommitId,
      pennKey: user.pennId,
      versionNum: newVersion,
      description: `Update to ${asset.assetName}`,
      prevCommitId: lastCommit.commitId,
      commitDate: new Date(),
      hasMaterials: lastCommit.hasMaterials,
      assetId: asset._id
    });
    
    await newCommit.save();
    
    // Update the asset
    asset.commitId = newCommitId;
    asset.checkedOut = false;
    asset.checkedOutBy = null;
    await asset.save();
    
    const s3 = req.app.locals.s3;
    const bucketName = req.app.locals.s3BucketName;
    
    const assetWithDetails = await getAssetWithDetails(asset, s3, bucketName);
    
    res.json({ asset: assetWithDetails });
  } catch (error) {
    console.error(`Failed to check in asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to check in asset" });
  }
});

// Download a copy of the asset
router.get('/:id/download', async (req, res) => {
  try {
    const idParts = req.params.id.split('-');
    const assetObjectId = idParts.length > 1 ? idParts[1] : req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assetObjectId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    
    const asset = await Asset.findById(assetObjectId);
    
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    const s3 = req.app.locals.s3;
    const bucketName = req.app.locals.s3BucketName;
    
    // Generate a signed URL for downloading
    const downloadUrl = await generateDownloadUrl(s3, bucketName, asset._id);
    
    res.json({ downloadUrl, success: true });
  } catch (error) {
    console.error(`Failed to download asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to download asset" });
  }
});

// Launch DCC with the asset
router.post('/:id/launch-dcc', async (req, res) => {
  try {
    const idParts = req.params.id.split('-');
    const assetObjectId = idParts.length > 1 ? idParts[1] : req.params.id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assetObjectId)) {
      return res.status(400).json({ error: "Invalid asset ID" });
    }
    
    const asset = await Asset.findById(assetObjectId);
    
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    // In a real implementation, this might generate a file with configuration
    // for a DCC application, or return a URL for a web-based editor
    
    res.json({ 
      success: true,
      message: `Launch configuration for ${asset.assetName} generated` 
    });
  } catch (error) {
    console.error(`Failed to launch DCC for asset ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to launch application" });
  }
});

module.exports = router;
