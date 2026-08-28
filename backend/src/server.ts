import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import path from 'path';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import submissionRoutes from './routes/submissionRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import uploadRoutes from './routes/uploadRoutes';
import courseRoutes from './routes/courseRoutes';
import { seedSystemAdmin } from './scripts/seedAdmin';

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static Files (Uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/courses', courseRoutes);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start (Only if run directly, not in Vercel serverless) ───────────────────
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    // Ensure the system admin account exists (idempotent)
    await seedSystemAdmin();
  });
}

export default app;
