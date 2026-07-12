import { Story, StoryCategory, Page } from '@/types/story';
import { ManifestStory, resolveUrl } from './content-manifest';

// Builds a runtime Story from a manifest entry, resolving relative asset keys to absolute URLs.
export function assembleStory(entry: ManifestStory, baseUrl: string): Story {
  const pages: Page[] = entry.pages.map((p) => {
    const audioSource = resolveUrl(baseUrl, p.audio);
    return { text: p.text, hasAudio: audioSource != null, audioSource };
  });

  return {
    id: entry.id,
    title: entry.title,
    readingTime: entry.readingTime,
    category: entry.category as StoryCategory,
    coverArt: resolveUrl(baseUrl, entry.cover),
    moral: entry.moral,
    pages,
  };
}
