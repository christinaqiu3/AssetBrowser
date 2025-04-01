import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Asset from '../models/Asset';
import Commit from '../models/Commit';
import CommitFile from '../models/CommitFile';
import User from '../models/User';
import { getAssetThumbnailUrl, downloadAssetFolderAsZip } from '../utils/s3';

// Helper to transform Asset document to match frontend expectations
const transformAssetData = async (asset: any) => {
  try {
    console.log(`[DEBUG] Transforming asset data for: ${asset.assetName}`);
    console.log(`[DEBUG] Asset source data: assetId=${asset._id}, assetName=${asset.assetName}, latestCommitId=${asset.latestCommitId}`);
    
    // Fetch the latest commit for this asset
    console.log(`[DEBUG] Querying 'commits' collection for commitId: ${asset.latestCommitId}`);
    const latestCommit = await Commit.findOne({ commitId: asset.latestCommitId });
    console.log(`[DEBUG] Latest commit for ${asset.assetName}:`, latestCommit ? `Found (commitId: ${latestCommit.commitId}, version: ${latestCommit.versionNum})` : 'Not found');
    
    // Fetch file information from CommitFile collection
    let fileInfo = null;
    if (latestCommit) {
      console.log(`[DEBUG] Querying 'commitfiles' collection for commitId: ${latestCommit.commitId}`);
      fileInfo = await CommitFile.findOne({ commitId: latestCommit.commitId });
      console.log(`[DEBUG] File info for commit ${latestCommit.commitId}:`, fileInfo ? 'Found' : 'Not found');
      if (fileInfo) {
        console.log(`[DEBUG] CommitFile data keys:`, Object.keys(fileInfo.toObject()).filter(key => key !== '_id' && key !== '__v'));
      }
    }
    
    // Find the user who created this commit
    let creator = null;
    let lastModifiedBy = null;
    
    if (latestCommit && latestCommit.pennKey) {
      console.log(`[DEBUG] Querying 'users' collection for pennId: ${latestCommit.pennKey}`);
      lastModifiedBy = await User.findOne({ pennId: latestCommit.pennKey });
      console.log(`[DEBUG] Last modified by:`, lastModifiedBy ? lastModifiedBy.fullName : 'User not found');
    }
    
    // Find the oldest commit for this asset to determine creator
    console.log(`[DEBUG] Searching for oldest commit for asset: ${asset.assetName}`);
    const oldestCommit = await Commit.findOne({ 
      notes: { $regex: asset.assetName, $options: 'i' } 
    }).sort({ commitDate: 1 }).limit(1);
    
    console.log(`[DEBUG] Oldest commit:`, oldestCommit ? `Found (commitId: ${oldestCommit.commitId}, date: ${oldestCommit.commitDate})` : 'Not found');
    
    if (oldestCommit && oldestCommit.pennKey) {
      console.log(`[DEBUG] Querying 'users' collection for creator pennId: ${oldestCommit.pennKey}`);
      creator = await User.findOne({ pennId: oldestCommit.pennKey });
      console.log(`[DEBUG] Creator:`, creator ? creator.fullName : 'Creator not found');
    }
    
    // Get checked out information
    let checkedOutBy = null;
    
    // Debug the checked out status
    console.log(`[DEBUG] Asset checked out status:`, {
      assetName: asset.assetName,
      checkedOut: asset.checkedOut,
      checkedOutValue: typeof asset.checkedOut,
    });
    
    if (asset.checkedOut && latestCommit) {
      checkedOutBy = asset.checkedOutBy;
      console.log(`[DEBUG] Asset is checked out by:`, checkedOutBy);
    }
    
    // Fetch thumbnail URL from S3
    // Use the full URL for the thumbnail
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const thumbnailUrl = `${baseUrl}/api/assets/${asset.assetName}/thumbnail`;
    
    // Log the thumbnail URL for debugging
    console.log(`[DEBUG] Setting thumbnail URL for asset ${asset.assetName}:`, thumbnailUrl);
    
    // Transform to match frontend expectations
    const transformed = {
      assetId: asset._id, // Use MongoDB _id as assetId for the frontend
      name: asset.assetName,
      thumbnailUrl: thumbnailUrl,
      version: latestCommit?.versionNum || "01.00.00",
      creator: creator?.fullName || "Unknown",
      lastModifiedBy: lastModifiedBy?.fullName || "Unknown",
      checkedOutBy: asset.checkedOutBy,
      isCheckedOut: asset.checkedOut,
      materials: latestCommit?.hasMaterials || false,
      keywords: asset.keywords,
      description: latestCommit?.notes || "No description available",
      createdAt: oldestCommit?.commitDate || asset.createdAt,
      updatedAt: latestCommit?.commitDate || asset.updatedAt,
      files: fileInfo ? fileInfo.files : [], // Add file information to the transformed asset
      approved: asset.lastApprovedId !== null
    };

    console.log(`[DEBUG] Transformed asset:`, {
      assetId: transformed.assetId,
      name: transformed.name,
      isCheckedOut: transformed.isCheckedOut,
      keywords: transformed.keywords,
      createdAt: transformed.createdAt,
      updatedAt: transformed.updatedAt
    });
    
    return transformed;
  } catch (error) {
    console.error('[ERROR] Error transforming asset data:', error);
    return asset;
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    console.log(`[DEBUG] getAssets called with query:`, req.query);
    
    // Log the MongoDB connection details
    console.log(`[DEBUG] MongoDB connection state:`, mongoose.connection.readyState);
    console.log(`[DEBUG] MongoDB database name:`, mongoose.connection.db?.databaseName);
    
    // Log the Asset model details
    console.log(`[DEBUG] Asset model collection name:`, Asset.collection.name);
    console.log(`[DEBUG] Asset model schema:`, JSON.stringify(Asset.schema.obj));
    
    // Try to directly query the MongoDB collection
    try {
      if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`[DEBUG] Available collections:`, collections.map((c: { name: string }) => c.name));
        const directResult = await mongoose.connection.db.collection('assets').find({}).toArray();
        console.log(`[DEBUG] Direct MongoDB query result count:`, directResult.length);

        const directResult2 = await mongoose.connection.db.collection('commitfiles').find({}).toArray();
        console.log(`[DEBUG] Direct MongoDB query result count:`, directResult2.length);

        const doc = await mongoose.connection.db.collection('assets').findOne({ assetName: "skateboard" });
        console.log(`find this guy: `, doc);
        if (directResult.length > 0) {
          console.log(`[DEBUG] Sample direct result:`, JSON.stringify(directResult[0]));
        }
      } else {
        console.error(`[ERROR] MongoDB connection exists but db object is undefined`);
      }
    } catch (err) {
      console.error(`[ERROR] Error during direct MongoDB query:`, err);
    }
    
    // Build query based on request parameters
    const query: Record<string, any> = {};
    
    // Handle search parameter
    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search), 'i');
      query.$or = [
        { assetName: searchRegex },
        { keywords: searchRegex }
      ];
      console.log(`[DEBUG] Searching with regex: ${searchRegex}`);
    }
    
    // Handle checked-in only filter
    if (req.query.checkedInOnly === 'true') {
      query.checkedOut = false;
      console.log(`[DEBUG] Filtering for checked-in assets only`);
    }
    
    // Execute the query
    console.log(`[DEBUG] Final MongoDB query:`, JSON.stringify(query));
    console.log(`[DEBUG] Executing find() on 'assets' collection in cis7000_mongoDB`);
    const rawAssets = await Asset.find(query);
    console.log(`[DEBUG] Found ${rawAssets.length} raw assets from database`);
    
    if (rawAssets.length > 0) {
      console.log(`[DEBUG] Sample asset data:`, JSON.stringify(rawAssets[0], null, 2).substring(0, 200) + '...');
    }
    
    // Transform all assets to include detailed information
    console.log(`[DEBUG] Beginning asset transformation process for ${rawAssets.length} assets`);
    const assets = await Promise.all(
      rawAssets.map(asset => transformAssetData(asset))
    );
    console.log(`[DEBUG] Completed transformation of ${assets.length} assets`);
    
    // Handle author filtering (after transformation, since it relies on commit data)
    let filteredAssets = assets;
    if (req.query.author) {
      console.log(`[DEBUG] Filtering by author: "${req.query.author}"`);
      filteredAssets = assets.filter(asset => 
        asset.creator === req.query.author
      );
      console.log(`[DEBUG] After author filtering: ${filteredAssets.length} assets remaining`);
    }
    
    // Handle sorting
    if (req.query.sortBy) {
      console.log(`[DEBUG] Sorting assets by: "${req.query.sortBy}"`);
      switch (req.query.sortBy) {
        case 'name':
          filteredAssets.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'author':
          filteredAssets.sort((a, b) => a.creator.localeCompare(b.creator));
          break;
        case 'updated':
          filteredAssets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          break;
        case 'created':
          filteredAssets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        default:
          break;
      }
    }
    
    console.log(`[DEBUG] Returning ${filteredAssets.length} assets to client`);
    if (filteredAssets.length > 0) {
      console.log(`[DEBUG] Sample transformed asset:`, JSON.stringify(filteredAssets[0], null, 2).substring(0, 200) + '...');
    }
    
    res.status(200).json({ assets: filteredAssets });
  } catch (error) {
    console.error('[ERROR] Error fetching assets:', error);
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    // Find asset by assetName instead of assetId
    const assetName = req.params.id;
    console.log(`[DEBUG] getAssetById called with assetName: ${assetName}`);
    
    const asset = await Asset.findOne({ assetName });
    console.log(`[DEBUG] Asset found: ${asset ? 'Yes' : 'No'}`);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    const transformedAsset = await transformAssetData(asset);
    console.log(`[DEBUG] Transformed asset ready to return`);
    
    res.status(200).json({ asset: transformedAsset });
  } catch (error) {
    console.error(`[ERROR] Error fetching asset ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch asset details' });
  }
};

export const checkoutAsset = async (req: Request, res: Response) => {
  try {
    const assetName = req.params.id;
    const { pennId } = req.body;
    console.log(`[DEBUG] Checking out asset ${assetName} for user ${pennId}`);
    
    const asset = await Asset.findOne({ assetName });
    
    if (!asset) {
      console.log(`[DEBUG] Asset ${assetName} not found for checkout`);
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    if (asset.checkedOut) {
      console.log(`[DEBUG] Asset ${assetName} is already checked out`);
      return res.status(400).json({ message: 'Asset is already checked out' });
    }
    
    // Get the latest commit for this asset
    console.log(`[DEBUG] Getting latest commit for asset ${assetName} with commitId: ${asset.latestCommitId}`);
    const latestCommit = await Commit.findOne({ commitId: asset.latestCommitId });
    if (!latestCommit) {
      console.log(`[DEBUG] Latest commit not found for asset ${assetName}`);
      return res.status(404).json({ message: 'Asset commit data not found' });
    }
    console.log(`[DEBUG] Found latest commit: ${latestCommit.commitId}, version: ${latestCommit.versionNum}`);
    
    // Fetch file references from CommitFile collection
    console.log(`[DEBUG] Fetching commit files for commit ${latestCommit.commitId}`);
    const commitFiles = await CommitFile.findOne({ commitId: latestCommit.commitId });
    if (!commitFiles) {
      console.log(`[DEBUG] No file data found for commit ${latestCommit.commitId}`);
    } else {
      console.log(`[DEBUG] Retrieved file data for commit ${latestCommit.commitId}:`);
      // Log the commit files object structure
      console.log(JSON.stringify(commitFiles, null, 2));
      
      // Extract and log the file paths (keys that are not the commitId or MongoDB metadata)
      const filePaths = Object.keys(commitFiles.toObject()).filter(key => 
        key !== 'commitId' && key !== '_id' && key !== '__v'
      );
      console.log(`[DEBUG] File paths in commit: ${filePaths.join(', ')}`);
      
      // Log each file path and its corresponding S3 version ID
      filePaths.forEach(path => {
        console.log(`[DEBUG] File: ${path}, S3 Version ID: ${(commitFiles as any)[path]}`);
      });
    }
    
    // Update the asset to be checked out
    asset.checkedOut = true;
    asset.checkedOutBy = pennId || "willcai"; 
    await asset.save();
    console.log(`[DEBUG] Asset ${assetName} has been checked out by ${pennId || "willcai"}`);
    
    // Return the updated asset with a download URL
    const transformedAsset = await transformAssetData(asset);
    
    // Include a URL for downloading the asset
    res.status(200).json({ 
      asset: transformedAsset,
      downloadUrl: `/api/assets/${assetName}/download`
    });
  } catch (error) {
    console.error(`[ERROR] Error checking out asset ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to check out asset' });
  }
};

export const checkinAsset = async (req: Request, res: Response) => {
  try {
    const assetName = req.params.id;
    const { pennId, notes, versionUpdate, files } = req.body;
    console.log(`[DEBUG] Checking in asset ${assetName} for user ${pennId}`);

    const asset = await Asset.findOne({ assetName });

    if (!asset) {
      console.log(`[DEBUG] Asset ${assetName} not found for check-in`);
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (!asset.checkedOut) {
      console.log(`[DEBUG] Asset ${assetName} is not checked out`);
      return res.status(400).json({ message: 'Asset is not checked out' });
    }

    // TODO: Implement asset check-in functionality
    // - Update asset's checkedOut status to false
    asset.checkedOut = false;
    asset.checkedOutBy = null; // Clear the checkedOutBy field

    // - Create a new commit record
    const newCommit = new Commit({
      commitId: 'debug-random-commitid', // Generate a unique commit ID
      pennKey: pennId,
      versionNum: versionUpdate, // Assuming versionUpdate is provided in the request
      notes: notes,
      prevCommitId: asset.latestCommitId, // Assuming latestCommitId is the previous commit
      commitDate: new Date().toISOString(),
      hasMaterials: files && files.length > 0, // Assuming files indicate the presence of materials
      state: [], // You might want to populate this based on your application's logic
    });

    await newCommit.save();
    console.log(`[DEBUG] New commit created with ID: ${newCommit.commitId}`);

    // - Update the asset's latestCommitId
    asset.latestCommitId = newCommit.commitId;
    asset.lastApprovedId = newCommit.commitId; // Assuming the new commit is automatically approved
    await asset.save();
    console.log(`[DEBUG] Asset ${assetName} updated with latestCommitId: ${asset.latestCommitId}`);

    // - Create CommitFile entries for files (if any)
    // TODO: Implement CommitFile creation logic here
    // This will depend on how you are handling files (e.g., storing them in S3)

    // Return the updated asset
    const transformedAsset = await transformAssetData(asset);
    res.status(200).json({ asset: transformedAsset });
  } catch (error) {
    console.error(`[ERROR] Error checking in asset ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to check in asset' });
  }
};

export const downloadAsset = async (req: Request, res: Response) => {
  try {
    const assetName = req.params.id;
    console.log(`[DEBUG] Downloading asset ${assetName}`);

    // Find the asset by assetName
    const asset = await Asset.findOne({ assetName });

    if (!asset) {
      console.log(`[DEBUG] Asset ${assetName} not found for download`);
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Get the latest commit for this asset
    const latestCommit = await Commit.findOne({ commitId: asset.latestCommitId });
    if (!latestCommit) {
      console.log(`[DEBUG] Latest commit not found for asset ${assetName}`);
      return res.status(404).json({ message: 'Asset commit data not found' });
    }

    // Fetch file references from CommitFile collection
    const commitFiles = await CommitFile.findOne({ commitId: latestCommit.commitId });
    if (!commitFiles) {
      console.log(`[DEBUG] No file data found for commit ${latestCommit.commitId}`);
      return res.status(404).json({ message: 'Asset file data not found' });
    }

    console.log(`[DEBUG] Retrieved file data for commit ${latestCommit.commitId}:`, commitFiles);

    try {
      // Download the asset folder as a zip
      console.log(`[DEBUG] Starting download process for asset ${assetName}`);
      const zipBuffer = await downloadAssetFolderAsZip(assetName);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${assetName}.zip`);
      res.setHeader('Content-Length', zipBuffer.length);
      
      // Send the zip file
      res.send(zipBuffer);
      console.log(`[DEBUG] Successfully sent zip file for asset ${assetName}`);
    } catch (error) {
      console.error(`[ERROR] Error creating zip file:`, error);
      res.status(500).json({ message: 'Failed to create zip file' });
    }
  } catch (error) {
    console.error(`[ERROR] Error downloading asset ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to download asset' });
  }
};