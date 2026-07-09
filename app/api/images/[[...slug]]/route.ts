import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { extname } from "path";
import db from "../../../_lib/db";
import { imageUrl, tempKey } from "../../../_lib/image-store";
import { s3, S3_BUCKET } from "../../../_lib/s3";
import { getScope } from "../../../_lib/scope";
import { compressImage } from "../../../_lib/utils";

export const runtime = "nodejs";

// Absolute ceiling on the raw upload we'll buffer into memory; anything larger
// is rejected before we touch it.
const MAX_SIZE = 25 * 1024 * 1024;
// Uploads above this get server-side compressed (safety net for images that
// skipped or outran client-side compression). Roughly matches the client's ~1MB target.
const COMPRESS_ABOVE = 1 * 1024 * 1024;

type Params = { params: Promise<{ slug?: string[] }> };

// POST /api/images/:contract/:teamNo/:weekKey/:day — stage an image to S3.
// Uploads land in the `temp/` prefix and carry no DB record; they're promoted
// to their permanent home and recorded only when the day is saved (see the day
// PUT route). A bucket lifecycle rule expires abandoned temp objects after 1 day.
export async function POST(req: Request, { params }: Params) {
  const { slug = [] } = await params;
  if (slug.length !== 4)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File too large" }, { status: 413 });

  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let contentType = file.type;
  let ext = extname(file.name) || ".jpg";

  // Too large → shrink it server-side rather than rejecting the upload.
  if (buffer.length > COMPRESS_ABOVE) {
    const compressed = await compressImage(buffer, file.type);
    buffer = compressed.buffer;
    contentType = compressed.contentType;
    ext = compressed.extension;
  }

  // Temp objects are still grouped by scope so the commit-time move stays within
  // the workspace/solution and the lifecycle rule can target one prefix.
  const { workspaceId, solutionId } = getScope(req);
  if (!workspaceId || !solutionId) {
    return NextResponse.json(
      { error: "Missing workspace/solution scope" },
      { status: 400 },
    );
  }

  const key = tempKey(workspaceId, solutionId, `${randomUUID()}${ext}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return NextResponse.json({
    // No DB row yet — the temp key doubles as a stable client-side identity and
    // is what the day-save reconciliation reads back to promote the object.
    id: key,
    name: file.name,
    url: imageUrl(key),
  });
}

// GET /api/images/file/:key — stream a private S3 object back to the browser.
// The key may span multiple path segments (workspaceId/solutionId/name).
export async function GET(_req: Request, { params }: Params) {
  const { slug = [] } = await params;
  if (slug.length < 2 || slug[0] !== "file") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const key = slug.slice(1).join("/");

  try {
    const obj = await s3.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );
    const bytes = await obj.Body?.transformToByteArray();
    if (!bytes)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contentType = obj.ContentType ?? "application/octet-stream";
    // Copy into a fresh ArrayBuffer-backed view so the type satisfies BlobPart.
    return new NextResponse(
      new Blob([new Uint8Array(bytes)], { type: contentType }),
      {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// DELETE /api/images/:imageId
export async function DELETE(_req: Request, { params }: Params) {
  const { slug = [] } = await params;
  if (slug.length !== 1)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const imageId = slug[0];
  // MongoDB ids are 24-char hex ObjectIds; reject anything else as not found
  // so Prisma doesn't throw on a malformed id.
  if (!/^[a-f\d]{24}$/i.test(imageId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = await db.image.findUnique({
    where: { id: imageId },
    select: { filename: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.image.delete({ where: { id: imageId } });

  // best-effort S3 object delete
  try {
    await s3.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: row.filename }),
    );
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true });
}
