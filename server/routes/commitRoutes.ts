
import { Router } from 'express';
import * as commitController from '../controllers/commitController';

const router = Router();

// GET /api/commits - Get all commits with optional filtering
router.get('/', commitController.getCommits);

// GET /api/commits/:id - Get a single commit by ID
router.get('/:id', commitController.getCommitById);

// POST /api/commits/:id/approve - Approve a commit
router.post('/:id/approve', commitController.approveCommit);

// GET /api/commits/:id/files - Get files for a commit
router.get('/:id/files', commitController.getCommitFiles);

export default router;
