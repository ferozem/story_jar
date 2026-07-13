// Validates R2 credentials by uploading (and deleting) a tiny test object.
// Run before a bulk publish so bad creds fail in seconds, not mid-upload.
import 'dotenv/config';
import { makeClient } from './lib/r2.mjs';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const client = makeClient();
const Bucket = process.env.R2_BUCKET;
const Key = '_connectivity_check.txt';

try {
  await client.send(new PutObjectCommand({ Bucket, Key, Body: 'ok', ContentType: 'text/plain' }));
  await client.send(new DeleteObjectCommand({ Bucket, Key }));
  console.log(`OK: credentials valid, wrote + deleted a test object in "${Bucket}".`);
} catch (e) {
  console.error(`FAILED: ${e.name} — ${e.message}`);
  process.exit(1);
}
