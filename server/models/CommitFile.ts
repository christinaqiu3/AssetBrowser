
import mongoose, { Schema, Document } from 'mongoose';

export interface ICommitFile extends Document {
  commitId: string;
  [key: string]: any; // For dynamic fields (file paths to S3 UIDs)
}

const CommitFileSchema: Schema = new Schema({
  commitId: {
    type: String,
    required: true,
    unique: true
  }
}, { strict: false }); // Allow for dynamic fields

export default mongoose.model<ICommitFile>('CommitFile', CommitFileSchema);
