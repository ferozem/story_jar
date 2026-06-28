# Story Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 31 unique new stories (text-only, no cover art or audio) to the app via a one-shot import script, bringing the total from 6 to 37 stories.

**Architecture:** A Node.js script (`scripts/import-stories.mjs`) parses two markdown files with different formats, deduplicates by slug ID, splits paragraphs into screen-sized pages, writes JSON files into `src/data/stories/`, and rewrites `src/data/stories.ts`. Three small type/component changes make the app handle stories without cover art without crashing.

**Tech Stack:** Node.js ESM (no new npm deps), TypeScript (existing), React Native / Expo (existing), Jest (existing).

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types/story.ts` | Make `coverArt` optional; add `moral?` |
| Modify | `src/data/story-assembler.ts` | Accept `moral?` in `RawStory`, pass through |
| Modify | `src/components/StoryCard.tsx` | Show placeholder `View` when `coverArt` is undefined |
| Modify | `src/__tests__/StoryCard.test.tsx` | Add test for `coverArt: undefined` |
| Modify | `src/__tests__/stories.test.ts` | Update count to 37, relax `coverArt` check |
| Create | `scripts/import-stories.mjs` | Parsers, page splitter, JSON writer, stories.ts rewriter |
| Create | `scripts/test-import-stories.mjs` | Unit tests for pure functions in the script |
| Generate | `src/data/stories/*.json` (31 new files) | Story content, output of the script |
| Rewrite | `src/data/stories.ts` | Imports all 37 stories, output of the script |

---

## Known Edge Cases

- **Duplicate:** "The Last Mango Slice" appears in both source files. The combined-story-collection.md version wins; the next-12-stories.md version is skipped. Net: 20 + 12 − 1 = 31 new stories.
- **Hyphenated titles:** "The Finish-Line Water Bottle" and "The Missing Thank-You" contain hyphens. `titleToId` preserves them: `the-finish-line-water-bottle`, `the-missing-thank-you`.
- **next-12-stories.md format:** Two sub-formats in one file. Section 1 (stories 1–6) uses `Story N: Title` plain-text headings with one line per paragraph. Section 2 (stories 7–12) uses `Story N` + title on next line with `________` separators.

---

## Task 1: Make `coverArt` optional in Story type

**Files:**
- Modify: `src/types/story.ts`

- [ ] **Step 1: Edit the type**

Replace the contents of `src/types/story.ts` with:

```typescript
export interface Page {
  text: string;
  illustration?: number;
  hasAudio: boolean;
  audioSource?: number;
}

export interface Story {
  id: string;
  title: string;
  coverArt?: number;
  readingTime: string;
  moral?: string;
  pages: Page[];
}
```

- [ ] **Step 2: Run tests to confirm nothing broke**

```
npm test
```

Expected: all tests pass (TypeScript now allows `coverArt` to be undefined, existing stories still have it).

- [ ] **Step 3: Commit**

```bash
git add src/types/story.ts
git commit -m "feat: make coverArt optional and add moral field to Story type"
```

---

## Task 2: Update assembler to pass `moral` through

**Files:**
- Modify: `src/data/story-assembler.ts`

- [ ] **Step 1: Update the file**

Replace the contents of `src/data/story-assembler.ts` with:

```typescript
import { Story, Page } from '@/types/story';
import { coverArt, audioAssets } from './asset-manifest';

type RawPage = { text: string };
type RawStory = { id: string; title: string; readingTime: string; moral?: string; pages: RawPage[] };

export function assembleStory(raw: RawStory): Story {
  const audio = audioAssets[raw.id] ?? [];

  if (audio.length > 0 && audio.length !== raw.pages.length) {
    throw new Error(
      `Story "${raw.id}": audio asset count (${audio.length}) does not match page count (${raw.pages.length}). ` +
      `Run scripts/generate-audio.mjs to regenerate missing files.`
    );
  }

  const pages: Page[] = raw.pages.map((p, i) => ({
    text: p.text,
    hasAudio: audio.length > 0,
    audioSource: audio[i],
  }));

  return {
    id: raw.id,
    title: raw.title,
    readingTime: raw.readingTime,
    coverArt: coverArt[raw.id],
    moral: raw.moral,
    pages,
  };
}
```

- [ ] **Step 2: Run tests**

```
npm test
```

Expected: all tests pass (adding optional `moral` is backwards-compatible).

- [ ] **Step 3: Commit**

```bash
git add src/data/story-assembler.ts
git commit -m "feat: pass moral field through assembleStory"
```

---

## Task 3: Fix StoryCard to handle missing `coverArt`

**Files:**
- Modify: `src/components/StoryCard.tsx`
- Modify: `src/__tests__/StoryCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test at the end of the `describe('StoryCard', ...)` block in `src/__tests__/StoryCard.test.tsx` (before the closing `}`):

```tsx
  it('renders a placeholder when coverArt is undefined', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard
        story={{ title: 'No Cover Story', coverArt: undefined, readingTime: '3 min' }}
        onPress={mockPress}
      />
    );
    expect(getByText('No Cover Story')).toBeDefined();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```
npx jest src/__tests__/StoryCard.test.tsx
```

Expected: the new test fails (Image crashes with undefined source) or passes vacuously. If it fails, proceed. If it passes unexpectedly, continue anyway — the next step still guards the component correctly.

- [ ] **Step 3: Update StoryCard to guard the Image**

Replace the contents of `src/components/StoryCard.tsx` with:

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  story: Pick<Story, 'title' | 'coverArt' | 'readingTime'>;
  onPress: () => void;
}

export function StoryCard({ story, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {story.coverArt !== undefined
        ? <Image source={story.coverArt} style={styles.cover} resizeMode="cover" />
        : <View style={[styles.cover, styles.coverPlaceholder]} />
      }
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
        <Text style={styles.readingTime}>{story.readingTime}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cover: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.border,
  },
  coverPlaceholder: {
    backgroundColor: theme.colors.secondary,
  },
  info: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSizes.body,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  readingTime: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
  },
});
```

- [ ] **Step 4: Run tests**

```
npx jest src/__tests__/StoryCard.test.tsx
```

Expected: all tests pass including the new one.

- [ ] **Step 5: Commit**

```bash
git add src/components/StoryCard.tsx src/__tests__/StoryCard.test.tsx
git commit -m "feat: show placeholder when story has no cover art"
```

---

## Task 4: Update stories.test.ts to expect 37 stories (red state)

**Files:**
- Modify: `src/__tests__/stories.test.ts`

- [ ] **Step 1: Update the count assertions and relax coverArt check**

Replace the contents of `src/__tests__/stories.test.ts` with:

```typescript
import { getStories, getStory } from '@/data/stories';
import { Story } from '@/types/story';

describe('stories module', () => {
  describe('getStories', () => {
    it('returns an array of stories', () => {
      const stories = getStories();
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBeGreaterThan(0);
    });

    it('returns 37 stories', () => {
      const stories = getStories();
      expect(stories.length).toBe(37);
    });

    it('each story has required properties', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('readingTime');
        expect(story).toHaveProperty('pages');
      });
    });

    it('stories with coverArt have a numeric value', () => {
      const stories = getStories();
      stories.forEach((story) => {
        if (story.coverArt !== undefined) {
          expect(typeof story.coverArt).toBe('number');
        }
      });
    });

    it('each story has valid id and title', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(typeof story.id).toBe('string');
        expect(story.id.length).toBeGreaterThan(0);
        expect(typeof story.title).toBe('string');
        expect(story.title.length).toBeGreaterThan(0);
      });
    });

    it('each story has at least one page', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(Array.isArray(story.pages)).toBe(true);
        expect(story.pages.length).toBeGreaterThan(0);
      });
    });

    it('each page has required properties', () => {
      const stories = getStories();
      stories.forEach((story) => {
        story.pages.forEach((page) => {
          expect(page).toHaveProperty('text');
          expect(page).toHaveProperty('hasAudio');
          expect(typeof page.text).toBe('string');
          expect(typeof page.hasAudio).toBe('boolean');
        });
      });
    });

    it('returns the same array on multiple calls', () => {
      const stories1 = getStories();
      const stories2 = getStories();
      expect(stories1).toBe(stories2);
    });
  });

  describe('getStory', () => {
    it('returns a story by id', () => {
      const stories = getStories();
      const story = getStory(stories[0].id);
      expect(story).toBeDefined();
      expect(story?.id).toBe(stories[0].id);
    });

    it('returns undefined for non-existent story id', () => {
      const story = getStory('non-existent-id');
      expect(story).toBeUndefined();
    });

    it('returns the correct story properties', () => {
      const stories = getStories();
      const testStory = stories[0];
      const foundStory = getStory(testStory.id);

      expect(foundStory?.title).toBe(testStory.title);
      expect(foundStory?.id).toBe(testStory.id);
      expect(foundStory?.readingTime).toBe(testStory.readingTime);
    });

    it('returns story with all pages', () => {
      const stories = getStories();
      const testStory = stories[0];
      const foundStory = getStory(testStory.id);

      expect(foundStory?.pages.length).toBe(testStory.pages.length);
    });

    it('finds each story in the collection', () => {
      const stories = getStories();
      stories.forEach((story) => {
        const found = getStory(story.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(story.id);
      });
    });

    it('case sensitive id matching', () => {
      const stories = getStories();
      const originalId = stories[0].id;
      const wrongCase = originalId.toUpperCase();
      const story = getStory(wrongCase);
      if (originalId !== wrongCase) {
        expect(story).toBeUndefined();
      }
    });

    it('handles empty string id', () => {
      const story = getStory('');
      expect(story).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('default export is an array of stories', () => {
      const stories = require('@/data/stories').default;
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBe(37);
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails (expected red state)**

```
npx jest src/__tests__/stories.test.ts
```

Expected: FAIL — "Expected: 37, Received: 6". This is intentional. Do NOT fix it yet; the script in Task 6 will fix it.

- [ ] **Step 3: Commit the red test**

```bash
git add src/__tests__/stories.test.ts
git commit -m "test: expect 37 stories after import script runs"
```

---

## Task 5: Write unit tests for the import script

**Files:**
- Create: `scripts/test-import-stories.mjs`

- [ ] **Step 1: Create the test file**

Create `scripts/test-import-stories.mjs` with this content:

```javascript
import assert from 'assert';
import { titleToId, splitIntoPages, parseFormatA, parseFormatB } from './import-stories.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log('\ntitleToId');

test('basic title', () => {
  assert.strictEqual(titleToId('The Trail Marker Promise'), 'the-trail-marker-promise');
});

test('preserves hyphen in title', () => {
  assert.strictEqual(titleToId('The Finish-Line Water Bottle'), 'the-finish-line-water-bottle');
});

test('preserves hyphen in compound word', () => {
  assert.strictEqual(titleToId('The Missing Thank-You'), 'the-missing-thank-you');
});

test('strips apostrophes', () => {
  assert.strictEqual(titleToId("Nani's Garden"), 'nanis-garden');
});

console.log('\nsplitIntoPages');

test('single short paragraph stays as one page', () => {
  const pages = splitIntoPages(['Short text.']);
  assert.strictEqual(pages.length, 1);
  assert.strictEqual(pages[0].text, 'Short text.');
});

test('groups short paragraphs until target is reached', () => {
  const paras = Array(10).fill('A'.repeat(80)); // 10 × 80-char paragraphs
  const pages = splitIntoPages(paras);
  // Each page should have multiple paragraphs
  assert.ok(pages.length < 10, `Expected fewer than 10 pages, got ${pages.length}`);
  pages.forEach(p => {
    assert.ok(p.text.length >= 150, `Page too short: ${p.text.length}`);
  });
});

test('never produces a page over 700 chars (unless single long paragraph)', () => {
  const paras = Array(20).fill('B'.repeat(60));
  const pages = splitIntoPages(paras);
  pages.forEach(p => {
    assert.ok(p.text.length <= 700, `Page too long: ${p.text.length}`);
  });
});

test('long single paragraph stays as one page', () => {
  const long = 'X'.repeat(600);
  const pages = splitIntoPages([long]);
  assert.strictEqual(pages.length, 1);
});

test('pages joined with double newline', () => {
  // Two ~250-char paragraphs should land in one page joined by \n\n
  const p1 = 'A'.repeat(250);
  const p2 = 'B'.repeat(100);
  const pages = splitIntoPages([p1, p2]);
  if (pages.length === 1) {
    assert.ok(pages[0].text.includes('\n\n'));
  }
});

console.log('\nparseFormatA');

const FORMAT_A_SAMPLE = `# Test Collection

## Story 1: The Red Kite

First paragraph here.

Second paragraph here.

## Moral of the Story

Always fly high.

---

## Story 2: The Blue Stone

Only paragraph.

## Moral of the Story

Be solid.

---
`;

test('parses 2 stories from format A', () => {
  const stories = parseFormatA(FORMAT_A_SAMPLE);
  assert.strictEqual(stories.length, 2);
});

test('extracts title correctly', () => {
  const stories = parseFormatA(FORMAT_A_SAMPLE);
  assert.strictEqual(stories[0].title, 'The Red Kite');
  assert.strictEqual(stories[1].title, 'The Blue Stone');
});

test('extracts moral correctly', () => {
  const stories = parseFormatA(FORMAT_A_SAMPLE);
  assert.strictEqual(stories[0].moral, 'Always fly high.');
  assert.strictEqual(stories[1].moral, 'Be solid.');
});

test('extracts paragraphs', () => {
  const stories = parseFormatA(FORMAT_A_SAMPLE);
  assert.strictEqual(stories[0].paragraphs.length, 2);
  assert.strictEqual(stories[0].paragraphs[0], 'First paragraph here.');
});

console.log('\nparseFormatB — section 1 (Story N: Title format)');

const FORMAT_B_S1 = `Creative Method: Next Stories
Story 1: The Small Jar
A child found a jar.
She filled it with rain.
Moral of the Story
Small things hold big meaning.
 
Story 2: The Paper Bridge
He built a bridge from paper.
It held one coin.
Moral of the Story
Effort matters more than material.
`;

test('parses 2 stories from format B section 1', () => {
  const stories = parseFormatB(FORMAT_B_S1);
  assert.strictEqual(stories.length, 2, `Got ${stories.length} stories`);
});

test('extracts title from format B section 1', () => {
  const stories = parseFormatB(FORMAT_B_S1);
  assert.strictEqual(stories[0].title, 'The Small Jar');
  assert.strictEqual(stories[1].title, 'The Paper Bridge');
});

test('extracts moral from format B section 1', () => {
  const stories = parseFormatB(FORMAT_B_S1);
  assert.strictEqual(stories[0].moral, 'Small things hold big meaning.');
});

test('extracts paragraphs from format B section 1', () => {
  const stories = parseFormatB(FORMAT_B_S1);
  assert.strictEqual(stories[0].paragraphs.length, 2);
});

console.log('\nparseFormatB — section 2 (Story N + title on next line)');

const FORMAT_B_S2 = `________________________________________
Story 1
The Old Clock
He wound the clock every morning.
Nobody asked him to.
Moral of the Story
Duty does not need an audience.
________________________________________
Story 2
The Torn Letter
She found a letter in the drain.
She returned it unread.
Moral of the Story
Respect means not prying.
`;

test('parses 2 stories from format B section 2', () => {
  const stories = parseFormatB(FORMAT_B_S2);
  assert.strictEqual(stories.length, 2, `Got ${stories.length} stories`);
});

test('extracts title from format B section 2', () => {
  const stories = parseFormatB(FORMAT_B_S2);
  assert.strictEqual(stories[0].title, 'The Old Clock');
  assert.strictEqual(stories[1].title, 'The Torn Letter');
});

test('extracts moral from format B section 2', () => {
  const stories = parseFormatB(FORMAT_B_S2);
  assert.strictEqual(stories[0].moral, 'Duty does not need an audience.');
});

console.log('\ndeduplication');

test('titleToId produces stable slug for duplicate detection', () => {
  assert.strictEqual(titleToId('The Last Mango Slice'), 'the-last-mango-slice');
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

- [ ] **Step 2: Note — tests will fail until the script exists**

Do not run this file yet. It imports from `./import-stories.mjs` which doesn't exist. Proceed to Task 6.

---

## Task 6: Write the import script

**Files:**
- Create: `scripts/import-stories.mjs`

- [ ] **Step 1: Create the script**

Create `scripts/import-stories.mjs` with this content:

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Pure functions (exported for tests) ───────────────────────────────────

export function titleToId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function splitIntoPages(paragraphs, targetChars = 500) {
  const pages = [];
  let current = [];
  let currentLen = 0;

  for (const para of paragraphs) {
    if (current.length > 0 && currentLen >= 200 && currentLen + para.length > targetChars) {
      pages.push({ text: current.join('\n\n') });
      current = [];
      currentLen = 0;
    }
    current.push(para);
    currentLen += currentLen > 0 ? para.length + 2 : para.length;
  }
  if (current.length > 0) pages.push({ text: current.join('\n\n') });
  return pages;
}

function calcReadingTime(paragraphs) {
  const words = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  return `${Math.ceil(words / 150)} min`;
}

// ─── Parser A: combined-story-collection.md format ─────────────────────────
// Format: ## Story N: Title / blank-line-separated paragraphs / ## Moral of the Story / ---

export function parseFormatA(content) {
  const stories = [];
  const blocks = content.split(/\n(?=## Story \d+:)/);

  for (const block of blocks) {
    const titleMatch = block.match(/^## Story \d+:\s*(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const afterTitle = block.slice(block.indexOf('\n') + 1);
    const moralIdx = afterTitle.indexOf('## Moral of the Story');
    const bodyRaw = moralIdx !== -1 ? afterTitle.slice(0, moralIdx) : afterTitle;
    const moralRaw = moralIdx !== -1 ? afterTitle.slice(moralIdx + '## Moral of the Story'.length) : '';
    const moralLines = moralRaw.split('\n').map(l => l.trim()).filter(Boolean);
    const moral = moralLines[0] || '';

    const paragraphs = bodyRaw.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length > 0) stories.push({ title, moral, paragraphs });
  }

  return stories;
}

// ─── Parser B: next-12-stories.md format (two sub-formats) ─────────────────

export function parseFormatB(content) {
  const sepIdx = content.indexOf('________');
  const section1Raw = sepIdx !== -1 ? content.slice(0, sepIdx) : content;
  const section2Raw = sepIdx !== -1 ? content.slice(sepIdx) : '';
  return [...parseSection1(section1Raw), ...parseSection2(section2Raw)];
}

function parseSection1(content) {
  // Format: Story N: Title / one paragraph per line / Moral of the Story / blank line + space
  const stories = [];
  const blocks = content.split(/\n(?=Story \d+:)/);

  for (const block of blocks) {
    const titleMatch = block.match(/^Story \d+:\s*(.+)/);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    const afterTitle = block.slice(block.indexOf('\n') + 1);
    const moralIdx = afterTitle.indexOf('Moral of the Story');
    const bodyRaw = moralIdx !== -1 ? afterTitle.slice(0, moralIdx) : afterTitle;
    const moralRaw = moralIdx !== -1 ? afterTitle.slice(moralIdx + 'Moral of the Story'.length) : '';
    const moralLines = moralRaw.split('\n').map(l => l.trim()).filter(Boolean);
    const moral = moralLines[0] || '';

    const paragraphs = bodyRaw.split('\n').map(l => l.trim()).filter(Boolean);
    if (paragraphs.length > 0) stories.push({ title, moral, paragraphs });
  }

  return stories;
}

function parseSection2(content) {
  // Format: ________ / Story N / Title on next line / one paragraph per line / Moral of the Story
  const stories = [];
  const blocks = content.split(/_{8,}\n?/).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const storyLineIdx = lines.findIndex(l => /^Story \d+$/.test(l));
    if (storyLineIdx === -1) continue;

    const title = lines[storyLineIdx + 1];
    if (!title || /^Story \d+$/.test(title)) continue;

    const bodyLines = lines.slice(storyLineIdx + 2);
    const moralLineIdx = bodyLines.findIndex(l => l === 'Moral of the Story');
    const paragraphs = moralLineIdx !== -1 ? bodyLines.slice(0, moralLineIdx) : bodyLines;
    const moral = moralLineIdx !== -1 ? (bodyLines[moralLineIdx + 1] || '') : '';

    if (paragraphs.length > 0) stories.push({ title, moral, paragraphs });
  }

  return stories;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const outDir = join(ROOT, 'src', 'data', 'stories');
  mkdirSync(outDir, { recursive: true });

  const allRaw = [];

  const contentA = readFileSync(join(ROOT, 'stories', 'final', 'combined-story-collection.md'), 'utf8');
  allRaw.push(...parseFormatA(contentA));

  const contentB = readFileSync(join(ROOT, 'stories', 'final', 'next-12-stories.md'), 'utf8');
  allRaw.push(...parseFormatB(contentB));

  // Deduplicate by id — first occurrence wins
  const seen = new Set();
  const unique = [];
  for (const story of allRaw) {
    const id = titleToId(story.title);
    if (!seen.has(id)) {
      seen.add(id);
      unique.push({ ...story, id });
    } else {
      console.log(`  [skip duplicate] ${id}`);
    }
  }

  const generated = [];

  for (const { id, title, moral, paragraphs } of unique) {
    const pages = splitIntoPages(paragraphs);
    const readingTime = calcReadingTime(paragraphs);
    const json = { id, title, readingTime, moral, pages };
    writeFileSync(join(outDir, `${id}.json`), JSON.stringify(json, null, 2));
    generated.push({ id, title, pageCount: pages.length });
  }

  console.log(`\nGenerated ${generated.length} stories:`);
  generated.forEach(s => console.log(`  ${s.id} (${s.pageCount} pages)`));

  rewriteStoriesTs(generated);
  console.log('\nDone. Run `npx expo start` to verify.\n');
}

function rewriteStoriesTs(generated) {
  const existing = [
    { id: 'the-torn-map',               varName: 'tornMap' },
    { id: 'the-locked-suggestion-box',  varName: 'lockedBox' },
    { id: 'the-forgotten-diary',        varName: 'forgottenDiary' },
    { id: 'the-broken-lantern',         varName: 'brokenLantern' },
    { id: 'the-hilltop-trail',          varName: 'hilltopTrail' },
    { id: 'the-boy-near-the-gate',      varName: 'boyNearGate' },
  ];

  const newEntries = generated.map(s => ({
    id: s.id,
    varName: s.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
  }));

  const all = [...existing, ...newEntries];

  const imports = all.map(s => `import ${s.varName} from './stories/${s.id}.json';`).join('\n');
  const array   = all.map(s => `  assembleStory(${s.varName}),`).join('\n');

  const content = `import { Story } from '@/types/story';
import { assembleStory } from './story-assembler';

${imports}

const stories: Story[] = [
${array}
];

export function getStories(): Story[] {
  return stories;
}

export function getStory(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}

export default stories;
`;

  writeFileSync(join(ROOT, 'src', 'data', 'stories.ts'), content);
  console.log('\nRewritten src/data/stories.ts');
}

// Run main only when executed directly, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 2: Run the unit tests**

```
node scripts/test-import-stories.mjs
```

Expected output ends with something like:
```
26 passed, 0 failed
```

If any tests fail, fix the relevant function in `import-stories.mjs` and re-run until all pass.

- [ ] **Step 3: Commit the script and tests**

```bash
git add scripts/import-stories.mjs scripts/test-import-stories.mjs
git commit -m "feat: add story import script with unit tests"
```

---

## Task 7: Run the import script

**Files:**
- Generate: `src/data/stories/*.json` (31 new files)
- Rewrite: `src/data/stories.ts`

- [ ] **Step 1: Run the script**

```
node scripts/import-stories.mjs
```

Expected terminal output (exact story order may vary):
```
  [skip duplicate] the-last-mango-slice

Generated 31 stories:
  the-trail-marker-promise (N pages)
  the-kindness-round (N pages)
  ...

Rewritten src/data/stories.ts

Done. Run `npx expo start` to verify.
```

- [ ] **Step 2: Spot-check 3 generated JSON files**

Read these files and verify they look correct:

```
src/data/stories/the-trail-marker-promise.json   ← from combined, story 1
src/data/stories/the-backward-badge.json          ← from next-12, section 1
src/data/stories/the-extra-ten-rupees.json        ← from next-12, section 2
```

Each should have:
- `id`, `title`, `readingTime`, `moral` fields
- `pages` array with multiple entries
- Each page's `text` roughly 200–600 chars
- No page text starting with "Moral of the Story"

- [ ] **Step 3: Verify stories.ts imports 37 stories**

Open `src/data/stories.ts` and confirm it has 37 `import` lines and 37 `assembleStory(...)` entries (6 existing + 31 new).

---

## Task 8: Run the full test suite and commit

- [ ] **Step 1: Run all tests**

```
npm test
```

Expected: all tests pass, including `stories.test.ts` which now expects 37 stories.

If `stories.test.ts` still fails, check the count in `src/data/stories.ts` — the 6 existing + 31 new must equal exactly 37.

- [ ] **Step 2: Commit generated files**

```bash
git add src/data/stories/ src/data/stories.ts
git commit -m "feat: import 31 new text-only stories (37 total)"
```

---

## Task 9: Smoke test in the app

- [ ] **Step 1: Start the dev server**

```
npx expo start
```

- [ ] **Step 2: Open the Library screen**

Verify:
- All stories appear in the grid
- New stories show the teal placeholder block (no cover art) instead of a cover image
- Tapping a new story opens the reader
- Pages scroll correctly

- [ ] **Step 3: Spot-check one new story end-to-end**

Open "The Backward Badge" or "The Extra Ten Rupees". Read through all pages. Confirm:
- Text reads cleanly (no paragraph run-ons, no "Moral of the Story" text bleeding into story pages)
- Page count is reasonable (4–10 pages)
- Reading time shown in the card matches the page count roughly

- [ ] **Step 4: Commit any fixes found during smoke test**

If you find any parsing issues (e.g. a story with only 1 page, or "Moral of the Story" appearing in the page text), fix the relevant parser function in `import-stories.mjs`, re-run `node scripts/import-stories.mjs`, re-run tests, and commit.
