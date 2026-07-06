import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { RunResult } from 'better-sqlite3';
import db from '../db.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max (after client compression)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// POST /api/images/:contract/:teamNo/:weekKey/:day
router.post('/:contract/:teamNo/:weekKey/:day', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { contract, teamNo, weekKey, day } = req.params;

  const result: RunResult = db.prepare(
    'INSERT INTO images (contract, team_no, week_key, day, filename, original_name) VALUES (?,?,?,?,?,?)'
  ).run(contract, teamNo, weekKey, day, req.file.filename, req.file.originalname);

  res.json({
    id: String(result.lastInsertRowid),
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
  });
});

// DELETE /api/images/:imageId
router.delete('/:imageId', (req: Request, res: Response) => {
  const row = db.prepare('SELECT filename FROM images WHERE id=?').get(req.params.imageId) as
    | { filename: string }
    | undefined;
  if (!row) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM images WHERE id=?').run(req.params.imageId);

  // best-effort file delete
  import('fs').then(({ unlinkSync }) => {
    try { unlinkSync(`uploads/${row.filename}`); } catch { /* ignore */ }
  });

  res.json({ ok: true });
});

export default router;
