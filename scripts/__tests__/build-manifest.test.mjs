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
