import { Router } from 'express';
import multer from 'multer';
import { uploadController } from './upload.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/upload/{folder}:
 *   post:
 *     summary: Upload single file
 *     tags: [Upload]
 */
router.post('/:folder', upload.single('file'), uploadController.uploadFile);

/**
 * @swagger
 * /api/v1/upload/{folder}/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Upload]
 */
router.post('/:folder/multiple', upload.array('files', 10), uploadController.uploadFiles);

/**
 * @swagger
 * /api/v1/upload/delete:
 *   post:
 *     summary: Delete file
 *     tags: [Upload]
 */
router.post('/delete', uploadController.deleteFile);

/**
 * @swagger
 * /api/v1/upload/presigned:
 *   post:
 *     summary: Get presigned URL for direct upload
 *     tags: [Upload]
 */
router.post('/presigned', uploadController.getPresignedUrl);

export default router;
