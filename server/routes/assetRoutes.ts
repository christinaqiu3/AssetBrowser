import { Router, RequestHandler } from 'express';
import * as assetController from '../controllers/assetController';

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

export default router;