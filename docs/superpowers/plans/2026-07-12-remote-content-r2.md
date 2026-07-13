# Remote Content on Cloudflare R2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all per-story content (text, cover images, page audio) out of the app bundle and onto Cloudflare R2, so new stories can be published to users **without an app-store redeploy**, while user data stays local (AsyncStorage) and there is no authentication.

**Architecture:** A `manifest.json` on R2 is the source of truth for the story catalog (text + metadata + relative asset keys). The app ships with a **bundled snapshot** of that manifest so the catalog always renders offline; on launch it fetches the remote manifest and, if newer, swaps it in (this is how new stories appear). **Images** are passed as remote URL strings to `expo-image`, which disk-caches them for free. **Audio** is downloaded on first play to the device cache via `expo-file-system` and replayed locally. Decorative category art stays bundled (it is the fixed app shell, not per-story content). Publishing is a local Node script — no backend server, no database.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript, `expo-image` (already installed), `expo-audio` (already installed), `expo-file-system` (to add), `@aws-sdk/client-s3` + `dotenv` for the upload scripts (dev-only), Cloudflare R2 (S3-compatible object storage).

---

## Key Facts (verified against the codebase and v56 docs — do not re-derive)

- **Story text** lives in `src/data/stories/<id>.json` (61 files), each `{ id, title, readingTime, category, moral?, pages: [{text}] }`.
- **All Metro `require()` calls** are quarantined in `src/data/asset-manifest.ts` (`coverArt: Record<id, number>`, `audioAssets: Record<id, number[]>`). This file gets **deleted**.
- **Decorative art** (`src/data/decorative-art.ts`, category heroes, ~88 MB) and **category icons** stay bundled and are OUT OF SCOPE for this migration.
- `src/data/story-assembler.ts::assembleStory()` combines a raw JSON story with `coverArt`/`audioAssets` from the manifest. It gets rewritten to read asset URLs from a manifest entry instead.
- `src/data/stories.ts` builds the static `Story[]` from 61 imports and exposes `getStories()`/`getStory(id)`. These become backed by a React context so remote updates re-render.
- **Consumers of `getStories()`:** `category/[category].tsx`, `library.tsx`, `my-jar.tsx`, `search.tsx` (4 screens). Pure helpers `story-of-the-day.ts` and `story-search.ts` already accept `stories` as a parameter — no signature change.
- **Image consumers** (`StoryCard`, `ContinueCard`, `StoryOfTheDayCard`, `PageView`, `index.tsx`) pass `story.coverArt` / `page.illustration` to `<Image source={...}>`. `expo-image` accepts a bare URL string as `source`, so these need **no change** once the type is `string`.
- **Audio** plays in `src/hooks/useNarration.ts` via `player.replace(source)` where `source` is currently a require-number. `expo-audio`'s `replace()` accepts `{ uri: string }`. This is the one consumer needing real new logic (download-then-play).
- **expo-file-system v56 API** (verified): `import { File, Directory, Paths } from 'expo-file-system';` — `new File(Paths.cache, name)`, `file.exists`, `file.uri`, `await File.downloadFileAsync(url, destinationDirectory)`.
- **User data** (`src/state/AppData.tsx`, AsyncStorage) is UNCHANGED by this plan.

---

## Manifest Schema (the contract every task depends on)

`manifest.json` (served from R2 root):

```json
{
  "version": "2026-07-12T10-30-00Z",
  "baseUrl": "https://cdn.example.com/",
  "stories": [
    {
      "id": "the-new-shoes",
      "title": "The New Shoes",
      "readingTime": "3 min",
      "category": "Kindness & Compassion",
      "moral": "Kindness should protect people's feelings...",
      "cover": "stories/the-new-shoes/cover-vibrant.jpg",
      "pages": [
        { "text": "Ibrahim had new shoes...", "audio": "audio/the-new-shoes/page-0.mp3" }
      ]
    }
  ]
}
```

- `version`: any string that changes when content changes (UTC timestamp). Used to decide whether the remote manifest is newer than the bundled one.
- `baseUrl`: prepended to every relative key to form a full URL. Lets you move CDN domains without rewriting keys.
- `cover` / `audio`: **relative keys** (may be omitted/null when a story has no cover or a page has no audio).
- Absolute asset URL = `baseUrl + key`.

---

## File Structure

**New files:**
- `scripts/lib/r2.mjs` — R2/S3 client factory + `uploadFile` helper (shared by both scripts).
- `scripts/build-manifest.mjs` — scans `src/data/stories/*.json` + `assets/` and writes `manifest.json` locally.
- `scripts/publish.mjs` — uploads assets + `manifest.json` to R2 (bulk on first run, incremental after).
- `src/data/content-manifest.ts` — manifest TypeScript types + `parseManifest()` + `fetchRemoteManifest()`.
- `src/data/manifest.bundled.json` — snapshot committed into the app for offline first-launch (generated by `build-manifest.mjs`).
- `src/state/ContentProvider.tsx` — loads bundled manifest synchronously, fetches remote on mount, exposes `useStories()`/`useStory(id)`.
- `src/data/content-cache.ts` — `getCachedAudioUri(url)`: download-if-missing to device cache, return local `file://` uri.
- `docs/r2-setup-checklist.md` — the click-by-click Cloudflare account steps for the user.
- `.env.example` — documents required R2 credentials.

**Modified files:**
- `src/types/story.ts` — asset fields `number → string`.
- `src/data/story-assembler.ts` — assemble from a manifest entry.
- `src/data/stories.ts` — thin wrappers over ContentProvider state (or a settable module snapshot).
- `src/hooks/useNarration.ts` — resolve audio through `content-cache` before `replace()`.
- `src/app/_layout.tsx` — wrap tree in `<ContentProvider>`.
- 4 screen files calling `getStories()` — switch to `useStories()`.
- `package.json` — add deps.
- `.gitignore` — ignore `.env` and local `manifest.json`.

**Deleted files:**
- `src/data/asset-manifest.ts` and its test `src/__tests__/asset-manifest.test.ts`.

---

## PHASE 0 — Accounts, Dependencies, Setup Doc

> The Cloudflare account/bucket/credentials steps are the USER's (they need the user's identity + credit card). This phase writes the checklist and installs code deps. Do not attempt to create the account or run uploads until the user confirms `.env` is populated.

### Task 0.1: Write the Cloudflare setup checklist

**Files:**
- Create: `docs/r2-setup-checklist.md`

- [ ] **Step 1: Write the checklist**

````markdown
# Cloudflare R2 Setup Checklist (do these once)

These steps need your identity and a credit card, so they are yours to do in a browser.
Usage stays inside the free tier (10 GB storage, unlimited egress); the card is Cloudflare's
anti-abuse gate, not a charge.

1. Create a Cloudflare account at https://dash.cloudflare.com/sign-up and verify your email.
2. In the dashboard sidebar, click **R2**. Click **Enable R2** and add a credit card when prompted.
3. Click **Create bucket**. Name it `story-time-content`. Region: **Automatic**. Create.
4. Create an API token: **R2 → Manage R2 API Tokens → Create API Token**.
   - Permissions: **Object Read & Write**.
   - Scope it to the `story-time-content` bucket.
   - Create, then copy the **Access Key ID**, **Secret Access Key**, and the
     **S3 API endpoint** (looks like `https://<accountid>.r2.cloudflarestorage.com`).
5. Paste those three values into a new file `.env` in the project root (copy `.env.example`).
6. (Later, for production) Attach a custom domain under **R2 → your bucket → Settings →
   Custom Domains** and set `CDN_BASE_URL` in `.env` to `https://<that-domain>/`.
   Until then, enable **R2.dev subdomain** (dev only) and use that URL as `CDN_BASE_URL`.

When `.env` has the four values, tell the agent and we run the bulk upload together.
````

- [ ] **Step 2: Commit**

```bash
git add docs/r2-setup-checklist.md
git commit -m "docs: add Cloudflare R2 setup checklist"
```

### Task 0.2: Add dependencies and env scaffolding

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Install runtime dep (app) and dev deps (scripts)**

Run:
```bash
npx expo install expo-file-system
npm install --save-dev @aws-sdk/client-s3 dotenv mime
```
Expected: `expo-file-system` added to `dependencies` at a `~56.x` version; the three dev deps added to `devDependencies`.

- [ ] **Step 2: Create `.env.example`**

```bash
# Cloudflare R2 credentials (fill real values in .env, never commit .env)
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=story-time-content
# Public base URL assets are served from (r2.dev subdomain for dev, custom domain for prod).
# MUST end with a trailing slash.
CDN_BASE_URL=https://<something>.r2.dev/
```

- [ ] **Step 3: Add ignores to `.gitignore`**

Append these lines:
```
# R2 credentials and generated manifest
.env
/manifest.json
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: add expo-file-system + R2 upload script deps"
```

---

## PHASE 1 — Publishing Pipeline (build + upload manifest and assets)

> Produces the remote bucket contents and the bundled snapshot. Fully testable on its own: run the scripts, see files land in R2 and `manifest.json` generated. This phase does NOT touch the app.

### Task 1.1: R2 client helper

**Files:**
- Create: `scripts/lib/r2.mjs`

- [ ] **Step 1: Write the helper**

```js
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
```

- [ ] **Step 2: Verify it imports without a network call**

Run: `node -e "import('./scripts/lib/r2.mjs').then(m => console.log(typeof m.makeClient))"`
Expected: prints `function` (no error — env not required until `makeClient` is called).

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/r2.mjs
git commit -m "feat: add R2 upload helper for publish scripts"
```

### Task 1.2: Manifest builder (pure, testable)

**Files:**
- Create: `scripts/build-manifest.mjs`
- Test: `scripts/__tests__/build-manifest.test.mjs`

The builder scans story JSON and asset folders and produces the manifest object. Asset presence is derived from the filesystem so it can never drift from reality.

- [ ] **Step 1: Write the failing test**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildManifest } from '../build-manifest.mjs';

test('buildManifest maps a story to relative keys and preserves page order', () => {
  const stories = [{
    id: 'demo-story',
    title: 'Demo',
    readingTime: '2 min',
    category: 'Patience',
    moral: 'wait',
    pages: [{ text: 'p0' }, { text: 'p1' }],
  }];
  // assetExists(key) fakes the filesystem: cover + both audio pages present.
  const assetExists = (key) => new Set([
    'stories/demo-story/cover-vibrant.jpg',
    'audio/demo-story/page-0.mp3',
    'audio/demo-story/page-1.mp3',
  ]).has(key);

  const m = buildManifest(stories, assetExists, 'v-test', 'https://cdn/');
  assert.equal(m.version, 'v-test');
  assert.equal(m.baseUrl, 'https://cdn/');
  assert.equal(m.stories.length, 1);
  const s = m.stories[0];
  assert.equal(s.cover, 'stories/demo-story/cover-vibrant.jpg');
  assert.equal(s.pages.length, 2);
  assert.equal(s.pages[0].audio, 'audio/demo-story/page-0.mp3');
  assert.equal(s.pages[1].audio, 'audio/demo-story/page-1.mp3');
});

test('buildManifest omits cover/audio keys when files are absent', () => {
  const stories = [{ id: 'no-assets', title: 'X', readingTime: '1 min', category: 'Courage', pages: [{ text: 'only text' }] }];
  const m = buildManifest(stories, () => false, 'v', 'https://cdn/');
  const s = m.stories[0];
  assert.equal(s.cover, undefined);
  assert.equal(s.pages[0].audio, undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/build-manifest.test.mjs`
Expected: FAIL — cannot find module `build-manifest.mjs` / `buildManifest` is not exported.

- [ ] **Step 3: Write the implementation**

```js
import 'dotenv/config';
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

// Filesystem-backed assetExists: a manifest key maps to assets/<key-with-stories-prefix-stripped>.
// Keys look like "stories/<id>/cover-vibrant.jpg" -> assets/stories/<id>/cover-vibrant.jpg
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

if (import.meta.url === `file://${process.argv[1]}`) main();
```

Note: verified real paths — covers at `assets/stories/<id>/cover-vibrant.jpg`, audio at `assets/audio/<id>/page-N.mp3`. The key templates above match these (`stories/${id}/cover-vibrant.jpg` and `audio/${id}/page-${i}.mp3`), and `assetExists` maps a key to `assets/<key>`. If you add a new asset naming convention later, this is the one place a wrong path silently omits assets — keep templates in sync with disk.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/build-manifest.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Generate the manifest locally and eyeball it**

Run: `CDN_BASE_URL=https://placeholder.r2.dev/ node scripts/build-manifest.mjs`
Expected: prints `Wrote manifest.json + manifest.bundled.json (61 stories ...)`. Open `manifest.json`, confirm covers and audio keys are present for a known story.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-manifest.mjs scripts/__tests__/build-manifest.test.mjs src/data/manifest.bundled.json
git commit -m "feat: add manifest builder + bundled snapshot"
```

### Task 1.3: Publish script (upload to R2)

**Files:**
- Create: `scripts/publish.mjs`

- [ ] **Step 1: Write the script**

```js
// Uploads all per-story assets and manifest.json to R2.
// Usage:
//   node scripts/publish.mjs            -> upload only assets missing/changed is out of scope; uploads all
//   node scripts/publish.mjs <storyId>  -> upload just one story's assets + refreshed manifest
import 'dotenv/config';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { makeClient, uploadFile } from './lib/r2.mjs';
import { loadStories, buildManifest, fsAssetExists } from './build-manifest.mjs';
import { writeFileSync } from 'node:fs';

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
```

- [ ] **Step 2: Dry-run guard check (no creds needed)**

Run: `node scripts/publish.mjs 2>&1 | head -1` with no `.env`.
Expected: prints the `CDN_BASE_URL missing...` or `Missing env vars...` error and exits non-zero — proves it fails safe before touching the network.

- [ ] **Step 3: Commit**

```bash
git add scripts/publish.mjs
git commit -m "feat: add R2 publish script (bulk + per-story)"
```

### Task 1.4: First real upload (USER + agent together)

**Files:** none (operational).

- [ ] **Step 1:** Confirm the user has completed `docs/r2-setup-checklist.md` and `.env` has all five values (`R2_*` + `CDN_BASE_URL`).
- [ ] **Step 2:** Run `node scripts/build-manifest.mjs` to regenerate the manifest with the real `CDN_BASE_URL`.
- [ ] **Step 3:** Run `node scripts/publish.mjs`. Watch the `...N files uploaded` progress. Expected final line: `Done. Uploaded ~800 asset files + manifest.json`.
- [ ] **Step 4:** Verify in a browser: open `${CDN_BASE_URL}manifest.json` and one cover URL from it. Both should load. (If 403/rate-limited on r2.dev, that's the dev-subdomain limit — fine for testing.)
- [ ] **Step 5:** Commit the refreshed bundled snapshot: `git add src/data/manifest.bundled.json && git commit -m "chore: refresh bundled manifest with real CDN base url"`.

---

## PHASE 2 — App Content Layer (manifest types, fetch, provider)

### Task 2.1: Manifest types + parser

**Files:**
- Create: `src/data/content-manifest.ts`
- Test: `src/__tests__/content-manifest.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { parseManifest, resolveUrl } from '@/data/content-manifest';

const sample = {
  version: 'v1',
  baseUrl: 'https://cdn/',
  stories: [{
    id: 's1', title: 'T', readingTime: '2 min', category: 'Patience', moral: 'm',
    cover: 'stories/s1/cover-vibrant.jpg',
    pages: [{ text: 'a', audio: 'stories/s1/audio/page-0.mp3' }, { text: 'b' }],
  }],
};

test('parseManifest returns version and one story', () => {
  const m = parseManifest(sample);
  expect(m.version).toBe('v1');
  expect(m.stories).toHaveLength(1);
  expect(m.stories[0].cover).toBe('stories/s1/cover-vibrant.jpg');
});

test('parseManifest throws on a malformed payload', () => {
  expect(() => parseManifest({ nope: true })).toThrow();
});

test('resolveUrl joins baseUrl and key, and passes through undefined', () => {
  expect(resolveUrl('https://cdn/', 'stories/s1/cover-vibrant.jpg')).toBe('https://cdn/stories/s1/cover-vibrant.jpg');
  expect(resolveUrl('https://cdn/', undefined)).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- content-manifest`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
export interface ManifestPage { text: string; audio?: string }
export interface ManifestStory {
  id: string;
  title: string;
  readingTime: string;
  category: string;
  moral?: string;
  cover?: string;
  pages: ManifestPage[];
}
export interface ContentManifest {
  version: string;
  baseUrl: string;
  stories: ManifestStory[];
}

export function parseManifest(raw: unknown): ContentManifest {
  const m = raw as Partial<ContentManifest>;
  if (!m || typeof m.version !== 'string' || typeof m.baseUrl !== 'string' || !Array.isArray(m.stories)) {
    throw new Error('Malformed manifest: missing version, baseUrl, or stories[].');
  }
  return m as ContentManifest;
}

// baseUrl always ends with '/'; key is relative. Undefined key => undefined url.
export function resolveUrl(baseUrl: string, key?: string): string | undefined {
  return key ? baseUrl + key : undefined;
}

const MANIFEST_PATH = 'manifest.json';

// Fetches the remote manifest. Throws on network/parse failure so callers can fall back.
export async function fetchRemoteManifest(baseUrl: string): Promise<ContentManifest> {
  const res = await fetch(baseUrl + MANIFEST_PATH, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  return parseManifest(await res.json());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- content-manifest`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/content-manifest.ts src/__tests__/content-manifest.test.ts
git commit -m "feat: add content manifest types + parser"
```

### Task 2.2: Update Story types + assembler to URL-based assets

**Files:**
- Modify: `src/types/story.ts`
- Modify: `src/data/story-assembler.ts`
- Test: `src/__tests__/story-assembler.test.ts` (create if absent)

- [ ] **Step 1: Change the types**

In `src/types/story.ts`, change the asset fields from `number` to `string`:

```ts
export interface Page {
  text: string;
  illustration?: string;   // was: number
  hasAudio: boolean;
  audioSource?: string;    // was: number  (now a remote URL)
}
```
and
```ts
export interface Story {
  id: string;
  title: string;
  coverArt?: string;       // was: number  (now a remote URL)
  readingTime: string;
  category: StoryCategory;
  moral?: string;
  pages: Page[];
}
```

- [ ] **Step 2: Write the failing assembler test**

```ts
import { assembleStory } from '@/data/story-assembler';
import type { ManifestStory } from '@/data/content-manifest';

const entry: ManifestStory = {
  id: 's1', title: 'T', readingTime: '2 min', category: 'Patience', moral: 'm',
  cover: 'stories/s1/cover-vibrant.jpg',
  pages: [{ text: 'a', audio: 'stories/s1/audio/page-0.mp3' }, { text: 'b' }],
};

test('assembleStory resolves cover + audio to absolute urls and sets hasAudio', () => {
  const s = assembleStory(entry, 'https://cdn/');
  expect(s.coverArt).toBe('https://cdn/stories/s1/cover-vibrant.jpg');
  expect(s.pages[0].hasAudio).toBe(true);
  expect(s.pages[0].audioSource).toBe('https://cdn/stories/s1/audio/page-0.mp3');
  expect(s.pages[1].hasAudio).toBe(false);
  expect(s.pages[1].audioSource).toBeUndefined();
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- story-assembler`
Expected: FAIL — assembleStory has the old signature/behavior.

- [ ] **Step 4: Rewrite the assembler**

Replace the entire body of `src/data/story-assembler.ts` with:

```ts
import { Story, StoryCategory, Page } from '@/types/story';
import { ManifestStory, resolveUrl } from './content-manifest';

// Builds a runtime Story from a manifest entry, resolving relative asset keys to absolute URLs.
export function assembleStory(entry: ManifestStory, baseUrl: string): Story {
  const pages: Page[] = entry.pages.map((p) => {
    const audioSource = resolveUrl(baseUrl, p.audio);
    return { text: p.text, hasAudio: audioSource != null, audioSource };
  });

  return {
    id: entry.id,
    title: entry.title,
    readingTime: entry.readingTime,
    category: entry.category as StoryCategory,
    coverArt: resolveUrl(baseUrl, entry.cover),
    moral: entry.moral,
    pages,
  };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- story-assembler`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/story.ts src/data/story-assembler.ts src/__tests__/story-assembler.test.ts
git commit -m "feat: assemble stories from manifest entries with URL assets"
```

### Task 2.3: Delete the static asset manifest

**Files:**
- Delete: `src/data/asset-manifest.ts`
- Delete: `src/__tests__/asset-manifest.test.ts`

- [ ] **Step 1: Delete both files**

```bash
git rm src/data/asset-manifest.ts src/__tests__/asset-manifest.test.ts
```

- [ ] **Step 2: Verify nothing else imports them**

Run: `grep -rn "asset-manifest" src/ || echo "no references"`
Expected: `no references` (Task 2.2 removed the assembler's import; `stories.ts` is rewritten in Task 2.4).

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: remove static Metro asset manifest (assets now remote)"
```

### Task 2.4: ContentProvider + rewire `stories.ts`

**Files:**
- Create: `src/state/ContentProvider.tsx`
- Modify: `src/data/stories.ts`
- Test: `src/__tests__/ContentProvider.test.tsx`

The provider loads the bundled snapshot synchronously (so first paint has the full catalog offline), then fetches the remote manifest and swaps it in if the version differs. `stories.ts` keeps its `getStories()`/`getStory()` API but reads from a module snapshot the provider updates, so the pure helpers (`story-of-the-day`, `story-search`) keep working unchanged.

- [ ] **Step 1: Rewrite `src/data/stories.ts`**

```ts
import { Story } from '@/types/story';
import { assembleStory } from './story-assembler';
import { ContentManifest, parseManifest } from './content-manifest';
import bundled from './manifest.bundled.json';

// Module snapshot of the current catalog. Starts from the bundled manifest so the app
// renders offline on first paint; ContentProvider replaces it when a newer remote manifest loads.
let current: Story[] = assembleAll(parseManifest(bundled));

function assembleAll(m: ContentManifest): Story[] {
  return m.stories.map((e) => assembleStory(e, m.baseUrl));
}

// Called by ContentProvider after a successful remote fetch.
export function setCatalog(m: ContentManifest): void {
  current = assembleAll(m);
}

export function getStories(): Story[] {
  return current;
}

export function getStory(id: string): Story | undefined {
  return current.find((s) => s.id === id);
}

export default current;
```

Note: `import bundled from './manifest.bundled.json'` requires `resolveJsonModule` — the project already imports story JSON this way, so it is enabled.

- [ ] **Step 2: Write the failing provider test**

```tsx
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ContentProvider, useCatalogVersion } from '@/state/ContentProvider';
import { getStories } from '@/data/stories';

function Probe() {
  const version = useCatalogVersion();
  return <Text>{`${version}:${getStories().length}`}</Text>;
}

test('ContentProvider renders bundled catalog immediately and exposes a version', async () => {
  const { getByText } = render(<ContentProvider><Probe /></ContentProvider>);
  await waitFor(() => {
    // bundled snapshot has all stories; version string is non-empty
    expect(getByText(/:\d+$/)).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- ContentProvider`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the provider**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { parseManifest, fetchRemoteManifest, ContentManifest } from '@/data/content-manifest';
import { setCatalog } from '@/data/stories';
import bundled from '@/data/manifest.bundled.json';

const VersionContext = createContext<string>('');

// Loads bundled content synchronously, then tries the remote manifest and swaps if newer.
export function ContentProvider({ children }: { children: ReactNode }) {
  const initial = parseManifest(bundled);
  const [version, setVersion] = useState(initial.version);

  useEffect(() => {
    let active = true;
    fetchRemoteManifest(initial.baseUrl)
      .then((remote: ContentManifest) => {
        if (!active) return;
        if (remote.version !== initial.version) {
          setCatalog(remote);
          setVersion(remote.version); // re-render consumers so new stories appear this session
        }
      })
      .catch(() => { /* offline or fetch failed — bundled snapshot stands */ });
    return () => { active = false; };
  }, [initial.baseUrl, initial.version]);

  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

// Screens read this so they re-render when the remote catalog swaps in.
export function useCatalogVersion(): string {
  return useContext(VersionContext);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- ContentProvider`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/state/ContentProvider.tsx src/data/stories.ts src/__tests__/ContentProvider.test.tsx
git commit -m "feat: ContentProvider loads bundled catalog + swaps in remote manifest"
```

### Task 2.5: Mount the provider and subscribe the screens

**Files:**
- Modify: `src/app/_layout.tsx`
- Modify: `src/app/(tabs)/(home)/category/[category].tsx`
- Modify: `src/app/(tabs)/(home)/library.tsx`
- Modify: `src/app/(tabs)/my-jar.tsx`
- Modify: `src/app/(tabs)/search.tsx`

- [ ] **Step 1: Wrap the tree in ContentProvider**

In `src/app/_layout.tsx`, import and wrap the existing `<AppDataProvider>` (place `ContentProvider` outside or inside it — order does not matter since they are independent):

```tsx
import { ContentProvider } from '@/state/ContentProvider';
// ...
return (
  <ContentProvider>
    <AppDataProvider>
      {/* existing children / Stack */}
    </AppDataProvider>
  </ContentProvider>
);
```
(Adapt to the real JSX in `_layout.tsx`; the only requirement is `ContentProvider` wraps everything that calls `getStories()`.)

- [ ] **Step 2: Make each screen re-render on catalog swap**

In each of the 4 screens, import the hook and call it once so the component subscribes to version changes. Example for `search.tsx` — add the import and one line inside the component:

```tsx
import { useCatalogVersion } from '@/state/ContentProvider';
// ...inside the component, before useMemo:
const catalogVersion = useCatalogVersion();
const stories = useMemo(() => getStories(), [catalogVersion]); // re-read when catalog swaps
```

For `library.tsx`, `category/[category].tsx`, `my-jar.tsx`: add `const catalogVersion = useCatalogVersion();` at the top of the component body, and include `catalogVersion` in the dependency array of whatever `useMemo`/derivation reads `getStories()` (or just reference it so the component re-renders — these screens call `getStories()` inline during render, so the hook subscription alone forces the re-read).

- [ ] **Step 3: Typecheck + full test run**

Run: `npx tsc --noEmit && npm test`
Expected: no type errors; all tests pass. (If any test imported `asset-manifest`, it was deleted in 2.3 — fix stragglers now.)

- [ ] **Step 4: Commit**

```bash
git add src/app/_layout.tsx "src/app/(tabs)/(home)/category/[category].tsx" "src/app/(tabs)/(home)/library.tsx" "src/app/(tabs)/my-jar.tsx" "src/app/(tabs)/search.tsx"
git commit -m "feat: mount ContentProvider and re-render screens on catalog swap"
```

---

## PHASE 3 — Asset Delivery (images stream, audio caches)

### Task 3.1: Confirm images work as remote URLs (no code, verify assumption)

**Files:** none (verification against v56 docs already done, but confirm at runtime in Phase 5).

- [ ] **Step 1:** Confirm `expo-image`'s `<Image source={string}>` treats a bare URL string as a remote image with disk caching. The image consumers (`StoryCard`, `ContinueCard`, `StoryOfTheDayCard`, `PageView`, `index.tsx`) already pass `story.coverArt` / `page.illustration`, which are now `string`. **No code change** — the type change in Task 2.2 is sufficient. This task is a checkpoint: grep the consumers and confirm none do arithmetic or `require()`-specific handling on those values.

Run: `grep -rn "coverArt\|illustration" src/components src/app | grep -v "\.test\."`
Expected: only `<Image source={...}>` usages and `!= null` / `!== undefined` guards — all string-safe.

- [ ] **Step 2:** No commit (verification only). If any consumer wraps the value in `{ uri: ... }` or does `require`, note it and fix to pass the string directly.

### Task 3.2: Audio cache (download-then-play)

**Files:**
- Create: `src/data/content-cache.ts`
- Test: `src/__tests__/content-cache.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { cacheFilenameFor } from '@/data/content-cache';

test('cacheFilenameFor is stable and filesystem-safe for a url', () => {
  const a = cacheFilenameFor('https://cdn/stories/s1/audio/page-0.mp3');
  const b = cacheFilenameFor('https://cdn/stories/s1/audio/page-0.mp3');
  expect(a).toBe(b);                       // deterministic
  expect(a).toMatch(/\.mp3$/);             // keeps extension
  expect(a).not.toContain('/');            // safe as a flat filename
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- content-cache`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import { File, Directory, Paths } from 'expo-file-system';

const AUDIO_DIR = 'story-audio';

// Deterministic flat filename for a remote url: encode the path, keep the extension.
export function cacheFilenameFor(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0] ?? 'mp3';
  const base = encodeURIComponent(url).replace(/[%]/g, '_');
  return `${base}.${ext}`;
}

// Returns a local file:// uri for the audio, downloading it once and reusing the cache after.
// On any failure (offline first-play), returns the remote url so expo-audio can stream instead.
export async function getCachedAudioUri(url: string): Promise<string> {
  try {
    const dir = new Directory(Paths.cache, AUDIO_DIR);
    if (!dir.exists) dir.create();
    const file = new File(dir, cacheFilenameFor(url));
    if (file.exists) return file.uri;
    const out = await File.downloadFileAsync(url, dir);
    return out.uri;
  } catch {
    return url; // fall back to streaming the remote url
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- content-cache`
Expected: PASS. (The pure `cacheFilenameFor` is unit-tested; `getCachedAudioUri` is exercised end-to-end in Phase 5 on device, since it needs the native filesystem.)

- [ ] **Step 5: Commit**

```bash
git add src/data/content-cache.ts src/__tests__/content-cache.test.ts
git commit -m "feat: add device audio cache (download-once, stream on failure)"
```

### Task 3.3: Play audio from the cache in useNarration

**Files:**
- Modify: `src/hooks/useNarration.ts`

The load effect currently does `player.replace(source)` with a require-number. Now `audioSource` is a URL string; resolve it through the cache, then `replace({ uri })`. Guard against the page changing mid-download (async race).

- [ ] **Step 1: Update the load effect**

Add the import at the top:
```ts
import { getCachedAudioUri } from '@/data/content-cache';
```

Replace the load effect (lines ~47–59) with:

```ts
  // Load audio on page change; auto-start if in continuous-play mode
  useEffect(() => {
    let active = true;
    safe(() => player.pause());
    setSpeechState('idle');
    const url = currentPage?.audioSource;
    if (url) {
      getCachedAudioUri(url).then((uri) => {
        if (!active) return; // page changed while downloading — drop this result
        safe(() => player.replace({ uri }));
        if (isAutoPlayingRef.current) {
          safe(() => player.play());
          setSpeechState('speaking');
        }
      });
    }
    return () => { active = false; };
  }, [currentPage]);
```

- [ ] **Step 2: Run the narration tests**

Run: `npm test -- useNarration`
Expected: The existing `useNarration.test.ts` mocks `expo-audio`. It may need a mock for `@/data/content-cache` returning a resolved uri. If tests reference `audioSource` as a number, update the fixtures to a string URL and mock `getCachedAudioUri` to `async (u) => u`. Make them pass.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useNarration.ts src/__tests__/useNarration.test.ts
git commit -m "feat: narration downloads audio to device cache before playback"
```

---

## PHASE 4 — Full Verification (real app, real network)

### Task 4.1: Run the app end-to-end

**Files:** none (runtime verification — REQUIRED before calling this done).

- [ ] **Step 1:** Ensure Phase 1.4 uploaded assets and `CDN_BASE_URL` in `manifest.bundled.json` points at the real bucket URL. Regenerate + commit if needed (`node scripts/build-manifest.mjs`).
- [ ] **Step 2:** Start the app: `npx expo start` (use the built-in `/run` skill if available). Open a story.
- [ ] **Step 3:** Confirm on device/emulator: (a) library grid shows cover images (streamed from R2), (b) opening a story shows text immediately, (c) tapping play downloads + plays the page audio, (d) replaying the same page is instant (cache hit).
- [ ] **Step 4:** Airplane-mode test: kill network, relaunch. Catalog still renders (bundled manifest); previously-played audio still plays (cache); covers already viewed still show (expo-image cache). Un-viewed covers show a placeholder — acceptable for v1.
- [ ] **Step 5:** New-story test: add a throwaway story JSON + assets, run `node scripts/publish.mjs <id>`, relaunch the app WITHOUT rebuilding. Confirm the new story appears. **This proves the core requirement.** Then remove the throwaway story and re-publish.

### Task 4.2: Confirm binary size dropped

- [ ] **Step 1:** Confirm `assets/stories` and `assets/audio` are no longer `require()`d anywhere: `grep -rn "assets/stories\|assets/audio" src/ || echo "clean"`. Expected `clean` (decorative stays).
- [ ] **Step 2:** Decide whether to keep the now-unbundled `assets/stories` + `assets/audio` folders in the repo (recommended: keep as the source of truth for re-uploads; they are just no longer imported by Metro, so they will not inflate the binary). Document this in `docs/r2-setup-checklist.md` if desired.

---

## Deferred (ponytail: exists, add when a feature demands it)

- **Bundled starter media** — ship ~5 stories' assets in the binary for a richer first-launch offline experience. Skipped: bundled manifest already renders the catalog; assets stream. Add if store review or UX needs offline covers on first run.
- **Incremental/changed-only upload** — `publish.mjs` uploads all referenced assets each full run. Skipped: R2 PUT is idempotent and cheap (~800 files, one-time; per-story publishes are tiny). Add content-hash diffing only if full re-uploads get slow.
- **Accounts + cross-device sync** — user data stays in AsyncStorage. Add Supabase/Firebase + auth only when "same progress on two devices" becomes a requirement.
- **Headless CMS** — publishing is a script. Add Sanity/Strapi only when a non-technical person needs to author stories.
- **Migrating decorative art (88 MB) off-bundle** — stays bundled as the fixed app shell. Revisit only if binary size becomes a store problem.

---

## Self-Review Notes

- **Spec coverage:** publish-without-redeploy → Phase 1 (scripts) + Task 4.1 Step 5 (proof). Keep user data local → untouched `AppData.tsx`. No auth → nothing added. Cost/setup → `docs/r2-setup-checklist.md` + `.env.example`.
- **Type consistency:** `audioSource`/`illustration`/`coverArt` are `string` everywhere post-2.2; `ManifestStory`/`ContentManifest` used identically in 2.1/2.2/2.4; `getCachedAudioUri`/`cacheFilenameFor` names match across 3.2/3.3; `setCatalog`/`getStories` match across 2.4/2.5.
- **Path reconciliation flagged** in Task 1.2 Step 3 — the one place to double-check real asset paths (`assets/audio/<id>` vs `assets/stories/<id>/audio`) before the first upload.
