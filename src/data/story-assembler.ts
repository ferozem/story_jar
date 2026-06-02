import { Story, Page } from '@/types/story';
import { coverArt, audioAssets } from './asset-manifest';

type RawPage = { text: string };
type RawStory = { id: string; title: string; readingTime: string; pages: RawPage[] };

export function assembleStory(raw: RawStory): Story {
  const audio = audioAssets[raw.id] ?? [];

  if (audio.length > 0 && audio.length !== raw.pages.length) {
    throw new Error(
      `Story "${raw.id}": audio asset count (${audio.length}) does not match page count (${raw.pages.length}). ` +
      `Run scripts/generate-audio.mjs to regenerate missing files.`
    );
  }

  const pages: Page[] = raw.pages.map((p, i) => ({
    text: p.text,
    hasAudio: audio.length > 0,
    audioSource: audio[i],
  }));

  return {
    id: raw.id,
    title: raw.title,
    readingTime: raw.readingTime,
    coverArt: coverArt[raw.id],
    pages,
  };
}
