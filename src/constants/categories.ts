import { StoryCategory } from '@/types/story';
import type { CardThemeArtKey } from '@/data/decorative-art';

/**
 * Per-virtue brand color. Hues are pulled toward the warm app palette
 * (see theme.ts) and mixed onto the cream ground at the call site so the
 * categories read as one cohesive system. Icons live in CategoryIcon.
 */
export const CATEGORY_COLORS: Record<StoryCategory, string> = {
  'Honesty & Trust': '#33a79e',
  'Humility & Service': '#83ac5a',
  'Kindness & Compassion': '#ec7a62',
  'Sharing & Generosity': '#f06c3c',
  'Forgiveness': '#56a2c9',
  'Patience': '#9a83be',
  'Courage': '#e09a2a',
  'Fairness': '#6e7cc4',
  'Gratitude & Contentment': '#d9a62e',
};

export const CATEGORY_CARD_THEMES: Record<StoryCategory, CardThemeArtKey> = {
  'Honesty & Trust': 'peach',
  'Humility & Service': 'mint',
  'Kindness & Compassion': 'gold',
  'Sharing & Generosity': 'peach',
  'Forgiveness': 'mint',
  'Patience': 'lavender',
  'Courage': 'gold',
  'Fairness': 'lavender',
  'Gratitude & Contentment': 'gold',
};

/** Mix a hex color onto the app's cream ground (#FFF8F0) so tints blend with the app. */
export function tintOnCream(hex: string, pct: number): string {
  const c = parseInt(hex.slice(1), 16);
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  const p = pct / 100;
  const mix = (channel: number, cream: number) => Math.round(channel * p + cream * (1 - p));
  return `rgb(${mix(r, 255)}, ${mix(g, 248)}, ${mix(b, 240)})`;
}
