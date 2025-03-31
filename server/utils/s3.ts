import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { Request } from 'express';
import { Readable } from 'stream';

// Define custom interface to extend Express Request
interface CustomRequest extends Request {
  body: {
    commitId?: string;
    assetName?: string;
    [key: string]: any;
  }
}

// Configure AWS S3 Client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'PLACEHOLDER_ACCESS_KEY',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'PLACEHOLDER_SECRET_KEY',
  },
  region: process.env.AWS_REGION || 'us-east-1'
});

const bucketName = process.env.S3_BUCKET_NAME || 'asset-management-files';

// Verify S3 connection on startup
export const verifyS3Connection = async () => {
  try {
    console.log('Verifying S3 connection...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    const bucketExists = response.Buckets?.some(bucket => bucket.Name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Successfully connected to S3 and bucket "${bucketName}" exists.`);
    } else {
      console.warn(`⚠️ Connected to S3, but bucket "${bucketName}" was not found.`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to S3:', error);
    console.error('Please check your AWS credentials and bucket configuration.');
    // Don't throw - allow application to continue even with S3 issues
    return false;
  }
};

// Set up multer for file uploads with multer-s3 v3 compatibility
export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: CustomRequest, file, cb) {
      const commitId = req.body.commitId || 'default';
      const assetName = req.body.assetName || 'asset';
      const fileKey = `${assetName}/${commitId}/${file.originalname}`;
      cb(null, fileKey);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.usd', '.usda', '.png', '.jpg', '.jpeg', '.glb'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed types: ${allowedExtensions.join(', ')}`));
      return;
    }
  }
});

// Function to get a file from S3
export const getFileFromS3 = async (key: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3Client.send(command);
    return response.Body as Readable;
  } catch (error) {
    console.error(`Error getting file ${key} from S3:`, error);
    throw error;
  }
};

// Function to upload a file to S3 programmatically
export const uploadFileToS3 = async (buffer: Buffer, key: string, contentType: string) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });
    
    await s3Client.send(command);
    // Generate a URL for the uploaded file
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Error uploading file ${key} to S3:`, error);
    throw error;
  }
};

// Function to delete a file from S3
export const deleteFileFromS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${key} from S3:`, error);
    throw error;
  }
};

// Function to check if a file exists in S3
export const checkFileExistsInS3 = async (key: string) => {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
};