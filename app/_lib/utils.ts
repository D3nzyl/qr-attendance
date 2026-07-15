import 'server-only';
import sharp from 'sharp';

/**
 * Server-side image compression (sharp-based), the Node counterpart to the
 * browser `compressImageIfNeeded` in the platform UI package. Runs in an API
 * route on a Buffer instead of a canvas, so it stays a safety net for uploads
 * that skipped or outran client-side compression.
 */

/** MIME types we skip so behaviour stays predictable (GIF animation, SVG markup). */
const SKIP_COMPRESSION_TYPES = new Set(['image/gif', 'image/svg+xml']);

export type ImageCompressOptions = {
  /** Target max size in megabytes (best-effort; may undershoot). Default 1 MB. */
  maxSizeMB?: number;
  /** Max width or height in pixels; aspect ratio preserved. Default 1920. */
  maxWidthOrHeight?: number;
  /** Starting JPEG quality, 1-100. Default 80. */
  quality?: number;
};

const DEFAULT_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  quality: 80,
} satisfies Required<ImageCompressOptions>;

/** Lowest JPEG quality we'll drop to while chasing the target size. */
const MIN_QUALITY = 40;
/** How much to lower quality on each retry. */
const QUALITY_STEP = 15;

export type CompressedImage = {
  buffer: Buffer;
  /** MIME of the returned buffer (image/jpeg after compression). */
  contentType: string;
  /** File extension matching `contentType`, including the leading dot. */
  extension: string;
};

/**
 * Shrinks a raster image toward `maxSizeMB`: honours EXIF orientation, downscales
 * (never upscales) to fit `maxWidthOrHeight`, then re-encodes as JPEG, stepping
 * quality down until it's under target or hits {@link MIN_QUALITY}.
 *
 * Non-images and {@link SKIP_COMPRESSION_TYPES} are returned untouched.
 */
export async function compressImage(
  input: Buffer,
  mimeType: string,
  options?: ImageCompressOptions,
): Promise<CompressedImage> {
  const mime = mimeType.trim().toLowerCase();
  if (!mime.startsWith('image/') || SKIP_COMPRESSION_TYPES.has(mime)) {
    return { buffer: input, contentType: mimeType, extension: extForMime(mime) };
  }

  const { maxSizeMB, maxWidthOrHeight, quality } = { ...DEFAULT_OPTIONS, ...options };
  const targetBytes = maxSizeMB * 1024 * 1024;

  // `failOn: 'none'` keeps slightly-malformed user uploads from throwing.
  const pipeline = sharp(input, { failOn: 'none' })
    .rotate() // apply EXIF orientation before metadata is stripped on re-encode
    .resize({
      width: maxWidthOrHeight,
      height: maxWidthOrHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

  let q = quality;
  let out = await pipeline.clone().jpeg({ quality: q, mozjpeg: true }).toBuffer();
  while (out.length > targetBytes && q > MIN_QUALITY) {
    q = Math.max(MIN_QUALITY, q - QUALITY_STEP);
    out = await pipeline.clone().jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }

  return { buffer: out, contentType: 'image/jpeg', extension: '.jpg' };
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'image/gif') return '.gif';
  if (mime === 'image/svg+xml') return '.svg';
  return '.jpg';
}
