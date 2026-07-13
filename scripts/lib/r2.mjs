import 'dotenv/config';
import { readFileSync } from 'node:fs';
import mime from 'mime';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;

export function requireEnv() {
  const missing = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
  }
}

export function makeClient() {
  requireEnv();
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

// Uploads a local file to `key` in the bucket. Returns the key on success.
export async function uploadFile(client, localPath, key) {
  const Body = readFileSync(localPath);
  const ContentType = mime.getType(localPath) || 'application/octet-stream';
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body, ContentType }));
  return key;
}
