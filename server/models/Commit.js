
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommitSchema = new Schema({
  commitId: {
    type: Number,
    required: true,
    unique: true
  },
  pennKey: {
    type: String,
    required: true
  },
  versionNum: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  prevCommitId: {
    type: Number,
    default: null
  },
  commitDate: {
    type: Date,
    default: Date.now
  },
  hasMaterials: {
    type: Boolean,
    default: false
  },
  assetId: {
    type: Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  }
});

module.exports = mongoose.model('Commit', CommitSchema);
