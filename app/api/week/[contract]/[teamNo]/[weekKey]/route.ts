import { NextResponse } from 'next/server';
import db from '../../../../../_lib/db';

export const runtime = 'nodejs';

// GET /api/week/:contract/:teamNo/:weekKey — full week data for one week
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contract: string; teamNo: string; weekKey: string }> },
) {
  const { contract, teamNo, weekKey } = await params;
  const rows = await db.day.findMany({
    where: { contract, teamNo, weekKey },
    select: {
      day: true,
      company: true,
      data: true,
      // Pull each day's images via the relation instead of the JSON blob.
      images: { select: { id: true, originalName: true, filename: true } },
    },
  });

  const result: { company: string; days: Record<string, unknown> } = { company: '', days: {} };
  for (const row of rows) {
    if (row.company) result.company = row.company;
    const data = (row.data ?? {}) as Record<string, unknown>;
    // Relation is the source of truth for images; overlay it onto the payload.
    data.images = row.images.map((img) => ({
      id: img.id,
      name: img.originalName,
      url: `/api/images/file/${img.filename}`,
    }));
    result.days[row.day] = data;
  }
  return NextResponse.json(result);
}
