# StoryJar — Phase 1: Engagement & Learning

**Date:** 2026-07-05
**Status:** Design — pending review

## Objective

StoryJar helps children internalize virtues through short, illustrated, read-aloud
stories. Today it is a pure consumption loop (pick jar → pick story → listen) with no
memory, no reflection, and no personalization. Phase 1 adds a **learning payoff** at the
end of each story and **reasons to return**, without heavy content authoring.

## Scope

**In scope (Phase 1 bundle):**

1. **Lesson screen** (D1) — surface the existing `Story.moral` on a dedicated screen when a story ends.
2. **Favorites / "My Jar"** (E1) — heart a story from anywhere; a tab lists favorites.
3. **Continue reading** (E2) — resume the last story at the page you left.
4. **Story of the Day** (E3) — one featured story per calendar day.
5. **Bottom tab navigation** (Home + My Jar) — the structural change that hosts the above.

**Out of scope (Phase 2, noted only):** "What would you do?" prompts (D2), parent/child
talk starters (D3), virtue journey + badges (E4), bedtime/calm mode (E5). No accounts, no
backend, no cloud sync, no text-to-speech for the moral.

## Navigation architecture

Move from the current single Stack to a **bottom tab navigator** with two tabs: **Home**
and **My Jar**.

- **Home tab** is a nested stack: `Landing → Library → Category → Reader`.
  - The **Landing screen** (`index.tsx`, the full-screen jar cover + "Open the Jar ✦")
    remains the Home tab's root. Tapping the **Home tab** from anywhere returns to it.
- **My Jar tab** — the favorites list.

**Tab bar visibility** (the one fiddly bit):

| Screen | Tab bar |
|---|---|
| Landing | **hidden** (full-screen, immersive) |
| Library, Category, My Jar | shown |
| Reader | **hidden** (full-screen reading) |

Because Landing and Reader live *inside* the Home tab's stack, per-screen visibility is
driven by the focused route name (react-navigation `getFocusedRouteNameFromRoute` →
`tabBarStyle: { display: 'none' }` for `index` and `reader/[id]`). This is a known
pattern; implementation detail goes in the plan.

Target file structure under `src/app/` (expo-router):

```
_layout.tsx                 // root (hosts the Tabs)
(tabs)/_layout.tsx          // Tabs: Home, My Jar
(tabs)/(home)/_layout.tsx   // Stack: landing, library, category, reader
(tabs)/(home)/index.tsx     // Landing (moved)
(tabs)/(home)/library.tsx
(tabs)/(home)/category/[category].tsx
(tabs)/(home)/reader/[id].tsx
(tabs)/my-jar.tsx           // Favorites list
```

(Exact grouping is an implementation choice for the plan; the requirement is: Landing is
Home-root, tab bar hides on Landing + Reader, My Jar is a sibling tab.)

## Data & persistence

**One new dependency:** `@react-native-async-storage/async-storage` — offline key-value
store. No backend.

**`AppDataProvider`** (React Context, mounted at the root) owns persisted user state,
hydrates from AsyncStorage on launch, and writes through on every change. No new state
library — plain Context + hooks.

Persisted shape:

```ts
type AppData = {
  favorites: string[];                 // story ids
  lastRead: { storyId: string; pageIndex: number; updatedAt: number } | null;
};
```

Exposed hooks:

- `useFavorites()` → `{ ids: Set<string>, isFavorite(id), toggle(id) }`
- `useContinue()` → `{ last: {storyId, pageIndex} | null, setLast(storyId, pageIndex), clear() }`

Story of the Day needs **no persistence** — it is computed from the date (below).

## Feature specs

### 1. Lesson screen (D1)

- Shown after the **last content page** of a story, as the final step of the reader flow
  (a virtual "lesson" step appended after the pages — continuous narration auto-advances
  into it).
- Content: the `Story.moral`, presented large and calm ("🌱 THE LESSON" + the moral text).
- Actions: **♥ Save to My Jar** (favorite toggle) and **Read another story**
  (returns to the current jar / category list).
- **No audio** for the moral in Phase 1 (narration is pre-recorded per page; the moral has
  no recording, and we are not adding TTS). Visual only.
- **Skip when `moral` is absent** (`moral` is optional): the last content page is the end,
  no lesson step.

### 2. Favorites / "My Jar" (E1)

- **♥ appears on:** story cards (category list), the Story of the Day card, the reader
  header, and the lesson screen ("Save to My Jar").
- Toggling updates `favorites` via `useFavorites()`; the heart reflects state everywhere
  live.
- On story cards the heart is a **separate tap target** in a corner — tapping it toggles
  favorite without opening the story; tapping the card body still opens it.
- **My Jar tab**: lists favorited stories (reuse the existing `StoryCard`). Empty state:
  a friendly "Your jar is empty — tap ♥ on any story to keep it here."

### 3. Continue reading (E2)

- The reader records `lastRead = { storyId, current pageIndex }` as the user moves through
  pages (write-through, debounced/simple on page change).
- The **Library screen** shows a **Continue card** at the top (above the jars) **only when
  `lastRead` exists**: cover thumb + title + "Continue reading ▸". Tapping resumes the
  reader at `pageIndex`.
- Requires the reader to accept an **initial page index** (currently it always starts on the
  title page) — `usePageNavigation` / reader route gains an optional start page.
- When a story reaches the **lesson screen** (finished), keep the last position or clear it
  — **decision: clear `lastRead` on reaching the lesson** so "Continue" only shows genuinely
  unfinished stories.

### 4. Story of the Day (E3)

- One story chosen **deterministically per calendar day**: `index = hash(YYYY-MM-DD) %
  stories.length`, over the stable full story list. Same for everyone, changes at local
  midnight, no persistence, no backend.
- Featured as a card at the top of the **Library screen** (below the pinned hero, above
  Continue + jars): cover + title + virtue + "▶ Listen". Tapping opens the reader.
- Helper: `getStoryOfTheDay(date): Story`.

## Screen-by-screen changes

- **Landing (`index`)** — unchanged visually; now the Home tab root with the tab bar hidden.
- **Library** — pinned curved hero unchanged. FlatList header gains: Story of the Day card,
  then Continue card (conditional). Story cards/jars unchanged except the grid already
  scrolls under the hero.
- **StoryCard** — add a ♥ corner toggle (used by category list, My Jar, Story of the Day).
- **Category** — unchanged except StoryCard now shows ♥.
- **Reader** — header gains ♥; records `lastRead`; appends the **lesson step**; accepts a
  start page for resume.
- **My Jar (new)** — favorites list + empty state.
- **Root** — wrap the app in `AppDataProvider`; introduce the tab navigator.

## Edge cases

- Story with no `moral` → no lesson step.
- Empty favorites → My Jar empty state.
- No `lastRead` → no Continue card.
- `lastRead` points to a story that no longer exists → ignore/clear.
- Story of the Day with a single-story catalog or empty catalog → guard (catalog is ~60, but
  the helper must not divide by zero).
- Favoriting from the Story of the Day card and the reader header must reflect the same state.

## Testing

- **Persistence unit tests**: `AppDataProvider` hydrate/toggle/persist round-trip with a
  mocked AsyncStorage; favorites toggle; lastRead set/clear.
- **Story of the Day**: deterministic for a fixed date; changes across dates; stable within a
  date; guards small/empty catalogs.
- **Reader**: resumes at the given start page; appends lesson step only when `moral` exists;
  clears `lastRead` on reaching the lesson.
- **Favorites integration**: toggling on a story card updates My Jar; heart state consistent
  across surfaces.
- Follow the existing jest patterns in `src/__tests__/`.

## New dependencies

- `@react-native-async-storage/async-storage` (Expo-compatible; install via `npx expo install`).
