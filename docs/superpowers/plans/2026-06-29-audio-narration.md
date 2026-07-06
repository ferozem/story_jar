# Audio Narration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TTS audio narration for the 31 new stories by (1) adding a `--stories` filter to the existing generation script, (2) writing a manifest-update script that regenerates `asset-manifest.ts` from disk, and (3) relaxing existing tests that will break once new audio entries are added.

**Architecture:** Two focused scripts: `generate-audio.mjs` (modified) handles OpenAI API calls and writes MP3s to `assets/audio/<id>/page-N.mp3`; `update-asset-manifest.mjs` (new) reads what MP3s exist on disk and regenerates the `audioAssets` export in `src/data/asset-manifest.ts` with literal `require()` calls Metro needs. Existing `asset-manifest.test.ts` hardcodes counts that must be relaxed before the manifest is expanded.

**Tech Stack:** Node.js ESM scripts, OpenAI REST API (`tts-1-hd`, `shimmer` voice), `fs` built-in only (no new npm dependencies), Jest for tests.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `scripts/generate-audio.mjs` | Modify | Add optional `--stories id1,id2` flag (filter which story JSONs get processed) |
| `scripts/update-asset-manifest.mjs` | Create | Scans `assets/audio/`, regenerates `audioAssets` block in manifest |
| `src/__tests__/asset-manifest.test.ts` | Modify | Relax "exactly 6" count → "at least 6"; remove cover-art consistency check that breaks for audio-only stories |

---

### Task 1: Add `--stories` filter to `generate-audio.mjs`

**Files:**
- Modify: `scripts/generate-audio.mjs` (lines 5–8 and 26–27)

This task adds an optional `--stories id1,id2,id3` CLI flag. When present, only those story IDs are processed. When absent, all JSON files are processed (existing behavior, fully backward compatible). No tests are needed — this is a migration script with manual verification.

- [ ] **Step 1: Update the usage comment at the top of the file**

Open `scripts/generate-audio.mjs`. The current Usage block (lines 5–7) reads:
```
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
```

Change it to:
```
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --stories id1,id2,id3
```

- [ ] **Step 2: Add flag parsing and filter the story files**

In `scripts/generate-audio.mjs`, find line 26 (the current `const storyFiles = ...` line):
```js
const storyFiles = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.json'));
```

Replace it with:
```js
const storiesArg = process.argv.indexOf('--stories');
const filter = storiesArg !== -1
  ? new Set(process.argv[storiesArg + 1].split(',').map(s => s.trim()))
  : null;

const storyFiles = fs.readdirSync(STORIES_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => filter === null || filter.has(f.replace('.json', '')));
```

- [ ] **Step 3: Verify the filter works**

The API key check runs before the story filter, so use a fake key with a nonexistent story ID — the filter runs, finds nothing, and exits cleanly with zero work done:

```
OPENAI_API_KEY=fake node scripts/generate-audio.mjs --stories nonexistent-story
```

Expected output:
```
Done. generated=0  skipped=0  failed=0
```

This confirms the flag parsed correctly and the filter excluded all real stories. No API calls were made (the loop body never ran).

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-audio.mjs
git commit -m "feat: add --stories filter to generate-audio script"
```

---

### Task 2: Create `scripts/update-asset-manifest.mjs`

**Files:**
- Create: `scripts/update-asset-manifest.mjs`

This script reads what MP3 files exist in `assets/audio/`, cross-checks each story's page count against its JSON, and regenerates the `audioAssets` export in `src/data/asset-manifest.ts` with literal `require('@/assets/audio/<id>/page-N.mp3')` calls. The `coverArt` block is preserved verbatim by slicing the existing file.

**Key constraint:** Metro bundler requires literal string paths in `require()` calls. No variables, no template strings, no dynamic expressions — every path must be a string literal. This script produces exactly that.

No unit tests — migration script (same rationale as `import-stories.mjs`). Verify by running it and checking the diff.

- [ ] **Step 1: Create the file with the full implementation**

Create `scripts/update-asset-manifest.mjs` with this exact content:

```js
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
```

- [ ] **Step 2: Verify the script runs without errors against the current repo**

The current `assets/audio/` directory has the 6 original story folders. Run:
```
node scripts/update-asset-manifest.mjs
```

Expected output:
```
  ok    the-boy-near-the-gate (5 pages)
  ok    the-broken-lantern (5 pages)
  ok    the-forgotten-diary (5 pages)
  ok    the-hilltop-trail (5 pages)
  ok    the-locked-suggestion-box (5 pages)
  ok    the-torn-map (8 pages)

Done. asset-manifest.ts updated with 6 stories.
```

Then check `git diff src/data/asset-manifest.ts` — the file should be functionally identical to what was there (maybe minor whitespace differences in the audioAssets block). If the diff shows the coverArt block was scrambled, something went wrong with the `indexOf('};')` slice — re-check.

- [ ] **Step 3: Run the test suite to confirm nothing broke**

```
npx jest --testPathPattern="asset-manifest" --no-coverage
```

Expected: All tests pass (6 stories, same structure).

- [ ] **Step 4: Commit**

```bash
git add scripts/update-asset-manifest.mjs src/data/asset-manifest.ts
git commit -m "feat: add update-asset-manifest script to regenerate audio entries from disk"
```

---

### Task 3: Relax `asset-manifest.test.ts` for future audio additions

**Files:**
- Modify: `src/__tests__/asset-manifest.test.ts` (lines 59–61 and 136–139)

Two tests will fail once new audio entries are added to the manifest:
1. `'has audio assets for all 6 stories'` — asserts `keys.length === 6`. Will fail once we have 37.
2. `'all stories with audio assets also have cover art'` — new stories have audio but no cover art (cover art is added separately). Will fail for all 31 new stories.

Fix both now so the tests stay green after the generation runs.

- [ ] **Step 1: Relax the audio story count check**

In `src/__tests__/asset-manifest.test.ts`, find lines 59–62:
```ts
it('has audio assets for all 6 stories', () => {
  const keys = Object.keys(audioAssets);
  expect(keys.length).toBe(6);
});
```

Change to:
```ts
it('has audio assets for at least the original 6 stories', () => {
  const keys = Object.keys(audioAssets);
  expect(keys.length).toBeGreaterThanOrEqual(6);
});
```

- [ ] **Step 2: Remove the cover-art consistency check**

In `src/__tests__/asset-manifest.test.ts`, find lines 136–139 (inside `describe('asset consistency', ...)`):
```ts
it('all stories with audio assets also have cover art', () => {
  Object.keys(audioAssets).forEach((storyId) => {
    expect(coverArt[storyId]).toBeDefined();
  });
});
```

Delete those 5 lines entirely. (The invariant no longer holds: new stories have audio but not yet cover art.)

- [ ] **Step 3: Run the full test suite to confirm all tests still pass**

```
npx jest --no-coverage
```

Expected: All tests pass. The count is now 171 tests (was 172 — you removed one test in the consistency block).

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/asset-manifest.test.ts
git commit -m "test: relax asset-manifest test counts for future audio additions"
```

---

## After These Tasks: Running the Audio Generation

These tasks only set up the infrastructure. The actual MP3 generation is a manual step (requires an OpenAI API key):

**Phase 1 — batch of 3 stories to verify shimmer voice quality:**
```
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --stories the-backward-badge,the-kindness-round,the-trail-marker-promise
node scripts/update-asset-manifest.mjs
```
Open the app, navigate to one of the 3 stories, tap the audio button. Verify the shimmer voice sounds right. Each story has 5 pages → 15 API calls total.

**Phase 2 — generate remaining 28 new stories (once voice is approved):**
```
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
node scripts/update-asset-manifest.mjs
```
The generator skips the 3 batch stories and all 6 originals (their MP3s already exist). ~140 additional API calls. Estimated cost: $3–5.
