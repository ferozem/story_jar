# StoryJar — Phase 2A: End-of-Story Reflection (D2 + D3)

**Date:** 2026-07-06
**Status:** Design — pending review

## Objective

Deepen the learning payoff at the end of a story. After Phase 1's Lesson screen surfaced
the moral, Phase 2A adds a short, gentle reflection: a "What would you do?" choice (which
primes the child before the lesson lands) and parent/child talk starters. Both reuse a
small per-virtue content set, so authoring stays light (9 sets, not per-story).

## Scope

**In scope:**
- **D2 — "What would you do?"** two-choice reflection shown *before* the moral. Both choices
  give warm, virtue-leaning feedback; there is no wrong answer.
- **D3 — Talk starters** ("For grown-ups") shown on the Lesson screen after the moral.
- 9 per-virtue reflection sets (question + 2 choices + feedback + talk starters), drafted by
  the assistant for user review.

**Out of scope (later Phase 2 sub-projects):** E4 virtue journey + badges, E5 bedtime mode.
No persistence of the child's choice, no per-story authoring, no scoring/quiz, no audio for
the reflection or talk starters.

## End-of-story flow

After the last content page, the reader shows a single **end step** that runs this sequence
(owned by a new `StoryEndFlow` component):

1. **Reflection** (if the story's virtue has a set — all 9 do):
   - Show `question` + the two `choices` as buttons.
   - On tap, show that choice's `feedback` + a **Continue →** button.
2. **Lesson** (the Phase 1 `LessonScreen`, extended):
   - The `moral` (omitted if the story has none).
   - A subtle, always-visible **"👋 For grown-ups"** section listing the `talkStarters`.
   - **♥ Save to My Jar** and **Read another story** (unchanged from Phase 1).

If a virtue has no reflection set, the flow starts directly at the Lesson sub-step. If a
story has no moral, the Lesson sub-step shows talk starters + actions without a moral.

## Data model & content

New file `src/data/virtue-reflections.ts`:

```ts
import { StoryCategory } from '@/types/story';

export interface ReflectionChoice {
  label: string;    // the button text
  feedback: string; // warm, virtue-leaning response shown after tapping
}

export interface VirtueReflection {
  question: string;              // the "what would you do?" scenario
  choices: [ReflectionChoice, ReflectionChoice];
  talkStarters: string[];        // 2–3 parent/child discussion questions
}

export const VIRTUE_REFLECTIONS: Record<StoryCategory, VirtueReflection> = {
  'Honesty & Trust': {
    question: 'You broke something by accident and no one saw. What would you do?',
    choices: [
      { label: 'Tell what happened', feedback: 'Telling the truth takes courage — and people trust you even more for it.' },
      { label: 'Stay quiet', feedback: 'It can feel easier to stay quiet — but telling the truth is what builds trust, even when it is hard.' },
    ],
    talkStarters: [
      'When is telling the truth hardest for you?',
      'How do you feel when someone is honest with you?',
    ],
  },
  // ...the remaining 8 virtues authored to the same shape (drafted for review):
  // 'Humility & Service', 'Kindness & Compassion', 'Sharing & Generosity',
  // 'Forgiveness', 'Patience', 'Courage', 'Fairness', 'Gratitude & Contentment'
};
```

The assistant drafts all 9 entries in the implementation; the user reviews the copy in the
data file and edits any wording. A test enforces that every `StoryCategory` has a complete
entry so no virtue is left blank.

## Components

- **`StoryEndFlow`** (new, `src/components/StoryEndFlow.tsx`) — owns the end sequence.
  - Props: `story: Story`, `reflection: VirtueReflection | undefined`, `isFavorite: boolean`,
    `onToggleFavorite: () => void`, `onReadAnother: () => void`.
  - Internal state: `phase: 'reflect' | 'feedback' | 'lesson'` and the chosen index.
  - Renders reflection (question + choices) → feedback (chosen `feedback` + Continue) →
    `LessonScreen`. Starts at `'lesson'` when `reflection` is undefined.
- **`LessonScreen`** (extend Phase 1) — add optional `talkStarters?: string[]` prop rendered
  as the "For grown-ups" section, and make `moral` optional (render nothing for it when
  absent). Existing props unchanged.
- **`usePageNavigation`** — generalize the Phase 1 lesson step into an "end" step:
  `hasLesson` option → `hasEnding`, `isLessonPage` → `isEndStep`. Gating changes from
  `!!moral` to `hasReflection || !!moral`. (Mechanical rename; Phase 1 reader + test updated.)
- **Reader** (`src/app/(tabs)/(home)/reader/[id].tsx`) — at the end step render
  `<StoryEndFlow>` (passing the reflection looked up by `story.category`) instead of
  `<LessonScreen>` directly. `hasEnding = !!VIRTUE_REFLECTIONS[story.category] || !!story.moral`.

## Data flow

Reader resolves `story` → looks up `VIRTUE_REFLECTIONS[story.category]` → passes it to
`StoryEndFlow`. Favorite state flows through the existing `useFavorites()` (unchanged).
`onReadAnother` navigates to the category, as in Phase 1. The child's choice lives only in
`StoryEndFlow` local state — nothing is persisted.

## Edge cases

- Virtue with no reflection set → `StoryEndFlow` starts at the lesson sub-step (guarded).
- Story with no `moral` → lesson sub-step shows talk starters + actions, no moral text.
- Continuous narration: auto-advance reaches the end step and stops there (no audio for the
  end step); the reflection waits for a tap. Unchanged behavior otherwise.
- Swiping back from the end step returns to the last page (existing `goPrev`); the
  `StoryEndFlow` internal phase resets when the step remounts.

## Testing

- **Data completeness:** every `StoryCategory` in `STORY_CATEGORIES` has a `VIRTUE_REFLECTIONS`
  entry with exactly 2 choices (each with non-empty `label` + `feedback`) and ≥2 talkStarters.
- **`StoryEndFlow`:** shows the question + 2 choices; tapping a choice shows that choice's
  feedback + Continue; Continue advances to the lesson (moral + talk starters); starts at the
  lesson when `reflection` is undefined.
- **`LessonScreen`:** renders the talk-starters section when `talkStarters` is provided;
  renders no moral block when `moral` is absent.
- **`usePageNavigation`:** end step present when reflection or moral exists; `isEndStep`
  correct; null-story tolerance preserved (from Phase 1 fix).
- Follow existing jest patterns in `src/__tests__/`.

## New dependencies

None.
