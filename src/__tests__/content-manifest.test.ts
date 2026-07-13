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
