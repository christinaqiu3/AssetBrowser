
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  assetName: {
    type: String,
    required: true
  },
  keywords: {
    type: [String],
    default: []
  },
  checkedOut: {
    type: Boolean,
    default: false
  },
  checkedOutBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assetState: {
    type: String,
    default: 'Active'
  },
  commitId: {
    type: Number,
    required: true
  },
  thumbnailUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for frontend id (compatible with existing code)
AssetSchema.virtual('id').get(function() {
  return `asset-${this._id}`;
});

// Configure to include virtuals when converted to JSON
AssetSchema.set('toJSON', { virtuals: true });
AssetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Asset', AssetSchema);
