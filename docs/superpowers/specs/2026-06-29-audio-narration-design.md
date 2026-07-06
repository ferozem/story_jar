# Audio Narration Design

**Date:** 2026-06-29
**Status:** Approved

## Goal

Add TTS audio narration to the 31 new stories using the existing OpenAI pipeline (model: `tts-1-hd`, voice: `shimmer`). Run a batch of 3 stories first to verify voice quality before committing to the full run.

## Scope

- Audio generation only. No cover art, no UI changes, no new hooks or screens.
- Existing 6 stories are untouched (their MP3s already exist and are registered in `asset-manifest.ts`).
- Two scripts: one modified, one new. No new npm dependencies.

## What Changes

### 1. `scripts/generate-audio.mjs` (modify)

Add an optional `--stories` flag that accepts a comma-separated list of story IDs. When the flag is present, only those story JSON files are processed. When absent, all JSON files in `src/data/stories/` are processed (current behavior — fully backward compatible).

**Flag parsing (~5 lines at top of script):**
```js
const storiesArg = process.argv.indexOf('--stories');
const filter = storiesArg !== -1
  ? new Set(process.argv[storiesArg + 1].split(',').map(s => s.trim()))
  : null;

const storyFiles = fs.readdirSync(STORIES_DIR)
  .filter(f => f.endsWith('.json'))
  .filter(f => !filter || filter.has(f.replace('.json', '')));
```

Everything else in the script is untouched.

**Usage:**
```
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --stories the-backward-badge,the-kindness-round,the-trail-marker-promise
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs   # runs all, skips existing
```

### 2. `scripts/update-asset-manifest.mjs` (new)

A Node.js ESM script (built-in `fs` only) that regenerates `src/data/asset-manifest.ts`.

**Algorithm:**
1. Read the current `asset-manifest.ts` and extract everything up to and including the first `};` line — this preserves the file header comment and the entire `coverArt` block verbatim.
2. Scan `assets/audio/` for story directories. For each directory, collect all `page-N.mp3` files sorted numerically (page-0, page-1, …).
3. **Safety check:** For each story found in `assets/audio/`, read the corresponding `src/data/stories/<id>.json` and verify that the MP3 count equals `story.pages.length`. This is required because `assembleStory()` throws if a story is registered in the manifest but the audio array length doesn't match the page count. If a story has incomplete audio (e.g. API failed mid-run), log a warning and skip it — do not add it to the manifest.
4. Generate a fresh `audioAssets` export as a `Record<string, number[]>` with one array per fully-complete story, entries in page order, using the `@/assets/audio/<id>/page-N.mp3` alias path Metro expects.
5. Write the combined result back to `src/data/asset-manifest.ts`.

**Output shape (example new story):**
```ts
'the-backward-badge': [
  require('@/assets/audio/the-backward-badge/page-0.mp3'),
  require('@/assets/audio/the-backward-badge/page-1.mp3'),
  require('@/assets/audio/the-backward-badge/page-2.mp3'),
  require('@/assets/audio/the-backward-badge/page-3.mp3'),
],
```

Story IDs are sorted alphabetically; pages are sorted numerically — output is deterministic and idempotent.

**Usage:**
```
node scripts/update-asset-manifest.mjs
```

No OPENAI_API_KEY needed. Safe to re-run any time.

## Full Workflow

### Phase 1 — verify voice quality (3 stories)
```
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs --stories the-backward-badge,the-kindness-round,the-trail-marker-promise
node scripts/update-asset-manifest.mjs
```
Open the app and navigate to one of the 3 stories. Tap the audio button. Confirm shimmer voice sounds correct.

### Phase 2 — generate remaining stories
```
OPENAI_API_KEY=sk-... node scripts/generate-audio.mjs
node scripts/update-asset-manifest.mjs
```
The generator skips the 3 batch stories (MP3s already exist) and all 6 original stories. The manifest updater adds all new entries in one pass.

## What Does NOT Change

- `src/data/asset-manifest.ts` coverArt section — preserved verbatim by the updater
- `src/hooks/useNarration.ts` — no changes; pages already carry `audioSource` from `assembleStory()`
- `src/data/story-assembler.ts` — no changes; already reads `audioAssets[id][pageIndex]`
- Reader screen UI — no changes
- All existing tests — should continue passing after each manifest update

## Testing

The existing `src/__tests__/asset-manifest.test.ts` covers the manifest structure. It will pass after each `update-asset-manifest.mjs` run since the `audioAssets` shape (`Record<string, number[]>`) is unchanged — just more entries.

No unit tests for `update-asset-manifest.mjs` itself (one-shot migration tool, same rationale as `import-stories.mjs`).

## Cost Estimate

~155 new pages (31 stories × ~5 pages avg) × `tts-1-hd` ≈ $3–5 at current OpenAI pricing.

## Out of Scope

- Cover art for new stories
- Changing voice or TTS model
- UI indicators for loading/buffering audio
- Per-story audio toggle in settings
