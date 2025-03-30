
import { Router } from 'express';
import * as assetController from '../controllers/assetController';

const router = Router();

// GET /api/assets - Get all assets with optional filtering
router.get('/', assetController.getAssets);

// GET /api/assets/:id - Get a single asset by ID
router.get('/:id', assetController.getAssetById);

// POST /api/assets/:id/checkout - Check out an asset
router.post('/:id/checkout', assetController.checkoutAsset);

// POST /api/assets/:id/checkin - Check in an asset
router.post('/:id/checkin', assetController.checkinAsset);

// GET /api/assets/:id/download - Download an asset
router.get('/:id/download', assetController.downloadAsset);

export default router;
