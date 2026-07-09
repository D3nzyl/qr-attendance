import 'server-only';
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3, S3_BUCKET } from './s3';

/**
 * S3 key helpers for uploaded images.
 *
 * Freshly uploaded images land under `temp/<workspaceId>/<solutionId>/…` and are
 * only promoted to `<workspaceId>/<solutionId>/…` when the day is saved. A bucket
 * lifecycle rule on the `temp/` prefix expires anything never committed (1 day).
 */

const URL_PREFIX = '/api/images/file/';
export const TEMP_PREFIX = 'temp';

/** Proxy URL the browser uses to read an object by key. */
export function imageUrl(key: string): string {
  return `${URL_PREFIX}${key}`;
}

/** Extract the S3 key from a proxy URL, or undefined if it isn't one. */
export function keyFromImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url.startsWith(URL_PREFIX)) return undefined;
  return url.slice(URL_PREFIX.length) || undefined;
}

/** Key for a just-uploaded image that hasn't been committed to a day yet. */
export function tempKey(workspaceId: string, solutionId: string, name: string): string {
  return `${TEMP_PREFIX}/${workspaceId}/${solutionId}/${name}`;
}

/**
 * Promote a staged temp object to its permanent home under the given scope and
 * remove the temp copy. Returns the permanent key, or undefined if `key` isn't a
 * temp object belonging to this workspace/solution (so a stray/foreign key can't
 * be moved).
 */
export async function commitTempObject(
  key: string,
  workspaceId: string,
  solutionId: string,
): Promise<string | undefined> {
  const prefix = `${TEMP_PREFIX}/${workspaceId}/${solutionId}/`;
  if (!key.startsWith(prefix)) return undefined;

  const permKey = `${workspaceId}/${solutionId}/${key.slice(prefix.length)}`;
  await s3.send(
    new CopyObjectCommand({
      Bucket: S3_BUCKET,
      CopySource: encodeURI(`${S3_BUCKET}/${key}`),
      Key: permKey,
    }),
  );
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  return permKey;
}
