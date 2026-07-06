import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync, writeFileSync, unlinkSync } from 'fs';
import db from '../../../_lib/db';

export const runtime = 'nodejs';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB max (after client compression)

type Params = { params: Promise<{ slug?: string[] }> };

// POST /api/images/:contract/:teamNo/:weekKey/:day
export async function POST(req: Request, { params }: Params) {
  const { slug = [] } = await params;
  if (slug.length !== 4) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [contract, teamNo, weekKey, day] = slug;

  const form = await req.formData();
  const file = form.get('image');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 413 });

  mkdirSync(UPLOADS_DIR, { recursive: true });
  const ext = extname(file.name) || '.jpg';
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(join(UPLOADS_DIR, filename), buffer);

  const created = await db.image.create({
    data: { contract, teamNo, weekKey, day, filename, originalName: file.name },
    select: { id: true },
  });

  return NextResponse.json({
    id: created.id,
    name: file.name,
    url: `/uploads/${filename}`,
  });
}

// DELETE /api/images/:imageId
export async function DELETE(_req: Request, { params }: Params) {
  const { slug = [] } = await params;
  if (slug.length !== 1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const imageId = slug[0];
  // MongoDB ids are 24-char hex ObjectIds; reject anything else as not found
  // so Prisma doesn't throw on a malformed id.
  if (!/^[a-f\d]{24}$/i.test(imageId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const row = await db.image.findUnique({
    where: { id: imageId },
    select: { filename: true },
  });
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.image.delete({ where: { id: imageId } });

  // best-effort file delete
  try { unlinkSync(join(UPLOADS_DIR, row.filename)); } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}
