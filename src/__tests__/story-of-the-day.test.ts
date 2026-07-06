import { getStoryOfTheDay, dateKey } from '@/data/story-of-the-day';
import { Story } from '@/types/story';

const mk = (id: string): Story =>
  ({ id, title: id, readingTime: '2 min', category: 'Patience', pages: [] } as Story);
const list = [mk('a'), mk('b'), mk('c'), mk('d'), mk('e')];

test('same date returns the same story', () => {
  const d = new Date(2026, 6, 5);
  expect(getStoryOfTheDay(d, list)!.id).toBe(getStoryOfTheDay(new Date(2026, 6, 5), list)!.id);
});

test('different dates can return different stories', () => {
  const ids = new Set(
    Array.from({ length: 20 }, (_, i) => getStoryOfTheDay(new Date(2026, 0, i + 1), list)!.id),
  );
  expect(ids.size).toBeGreaterThan(1);
});

test('empty catalog returns undefined', () => {
  expect(getStoryOfTheDay(new Date(2026, 6, 5), [])).toBeUndefined();
});

test('dateKey is zero-padded local date', () => {
  expect(dateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
});
