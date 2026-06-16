import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import authMiddleware from '../../../middleware/auth';
import { requireRole } from '../../../middleware/requireRole';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from './controllers/categoryController';

const router = Router();

// Rutas públicas (o al menos autenticadas pero sin rol de admin)
router.get('/', authMiddleware, asyncHandler(getAllCategories));

// Rutas de administración (requieren super_admin)
router.post('/', authMiddleware, requireRole('super_admin'), asyncHandler(createCategory));
router.put('/:id', authMiddleware, requireRole('super_admin'), asyncHandler(updateCategory));
router.delete('/:id', authMiddleware, requireRole('super_admin'), asyncHandler(deleteCategory));

export default router;
