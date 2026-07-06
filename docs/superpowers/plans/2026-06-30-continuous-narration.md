# Continuous Narration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the narration button is pressed, audio plays continuously across pages until the story ends or the user pauses.

**Architecture:** `useNarration` gains two optional params — `isAutoPlaying` and `onFinished`. Refs keep them fresh inside effects without widening dependency arrays. `ReaderScreen` owns `isAutoPlaying` state, wires `handleVoiceButton` to set it, and passes `handleNarrationFinished` as `onFinished` to advance the page or stop at the end.

**Tech Stack:** React Native, Expo Audio (`expo-audio`), React Testing Library (`@testing-library/react-native`)

---

## Files

| Action | Path |
|---|---|
| Modify | `src/hooks/useNarration.ts` |
| Modify | `src/__tests__/useNarration.test.ts` |
| Modify | `src/app/reader/[id].tsx` |
| Modify | `src/__tests__/ReaderScreen.test.tsx` |

---

### Task 1: useNarration — add params, refs, auto-start on page change

**Files:**
- Modify: `src/hooks/useNarration.ts`
- Modify: `src/__tests__/useNarration.test.ts`

- [ ] **Step 1: Write failing tests for auto-start behaviour**

Add these two tests inside the existing `describe('useNarration')` block in `src/__tests__/useNarration.test.ts`, after the existing `'handles transitions between multiple pages'` test:

```typescript
it('auto-starts playing on initial page when isAutoPlaying is true', () => {
  const onFinished = jest.fn();
  const { result } = renderHook(() => useNarration(mockPage, true, onFinished));
  expect(result.current.speechState).toBe('speaking');
});

it('auto-starts playing on the new page when isAutoPlaying is true and page changes', () => {
  const page1: Page = { text: 'Page 1', hasAudio: true, audioSource: 1 };
  const page2: Page = { text: 'Page 2', hasAudio: true, audioSource: 2 };
  const onFinished = jest.fn();

  const { result, rerender } = renderHook(
    ({ page }: { page: Page }) => useNarration(page, true, onFinished),
    { initialProps: { page: page1 } }
  );

  expect(result.current.speechState).toBe('speaking');

  act(() => {
    rerender({ page: page2 });
  });

  expect(result.current.speechState).toBe('speaking');
});
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```
npx jest src/__tests__/useNarration.test.ts --no-coverage
```

Expected: both new tests fail with `Expected: "speaking"  Received: "idle"`.

- [ ] **Step 3: Update useNarration with new params and ref pattern**

Replace the entire contents of `src/hooks/useNarration.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Page } from '@/types/story';

export type SpeechState = 'idle' | 'speaking' | 'paused';

export interface Narration {
  speechState: SpeechState;
  toggleSpeech: () => void;
}

export function useNarration(
  currentPage: Page | null,
  isAutoPlaying: boolean = false,
  onFinished: () => void = () => {},
): Narration {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Refs let effects read the latest values without being listed as dependencies,
  // preventing unwanted effect re-runs when these change between renders.
  const isAutoPlayingRef = useRef(isAutoPlaying);
  isAutoPlayingRef.current = isAutoPlaying;

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Load audio on page change; auto-start if in continuous-play mode
  useEffect(() => {
    player.pause();
    setSpeechState('idle');
    if (currentPage?.audioSource) {
      player.replace(currentPage.audioSource);
      if (isAutoPlayingRef.current) {
        player.play();
        setSpeechState('speaking');
      }
    }
  }, [currentPage]);

  // Reset to idle when audio finishes naturally; call onFinished if auto-playing
  useEffect(() => {
    if (status.didJustFinish) {
      setSpeechState('idle');
      if (isAutoPlayingRef.current) {
        onFinishedRef.current();
      }
    }
  }, [status.didJustFinish]);

  function toggleSpeech() {
    if (!currentPage?.hasAudio) return;
    if (speechState === 'speaking') {
      player.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      player.play();
      setSpeechState('speaking');
    } else {
      player.play();
      setSpeechState('speaking');
    }
  }

  return { speechState, toggleSpeech };
}
```

- [ ] **Step 4: Run the full useNarration test suite**

```
npx jest src/__tests__/useNarration.test.ts --no-coverage
```

Expected: all tests pass. The two new tests now pass; the existing tests still pass because `isAutoPlaying` defaults to `false` so page-change behaviour is unchanged for them.

- [ ] **Step 5: Commit**

```
git add src/hooks/useNarration.ts src/__tests__/useNarration.test.ts
git commit -m "feat: auto-start narration on page change when isAutoPlaying is true"
```

---

### Task 2: useNarration — call onFinished when audio ends while auto-playing

**Files:**
- Modify: `src/__tests__/useNarration.test.ts`

- [ ] **Step 1: Write failing tests for onFinished callback**

Add these two tests inside `describe('useNarration')`, after the tests added in Task 1:

```typescript
it('calls onFinished when audio ends naturally while isAutoPlaying is true', () => {
  const { useAudioPlayerStatus } = require('expo-audio');
  const onFinished = jest.fn();
  useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

  const { rerender } = renderHook(
    () => useNarration(mockPage, true, onFinished)
  );

  useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
  act(() => { rerender(); });

  expect(onFinished).toHaveBeenCalledTimes(1);
});

it('does not call onFinished when audio ends and isAutoPlaying is false', () => {
  const { useAudioPlayerStatus } = require('expo-audio');
  const onFinished = jest.fn();
  useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

  const { rerender } = renderHook(
    () => useNarration(mockPage, false, onFinished)
  );

  useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
  act(() => { rerender(); });

  expect(onFinished).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```
npx jest src/__tests__/useNarration.test.ts --no-coverage
```

Expected: the two new `onFinished` tests fail. (They should pass once the implementation from Task 1 is in place — if they already pass, move on.)

> **Note:** The `onFinished` logic was added in Task 1's implementation. If these tests already pass after Task 1, that's expected — skip Step 3 and go straight to Step 4.

- [ ] **Step 3: Verify the implementation already covers this (no new code needed)**

Open `src/hooks/useNarration.ts` and confirm the `didJustFinish` effect already reads `isAutoPlayingRef.current` and calls `onFinishedRef.current()`:

```typescript
useEffect(() => {
  if (status.didJustFinish) {
    setSpeechState('idle');
    if (isAutoPlayingRef.current) {
      onFinishedRef.current();
    }
  }
}, [status.didJustFinish]);
```

If this is present, the implementation is complete.

- [ ] **Step 4: Run the full useNarration test suite**

```
npx jest src/__tests__/useNarration.test.ts --no-coverage
```

Expected: all tests pass, including the `resets to idle when audio finishes naturally` test that already existed.

- [ ] **Step 5: Commit**

```
git add src/__tests__/useNarration.test.ts
git commit -m "test: verify onFinished called on natural audio end when auto-playing"
```

---

### Task 3: ReaderScreen — wire isAutoPlaying, handleVoiceButton, handleNarrationFinished

**Files:**
- Modify: `src/app/reader/[id].tsx`
- Modify: `src/__tests__/ReaderScreen.test.tsx`

- [ ] **Step 1: Write failing test for auto-advance**

Add this test inside `describe('reading mode')` in `src/__tests__/ReaderScreen.test.tsx`, after the existing `'toggles to paused state when pause button is pressed'` test:

```typescript
it('auto-advances to the next page when audio finishes while auto-playing', () => {
  const { useAudioPlayerStatus } = require('expo-audio');
  useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

  const { getByText, rerender: rerenderComponent } = render(<ReaderScreen />);

  // Navigate to page 1
  fireEvent.press(getByText('Begin reading ›'));
  expect(getByText('1 / 2')).toBeDefined();

  // Start auto-play
  fireEvent.press(getByText('🔊'));
  expect(getByText('⏸')).toBeDefined();

  // Simulate audio finishing
  useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
  act(() => {
    rerenderComponent(<ReaderScreen />);
  });

  // Should have advanced to page 2
  expect(getByText('Page two content here.')).toBeDefined();
  expect(getByText('2 / 2')).toBeDefined();
});
```

- [ ] **Step 2: Run the new test to confirm it fails**

```
npx jest src/__tests__/ReaderScreen.test.tsx --no-coverage
```

Expected: the new test fails — page counter still shows `1 / 2` because the screen doesn't yet wire `handleNarrationFinished`.

- [ ] **Step 3: Update ReaderScreen**

Replace the relevant section of `src/app/reader/[id].tsx`. The full updated file:

```typescript
import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { PageView } from '@/components/PageView';
import { getStory } from '@/data/stories';
import { theme } from '@/constants/theme';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { useNarration } from '@/hooks/useNarration';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const story = getStory(id);
  const nav = usePageNavigation(story!);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  function handleNarrationFinished() {
    if (nav.canGoNext) {
      nav.goNext();
    } else {
      setIsAutoPlaying(false);
    }
  }

  const narration = useNarration(nav.currentPage, isAutoPlaying, handleNarrationFinished);

  function handleVoiceButton() {
    const willPlay = narration.speechState !== 'speaking';
    setIsAutoPlaying(willPlay);
    narration.toggleSpeech();
  }

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Story not found.</Text>
        <Pressable onPress={() => router.push('/library')}>
          <Text style={styles.backButtonText}>← StoryJar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.titleBar}>
        <Pressable onPress={() => router.push('/library')} hitSlop={12}>
          <Text style={styles.backButtonText}>← StoryJar</Text>
        </Pressable>
        {!nav.isTitlePage && (
          <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
        )}
        {!nav.isTitlePage && (
          <Text style={styles.pageCounter}>{nav.currentIndex} / {nav.totalPages}</Text>
        )}
        {nav.isTitlePage && <View style={styles.spacer} />}
      </View>

      <View style={styles.rule} />

      {/* Page content */}
      <View style={styles.pageArea} {...nav.panHandlers}>
        {nav.isTitlePage ? (
          <View style={styles.titlePageContent}>
            <Text style={styles.titlePageText}>{story.title}</Text>
            <Pressable style={styles.beginButton} onPress={nav.goNext}>
              <Text style={styles.beginButtonText}>Begin reading ›</Text>
            </Pressable>
          </View>
        ) : (
          <PageView
            key={nav.currentIndex}
            page={story.pages[nav.currentIndex - 1]}
            width={width}
          />
        )}
      </View>

      {/* Compact footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={nav.goPrev}
          disabled={!nav.canGoBack}
          hitSlop={12}
          style={[styles.arrowBtn, !nav.canGoBack && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !nav.canGoBack && styles.arrowTextDisabled]}>‹</Text>
        </Pressable>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${nav.progress * 100}%` }]} />
        </View>

        <Pressable
          onPress={nav.goNext}
          disabled={!nav.canGoNext}
          hitSlop={12}
          style={[styles.arrowBtn, !nav.canGoNext && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !nav.canGoNext && styles.arrowTextDisabled]}>›</Text>
        </Pressable>

        {!nav.isTitlePage && nav.currentPage?.hasAudio && (
          <Pressable
            onPress={handleVoiceButton}
            hitSlop={12}
            style={[styles.arrowBtn, narration.speechState !== 'idle' && styles.arrowBtnActive]}
          >
            <Text style={[styles.arrowText, narration.speechState !== 'idle' && styles.arrowTextActive]}>
              {narration.speechState === 'speaking' ? '⏸' : narration.speechState === 'paused' ? '▶' : '🔊'}
            </Text>
          </Pressable>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.bold,
  },
  storyTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing.sm,
  },
  pageCounter: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  spacer: { flex: 1 },
  rule: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  pageArea: { flex: 1 },
  titlePageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  titlePageText: {
    fontSize: 48,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 60,
  },
  beginButton: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
  },
  beginButtonText: {
    fontSize: theme.fontSizes.body,
    color: '#FFFFFF',
    fontWeight: theme.fontWeights.bold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  arrowBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  arrowText: {
    fontSize: 22,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 26,
  },
  arrowTextDisabled: {
    color: theme.colors.border,
  },
  arrowTextActive: {
    color: '#FFFFFF',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  errorText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.text,
    margin: theme.spacing.lg,
  },
});
```

- [ ] **Step 4: Run the full test suite**

```
npx jest --no-coverage
```

Expected: all tests pass. The new ReaderScreen auto-advance test passes; existing tests are unaffected.

- [ ] **Step 5: Commit**

```
git add src/app/reader/[id].tsx src/__tests__/ReaderScreen.test.tsx
git commit -m "feat: continuous narration — auto-advance pages until story ends or user pauses"
```
