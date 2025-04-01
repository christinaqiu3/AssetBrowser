import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  assetName: string;
  keywords: string[];
  checkedOut: boolean;
  checkedOutBy: string | null;
  latestCommitId: string;
  lastApprovedId: string | null;
}

const AssetSchema: Schema = new Schema({
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
    type: String,
    default: null
  },
  latestCommitId: {
    type: String,
    required: true
  },
  lastApprovedId: {
    type: String,
    required: false,
    default: null
  }
}, { 
  timestamps: true,
  collection: 'assets' 
});

export default mongoose.model<IAsset>('Asset', AssetSchema);