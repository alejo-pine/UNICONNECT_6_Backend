import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { promisify } from 'node:util';
import { asyncHandler } from '../../../utils/controller';
import {
  getProfileById,
  getProfiles,
  getPublicProfile,
  updateProfile,
  uploadAvatar,
} from './profilesController';

const router: Router = Router();

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

const avatarUploadHandler = avatarUpload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'avatar', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

type MulterUpload = (
  req: Request,
  res: Response,
  callback: (error?: unknown) => void
) => void;

const runAvatarUpload = promisify(avatarUploadHandler as MulterUpload);

const avatarUploadMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await runAvatarUpload(req, res);
    next();
  } catch (err: unknown) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          error: 'Archivo demasiado grande. Maximo permitido: 8MB',
          statusCode: 413,
        });
        return;
      }

      res.status(400).json({
        error: 'Error de carga multipart/form-data',
        statusCode: 400,
      });
      return;
    }

    next(err);
  }
};

router.get('/', asyncHandler(getProfiles));
router.get('/:id/public', asyncHandler(getPublicProfile));
router.get('/:id', asyncHandler(getProfileById));
router.put('/:id', asyncHandler(updateProfile));

router.post('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.put('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.patch('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));

router.post('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.put('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.patch('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));

router.post('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.put('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.patch('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

router.post('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.put('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));
router.patch('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

export default router;
