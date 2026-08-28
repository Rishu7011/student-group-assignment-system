import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ── Storage strategy ─────────────────────────────────────────────────────────
// On Vercel (serverless), the filesystem is read-only except for /tmp.
// Use /tmp/uploads when running on Vercel, ./uploads locally.
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
  ? '/tmp/uploads'
  : path.join(process.cwd(), 'uploads');

// Ensure folder exists (safe on both local and Vercel /tmp)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Re-create /tmp/uploads lazily in case it was wiped between invocations
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

// File filter (PDF, Word docs, images)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC/DOCX, and images (PNG, JPG, WebP) are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter,
});

export function handleFileUpload(req: Request, res: Response): void {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  // On Vercel, /tmp is ephemeral — return relative path same as locally
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    message: 'File uploaded successfully',
    file_url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
}
