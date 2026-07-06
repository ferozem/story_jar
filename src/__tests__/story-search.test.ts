import { searchStories } from '@/data/story-search';
import { Story } from '@/types/story';

const stories: Story[] = [
  {
    id: 'the-torn-map',
    title: 'The Torn Map',
    readingTime: '8 min',
    category: 'Honesty & Trust',
    pages: [{ text: 'The children searched for the Golden Bookmark.', hasAudio: false }],
  },
  {
    id: 'the-brave-breath',
    title: 'The Brave Breath',
    readingTime: '4 min',
    category: 'Courage',
    pages: [{ text: 'A child walked across the stage calmly.', hasAudio: false }],
  },
  {
    id: 'the-water-team',
    title: 'The Water Team',
    readingTime: '5 min',
    category: 'Sharing & Generosity',
    pages: [{ text: 'Everyone carried cups together.', hasAudio: false }],
  },
];

describe('searchStories', () => {
  it('matches story titles case-insensitively', () => {
    expect(searchStories(stories, 'torn').map((s) => s.id)).toEqual(['the-torn-map']);
  });

  it('matches story categories', () => {
    expect(searchStories(stories, 'courage').map((s) => s.id)).toEqual(['the-brave-breath']);
  });

  it('matches full story page text', () => {
    expect(searchStories(stories, 'golden bookmark').map((s) => s.id)).toEqual(['the-torn-map']);
  });

  it('returns no stories for a blank query', () => {
    expect(searchStories(stories, '   ')).toEqual([]);
  });
});
