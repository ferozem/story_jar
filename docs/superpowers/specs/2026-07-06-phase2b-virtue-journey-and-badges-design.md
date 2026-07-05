# StoryJar — Phase 2B: Virtue Journey + Badges (E4)

**Date:** 2026-07-06
**Status:** Design — pending review

## Objective

Turn habit into a collection. Track which stories a child finishes, fill each virtue jar as
they go, and award one badge per virtue when its jar is complete — collect all 9. Progress
shows in-context on the library jars and, in full, on a Journey screen reached from the
library. Builds on the Phase 1 `AppData` persistence layer.

## Scope

**In scope:**
- Persisted **completion tracking** (a set of finished story ids), marked when the reader
  reaches a story's end step.
- **Per-virtue progress** derivation: `done / total`, and `mastered` when all are done.
- **Library jars fill**: a tint rises from the bottom of each jar tile to `done/total`; a 🏅
  appears when the virtue is mastered.
- **Journey screen** (`/journey`): a grid of 9 virtue badges (colored when mastered, greyed
  otherwise) with progress; tapping one opens that jar. Reached from a **"Your Journey · X of
  9"** card in the library header.
- **Badge model:** one badge per virtue, earned at 100% (all stories in the jar finished).

**Out of scope:** tiered/milestone badges, a Journey tab, animations/celebrations on unlock,
sharing, a separate "missed virtue" banner (greyed cells serve that role), E5 bedtime mode.

## Completion model

- A story is **completed** the moment the reader reaches its **end step** (`nav.isEndStep`) —
  the same place Phase 2A shows the reflection/lesson and Phase 1 clears the continue
  position. Completion is **binary per story** (no partial credit) and idempotent (a set).
- A virtue is **mastered** when every story in that category is completed.

## Data & persistence

Extend the Phase 1 `AppData` shape (in `src/state/AppData.tsx`):

```ts
type AppData = {
  favorites: string[];
  lastRead: LastRead | null;
  completed: string[];   // NEW — finished story ids
};
```

New hook `useProgress()` (alongside `useFavorites`/`useContinue`):

```ts
useProgress(): {
  isCompleted(id: string): boolean;
  markCompleted(id: string): void;              // idempotent
  progressFor(category: StoryCategory): VirtueProgress;
  all: VirtueProgress[];                         // one per STORY_CATEGORIES entry
  badges: number;                                // count of mastered virtues
}
```

Hydration merges `completed` with the existing default (`EMPTY.completed = []`), so upgrading
users with older stored data get an empty set.

## Progress derivation (pure, testable)

New file `src/data/virtue-progress.ts`:

```ts
import { StoryCategory, STORY_CATEGORIES } from '@/types/story';
import { getStories } from './stories';
import { Story } from '@/types/story';

export interface VirtueProgress {
  category: StoryCategory;
  done: number;
  total: number;
  mastered: boolean;
}

export function virtueProgress(
  completed: Set<string>,
  category: StoryCategory,
  stories: Story[] = getStories(),
): VirtueProgress {
  const inCat = stories.filter((s) => s.category === category);
  const done = inCat.filter((s) => completed.has(s.id)).length;
  const total = inCat.length;
  return { category, done, total, mastered: total > 0 && done === total };
}

export function allVirtueProgress(
  completed: Set<string>,
  stories: Story[] = getStories(),
): VirtueProgress[] {
  return STORY_CATEGORIES.map((c) => virtueProgress(completed, c, stories));
}

export function badgesEarned(completed: Set<string>, stories: Story[] = getStories()): number {
  return allVirtueProgress(completed, stories).filter((p) => p.mastered).length;
}
```

Stale ids (stories that no longer exist) are naturally excluded — derivation counts only
stories present in the catalog. `mastered` guards against a 0-story category.

## Components & screens

- **`VirtueBadge`** (new, `src/components/VirtueBadge.tsx`) — one cell: the existing
  `CategoryIcon` on a medallion, colored with `CATEGORY_COLORS[category]` when `mastered`,
  greyed otherwise; the category name and `done/total` (or a ✓ when mastered). Props:
  `{ progress: VirtueProgress; onPress: () => void }`.
- **Journey screen** (new, `src/app/(tabs)/(home)/journey.tsx`, route `/journey`) — header
  "🏅 Your Journey · {badges} of 9" over a 3-column grid of `VirtueBadge` from
  `useProgress().all`. Tapping a badge routes to `/category/[category]`. Lives in the home
  stack, so the tab bar stays visible (it is not in the `HIDE_TAB_BAR_ON` list).
- **`JourneyCard`** (new, `src/components/JourneyCard.tsx`) — the library-header entry point:
  "🏅 Your Journey" + "{badges} of 9 badges" + chevron; `onPress` → `/journey`.
- **Library jar tile** (modify `library.tsx` `renderItem`) — inside `jarClip` (which already
  clips to the rounded rect), add an absolutely-positioned fill `View` (bottom-anchored,
  `height: ${done/total * 100}%`, a stronger translucent tint of the category color) layered
  above the theme-art/gradient but below `jarInner`. When `mastered`, show a small 🏅 in a
  corner. Add `<JourneyCard>` to the existing `ListHeaderComponent` (with Story of the Day +
  Continue).
- **Reader** (modify `reader/[id].tsx`) — in the existing end-step effect, call
  `markCompleted(story.id)` alongside `clear()`.

## Data flow

Reader reaches end step → `markCompleted(story.id)` → `AppData.completed` updated + persisted.
Library and Journey read `useProgress()`, which derives per-virtue progress from the
`completed` set on each render (cheap over ~60 stories). No new persistence beyond the one
`completed` array.

## Edge cases

- Category with 0 stories → `mastered = false` (guarded); not counted as a badge.
- Completed id for a deleted story → excluded from `done`/`total` automatically.
- Re-finishing an already-completed story → set semantics keep it idempotent (no double count).
- A jar with 1 story → finishing it fills the tile to 100% and awards the badge immediately;
  acceptable.
- Fill height uses `total > 0` guard to avoid divide-by-zero (0% when total is 0).

## Testing

- **`virtue-progress`:** `done/total/mastered` correct for partial/complete/empty categories;
  `mastered` false when `total === 0`; `badgesEarned` counts only mastered; stale ids ignored.
- **`AppData`:** `completed` round-trips through AsyncStorage; `markCompleted` adds and is
  idempotent; `isCompleted` reflects state; hydration defaults `completed` to `[]`.
- **`VirtueBadge`:** renders colored + name + ✓ when mastered; greyed + `done/total` when not.
- **Journey screen:** renders 9 badges; header shows the correct badge count; tapping routes
  to the category.
- **Reader:** marks the story completed on reaching the end step (unit-test the end-step
  effect or `useProgress` directly; the reader render is already covered by Phase 2A tests).
- Follow existing jest patterns in `src/__tests__/`.

## New dependencies

None.
