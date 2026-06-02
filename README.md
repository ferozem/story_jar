# StoryJar

A children's story reading app for kids aged 6–10, built with Expo and React Native. Stories are bundled with the app and work fully offline — no backend, no network required.

## What it does

- **Library** — a grid of Story Cards showing all available stories with cover art and reading time
- **Reader** — tap a story to open it; swipe left/right or use arrow buttons to navigate between pages; tap the speaker icon to play narration
- **Narration** — pre-recorded human-voiced audio for each page, played via expo-audio

Six stories ship with the app, each with moral themes appropriate for young readers.

## Tech stack

- **Expo SDK 56** / **React Native 0.85**
- **Expo Router** for file-based navigation
- **expo-audio** for narration playback
- **TypeScript 6**

## Project structure

```
src/
  app/               # Expo Router screens
    index.tsx        # Landing page
    library.tsx      # Story grid
    reader/[id].tsx  # Story reader
  components/
    StoryCard.tsx    # Cover art tile used in the Library
    PageView.tsx     # Scrollable page content with overflow indicator
  data/
    stories.ts       # Public API: getStories(), getStory(id)
    story-assembler.ts   # Attaches audio/cover assets to raw story JSON
    asset-manifest.ts    # All Metro require() calls live here
    stories/         # One JSON file per story
  hooks/
    usePageNavigation.ts  # Index, direction, swipe gesture state
    useNarration.ts       # Audio playback state machine
  constants/
    theme.ts         # Design tokens (colors, spacing, type scale)
  types/
    story.ts         # Story and Page interfaces
assets/
  stories/           # Cover art PNGs per story
  audio/             # Pre-generated MP3 narration per page
```

## Getting started

```bash
npm install
npm start          # Opens Expo dev server
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

## Running tests

```bash
npm test                    # Run all tests
npm test -- --coverage      # Run tests with coverage report
```

Coverage is collected from `src/**/*.{ts,tsx}` (excluding test files and type declarations).

Current coverage: **Statements 100% · Branches 95.77% · Functions 100% · Lines 100%**

## Adding a new story

1. Create `src/data/stories/<story-id>.json` with `id`, `title`, `readingTime`, and `pages` (each page has a `text` field)
2. Add cover art to `assets/stories/<story-id>/cover.png`
3. Add audio files to `assets/audio/<story-id>/page-0.mp3`, `page-1.mp3`, … (one per page)
4. Register all assets in `src/data/asset-manifest.ts`
5. Import the JSON and call `assembleStory()` in `src/data/stories.ts`

> Stories and audio ship bundled with the app — a new release is required to publish new content. See `docs/adr/0001-bundle-stories-in-app.md` for the rationale.
