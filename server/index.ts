import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import dataRouter from './routes/data.js';
import uploadRouter from './routes/upload.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = join(__dirname, '..', 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(UPLOADS_DIR));

// API routes
app.use('/api', dataRouter);
app.use('/api/images', uploadRouter);

// Serve built Vite frontend in production
const DIST = join(__dirname, '..', 'dist');
app.use(express.static(DIST));
app.get('/{*path}', (req: Request, res: Response) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
