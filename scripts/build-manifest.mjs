import 'dotenv/config';
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const STORIES_DIR = 'src/data/stories';
const ASSETS_DIR = 'assets';

// Pure core: given loaded stories + an assetExists predicate, produce the manifest object.
export function buildManifest(stories, assetExists, version, baseUrl) {
  return {
    version,
    baseUrl,
    stories: stories.map((raw) => {
      const coverKey = `stories/${raw.id}/cover-vibrant.jpg`;
      const entry = {
        id: raw.id,
        title: raw.title,
        readingTime: raw.readingTime,
        category: raw.category,
        pages: raw.pages.map((p, i) => {
          const audioKey = `audio/${raw.id}/page-${i}.mp3`;
          return assetExists(audioKey) ? { text: p.text, audio: audioKey } : { text: p.text };
        }),
      };
      if (raw.moral) entry.moral = raw.moral;
      if (assetExists(coverKey)) entry.cover = coverKey;
      return entry;
    }),
  };
}

// Loads every story JSON from disk.
export function loadStories() {
  return readdirSync(STORIES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(STORIES_DIR, f), 'utf8')));
}

// Filesystem-backed assetExists: a manifest key maps to assets/<key>.
// Keys look like "stories/<id>/cover-vibrant.jpg" or "audio/<id>/page-N.mp3".
export function fsAssetExists(key) {
  return existsSync(join(ASSETS_DIR, key));
}

// CLI entry: writes ./manifest.json and ./src/data/manifest.bundled.json.
function main() {
  const baseUrl = process.env.CDN_BASE_URL;
  if (!baseUrl) throw new Error('CDN_BASE_URL missing (must end with /). See .env.example.');
  if (!baseUrl.endsWith('/')) throw new Error('CDN_BASE_URL must end with a trailing slash.');
  const version = new Date().toISOString().replace(/[:.]/g, '-');
  const manifest = buildManifest(loadStories(), fsAssetExists, version, baseUrl);
  const json = JSON.stringify(manifest, null, 2);
  writeFileSync('manifest.json', json);
  writeFileSync('src/data/manifest.bundled.json', json);
  console.log(`Wrote manifest.json + manifest.bundled.json (${manifest.stories.length} stories, version ${version}).`);
}

// Run main() when invoked directly (pathToFileURL handles Windows drive paths correctly).
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
