# Continuous Narration (Auto-Advance) — Design Spec

**Date:** 2026-06-30
**Status:** Approved

## Overview

When a user taps the narration button, audio plays for the current page. When that page's audio ends, the app automatically advances to the next page and starts playing its audio — continuing until the story ends or the user pauses. On the last page, audio stops and stays there.

## Behaviour

| Situation | Result |
|---|---|
| User taps 🔊 (idle) | Enters continuous play: starts audio, sets `isAutoPlaying = true` |
| User taps ⏸ (speaking) | Pauses audio, sets `isAutoPlaying = false` |
| User taps ▶ (paused) | Resumes audio, sets `isAutoPlaying = true` |
| Audio finishes, next page exists | Auto-advances to next page, auto-starts its audio |
| Audio finishes on last page | Stays on last page, resets to idle, `isAutoPlaying = false` |
| User manually swipes/taps nav while auto-playing | Page changes, auto-play continues from the new page |

Button icons (🔊 / ⏸ / ▶) are driven by `speechState` — no change needed there.

## Changes

### `useNarration(currentPage, isAutoPlaying, onFinished)`

Two new parameters:
- `isAutoPlaying: boolean` — passed in from ReaderScreen; tells the hook whether to auto-start on page change and whether to call `onFinished` when audio ends.
- `onFinished: () => void` — called when a page's audio completes naturally while `isAutoPlaying` is true.

Both are read inside effects via refs (assigned directly in render body, no `useEffect`) to prevent stale-closure bugs without adding them to dependency arrays.

**Page-change effect** (depends on `[currentPage]`):
- Pause and replace audio as before.
- If `isAutoPlayingRef.current` is true, also call `player.play()` and set `speechState = 'speaking'`.

**`didJustFinish` effect** (depends on `[status.didJustFinish]`):
- Always set `speechState = 'idle'`.
- If `isAutoPlayingRef.current`, call `onFinishedRef.current()`.

`toggleSpeech` is unchanged.

Return type gains no new fields — `speechState` and `toggleSpeech` are still the full public interface.

### `ReaderScreen`

**New state:** `const [isAutoPlaying, setIsAutoPlaying] = useState(false)`

**New handler — `handleVoiceButton`** (replaces direct `narration.toggleSpeech` on the button):
```
speechState === 'speaking' → setIsAutoPlaying(false); narration.toggleSpeech()
speechState !== 'speaking' → setIsAutoPlaying(true);  narration.toggleSpeech()
```

**New handler — `handleNarrationFinished`** (passed as `onFinished` to `useNarration`):
```
nav.canGoNext  → nav.goNext()            (isAutoPlaying stays true; page-change effect auto-starts audio)
!nav.canGoNext → setIsAutoPlaying(false) (last page; useNarration already set speechState to idle)
```

`useNarration` call becomes:
```typescript
const narration = useNarration(nav.currentPage, isAutoPlaying, handleNarrationFinished);
```

## What does NOT change

- Button icons and active/inactive styling.
- `usePageNavigation` — untouched.
- Swipe gesture behaviour.
- The title page (narration button is hidden there already).
- Stories with no audio — `toggleSpeech` early-returns if `!currentPage?.hasAudio`.

## Testing

- `useNarration.test.ts`: add cases for auto-start on page change when `isAutoPlaying=true`, `onFinished` called on natural finish, no call on pause/manual stop.
- `ReaderScreen.test.ts`: verify `handleVoiceButton` sets `isAutoPlaying` correctly, verify `handleNarrationFinished` calls `goNext` vs `setIsAutoPlaying(false)` based on `canGoNext`.
