import { cacheFilenameFor } from '@/data/content-cache';

test('cacheFilenameFor is stable and filesystem-safe for a url', () => {
  const a = cacheFilenameFor('https://cdn/audio/s1/page-0.mp3');
  const b = cacheFilenameFor('https://cdn/audio/s1/page-0.mp3');
  expect(a).toBe(b);                       // deterministic
  expect(a).toMatch(/\.mp3$/);             // keeps extension
  expect(a).not.toContain('/');            // safe as a flat filename
});

test('cacheFilenameFor distinguishes different urls', () => {
  expect(cacheFilenameFor('https://cdn/audio/s1/page-0.mp3'))
    .not.toBe(cacheFilenameFor('https://cdn/audio/s1/page-1.mp3'));
});
