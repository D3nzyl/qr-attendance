import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import db from '../../../../../../_lib/db';

export const runtime = 'nodejs';

type Params = { params: Promise<{ contract: string; teamNo: string; weekKey: string; day: string }> };

// PUT /api/day/:contract/:teamNo/:weekKey/:day — upsert a day
export async function PUT(req: Request, { params }: Params) {
  const { contract, teamNo, weekKey, day } = await params;
  const { company = '', ...dayData } = await req.json();
  const data = dayData as Prisma.InputJsonValue;
  await db.day.upsert({
    where: { contract_teamNo_weekKey_day: { contract, teamNo, weekKey, day } },
    update: { company, data },
    create: { contract, teamNo, weekKey, day, company, data },
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/day/:contract/:teamNo/:weekKey/:day — clear a day
export async function DELETE(_req: Request, { params }: Params) {
  const { contract, teamNo, weekKey, day } = await params;
  // also remove image records (files cleaned up separately or left for manual cleanup)
  await Promise.all([
    db.day.deleteMany({ where: { contract, teamNo, weekKey, day } }),
    db.image.deleteMany({ where: { contract, teamNo, weekKey, day } }),
  ]);
  return NextResponse.json({ ok: true });
}
