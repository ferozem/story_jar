import { assembleStory } from '@/data/story-assembler';

jest.mock('@/data/asset-manifest', () => ({
  coverArt: { 'test-story': 1 },
  audioAssets: { 'test-story': [10, 11] },
}));

const baseStory = {
  id: 'test-story',
  title: 'Test Story',
  readingTime: '2 min',
  pages: [{ text: 'Page one.' }, { text: 'Page two.' }],
};

describe('assembleStory', () => {
  it('sets hasAudio true and attaches audioSource when audio assets match pages', () => {
    const story = assembleStory(baseStory);
    expect(story.pages[0].hasAudio).toBe(true);
    expect(story.pages[0].audioSource).toBe(10);
    expect(story.pages[1].audioSource).toBe(11);
  });

  it('throws when audio asset count does not match page count', () => {
    const mismatch = { ...baseStory, pages: [{ text: 'Only one page.' }] };
    expect(() => assembleStory(mismatch)).toThrow(/audio asset count/);
  });

  it('sets hasAudio false when no audio assets exist for the story', () => {
    const noAudio = { ...baseStory, id: 'unknown-story' };
    const story = assembleStory(noAudio);
    expect(story.pages[0].hasAudio).toBe(false);
    expect(story.pages[0].audioSource).toBeUndefined();
  });
});
