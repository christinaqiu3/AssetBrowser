
import mongoose, { Schema, Document } from 'mongoose';

export interface IAsset extends Document {
  assetId: number;
  assetName: string;
  keywords: string[];
  checkedOut: boolean;
  latestCommitId: number;
  lastApprovedId: number;
}

const AssetSchema: Schema = new Schema({
  assetId: {
    type: Number,
    required: true,
    unique: true
  },
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
  latestCommitId: {
    type: Number,
    required: true
  },
  lastApprovedId: {
    type: Number,
    required: true
  }
}, { timestamps: true });

export default mongoose.model<IAsset>('Asset', AssetSchema);
