import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import db from '../../../../../../_lib/db';
import { commitTempObject, keyFromImageUrl } from '../../../../../../_lib/image-store';
import { s3, S3_BUCKET } from '../../../../../../_lib/s3';
import { getScope } from '../../../../../../_lib/scope';

export const runtime = 'nodejs';

type Params = { params: Promise<{ contract: string; teamNo: string; weekKey: string; day: string }> };

// The image refs the client sends back in the save payload.
type ImageRefInput = { id?: string; name?: string; url?: string };

// PUT /api/day/:contract/:teamNo/:weekKey/:day — upsert a day and commit its images
export async function PUT(req: Request, { params }: Params) {
  const { contract, teamNo, weekKey, day } = await params;

  // A Day is scoped to a workspace/solution (required on create).
  const { workspaceId, solutionId } = getScope(req);
  if (!workspaceId || !solutionId) {
    return NextResponse.json({ error: 'Missing workspace/solution scope' }, { status: 400 });
  }

  // Images live in their own collection (relation), so keep them out of the JSON blob.
  const { company = '', images, ...dayData } = await req.json();
  const data = dayData as Prisma.InputJsonValue;

  const dayRow = await db.day.upsert({
    where: { contract_teamNo_weekKey_day: { contract, teamNo, weekKey, day } },
    update: { company, data, workspaceId, solutionId },
    create: { contract, teamNo, weekKey, day, company, data, workspaceId, solutionId },
    select: { id: true },
  });

  // The save payload carries the authoritative image set, so reconcile it here.
  if (Array.isArray(images)) {
    await reconcileImages(dayRow.id, workspaceId, solutionId, images);
  }

  return NextResponse.json({ ok: true });
}

/**
 * Make the day's Image rows and S3 objects match the set the client saved:
 * promote newly-staged temp objects (creating their records), drop committed
 * images the user removed, and leave untouched images alone.
 */
async function reconcileImages(
  dayId: string,
  workspaceId: string,
  solutionId: string,
  images: ImageRefInput[],
): Promise<void> {
  const existing = await db.image.findMany({
    where: { dayId },
    select: { id: true, filename: true },
  });

  const keepIds = new Set<string>();

  for (const ref of images) {
    const key = keyFromImageUrl(ref?.url);
    if (!key) continue;

    // A temp object → promote it to permanent and create its record.
    const permKey = await commitTempObject(key, workspaceId, solutionId);
    if (permKey) {
      await db.image.create({
        data: { dayId, filename: permKey, originalName: ref.name ?? '' },
        select: { id: true },
      });
    } else if (ref.id) {
      // Already-committed image the user kept.
      keepIds.add(ref.id);
    }
  }

  // Anything committed but no longer in the payload was removed by the user.
  const removed = existing.filter((img) => !keepIds.has(img.id));
  if (removed.length === 0) return;

  await Promise.all(
    removed.map((img) =>
      s3
        .send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: img.filename }))
        .catch(() => {}),
    ),
  );
  await db.image.deleteMany({ where: { id: { in: removed.map((img) => img.id) } } });
}

// DELETE /api/day/:contract/:teamNo/:weekKey/:day — clear a day and its images
export async function DELETE(_req: Request, { params }: Params) {
  const { contract, teamNo, weekKey, day } = await params;

  const dayRow = await db.day.findUnique({
    where: { contract_teamNo_weekKey_day: { contract, teamNo, weekKey, day } },
    select: { id: true, images: { select: { filename: true } } },
  });
  if (!dayRow) return NextResponse.json({ ok: true });

  // Best-effort remove the S3 objects before dropping the rows.
  await Promise.all(
    dayRow.images.map((img) =>
      s3
        .send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: img.filename }))
        .catch(() => {}),
    ),
  );

  await db.image.deleteMany({ where: { dayId: dayRow.id } });
  await db.day.delete({ where: { id: dayRow.id } });

  return NextResponse.json({ ok: true });
}
