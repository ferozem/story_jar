# Story Import Design

**Date:** 2026-06-28
**Status:** Approved

## Goal

Add 32 new stories (text only, no cover art or audio) to the Story Time app. 20 stories come from `stories/final/combined-story-collection.md`; 12 come from `stories/final/next-12-stories.md`.

## Scope

- Text content only. Cover art and TTS audio will be added later per-story.
- No new screens or UI changes. Stories appear in the existing library and reader.
- Existing 6 stories are untouched.

## What Changes

### 1. `scripts/import-stories.mjs` (new)

A one-shot Node.js script (no extra npm dependencies — uses only built-in `fs`). Run once with `node scripts/import-stories.mjs`.

**Parsing — two parsers, one output shape:**

- **Parser A** (`combined-story-collection.md` format): detects stories by `## Story N: Title` headings; splits text on double newlines to get paragraphs; moral marked by `## Moral of the Story`; stories separated by `---`.
- **Parser B** (`next-12-stories.md` format): handles two sub-formats in one file:
  - First 6: `Story N: Title` (plain text), paragraphs = consecutive lines with no blank lines, stories separated by blank line + space
  - Last 6: `Story N` + title on next line, stories separated by `________________________________________`
  - Both: `Moral of the Story` (plain text, no `##`) marks the end of story text

Both parsers produce: `{ id, title, moral, paragraphs[] }`.

**Page splitting:**

Group paragraphs into pages targeting ~350 chars per page. Algorithm:
1. Start a new page accumulator
2. Add paragraphs one at a time, joining with `\n\n`
3. When adding the next paragraph would push the page past 400 chars AND the current page is already ≥ 150 chars, flush the current page and start a new one
4. Always keep at least one paragraph per page (avoids splitting a long single paragraph across multiple pages)

**Reading time:** `Math.ceil(totalWords / 150)` minutes (children's reading pace).

**ID generation:** lowercase title, strip punctuation, replace spaces with hyphens. E.g. `"The Trail Marker Promise"` → `the-trail-marker-promise`.

**Output per story:**
- Writes `src/data/stories/<id>.json` with shape `{ id, title, readingTime, moral, pages: [{ text }] }`
- Overwrites if the file already exists (idempotent re-runs)

**Rewrites `src/data/stories.ts`:**
- Imports all 38 JSON files (existing 6 + 32 new) using static `import` syntax
- Rebuilds the `stories` array with `assembleStory()` for each

**Does NOT touch `src/data/asset-manifest.ts`** — new stories have no cover art or audio entries yet.

### 2. `src/types/story.ts`

- `coverArt` changes from `number` to `number | undefined`
- Add `moral?: string` to the `Story` interface

### 3. `src/data/story-assembler.ts`

- Add `moral?: string` to `RawStory` type
- Pass `moral` through to the assembled `Story`

### 4. `src/components/StoryCard.tsx`

- Guard the cover image render: show a placeholder (e.g. solid colour block) when `coverArt` is `undefined`, so the library screen doesn't crash for the new stories.

## What Does NOT Change

- `asset-manifest.ts` — no new `require()` calls needed
- Reader screen logic — pages work the same
- Audio / narration — skipped for now
- Tests — existing tests remain green; new stories don't have dedicated tests yet

## Sequence

1. Run `node scripts/import-stories.mjs`
2. Check the generated JSON files look right (spot-check 2–3 stories)
3. Start the dev server and verify new stories appear in the library
4. Add cover art + audio per story in a later pass

## Out of Scope

- Cover art generation
- TTS audio generation
- Pagination UI changes
- Story metadata screen (virtue/moral display)
