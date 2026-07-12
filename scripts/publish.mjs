// Uploads all per-story assets and manifest.json to R2.
// Usage:
//   node scripts/publish.mjs            -> upload every story's assets + refreshed manifest
//   node scripts/publish.mjs <storyId>  -> upload just one story's assets + refreshed manifest
import 'dotenv/config';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeClient, uploadFile } from './lib/r2.mjs';
import { loadStories, buildManifest, fsAssetExists } from './build-manifest.mjs';

const ASSETS_DIR = 'assets';

// Collect every asset key referenced by a manifest entry that exists on disk.
function assetKeysForStory(entry) {
  const keys = [];
  if (entry.cover) keys.push(entry.cover);
  for (const p of entry.pages) if (p.audio) keys.push(p.audio);
  return keys.filter((k) => existsSync(join(ASSETS_DIR, k)));
}

async function main() {
  const baseUrl = process.env.CDN_BASE_URL;
  if (!baseUrl || !baseUrl.endsWith('/')) throw new Error('CDN_BASE_URL missing or lacks trailing slash.');

  const onlyId = process.argv[2];
  const version = new Date().toISOString().replace(/[:.]/g, '-');
  const manifest = buildManifest(loadStories(), fsAssetExists, version, baseUrl);

  const client = makeClient();
  const targets = onlyId ? manifest.stories.filter((s) => s.id === onlyId) : manifest.stories;
  if (onlyId && targets.length === 0) throw new Error(`No story with id "${onlyId}".`);

  let uploaded = 0;
  for (const entry of targets) {
    for (const key of assetKeysForStory(entry)) {
      await uploadFile(client, join(ASSETS_DIR, key), key);
      uploaded++;
      if (uploaded % 25 === 0) console.log(`  ...${uploaded} files uploaded`);
    }
  }

  // Always refresh the manifest last so it never points at not-yet-uploaded assets.
  const json = JSON.stringify(manifest, null, 2);
  writeFileSync('manifest.json', json);
  writeFileSync('src/data/manifest.bundled.json', json);
  await uploadFile(client, 'manifest.json', 'manifest.json');

  console.log(`Done. Uploaded ${uploaded} asset files + manifest.json (version ${version}).`);
  console.log('Commit the updated src/data/manifest.bundled.json so the app ships the latest offline snapshot.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
