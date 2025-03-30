
import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

// GET /api/users - Get all users
router.get('/', userController.getUsers);

// GET /api/users/:id - Get a single user by pennId
router.get('/:id', userController.getUserById);

// POST /api/users/login - Authenticate user
router.post('/login', userController.authenticateUser);

export default router;
