import mongoose, { Schema, Document } from 'mongoose';

export interface ICommit extends Document {
  commitId: string;
  pennKey: string;
  versionNum: string;
  notes: string;
  prevCommitId: string | null;
  commitDate: string;
  hasMaterials: boolean;
  state: string[];
}

const CommitSchema: Schema = new Schema({
  commitId: {
    type: String,
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
  notes: {
    type: String,
    default: ''
  },
  prevCommitId: {
    type: String,
    default: null
  },
  commitDate: {
    type: String,
    required: true
  },
  hasMaterials: {
    type: Boolean,
    default: false
  },
  state: {
    type: [String],
    default: []
  }
}, {
  collection: 'commits'
});

export default mongoose.model<ICommit>('Commit', CommitSchema);
