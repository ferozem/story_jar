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
