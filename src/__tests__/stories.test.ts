import { getStories, getStory } from '@/data/stories';
import { Story, STORY_CATEGORIES } from '@/types/story';

describe('stories module', () => {
  describe('getStories', () => {
    it('returns an array of stories', () => {
      const stories = getStories();
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBeGreaterThan(0);
    });

    it('returns 61 stories', () => {
      const stories = getStories();
      expect(stories.length).toBe(61);
    });

    it('each story has required properties', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(story).toHaveProperty('id');
        expect(story).toHaveProperty('title');
        expect(story).toHaveProperty('readingTime');
        expect(story).toHaveProperty('pages');
      });
    });

    it('stories with coverArt have a valid asset reference', () => {
      const stories = getStories();
      stories.forEach((story) => {
        if (story.coverArt !== undefined) {
          // Metro (production) returns a number; Jest returns a module object
          expect(['number', 'object']).toContain(typeof story.coverArt);
          expect(story.coverArt).not.toBeNull();
        }
      });
    });

    it('each story has a category from the fixed taxonomy', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(STORY_CATEGORIES).toContain(story.category);
      });
    });

    it('each story has valid id and title', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(typeof story.id).toBe('string');
        expect(story.id.length).toBeGreaterThan(0);
        expect(typeof story.title).toBe('string');
        expect(story.title.length).toBeGreaterThan(0);
      });
    });

    it('each story has at least one page', () => {
      const stories = getStories();
      stories.forEach((story) => {
        expect(Array.isArray(story.pages)).toBe(true);
        expect(story.pages.length).toBeGreaterThan(0);
      });
    });

    it('each page has required properties', () => {
      const stories = getStories();
      stories.forEach((story) => {
        story.pages.forEach((page) => {
          expect(page).toHaveProperty('text');
          expect(page).toHaveProperty('hasAudio');
          expect(typeof page.text).toBe('string');
          expect(typeof page.hasAudio).toBe('boolean');
        });
      });
    });

    it('returns the same array on multiple calls', () => {
      const stories1 = getStories();
      const stories2 = getStories();
      expect(stories1).toBe(stories2);
    });
  });

  describe('getStory', () => {
    it('returns a story by id', () => {
      const stories = getStories();
      const story = getStory(stories[0].id);
      expect(story).toBeDefined();
      expect(story?.id).toBe(stories[0].id);
    });

    it('returns undefined for non-existent story id', () => {
      const story = getStory('non-existent-id');
      expect(story).toBeUndefined();
    });

    it('returns the correct story properties', () => {
      const stories = getStories();
      const testStory = stories[0];
      const foundStory = getStory(testStory.id);

      expect(foundStory?.title).toBe(testStory.title);
      expect(foundStory?.id).toBe(testStory.id);
      expect(foundStory?.readingTime).toBe(testStory.readingTime);
    });

    it('returns story with all pages', () => {
      const stories = getStories();
      const testStory = stories[0];
      const foundStory = getStory(testStory.id);

      expect(foundStory?.pages.length).toBe(testStory.pages.length);
    });

    it('finds each story in the collection', () => {
      const stories = getStories();
      stories.forEach((story) => {
        const found = getStory(story.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(story.id);
      });
    });

    it('case sensitive id matching', () => {
      const stories = getStories();
      const originalId = stories[0].id;
      const wrongCase = originalId.toUpperCase();
      const story = getStory(wrongCase);
      if (originalId !== wrongCase) {
        expect(story).toBeUndefined();
      }
    });

    it('handles empty string id', () => {
      const story = getStory('');
      expect(story).toBeUndefined();
    });
  });

  describe('default export', () => {
    it('default export is an array of stories', () => {
      const stories = require('@/data/stories').default;
      expect(Array.isArray(stories)).toBe(true);
      expect(stories.length).toBe(61);
    });
  });
});
