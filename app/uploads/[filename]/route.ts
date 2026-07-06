import { NextResponse } from 'next/server';
import { basename, extname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

export const runtime = 'nodejs';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

// GET /uploads/:filename — serve a user-uploaded image
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const safe = basename(filename); // guard against path traversal
  const filePath = join(UPLOADS_DIR, safe);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const file = readFileSync(filePath);
  const contentType = MIME[extname(safe).toLowerCase()] ?? 'application/octet-stream';
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
