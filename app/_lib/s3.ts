import { S3Client } from '@aws-sdk/client-s3';

// One S3 client, configured from the standard AWS_* env vars
// (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION).
export const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME ?? '';
