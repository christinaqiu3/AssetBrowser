const mongoose = require('mongoose');
const fs = require('fs');
const moment = require('moment');
const Commit = require('./Commit');
const CommitFiles = require('./CommitFile');

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
      const commitData = {
          commitId: 000000000,
          pennKey: "testUser",
          versionNum: "00.00.00",
          notes: "This is a commit for testing.",
          prevCommitId: null,
          commitDate: moment().utc().toISOString(),
          hasMaterials: false,
          state: ["latest"],
          files: {
              "asset000000000.usd": "s3://test-bucket/asset000000000.usd",
              "thumbnail000000000.png": "s3://test-bucket/thumbnail000000000.png",
              "asset000000000_lod1.usd": "s3://test-bucket/asset000000000_lod1.usd",
              "asset000000000_lod2.usd": "s3://test-bucket/asset000000000_lod2.usd"
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
  } catch (err) {
      console.error('Error adding test commit:', err);
  }
}
  
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

      await addTestCommit();

      mongoose.connection.close();
    } catch (err) {
      console.error('Connection error:', err);
    }
  }
  
  main();