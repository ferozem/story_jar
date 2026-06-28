/**
 * Static asset manifest — all Metro require() calls live here.
 * Metro needs literal string paths at build time; nothing else belongs in this file.
 */

export const coverArt: Record<string, number> = {
  'the-torn-map':               require('@/assets/stories/the-torn-map/cover.png'),
  'the-locked-suggestion-box':  require('@/assets/stories/the-locked-suggestion-box/cover.png'),
  'the-forgotten-diary':        require('@/assets/stories/the-forgotten-diary/cover.png'),
  'the-broken-lantern':         require('@/assets/stories/the-broken-lantern/cover.png'),
  'the-hilltop-trail':          require('@/assets/stories/the-hilltop-trail/cover.png'),
  'the-boy-near-the-gate':      require('@/assets/stories/the-boy-near-the-gate/cover.png'),
};
export const audioAssets: Record<string, number[]> = {
  'the-boy-near-the-gate': [
    require('@/assets/audio/the-boy-near-the-gate/page-0.mp3'),
    require('@/assets/audio/the-boy-near-the-gate/page-1.mp3'),
    require('@/assets/audio/the-boy-near-the-gate/page-2.mp3'),
    require('@/assets/audio/the-boy-near-the-gate/page-3.mp3'),
    require('@/assets/audio/the-boy-near-the-gate/page-4.mp3'),
  ],
  'the-broken-lantern': [
    require('@/assets/audio/the-broken-lantern/page-0.mp3'),
    require('@/assets/audio/the-broken-lantern/page-1.mp3'),
    require('@/assets/audio/the-broken-lantern/page-2.mp3'),
    require('@/assets/audio/the-broken-lantern/page-3.mp3'),
    require('@/assets/audio/the-broken-lantern/page-4.mp3'),
  ],
  'the-forgotten-diary': [
    require('@/assets/audio/the-forgotten-diary/page-0.mp3'),
    require('@/assets/audio/the-forgotten-diary/page-1.mp3'),
    require('@/assets/audio/the-forgotten-diary/page-2.mp3'),
    require('@/assets/audio/the-forgotten-diary/page-3.mp3'),
    require('@/assets/audio/the-forgotten-diary/page-4.mp3'),
  ],
  'the-hilltop-trail': [
    require('@/assets/audio/the-hilltop-trail/page-0.mp3'),
    require('@/assets/audio/the-hilltop-trail/page-1.mp3'),
    require('@/assets/audio/the-hilltop-trail/page-2.mp3'),
    require('@/assets/audio/the-hilltop-trail/page-3.mp3'),
    require('@/assets/audio/the-hilltop-trail/page-4.mp3'),
  ],
  'the-locked-suggestion-box': [
    require('@/assets/audio/the-locked-suggestion-box/page-0.mp3'),
    require('@/assets/audio/the-locked-suggestion-box/page-1.mp3'),
    require('@/assets/audio/the-locked-suggestion-box/page-2.mp3'),
    require('@/assets/audio/the-locked-suggestion-box/page-3.mp3'),
    require('@/assets/audio/the-locked-suggestion-box/page-4.mp3'),
  ],
  'the-torn-map': [
    require('@/assets/audio/the-torn-map/page-0.mp3'),
    require('@/assets/audio/the-torn-map/page-1.mp3'),
    require('@/assets/audio/the-torn-map/page-2.mp3'),
    require('@/assets/audio/the-torn-map/page-3.mp3'),
    require('@/assets/audio/the-torn-map/page-4.mp3'),
    require('@/assets/audio/the-torn-map/page-5.mp3'),
    require('@/assets/audio/the-torn-map/page-6.mp3'),
    require('@/assets/audio/the-torn-map/page-7.mp3'),
  ],
};
