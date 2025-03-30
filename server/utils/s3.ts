
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'PLACEHOLDER_ACCESS_KEY',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'PLACEHOLDER_SECRET_KEY',
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME || 'asset-management-files';

// Set up multer for file uploads
export const upload = multer({
  storage: multerS3({
    s3,
    bucket: bucketName,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const commitId = req.body.commitId;
      const assetName = req.body.assetName;
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
      cb(new Error('File type not supported'));
      return;
    }
  }
});

// Function to get a file from S3
export const getFileFromS3 = async (key: string) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    return s3.getObject(params).createReadStream();
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw error;
  }
};

// Function to upload a file to S3 programmatically
export const uploadFileToS3 = async (buffer: Buffer, key: string, contentType: string) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Function to delete a file from S3
export const deleteFileFromS3 = async (key: string) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Function to check if a file exists in S3
export const checkFileExistsInS3 = async (key: string) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: key
    };
    
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    return false;
  }
};
