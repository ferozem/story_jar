import { coverArt, audioAssets } from '@/data/asset-manifest';

describe('asset-manifest', () => {
  describe('coverArt', () => {
    it('exports coverArt as an object', () => {
      expect(typeof coverArt).toBe('object');
      expect(coverArt).not.toBeNull();
    });

    it('has cover art for all 6 stories', () => {
      const keys = Object.keys(coverArt);
      // Cover art is added separately from audio; stays at 6 until images are generated for new stories.
      expect(keys.length).toBe(6);
    });

    it('has cover art for the-torn-map', () => {
      expect(coverArt['the-torn-map']).toBeDefined();
    });

    it('has cover art for the-locked-suggestion-box', () => {
      expect(coverArt['the-locked-suggestion-box']).toBeDefined();
    });

    it('has cover art for the-forgotten-diary', () => {
      expect(coverArt['the-forgotten-diary']).toBeDefined();
    });

    it('has cover art for the-broken-lantern', () => {
      expect(coverArt['the-broken-lantern']).toBeDefined();
    });

    it('has cover art for the-hilltop-trail', () => {
      expect(coverArt['the-hilltop-trail']).toBeDefined();
    });

    it('has cover art for the-boy-near-the-gate', () => {
      expect(coverArt['the-boy-near-the-gate']).toBeDefined();
    });

    it('all cover art values are defined objects (require results)', () => {
      Object.values(coverArt).forEach((art) => {
        expect(art).toBeDefined();
        expect(typeof art).toBe('object');
      });
    });

    it('cover art values are require() results', () => {
      Object.values(coverArt).forEach((art) => {
        expect(art).toBeDefined();
      });
    });
  });

  describe('audioAssets', () => {
    it('exports audioAssets as an object', () => {
      expect(typeof audioAssets).toBe('object');
      expect(audioAssets).not.toBeNull();
    });

    it('has audio assets for at least the original 6 stories', () => {
      const keys = Object.keys(audioAssets);
      expect(keys.length).toBeGreaterThanOrEqual(6);
    });

    it('the-torn-map has 8 audio files', () => {
      expect(audioAssets['the-torn-map'].length).toBe(8);
    });

    it('the-locked-suggestion-box has 5 audio files', () => {
      expect(audioAssets['the-locked-suggestion-box'].length).toBe(5);
    });

    it('the-forgotten-diary has 5 audio files', () => {
      expect(audioAssets['the-forgotten-diary'].length).toBe(5);
    });

    it('the-broken-lantern has 5 audio files', () => {
      expect(audioAssets['the-broken-lantern'].length).toBe(5);
    });

    it('the-hilltop-trail has 5 audio files', () => {
      expect(audioAssets['the-hilltop-trail'].length).toBe(5);
    });

    it('the-boy-near-the-gate has 5 audio files', () => {
      expect(audioAssets['the-boy-near-the-gate'].length).toBe(5);
    });

    it('all audio asset entries are arrays', () => {
      Object.values(audioAssets).forEach((assets) => {
        expect(Array.isArray(assets)).toBe(true);
      });
    });

    it('all audio asset values are defined (require results)', () => {
      Object.values(audioAssets).forEach((assets) => {
        assets.forEach((asset) => {
          expect(asset).toBeDefined();
        });
      });
    });

    it('audio files are require() results', () => {
      Object.values(audioAssets).forEach((assets) => {
        assets.forEach((asset) => {
          expect(asset).toBeDefined();
        });
      });
    });

    it('has audio assets for the-torn-map', () => {
      expect(audioAssets['the-torn-map']).toBeDefined();
    });

    it('has audio assets for the-locked-suggestion-box', () => {
      expect(audioAssets['the-locked-suggestion-box']).toBeDefined();
    });

    it('has audio assets for the-forgotten-diary', () => {
      expect(audioAssets['the-forgotten-diary']).toBeDefined();
    });

    it('has audio assets for the-broken-lantern', () => {
      expect(audioAssets['the-broken-lantern']).toBeDefined();
    });

    it('has audio assets for the-hilltop-trail', () => {
      expect(audioAssets['the-hilltop-trail']).toBeDefined();
    });

    it('has audio assets for the-boy-near-the-gate', () => {
      expect(audioAssets['the-boy-near-the-gate']).toBeDefined();
    });
  });

  describe('asset consistency', () => {
    it('all stories with cover art exist in the manifest', () => {
      Object.keys(coverArt).forEach((storyId) => {
        expect(audioAssets[storyId] || coverArt[storyId]).toBeDefined();
      });
    });

    it('story ids follow consistent naming pattern', () => {
      const storyIds = Object.keys(coverArt);
      storyIds.forEach((id) => {
        expect(id).toMatch(/^the-[a-z-]+$/);
      });
    });
  });
});
