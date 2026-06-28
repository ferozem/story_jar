/**
 * Regenerates the audioAssets export in src/data/asset-manifest.ts
 * from whatever MP3 files exist in assets/audio/.
 *
 * Usage:
 *   node scripts/update-asset-manifest.mjs
 *
 * Safe to re-run at any time. Preserves the coverArt block verbatim.
 * Skips stories whose MP3 count doesn't match their JSON page count
 * (protects against partial/failed generation runs).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR   = path.join(__dirname, '../assets/audio');
const STORIES_DIR = path.join(__dirname, '../src/data/stories');
const MANIFEST    = path.join(__dirname, '../src/data/asset-manifest.ts');

// ── 1. Preserve the coverArt section ────────────────────────────────────────
const current = fs.readFileSync(MANIFEST, 'utf8');
const cutAt = current.indexOf('};');
if (cutAt === -1) {
  console.error('Error: could not find "};" in asset-manifest.ts — aborting.');
  process.exit(1);
}
const coverArtSection = current.slice(0, cutAt + 2); // includes '};'

// ── 2. Discover MP3 files ────────────────────────────────────────────────────
if (!fs.existsSync(AUDIO_DIR)) {
  console.log('No assets/audio/ directory found. Nothing to update.');
  process.exit(0);
}

const storyIds = fs.readdirSync(AUDIO_DIR)
  .filter(d => fs.statSync(path.join(AUDIO_DIR, d)).isDirectory())
  .sort();

// ── 3. Safety-check each story against its JSON ──────────────────────────────
const entries = [];
for (const id of storyIds) {
  const audioDir = path.join(AUDIO_DIR, id);
  const mp3s = fs.readdirSync(audioDir)
    .filter(f => /^page-\d+\.mp3$/.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0], 10);
      const nb = parseInt(b.match(/\d+/)[0], 10);
      return na - nb;
    });

  const jsonPath = path.join(STORIES_DIR, `${id}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.warn(`  warn  ${id}: no JSON found in stories/ — skipping`);
    continue;
  }

  const story = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (mp3s.length !== story.pages.length) {
    console.warn(`  warn  ${id}: ${mp3s.length} MP3s but ${story.pages.length} pages — skipping (re-run generate-audio to finish)`);
    continue;
  }

  entries.push({ id, mp3s });
  console.log(`  ok    ${id} (${mp3s.length} pages)`);
}

// ── 4. Generate audioAssets block ────────────────────────────────────────────
let audioBlock = '\nexport const audioAssets: Record<string, number[]> = {\n';
for (const { id, mp3s } of entries) {
  audioBlock += `  '${id}': [\n`;
  for (const mp3 of mp3s) {
    const page = mp3.replace('.mp3', '');
    audioBlock += `    require('@/assets/audio/${id}/${page}.mp3'),\n`;
  }
  audioBlock += `  ],\n`;
}
audioBlock += '};\n';

// ── 5. Write ─────────────────────────────────────────────────────────────────
fs.writeFileSync(MANIFEST, coverArtSection + audioBlock, 'utf8');
console.log(`\nDone. asset-manifest.ts updated with ${entries.length} stories.`);
