const mongoose = require('mongoose');
const fs = require('fs');
const moment = require('moment');
const Commit = require('./Commit');
const CommitFiles = require('./CommitFile');
const Asset = require('./Asset'); 

let commitIdCounter = 1; // Start from 0000001 for commitId
let assetIdCounter = 1;

async function getAssetByName(assetName) {
  try {
      const asset = await Asset.findOne({ assetName });

      if (!asset) {
          console.log(`Asset not found: ${assetName}`);
          return null;
      }

      console.log(`Asset found:`, asset);
      return asset;
  } catch (error) {
      console.error('Error retrieving asset:', error);
      throw new Error('Failed to retrieve asset');
  }
}

async function addNewCommitFromFile(metadataFilePath) {
  try {
      const rawData = fs.readFileSync(metadataFilePath);
      const commitData = JSON.parse(rawData);

      const newCommit = new Commit({
          commitId: commitData.commitId,
          pennKey: commitData.pennKey,
          versionNum: commitData.versionNum,
          notes: commitData.notes,
          prevCommitId: commitData.prevCommitId || null,
          commitDate: moment(commitData.commitDate).utc().toISOString(),
          hasMaterials: commitData.hasMaterials,
          state: commitData.state
      });
      
      const savedCommit = await newCommit.save();
      console.log('Commit successfully added:', savedCommit);

      const newCommitFiles = new CommitFiles({
          commitId: commitData.commitId,
          files: commitData.files 
      });

      const savedCommitFiles = await newCommitFiles.save();
      console.log('Commit files successfully added:', savedCommitFiles);
  } catch (err) {
      console.error('Error adding new commit:', err);
  }
}

async function addTestCommit() {
  try {
      // Format commitId with leading zeros (e.g., 0000001, 0000002, etc.)
      const commitId = commitIdCounter.toString().padStart(7, '0'); 

      const commitData = {
          commitId: commitId,
          pennKey: "testUser",
          versionNum: "00.00.00",
          notes: "This is a commit for testing.",
          prevCommitId: null,
          commitDate: moment().utc().toISOString(),
          hasMaterials: false,
          state: ["latest"],
          files: {
              "asset${commitId}.usd": "s3://test-bucket/asset${commitId}.usd",
              "thumbnail${commitId}.png": "s3://test-bucket/thumbnail${commitId}.png",
              "asset${commitId}_lod1.usd": "s3://test-bucket/asset${commitId}_lod1.usd",
              "asset${commitId}_lod2.usd": "s3://test-bucket/asset${commitId}_lod2.usd"
          }
      };

      const newCommit = new Commit({
          commitId: commitData.commitId,
          pennKey: commitData.pennKey,
          versionNum: commitData.versionNum,
          notes: commitData.notes,
          prevCommitId: commitData.prevCommitId,
          commitDate: commitData.commitDate,
          hasMaterials: commitData.hasMaterials,
          state: commitData.state
      });
      
      const savedCommit = await newCommit.save();
      console.log('Test commit successfully added:', savedCommit);

      const newCommitFiles = new CommitFiles({
          commitId: commitData.commitId,
          ...commitData.files
      });

      const savedCommitFiles = await newCommitFiles.save();
      console.log('Test commit files successfully added:', savedCommitFiles);
      commitIdCounter++;
  } catch (err) {
      console.error('Error adding test commit:', err);
  }
}

async function addTestAsset() {
  try {
      const assetId = assetIdCounter.toString().padStart(7, '0');
      const latestCommitId = commitIdCounter - 1; // Use the last commitId as the latestCommitId
      const lastApprovedId = commitIdCounter - 1; // Use the last commitId as lastApprovedId

      const assetData = {
          assetId: assetId,
          assetName: `Asset_${assetId}`,
          keywords: ["test", "asset"],
          checkedOut: false,
          latestCommitId: latestCommitId,
          lastApprovedId: lastApprovedId
      };

      const newAsset = new Asset(assetData);
      const savedAsset = await newAsset.save();
      console.log('Test asset successfully added:', savedAsset);

      assetIdCounter++; // Increment assetIdCounter for the next asset
  } catch (err) {
      console.error('Error adding test asset:', err);
  }
}

module.exports = {
  getAssetByName, 
  addNewCommitFromFile
};
  
async function main() {
  try {
    // Replace <username> and <password> with your MongoDB Atlas credentials.
    // Replace <cluster-url> with your cluster's URL (found in MongoDB Atlas under "Connect").
    // Replace <database> with your database name.
    await mongoose.connect('mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
  });
    console.log('Connected to MongoDB!');
    
    //const metadataFilePath = 'beegCrab/metadata.json'; // Update with the correct file path
    //await addNewAssetFromFile(metadataFilePath);

    // add as many test commits as you want
    await addTestCommit();
    await addTestCommit();
    await addTestCommit();

    mongoose.connection.close();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

main();