import { Story } from '@/types/story';

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function searchableText(story: Story): string {
  return [
    story.title,
    story.category,
    story.moral ?? '',
    ...story.pages.map((page) => page.text),
  ].join(' ');
}

export function searchStories(stories: Story[], query: string): Story[] {
  const needle = normalize(query);
  if (!needle) return [];

  return stories.filter((story) => normalize(searchableText(story)).includes(needle));
}
