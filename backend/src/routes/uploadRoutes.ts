import { Router, Request, Response, NextFunction } from 'express';
import authenticate from '../middleware/auth';
import { upload, handleFileUpload } from '../controllers/uploadController';

const router = Router();

// Upload middleware with custom error handling for multer errors
router.post(
  '/',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum limit of 15MB' });
        }
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      next();
    });
  },
  handleFileUpload
);

export default router;
