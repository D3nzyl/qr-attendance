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
    select: { day: true, company: true, data: true },
  });

  const result: { company: string; days: Record<string, unknown> } = { company: '', days: {} };
  for (const row of rows) {
    if (row.company) result.company = row.company;
    result.days[row.day] = row.data ?? {};
  }
  return NextResponse.json(result);
}
