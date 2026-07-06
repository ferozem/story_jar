# StoryJar Phase 1 (Engagement & Learning) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Lesson screen (surfacing `Story.moral`), Favorites ("My Jar"), Continue reading, and Story of the Day to StoryJar, hosted under a new Home/My-Jar bottom-tab navigation.

**Architecture:** A React Context (`AppDataProvider`) backed by AsyncStorage holds `favorites` and `lastRead`. Presentational pieces (lesson screen, cards) are standalone components. Navigation moves to an expo-router tab group where the Home tab is a nested stack (Landing → Library → Category → Reader), with the tab bar hidden on Landing and Reader.

**Tech Stack:** React Native, Expo Router (v56), TypeScript, Jest + @testing-library/react-native, `@react-native-async-storage/async-storage` (new).

---

## Parallelization (for the dispatcher)

Tasks are grouped into **waves**. Within a wave, tasks touch disjoint files and run as **parallel subagents**. Waves run in order.

- **Wave 1 — 4 parallel subagents** (all new, isolated files, no shared edits): **Task 1** (AppData state), **Task 2** (Story of the Day helper), **Task 3** (LessonScreen component), **Task 4** (StoryOfTheDayCard + ContinueCard components).
- **Wave 2 — 1 subagent** (moves the app screens; must land before Wave 3): **Task 5** (tab navigation + provider mount + My Jar shell).
- **Wave 3 — 2 parallel subagents** (disjoint: reader vs library/cards): **Task 6** (reader: resume + lesson step + record lastRead + header heart), **Task 7** (StoryCard heart + Library cards + My Jar list).

Dependency summary: Wave 1 → Wave 2 → Wave 3. Tasks 6 and 7 both depend on Tasks 1–5 but not on each other.

---

## File Structure

**New files**
- `src/state/AppData.tsx` — Context provider + `useFavorites` / `useContinue` hooks (Task 1)
- `src/__tests__/AppData.test.tsx` (Task 1)
- `src/data/story-of-the-day.ts` — deterministic daily pick (Task 2)
- `src/__tests__/story-of-the-day.test.ts` (Task 2)
- `src/components/LessonScreen.tsx` (Task 3)
- `src/components/StoryOfTheDayCard.tsx`, `src/components/ContinueCard.tsx` (Task 4)
- `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/(home)/_layout.tsx`, `src/app/(tabs)/my-jar.tsx` (Task 5)

**Moved files** (Task 5 — imports use the `@/` alias so contents need no import edits; route paths stay the same because `(tabs)` and `(home)` are groups)
- `src/app/index.tsx` → `src/app/(tabs)/(home)/index.tsx`
- `src/app/library.tsx` → `src/app/(tabs)/(home)/library.tsx`
- `src/app/category/[category].tsx` → `src/app/(tabs)/(home)/category/[category].tsx`
- `src/app/reader/[id].tsx` → `src/app/(tabs)/(home)/reader/[id].tsx`

**Modified files**
- `src/app/_layout.tsx` — mount `AppDataProvider` (Task 5)
- `src/hooks/usePageNavigation.ts` — `initialIndex` + lesson step (Task 6)
- `src/app/(tabs)/(home)/reader/[id].tsx` — resume, lesson, record, heart (Task 6)
- `src/components/StoryCard.tsx` — optional heart (Task 7)
- `src/app/(tabs)/(home)/library.tsx` — Story of the Day + Continue cards (Task 7)
- `src/app/(tabs)/(home)/category/[category].tsx` — pass heart props to StoryCard (Task 7)
- `src/app/(tabs)/my-jar.tsx` — favorites list body (Task 7)
- `package.json` — new dependency (Task 1)

---

## Task 1: AppData state (favorites + lastRead)

**Files:**
- Create: `src/state/AppData.tsx`
- Test: `src/__tests__/AppData.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install the dependency**

Run: `npx expo install @react-native-async-storage/async-storage`
Expected: `package.json` gains `@react-native-async-storage/async-storage`.

- [ ] **Step 2: Write the state module**

Create `src/state/AppData.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@storyjar/appdata';

export type LastRead = { storyId: string; pageIndex: number; updatedAt: number };
export type AppData = { favorites: string[]; lastRead: LastRead | null };

const EMPTY: AppData = { favorites: [], lastRead: null };

type Ctx = {
  hydrated: boolean;
  data: AppData;
  setData: (updater: (prev: AppData) => AppData) => void;
};

const AppDataContext = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!active) return;
      if (raw) {
        try {
          setDataState({ ...EMPTY, ...JSON.parse(raw) });
        } catch {
          // corrupt payload — start clean
        }
      }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  const setData = (updater: (prev: AppData) => AppData) => {
    setDataState((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <AppDataContext.Provider value={{ hydrated, data, setData }}>
      {children}
    </AppDataContext.Provider>
  );
}

function useCtx(): Ctx {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export function useFavorites() {
  const { data, setData } = useCtx();
  const ids = new Set(data.favorites);
  return {
    ids,
    isFavorite: (id: string) => ids.has(id),
    toggle: (id: string) =>
      setData((prev) => ({
        ...prev,
        favorites: prev.favorites.includes(id)
          ? prev.favorites.filter((f) => f !== id)
          : [...prev.favorites, id],
      })),
  };
}

export function useContinue() {
  const { data, setData } = useCtx();
  return {
    last: data.lastRead,
    setLast: (storyId: string, pageIndex: number) =>
      setData((prev) => ({ ...prev, lastRead: { storyId, pageIndex, updatedAt: Date.now() } })),
    clear: () => setData((prev) => ({ ...prev, lastRead: null })),
  };
}
```

- [ ] **Step 3: Write the failing test**

Create `src/__tests__/AppData.test.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDataProvider, useFavorites, useContinue } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

beforeEach(async () => { await AsyncStorage.clear(); });

test('toggle adds then removes a favorite and persists', async () => {
  const { result } = renderHook(() => useFavorites(), { wrapper });
  await act(async () => { result.current.toggle('story-a'); });
  expect(result.current.isFavorite('story-a')).toBe(true);
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@storyjar/appdata',
      expect.stringContaining('story-a'),
    ),
  );
  await act(async () => { result.current.toggle('story-a'); });
  expect(result.current.isFavorite('story-a')).toBe(false);
});

test('setLast then clear updates continue position', async () => {
  const { result } = renderHook(() => useContinue(), { wrapper });
  await act(async () => { result.current.setLast('story-b', 3); });
  expect(result.current.last).toMatchObject({ storyId: 'story-b', pageIndex: 3 });
  await act(async () => { result.current.clear(); });
  expect(result.current.last).toBeNull();
});
```

- [ ] **Step 4: Run tests**

Run: `npx jest AppData`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/state/AppData.tsx src/__tests__/AppData.test.tsx
git commit -m "feat: AppData context for favorites and continue-reading"
```

---

## Task 2: Story of the Day helper

**Files:**
- Create: `src/data/story-of-the-day.ts`
- Test: `src/__tests__/story-of-the-day.test.ts`

- [ ] **Step 1: Write the helper**

Create `src/data/story-of-the-day.ts`:

```ts
import { Story } from '@/types/story';
import { getStories } from './stories';

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Deterministic per local calendar day; stable within a day; no persistence.
export function getStoryOfTheDay(date: Date, list: Story[] = getStories()): Story | undefined {
  if (list.length === 0) return undefined;
  return list[hashString(dateKey(date)) % list.length];
}
```

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/story-of-the-day.test.ts`:

```ts
import { getStoryOfTheDay, dateKey } from '@/data/story-of-the-day';
import { Story } from '@/types/story';

const mk = (id: string): Story =>
  ({ id, title: id, readingTime: '2 min', category: 'Patience', pages: [] } as Story);
const list = [mk('a'), mk('b'), mk('c'), mk('d'), mk('e')];

test('same date returns the same story', () => {
  const d = new Date(2026, 6, 5);
  expect(getStoryOfTheDay(d, list)!.id).toBe(getStoryOfTheDay(new Date(2026, 6, 5), list)!.id);
});

test('different dates can return different stories', () => {
  const ids = new Set(
    Array.from({ length: 20 }, (_, i) => getStoryOfTheDay(new Date(2026, 0, i + 1), list)!.id),
  );
  expect(ids.size).toBeGreaterThan(1);
});

test('empty catalog returns undefined', () => {
  expect(getStoryOfTheDay(new Date(2026, 6, 5), [])).toBeUndefined();
});

test('dateKey is zero-padded local date', () => {
  expect(dateKey(new Date(2026, 0, 9))).toBe('2026-01-09');
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest story-of-the-day`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add src/data/story-of-the-day.ts src/__tests__/story-of-the-day.test.ts
git commit -m "feat: deterministic Story of the Day helper"
```

---

## Task 3: LessonScreen component

**Files:**
- Create: `src/components/LessonScreen.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/LessonScreen.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

interface Props {
  moral: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onReadAnother: () => void;
}

export function LessonScreen({ moral, isFavorite, onToggleFavorite, onReadAnother }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.leaf}>🌱</Text>
      <Text style={styles.label}>THE LESSON</Text>
      <Text style={styles.moral}>{`“${moral}”`}</Text>
      <Pressable
        style={({ pressed }) => [styles.btn, styles.primary, pressed && styles.pressed]}
        onPress={onToggleFavorite}
      >
        <Text style={styles.primaryText}>{isFavorite ? '♥ Saved to My Jar' : '♡ Save to My Jar'}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.btn, styles.secondary, pressed && styles.pressed]}
        onPress={onReadAnother}
      >
        <Text style={styles.secondaryText}>Read another story</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  leaf: { fontSize: 44 },
  label: {
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: theme.fontWeights.bold,
    color: '#c79a3a',
  },
  moral: {
    fontSize: 20,
    lineHeight: 30,
    fontStyle: 'italic',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  btn: {
    borderRadius: theme.radii.full,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    minWidth: 220,
    alignItems: 'center',
  },
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.border },
  primaryText: { color: '#fff', fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold },
  secondaryText: { color: theme.colors.text, fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep LessonScreen || echo clean`
Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add src/components/LessonScreen.tsx
git commit -m "feat: LessonScreen component"
```

---

## Task 4: StoryOfTheDayCard + ContinueCard components

**Files:**
- Create: `src/components/StoryOfTheDayCard.tsx`
- Create: `src/components/ContinueCard.tsx`

- [ ] **Step 1: Write StoryOfTheDayCard**

Create `src/components/StoryOfTheDayCard.tsx`:

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  story: Story;
  onPress: () => void;
}

export function StoryOfTheDayCard({ story, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {story.coverArt !== undefined && (
        <Image source={story.coverArt} style={styles.thumb} resizeMode="cover" />
      )}
      <View style={styles.body}>
        <Text style={styles.kicker}>☀ STORY OF THE DAY</Text>
        <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
        <Text style={styles.meta}>{story.category} · {story.readingTime}</Text>
      </View>
      <Text style={styles.play}>▶</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  thumb: { width: 52, height: 52, borderRadius: theme.radii.sm, backgroundColor: theme.colors.border },
  body: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: theme.fontWeights.bold, color: '#a8722a' },
  title: { fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold, color: theme.colors.text, marginTop: 2 },
  meta: { fontSize: theme.fontSizes.caption, color: theme.colors.textSecondary, marginTop: 2 },
  play: { fontSize: 18, color: theme.colors.primary, paddingHorizontal: theme.spacing.xs },
});
```

- [ ] **Step 2: Write ContinueCard**

Create `src/components/ContinueCard.tsx`:

```tsx
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  story: Story;
  onPress: () => void;
}

export function ContinueCard({ story, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {story.coverArt !== undefined && (
        <Image source={story.coverArt} style={styles.thumb} resizeMode="cover" />
      )}
      <View style={styles.body}>
        <Text style={styles.kicker}>▸ CONTINUE READING</Text>
        <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#EBD9CC',
    borderRadius: theme.radii.md,
    padding: theme.spacing.sm,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  thumb: { width: 40, height: 40, borderRadius: theme.radii.sm, backgroundColor: theme.colors.border },
  body: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.2, fontWeight: theme.fontWeights.bold, color: '#8a6a52' },
  title: { fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold, color: theme.colors.text, marginTop: 2 },
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "StoryOfTheDayCard|ContinueCard" || echo clean`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add src/components/StoryOfTheDayCard.tsx src/components/ContinueCard.tsx
git commit -m "feat: StoryOfTheDayCard and ContinueCard components"
```

---

## Task 5: Tab navigation + provider mount + My Jar shell

**Files:**
- Modify: `src/app/_layout.tsx`
- Create: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/(home)/_layout.tsx`, `src/app/(tabs)/my-jar.tsx`
- Move: `index.tsx`, `library.tsx`, `category/[category].tsx`, `reader/[id].tsx` into `src/app/(tabs)/(home)/`

> Route paths are unchanged because `(tabs)` and `(home)` are groups. Moved files use the `@/` alias internally, so their contents need no edits.

- [ ] **Step 1: Move the screens**

```bash
cd src/app
mkdir -p "(tabs)/(home)/category" "(tabs)/(home)/reader"
git mv index.tsx "(tabs)/(home)/index.tsx"
git mv library.tsx "(tabs)/(home)/library.tsx"
git mv "category/[category].tsx" "(tabs)/(home)/category/[category].tsx"
git mv "reader/[id].tsx" "(tabs)/(home)/reader/[id].tsx"
rmdir category reader 2>/dev/null || true
cd ../..
```

- [ ] **Step 2: Mount the provider in the root layout**

Replace `src/app/_layout.tsx` with:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppDataProvider } from '@/state/AppData';

export default function RootLayout() {
  return (
    <AppDataProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppDataProvider>
  );
}
```

- [ ] **Step 3: Create the tabs layout**

Create `src/app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Text } from 'react-native';
import { theme } from '@/constants/theme';

// Route names inside the (home) stack where the tab bar must hide.
const HIDE_TAB_BAR_ON = ['index', 'reader/[id]'];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={({ route }) => {
          const focused = getFocusedRouteNameFromRoute(route) ?? 'index';
          return {
            title: 'Home',
            tabBarStyle: HIDE_TAB_BAR_ON.includes(focused) ? { display: 'none' } : undefined,
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⌂</Text>,
          };
        }}
      />
      <Tabs.Screen
        name="my-jar"
        options={{
          title: 'My Jar',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>♥</Text>,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 4: Create the home stack layout**

Create `src/app/(tabs)/(home)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 5: Create the My Jar shell**

Create `src/app/(tabs)/my-jar.tsx` (list body is filled in Task 7):

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export default function MyJarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Jar</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your jar is empty — tap ♥ on any story to keep it here.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  heading: {
    fontSize: theme.fontSizes.heading,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSizes.body, color: theme.colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 6: Verify the app boots and navigates**

Run: `npx tsc --noEmit 2>&1 | grep -E "app/\(tabs\)|_layout" || echo clean`
Expected: `clean`.
Then manually (or note for the run step): launch the app — Landing shows with **no** tab bar; "Open the Jar" → Library **with** tab bar (Home · My Jar); My Jar tab shows the empty state; opening a story hides the tab bar; tapping Home returns to Landing.

- [ ] **Step 7: Commit**

```bash
git add -A src/app
git commit -m "feat: bottom-tab navigation (Home + My Jar) with landing/reader tab-bar hidden"
```

---

## Task 6: Reader — resume, lesson step, record position, header heart

**Files:**
- Modify: `src/hooks/usePageNavigation.ts`
- Modify: `src/app/(tabs)/(home)/reader/[id].tsx`
- Test: `src/__tests__/usePageNavigation.test.ts` (create)

- [ ] **Step 1: Extend usePageNavigation**

Replace `src/hooks/usePageNavigation.ts` with:

```ts
import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { Story, Page } from '@/types/story';

export interface PageNavigation {
  currentIndex: number;
  totalPages: number;
  isTitlePage: boolean;
  isLessonPage: boolean;
  currentPage: Page | null;
  canGoBack: boolean;
  canGoNext: boolean;
  progress: number;
  goNext: () => void;
  goPrev: () => void;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
}

interface Options {
  initialIndex?: number;
  hasLesson?: boolean;
}

export function usePageNavigation(story: Story, options: Options = {}): PageNavigation {
  const { initialIndex = 0, hasLesson = false } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const swipeStartX = useRef(0);

  const totalPages = story.pages.length;
  // Content pages are 1..totalPages. When hasLesson, one extra step (totalPages + 1) is the lesson.
  const maxIndex = hasLesson ? totalPages + 1 : totalPages;
  const isTitlePage = currentIndex === 0;
  const isLessonPage = hasLesson && currentIndex === totalPages + 1;
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const progress = totalPages > 0 ? Math.min(currentIndex, totalPages) / totalPages : 0;
  const currentPage = !isTitlePage && !isLessonPage ? (story.pages[currentIndex - 1] ?? null) : null;

  function goNext() { if (canGoNext) setCurrentIndex((i) => i + 1); }
  function goPrev() { if (canGoBack) setCurrentIndex((i) => i - 1); }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 12,
    onPanResponderGrant: (e) => { swipeStartX.current = e.nativeEvent.pageX; },
    onPanResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - swipeStartX.current;
      if (dx < -40) goNext();
      else if (dx > 40) goPrev();
    },
  });

  return {
    currentIndex, totalPages, isTitlePage, isLessonPage, currentPage,
    canGoBack, canGoNext, progress, goNext, goPrev,
    panHandlers: panResponder.panHandlers,
  };
}
```

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/usePageNavigation.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { Story } from '@/types/story';

const story = {
  id: 's', title: 's', readingTime: '2 min', category: 'Patience', moral: 'x',
  pages: [
    { text: 'p1', hasAudio: false },
    { text: 'p2', hasAudio: false },
  ],
} as Story;

test('starts at initialIndex', () => {
  const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 1 }));
  expect(result.current.currentIndex).toBe(1);
  expect(result.current.isTitlePage).toBe(false);
});

test('with lesson, advancing past last page lands on the lesson', () => {
  const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 2, hasLesson: true }));
  expect(result.current.isLessonPage).toBe(false);
  act(() => { result.current.goNext(); });
  expect(result.current.isLessonPage).toBe(true);
  expect(result.current.canGoNext).toBe(false);
});

test('without lesson, cannot advance past the last page', () => {
  const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 2, hasLesson: false }));
  expect(result.current.canGoNext).toBe(false);
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest usePageNavigation`
Expected: PASS (3 tests).

- [ ] **Step 4: Wire the reader**

In `src/app/(tabs)/(home)/reader/[id].tsx`:

(a) Update imports and add hooks/params near the top of `ReaderScreen`:

```tsx
import { useEffect } from 'react';
import { LessonScreen } from '@/components/LessonScreen';
import { useFavorites, useContinue } from '@/state/AppData';
```

(b) Read the optional resume page param and set up state. Replace the params/nav lines:

```tsx
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const story = getStory(id);
  const hasLesson = !!story?.moral;
  const startIndex = page ? Number(page) : 0;
  const nav = usePageNavigation(story!, { initialIndex: startIndex, hasLesson });

  const favorites = useFavorites();
  const { setLast, clear } = useContinue();

  // Record/clear continue position as the reader moves.
  useEffect(() => {
    if (!story) return;
    if (nav.isLessonPage) { clear(); return; }
    if (nav.currentIndex >= 1 && nav.currentIndex <= nav.totalPages) {
      setLast(story.id, nav.currentIndex);
    }
  }, [nav.currentIndex]);
```

(c) Add a heart to the title bar. Replace the back Pressable row's trailing area — after the existing `pageCounter`/`spacer`, add a heart when there's a story:

```tsx
        <Pressable onPress={() => favorites.toggle(story.id)} hitSlop={12}>
          <Text style={styles.heart}>{favorites.isFavorite(story.id) ? '♥' : '♡'}</Text>
        </Pressable>
```

And add to `styles`:

```tsx
  heart: { fontSize: 20, color: theme.colors.primary },
```

(d) Render the lesson step. In the page-content area, branch on `nav.isLessonPage` before the existing title/page logic:

```tsx
        {nav.isLessonPage ? (
          <LessonScreen
            moral={story.moral!}
            isFavorite={favorites.isFavorite(story.id)}
            onToggleFavorite={() => favorites.toggle(story.id)}
            onReadAnother={() => router.push({ pathname: '/category/[category]', params: { category: story.category } })}
          />
        ) : nav.isTitlePage ? (
          /* ...existing title-page block... */
        ) : (
          /* ...existing PageView block... */
        )}
```

- [ ] **Step 5: Typecheck + tests**

Run: `npx tsc --noEmit 2>&1 | grep -E "reader|usePageNavigation" || echo clean` → `clean`
Run: `npx jest usePageNavigation useNarration` → PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePageNavigation.ts src/app/"(tabs)"/"(home)"/reader src/__tests__/usePageNavigation.test.ts
git commit -m "feat: reader resume, lesson step, position tracking, favorite heart"
```

---

## Task 7: StoryCard heart + Library cards + My Jar list

**Files:**
- Modify: `src/components/StoryCard.tsx`
- Modify: `src/app/(tabs)/(home)/library.tsx`
- Modify: `src/app/(tabs)/(home)/category/[category].tsx`
- Modify: `src/app/(tabs)/my-jar.tsx`

- [ ] **Step 1: Add an optional heart to StoryCard**

In `src/components/StoryCard.tsx`, extend `Props` and render a corner heart. Update the interface and component:

```tsx
interface Props {
  story: Pick<Story, 'title' | 'coverArt' | 'readingTime'>;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function StoryCard({ story, onPress, isFavorite, onToggleFavorite }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {story.coverArt !== undefined
        ? <Image source={story.coverArt} style={styles.cover} resizeMode="cover" />
        : <View style={[styles.cover, styles.coverPlaceholder]} />
      }
      {onToggleFavorite && (
        <Pressable style={styles.heart} onPress={onToggleFavorite} hitSlop={10}>
          <Text style={styles.heartText}>{isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{story.title}</Text>
        <Text style={styles.readingTime}>{story.readingTime}</Text>
      </View>
    </Pressable>
  );
}
```

Add `Text` to the `react-native` import (it already imports `Image, Pressable, StyleSheet, Text, View` — confirm `Text` is present). Add styles:

```tsx
  heart: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartText: { fontSize: 16, color: theme.colors.primary },
```

- [ ] **Step 2: Wire favorites into the Category screen**

In `src/app/(tabs)/(home)/category/[category].tsx`, import and pass heart props. Add:

```tsx
import { useFavorites } from '@/state/AppData';
```

Inside `CategoryScreen`, add `const favorites = useFavorites();` and update `renderItem`:

```tsx
  function renderItem({ item }: { item: Story }) {
    return (
      <StoryCard
        story={item}
        onPress={() => router.push(`/reader/${item.id}`)}
        isFavorite={favorites.isFavorite(item.id)}
        onToggleFavorite={() => favorites.toggle(item.id)}
      />
    );
  }
```

- [ ] **Step 3: Add Story of the Day + Continue to the Library header**

In `src/app/(tabs)/(home)/library.tsx`, add imports:

```tsx
import { StoryOfTheDayCard } from '@/components/StoryOfTheDayCard';
import { ContinueCard } from '@/components/ContinueCard';
import { getStory } from '@/data/stories';
import { getStoryOfTheDay } from '@/data/story-of-the-day';
import { useContinue } from '@/state/AppData';
```

Inside `LibraryScreen`, compute the feature stories:

```tsx
  const today = getStoryOfTheDay(new Date());
  const { last } = useContinue();
  const continueStory = last ? getStory(last.storyId) : undefined;
```

Add a `ListHeaderComponent` to the `FlatList` that renders the two cards above the grid (the pinned hero overlay stays as-is):

```tsx
        ListHeaderComponent={
          <View style={styles.featured}>
            {continueStory && last && (
              <ContinueCard
                story={continueStory}
                onPress={() => router.push({ pathname: '/reader/[id]', params: { id: continueStory.id, page: String(last.pageIndex) } })}
              />
            )}
            {today && (
              <StoryOfTheDayCard story={today} onPress={() => router.push(`/reader/${today.id}`)} />
            )}
          </View>
        }
```

Add the style:

```tsx
  featured: { gap: theme.spacing.sm, paddingBottom: theme.spacing.sm },
```

> Note: the grid's `contentContainerStyle` already has `paddingTop: heroHeight + spacing.sm`; the `ListHeaderComponent` renders below that padding, so the cards sit correctly under the pinned hero.

- [ ] **Step 4: Fill in the My Jar list**

Replace `src/app/(tabs)/my-jar.tsx` with:

```tsx
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StoryCard } from '@/components/StoryCard';
import { getStories } from '@/data/stories';
import { useFavorites } from '@/state/AppData';
import { theme } from '@/constants/theme';

export default function MyJarScreen() {
  const router = useRouter();
  const favorites = useFavorites();
  const stories = getStories().filter((s) => favorites.ids.has(s.id));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Jar</Text>
      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your jar is empty — tap ♥ on any story to keep it here.</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(s) => s.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              onPress={() => router.push(`/reader/${item.id}`)}
              isFavorite
              onToggleFavorite={() => favorites.toggle(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  heading: {
    fontSize: theme.fontSizes.heading,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  grid: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSizes.body, color: theme.colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 5: Typecheck + full test run**

Run: `npx tsc --noEmit 2>&1 | grep -E "StoryCard|library|my-jar|category" || echo clean` → `clean`
Run: `npx jest` → all green.

- [ ] **Step 6: Commit**

```bash
git add src/components/StoryCard.tsx src/app/"(tabs)"
git commit -m "feat: favorite hearts on story cards, Story of the Day + Continue on Library, My Jar list"
```

---

## Self-Review Notes

- **Spec coverage:** Lesson screen (Task 3 + 6), Favorites everywhere (Tasks 3, 6, 7 — reader header, lesson, story cards, Story of the Day card via reader), My Jar tab (Tasks 5, 7), Continue reading (Tasks 1, 6, 7), Story of the Day (Tasks 2, 7), tabs + landing/reader tab-bar hiding (Task 5), AsyncStorage persistence (Task 1). All covered.
- **Story of the Day card heart:** the spec lists a ♥ on the Story of the Day card. Tapping the card opens the reader, whose header carries the heart — acceptable for Phase 1. If a corner heart on the card itself is wanted, add `isFavorite`/`onToggleFavorite` to `StoryOfTheDayCard` mirroring `StoryCard` (small follow-up, not blocking).
- **Types:** `LastRead`, `AppData`, `PageNavigation` (adds `isLessonPage`), `getStoryOfTheDay` signatures are consistent across tasks.
- **Manual verification:** navigation flow and tab-bar visibility need a device/emulator check (Task 5 Step 6) since they aren't unit-testable.

## Out of scope (Phase 2)

D2 "What would you do?", D3 talk starters, E4 virtue journey + badges, E5 bedtime mode. No accounts, no backend, no TTS for the moral.
