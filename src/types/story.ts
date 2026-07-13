export interface Page {
  text: string;
  illustration?: string;
  hasAudio: boolean;
  audioSource?: string; // remote URL
}

export const STORY_CATEGORIES = [
  'Honesty & Trust',
  'Humility & Service',
  'Kindness & Compassion',
  'Sharing & Generosity',
  'Forgiveness',
  'Patience',
  'Courage',
  'Fairness',
  'Gratitude & Contentment',
] as const;

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

export interface Story {
  id: string;
  title: string;
  coverArt?: string; // remote URL
  readingTime: string;
  category: StoryCategory;
  moral?: string;
  pages: Page[];
}
