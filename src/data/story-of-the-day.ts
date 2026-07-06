import { Story } from '@/types/story';
import { getStories } from './stories';

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Deterministic per local calendar day; stable within a day; no persistence.
export function getStoryOfTheDay(date: Date, list: Story[] = getStories()): Story | undefined {
  if (list.length === 0) return undefined;
  return list[hashString(dateKey(date)) % list.length];
}
