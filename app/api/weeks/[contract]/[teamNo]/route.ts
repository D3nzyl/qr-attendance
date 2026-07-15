import { NextResponse } from 'next/server';
import db from '../../../../_lib/db';

export const runtime = 'nodejs';

// GET /api/weeks/:contract/:teamNo — list all weekKeys that have data
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contract: string; teamNo: string }> },
) {
  const { contract, teamNo } = await params;
  const rows = await db.day.findMany({
    where: { contract, teamNo },
    distinct: ['weekKey'],
    orderBy: { weekKey: 'desc' },
    select: { weekKey: true },
  });
  return NextResponse.json(rows.map((r) => r.weekKey));
}
