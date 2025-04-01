import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListBucketsCommand, GetObjectCommandOutput, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
    [key: string]: unknown;
  }
}

// Configure AWS S3 Client
const s3Client = new S3Client({
  credentials: {
    // accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
    // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
    accessKeyId: '',
    secretAccessKey: '',
  },
  region: 'us-east-2'
});

// const bucketName = process.env.S3_BUCKET_NAME || 'production-pipelines-spring2025';
const bucketName = 'production-pipelines-spring2025';

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

// Function to get a signed URL for an asset thumbnail
export const getAssetThumbnailUrl = async (assetName: string) => {
  try {
    console.log(`[DEBUG] Looking for thumbnail for asset: ${assetName}`);
    
    // First, check if the Week4Assets folder exists and list its contents
    console.log(`[DEBUG] Listing objects in the S3 bucket with prefix 'Week4Assets/'`);
    const rootObjects = await listObjectsInS3WithPrefix('Week4Assets/');
    if (!rootObjects || rootObjects.length === 0) {
      console.log(`[DEBUG] No objects found with prefix 'Week4Assets/'`);
      return null;
    }
    
    // Log the first few objects to see the structure
    console.log(`[DEBUG] Found ${rootObjects.length} objects in 'Week4Assets/'`);
    rootObjects.slice(0, 5).forEach(obj => {
      console.log(`[DEBUG] - ${obj.Key}`);
    });
    
    // Check if the asset folder exists
    const assetFolderPrefix = `Week4Assets/${assetName}/`;
    console.log(`[DEBUG] Looking for asset folder: ${assetFolderPrefix}`);
    const assetObjects = await listObjectsInS3WithPrefix(assetFolderPrefix);
    
    if (!assetObjects || assetObjects.length === 0) {
      console.log(`[DEBUG] No objects found in asset folder: ${assetFolderPrefix}`);
      return null;
    }
    
    // Log all objects in the asset folder
    console.log(`[DEBUG] Found ${assetObjects.length} objects in asset folder:`);
    assetObjects.forEach(obj => {
      console.log(`[DEBUG] - ${obj.Key}`);
    });
    
    // The path to the thumbnail in the S3 bucket
    const thumbnailKey = `Week4Assets/${assetName}/thumbnail.png`;
    
    // Check if the thumbnail exists
    const exists = await checkFileExistsInS3(thumbnailKey);
    if (!exists) {
      console.log(`[DEBUG] Thumbnail not found for asset: ${assetName} at path: ${thumbnailKey}`);
      
      // Try to find any PNG files in the asset folder that might be thumbnails
      const pngFiles = assetObjects.filter(obj => obj.Key?.toLowerCase().endsWith('.png'));
      if (pngFiles.length > 0) {
        console.log(`[DEBUG] Found ${pngFiles.length} PNG files in asset folder:`);
        pngFiles.forEach(obj => {
          console.log(`[DEBUG] - ${obj.Key}`);
        });
        
        // Use the first PNG file as the thumbnail
        const firstPngKey = pngFiles[0].Key;
        if (firstPngKey) {
          console.log(`[DEBUG] Using first PNG file as thumbnail: ${firstPngKey}`);
          return `https://${bucketName}.s3.amazonaws.com/${firstPngKey}`;
        }
      }
      
      return null;
    }
    
    // Generate a URL for the thumbnail
    return `https://${bucketName}.s3.amazonaws.com/${thumbnailKey}`;
  } catch (error) {
    console.error(`[ERROR] Error getting thumbnail URL for asset ${assetName}:`, error);
    return null;
  }
};

// Function to list objects in the S3 bucket
export const listObjectsInS3 = async () => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName
    });
    
    const response = await s3Client.send(command);
    return response.Contents;
  } catch (error) {
    console.error(`Error listing objects in S3 bucket ${bucketName}:`, error);
    throw error;
  }
};

// Function to list objects in the S3 bucket with prefix
export const listObjectsInS3WithPrefix = async (prefix: string) => {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix
    });
    
    const response = await s3Client.send(command);
    return response.Contents;
  } catch (error) {
    console.error(`Error listing objects in S3 bucket ${bucketName} with prefix ${prefix}:`, error);
    throw error;
  }
};