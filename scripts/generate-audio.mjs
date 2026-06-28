/**
 * One-time script: generates MP3 narration for every story page using OpenAI TTS.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --stories id1,id2,id3
 *
 * Output: assets/audio/[story-id]/page-[n].mp3
 * Skips files that already exist so it's safe to re-run.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORIES_DIR = path.join(__dirname, '../src/data/stories');
const AUDIO_DIR = path.join(__dirname, '../assets/audio');
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  console.error('Usage: OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs');
  process.exit(1);
}

const storiesArg = process.argv.indexOf('--stories');
const storiesVal = storiesArg !== -1 ? process.argv[storiesArg + 1] : null;

if (storiesVal && storiesVal.startsWith('--')) {
  console.error('Error: --stories requires a value, not another flag.');
  process.exit(1);
}

if (storiesArg !== -1 && !storiesVal) {
  console.error('Error: --stories requires a comma-separated list of IDs.');
  process.exit(1);
}

const filter = storiesVal
  ? new Set(storiesVal.split(',').map(s => s.trim()).filter(Boolean))
  : null;

if (filter !== null && filter.size === 0) {
  console.error('Error: --stories produced an empty ID list after parsing.');
  process.exit(1);
}

const storyFiles = fs.readdirSync(STORIES_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => filter === null || filter.has(path.basename(f, '.json')));

if (filter !== null) {
  const matched = new Set(storyFiles.map(f => path.basename(f, '.json')));
  for (const id of filter) {
    if (!matched.has(id)) {
      console.warn(`  warn  '${id}' not found in stories/ — check spelling`);
    }
  }
}

let generated = 0;
let skipped = 0;
let failed = 0;

for (const file of storyFiles) {
  const story = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, file), 'utf8'));
  const outDir = path.join(AUDIO_DIR, story.id);
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < story.pages.length; i++) {
    const outPath = path.join(outDir, `page-${i}.mp3`);

    if (fs.existsSync(outPath)) {
      console.log(`  skip  ${story.id}/page-${i}.mp3`);
      skipped++;
      continue;
    }

    const text = story.pages[i].text;
    process.stdout.write(`  gen   ${story.id}/page-${i}.mp3 ... `);

    try {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          voice: 'shimmer',
          input: text,
          response_format: 'mp3',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.log(`FAILED — ${res.status}: ${err}`);
        failed++;
        continue;
      }

      const buffer = await res.arrayBuffer();
      fs.writeFileSync(outPath, Buffer.from(buffer));
      console.log('done');
      generated++;

      // Stay within OpenAI rate limits
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      failed++;
    }
  }
}

console.log(`\nDone. generated=${generated}  skipped=${skipped}  failed=${failed}`);
