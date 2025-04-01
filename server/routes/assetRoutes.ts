import { Router, RequestHandler } from 'express';
import * as assetController from '../controllers/assetController';
import { listObjectsInS3, listObjectsInS3WithPrefix, checkFileExistsInS3, getFileFromS3 } from '../utils/s3';

const router = Router();

// GET /api/assets - Get all assets with optional filtering
router.get('/', assetController.getAssets as RequestHandler);

// GET /api/assets/:id - Get a single asset by ID
router.get('/:id', assetController.getAssetById as RequestHandler);

// POST /api/assets/:id/checkout - Check out an asset
router.post('/:id/checkout', assetController.checkoutAsset as RequestHandler);

// POST /api/assets/:id/checkin - Check in an asset
router.post('/:id/checkin', assetController.checkinAsset as RequestHandler);

// GET /api/assets/:id/download - Download an asset
router.get('/:id/download', assetController.downloadAsset as RequestHandler);

// Debug route to test S3 bucket structure
router.get('/debug/s3-structure', async (req, res) => {
  try {
    console.log('[DEBUG] Testing S3 bucket structure');
    
    // List all objects in the bucket
    const allObjects = await listObjectsInS3();
    
    // List objects in the Week4Assets folder
    const week4Objects = await listObjectsInS3WithPrefix('Week4Assets/');
    
    // Get unique top-level folders in Week4Assets
    const topLevelFolders = new Set<string>();
    week4Objects?.forEach(obj => {
      if (obj.Key) {
        const parts = obj.Key.split('/');
        if (parts.length > 1 && parts[0] === 'Week4Assets' && parts[1]) {
          topLevelFolders.add(parts[1]);
        }
      }
    });
    
    res.json({
      totalObjects: allObjects?.length || 0,
      week4AssetsObjects: week4Objects?.length || 0,
      topLevelFolders: Array.from(topLevelFolders),
      sampleObjects: allObjects?.slice(0, 10).map(obj => obj.Key) || []
    });
  } catch (error) {
    console.error('[ERROR] Error testing S3 bucket structure:', error);
    res.status(500).json({ error: 'Failed to test S3 bucket structure' });
  }
});

// Route to serve asset thumbnails
router.get('/:assetName/thumbnail', (async (req, res) => {
  try {
    const { assetName } = req.params;
    console.log(`[DEBUG] Fetching thumbnail for asset: ${assetName}`);
    
    // The path to the thumbnail in the S3 bucket
    const thumbnailKey = `Week4Assets/${assetName}/thumbnail.png`;
    
    // Check if the thumbnail exists
    const exists = await checkFileExistsInS3(thumbnailKey);
    if (!exists) {
      console.log(`[DEBUG] Thumbnail not found for asset: ${assetName} at path: ${thumbnailKey}`);
      
      // Try to find any PNG files in the asset folder
      const assetObjects = await listObjectsInS3WithPrefix(`Week4Assets/${assetName}/`);
      const pngFiles = assetObjects?.filter(obj => obj.Key?.toLowerCase().endsWith('.png')) || [];
      
      if (pngFiles.length > 0) {
        const firstPngKey = pngFiles[0].Key;
        
        if (firstPngKey) {
          console.log(`[DEBUG] Using first PNG file as thumbnail: ${firstPngKey}`);
          
          // Get the file from S3
          const fileStream = await getFileFromS3(firstPngKey);
          
          // Set appropriate headers
          res.setHeader('Content-Type', 'image/png');
          
          // Pipe the file stream to the response
          fileStream.pipe(res);
          return;
        }
      }
      
      // If no PNG files found, return a 404
      return res.status(404).send('Thumbnail not found');
    }
    
    // Get the file from S3
    const fileStream = await getFileFromS3(thumbnailKey);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/png');
    
    // Pipe the file stream to the response
    fileStream.pipe(res);
  } catch (error) {
    console.error(`[ERROR] Error serving thumbnail:`, error);
    res.status(500).send('Error serving thumbnail');
  }
}) as RequestHandler);

export default router;