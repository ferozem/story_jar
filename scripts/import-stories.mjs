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
  // Pre-seed with hardcoded existing IDs so markdown files can't shadow them
  const seen = new Set([
    'the-torn-map',
    'the-locked-suggestion-box',
    'the-forgotten-diary',
    'the-broken-lantern',
    'the-hilltop-trail',
    'the-boy-near-the-gate',
  ]);
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
