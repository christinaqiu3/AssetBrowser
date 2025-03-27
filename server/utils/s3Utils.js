
/**
 * Utility functions for S3 interaction
 */
const generatePreSignedUrl = (s3, bucketName, key, operation, expiresIn = 3600) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: expiresIn
  };
  
  return s3.getSignedUrlPromise(operation, params);
};

const generateThumbnailUrl = async (s3, bucketName, assetId) => {
  try {
    const key = `thumbnails/${assetId}.jpg`;
    return await generatePreSignedUrl(s3, bucketName, key, 'getObject');
  } catch (error) {
    console.error('Failed to generate thumbnail URL:', error);
    // Return a default placeholder if the thumbnail doesn't exist
    return '/placeholder.jpg';
  }
};

const generateDownloadUrl = async (s3, bucketName, assetId) => {
  try {
    const key = `assets/${assetId}/latest.zip`;
    return await generatePreSignedUrl(s3, bucketName, key, 'getObject');
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw new Error('Asset file not found');
  }
};

module.exports = {
  generatePreSignedUrl,
  generateThumbnailUrl,
  generateDownloadUrl
};
