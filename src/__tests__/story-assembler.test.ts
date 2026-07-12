import { assembleStory } from '@/data/story-assembler';
import type { ManifestStory } from '@/data/content-manifest';

const entry: ManifestStory = {
  id: 's1', title: 'T', readingTime: '2 min', category: 'Patience', moral: 'm',
  cover: 'stories/s1/cover-vibrant.jpg',
  pages: [{ text: 'a', audio: 'audio/s1/page-0.mp3' }, { text: 'b' }],
};

describe('assembleStory', () => {
  it('resolves cover + audio to absolute urls and sets hasAudio per page', () => {
    const s = assembleStory(entry, 'https://cdn/');
    expect(s.coverArt).toBe('https://cdn/stories/s1/cover-vibrant.jpg');
    expect(s.pages[0].hasAudio).toBe(true);
    expect(s.pages[0].audioSource).toBe('https://cdn/audio/s1/page-0.mp3');
    expect(s.pages[1].hasAudio).toBe(false);
    expect(s.pages[1].audioSource).toBeUndefined();
  });

  it('leaves coverArt undefined when the entry has no cover', () => {
    const noCover: ManifestStory = { ...entry, cover: undefined };
    const s = assembleStory(noCover, 'https://cdn/');
    expect(s.coverArt).toBeUndefined();
  });
});
