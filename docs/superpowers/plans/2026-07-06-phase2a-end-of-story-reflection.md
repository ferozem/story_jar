# StoryJar Phase 2A (End-of-Story Reflection) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the last page of a story, show a two-choice "What would you do?" reflection, then the moral, then parent/child talk starters — driven by one reusable reflection set per virtue.

**Architecture:** A new `StoryEndFlow` component owns the reflect → feedback → lesson sequence and is rendered by the reader at its single "end" step. Content lives in a per-virtue data map. `LessonScreen` is extended with talk starters and an optional moral; `usePageNavigation`'s Phase 1 "lesson step" is generalized to an "end step."

**Tech Stack:** React Native, Expo Router v56, TypeScript, Jest + @testing-library/react-native. No new dependencies.

---

## Parallelization (for the dispatcher)

- **Wave 1 — 3 parallel subagents** (disjoint files): **Task 1** (virtue-reflections data), **Task 2** (LessonScreen extension), **Task 3** (usePageNavigation rename + reader rename).
- **Wave 2 — 1 subagent**: **Task 4** (StoryEndFlow) — depends on Tasks 1 + 2.
- **Wave 3 — 1 subagent**: **Task 5** (reader integration) — depends on Tasks 3 + 4.

Implementers should implement + test only and NOT commit; the coordinator commits per wave and runs the full suite as the integration gate.

## File Structure

**New**
- `src/data/virtue-reflections.ts` — the 9 per-virtue reflection sets + `VirtueReflection` type (Task 1)
- `src/__tests__/virtue-reflections.test.ts` (Task 1)
- `src/components/StoryEndFlow.tsx` (Task 4)
- `src/__tests__/StoryEndFlow.test.tsx` (Task 4)
- `src/__tests__/LessonScreen.test.tsx` (Task 2)

**Modified**
- `src/components/LessonScreen.tsx` — optional `moral`, new `talkStarters` (Task 2)
- `src/hooks/usePageNavigation.ts` — `hasLesson`→`hasEnding`, `isLessonPage`→`isEndStep` (Task 3)
- `src/__tests__/usePageNavigation.test.ts` — rename references (Task 3)
- `src/app/(tabs)/(home)/reader/[id].tsx` — rename references (Task 3), then render `StoryEndFlow` (Task 5)

---

## Task 1: Virtue reflection data (9 sets)

**Files:**
- Create: `src/data/virtue-reflections.ts`
- Test: `src/__tests__/virtue-reflections.test.ts`

- [ ] **Step 1: Write the data file**

Create `src/data/virtue-reflections.ts`:

```ts
import { StoryCategory } from '@/types/story';

export interface ReflectionChoice {
  label: string;
  feedback: string;
}

export interface VirtueReflection {
  question: string;
  choices: [ReflectionChoice, ReflectionChoice];
  talkStarters: string[];
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
  'Humility & Service': {
    question: 'You did something helpful and someone else got the thanks. What would you do?',
    choices: [
      { label: 'Keep helping anyway', feedback: 'Helping because it is kind — not for the thanks — is what real service looks like.' },
      { label: 'Say it was you', feedback: 'It is okay to want to be noticed — and helping quietly, without needing credit, is a quiet kind of strong.' },
    ],
    talkStarters: [
      'When have you helped without anyone noticing?',
      'How does it feel to help someone just because?',
    ],
  },
  'Kindness & Compassion': {
    question: 'A new kid is sitting alone and looks sad. What would you do?',
    choices: [
      { label: 'Go sit with them', feedback: 'One kind hello can change someone’s whole day.' },
      { label: 'Wait for someone else', feedback: 'It can feel scary to go first — and even a small smile can help someone feel less alone.' },
    ],
    talkStarters: [
      'When has someone been kind to you when you felt alone?',
      'What is one kind thing you could do tomorrow?',
    ],
  },
  'Sharing & Generosity': {
    question: 'You have one treat left and a friend has none. What would you do?',
    choices: [
      { label: 'Share it', feedback: 'Sharing what you have, even when it is little, is a big-hearted thing to do.' },
      { label: 'Keep it', feedback: 'It is okay to enjoy your own things — and sharing can make a moment even better for both of you.' },
    ],
    talkStarters: [
      'How does it feel when someone shares with you?',
      'What is something you could share this week?',
    ],
  },
  'Forgiveness': {
    question: 'A friend broke your toy and said sorry. What would you do?',
    choices: [
      { label: 'Forgive them', feedback: 'Forgiving does not mean it did not hurt — it means you choose to stay friends.' },
      { label: 'Stay angry', feedback: 'Your feelings are real — and holding on to anger often hurts you most. Forgiving sets you free too.' },
    ],
    talkStarters: [
      'Is it harder to say sorry, or to forgive? Why?',
      'How do you feel after you forgive someone?',
    ],
  },
  'Patience': {
    question: 'Something you really want is taking a long time. What would you do?',
    choices: [
      { label: 'Wait calmly', feedback: 'Good things often take time — waiting is a quiet kind of strength.' },
      { label: 'Give up', feedback: 'It is okay to feel frustrated — but sticking with it a little longer often makes it worth the wait.' },
    ],
    talkStarters: [
      'What is something you had to wait a long time for?',
      'What helps you feel calm while you wait?',
    ],
  },
  'Courage': {
    question: 'You are scared to try something new in front of others. What would you do?',
    choices: [
      { label: 'Take a breath and try', feedback: 'Being brave does not mean not being scared — it means trying anyway.' },
      { label: 'Sit it out', feedback: 'It is okay to feel nervous — and every small try makes the next one easier.' },
    ],
    talkStarters: [
      'When were you brave, even though you felt scared?',
      'What is one brave thing you would like to try?',
    ],
  },
  'Fairness': {
    question: 'You are picking teams and one friend is always chosen last. What would you do?',
    choices: [
      { label: 'Pick them early', feedback: 'Making sure everyone gets a fair chance is what fairness is all about.' },
      { label: 'Pick the best players', feedback: 'Wanting to win is normal — and making the game fair for everyone makes it better for all.' },
    ],
    talkStarters: [
      'When has something felt unfair to you?',
      'How can you help make things fair for others?',
    ],
  },
  'Gratitude & Contentment': {
    question: 'A friend got something new that you wish you had. What would you do?',
    choices: [
      { label: 'Be happy for them', feedback: 'Noticing the good things you already have brings a quiet, happy kind of peace.' },
      { label: 'Feel jealous', feedback: 'It is normal to wish for things — and remembering what you are thankful for helps the jealous feeling fade.' },
    ],
    talkStarters: [
      'What are three things you are thankful for today?',
      'How does it feel to be happy for someone else?',
    ],
  },
};
```

- [ ] **Step 2: Write the failing completeness test**

Create `src/__tests__/virtue-reflections.test.ts`:

```ts
import { VIRTUE_REFLECTIONS } from '@/data/virtue-reflections';
import { STORY_CATEGORIES } from '@/types/story';

test('every virtue category has a complete reflection set', () => {
  for (const category of STORY_CATEGORIES) {
    const r = VIRTUE_REFLECTIONS[category];
    expect(r).toBeDefined();
    expect(r.question.trim().length).toBeGreaterThan(0);
    expect(r.choices).toHaveLength(2);
    for (const choice of r.choices) {
      expect(choice.label.trim().length).toBeGreaterThan(0);
      expect(choice.feedback.trim().length).toBeGreaterThan(0);
    }
    expect(r.talkStarters.length).toBeGreaterThanOrEqual(2);
    for (const t of r.talkStarters) {
      expect(t.trim().length).toBeGreaterThan(0);
    }
  }
});
```

- [ ] **Step 3: Run test**

Run: `npx jest virtue-reflections`
Expected: PASS (1 test).

- [ ] **Step 4: Commit** (coordinator does this; implementer skips)

```bash
git add src/data/virtue-reflections.ts src/__tests__/virtue-reflections.test.ts
git commit -m "feat: per-virtue reflection content (9 sets)"
```

---

## Task 2: Extend LessonScreen (talk starters + optional moral)

**Files:**
- Modify: `src/components/LessonScreen.tsx`
- Test: `src/__tests__/LessonScreen.test.tsx` (create)

- [ ] **Step 1: Update LessonScreen**

Replace `src/components/LessonScreen.tsx` with:

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

interface Props {
  moral?: string;
  talkStarters?: string[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onReadAnother: () => void;
}

export function LessonScreen({ moral, talkStarters, isFavorite, onToggleFavorite, onReadAnother }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.leaf}>🌱</Text>
      <Text style={styles.label}>THE LESSON</Text>
      {moral ? <Text style={styles.moral}>{`“${moral}”`}</Text> : null}

      {talkStarters && talkStarters.length > 0 ? (
        <View style={styles.grownups}>
          <Text style={styles.grownupsTitle}>👋 For grown-ups</Text>
          {talkStarters.map((t) => (
            <Text key={t} style={styles.starter}>• {t}</Text>
          ))}
        </View>
      ) : null}

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
  label: { fontSize: 13, letterSpacing: 3, fontWeight: theme.fontWeights.bold, color: '#c79a3a' },
  moral: {
    fontSize: 20,
    lineHeight: 30,
    fontStyle: 'italic',
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    textAlign: 'center',
  },
  grownups: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    gap: 6,
  },
  grownupsTitle: {
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  starter: { fontSize: theme.fontSizes.caption, color: theme.colors.textSecondary, lineHeight: 20 },
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

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/LessonScreen.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { LessonScreen } from '@/components/LessonScreen';

test('renders moral, talk starters, and fires callbacks', () => {
  const onToggle = jest.fn();
  const onAnother = jest.fn();
  const { getByText, queryByText } = render(
    <LessonScreen
      moral="Be kind."
      talkStarters={['Question one?', 'Question two?']}
      isFavorite={false}
      onToggleFavorite={onToggle}
      onReadAnother={onAnother}
    />,
  );
  expect(getByText('“Be kind.”')).toBeTruthy();
  expect(getByText('👋 For grown-ups')).toBeTruthy();
  expect(getByText('• Question one?')).toBeTruthy();
  fireEvent.press(getByText('♡ Save to My Jar'));
  expect(onToggle).toHaveBeenCalled();
  fireEvent.press(getByText('Read another story'));
  expect(onAnother).toHaveBeenCalled();
});

test('omits the moral when none is given', () => {
  const { queryByText } = render(
    <LessonScreen
      talkStarters={['Just a starter?']}
      isFavorite
      onToggleFavorite={() => {}}
      onReadAnother={() => {}}
    />,
  );
  expect(queryByText(/“/)).toBeNull();
  expect(queryByText('• Just a starter?')).toBeTruthy();
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest LessonScreen`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit** (coordinator)

```bash
git add src/components/LessonScreen.tsx src/__tests__/LessonScreen.test.tsx
git commit -m "feat: LessonScreen supports talk starters and optional moral"
```

---

## Task 3: Generalize the reader's lesson step to an "end" step

**Files:**
- Modify: `src/hooks/usePageNavigation.ts`
- Modify: `src/__tests__/usePageNavigation.test.ts`
- Modify: `src/app/(tabs)/(home)/reader/[id].tsx`

> Pure rename: `hasLesson`→`hasEnding` (option), `isLessonPage`→`isEndStep` (return). Behavior is unchanged in this task (the reader still renders `LessonScreen`); Task 5 swaps in the reflection flow.

- [ ] **Step 1: Rename in the hook**

In `src/hooks/usePageNavigation.ts`:
- In `interface PageNavigation`, rename `isLessonPage: boolean;` → `isEndStep: boolean;`
- In `interface Options`, rename `hasLesson?: boolean;` → `hasEnding?: boolean;`
- In the function body, change the destructure `const { initialIndex = 0, hasLesson = false } = options;` → `const { initialIndex = 0, hasEnding = false } = options;`
- Replace the three `hasLesson`/`isLessonPage` derivations with:

```ts
  const maxIndex = hasEnding ? totalPages + 1 : totalPages;
  const isTitlePage = currentIndex === 0;
  const isEndStep = hasEnding && currentIndex === totalPages + 1;
```
- In `currentPage`, replace `!isLessonPage` with `!isEndStep`:
```ts
  const currentPage = story && !isTitlePage && !isEndStep ? (story.pages[currentIndex - 1] ?? null) : null;
```
- In the returned object, replace `isLessonPage` with `isEndStep`.

- [ ] **Step 2: Update the hook test**

In `src/__tests__/usePageNavigation.test.ts`, replace every `hasLesson` with `hasEnding` and every `isLessonPage` with `isEndStep` (in the option objects and assertions). Do not change any other logic.

- [ ] **Step 3: Update the reader's references**

In `src/app/(tabs)/(home)/reader/[id].tsx`:
- Change `const hasLesson = !!story?.moral;` → `const hasEnding = !!story?.moral;`
- Change the hook call option `{ initialIndex: startIndex, hasLesson }` → `{ initialIndex: startIndex, hasEnding }`
- In the record/clear effect, change `if (nav.isLessonPage)` → `if (nav.isEndStep)`
- In the render branch, change `nav.isLessonPage ?` → `nav.isEndStep ?` (the branch still renders `<LessonScreen moral={story.moral!} … />` unchanged)

- [ ] **Step 4: Run tests**

Run: `npx jest usePageNavigation ReaderScreen`
Expected: PASS (all).
Run: `npx tsc --noEmit 2>&1 | grep -E "usePageNavigation|reader" || echo clean` → `clean`

- [ ] **Step 5: Commit** (coordinator)

```bash
git add src/hooks/usePageNavigation.ts src/__tests__/usePageNavigation.test.ts "src/app/(tabs)/(home)/reader/[id].tsx"
git commit -m "refactor: generalize reader lesson step to an end step"
```

---

## Task 4: StoryEndFlow component

**Files:**
- Create: `src/components/StoryEndFlow.tsx`
- Test: `src/__tests__/StoryEndFlow.test.tsx`

Depends on Task 1 (`VirtueReflection`) and Task 2 (extended `LessonScreen`).

- [ ] **Step 1: Write the component**

Create `src/components/StoryEndFlow.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '@/types/story';
import { VirtueReflection } from '@/data/virtue-reflections';
import { LessonScreen } from '@/components/LessonScreen';
import { theme } from '@/constants/theme';

interface Props {
  story: Story;
  reflection?: VirtueReflection;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onReadAnother: () => void;
}

type Phase = 'reflect' | 'feedback' | 'lesson';

export function StoryEndFlow({ story, reflection, isFavorite, onToggleFavorite, onReadAnother }: Props) {
  const [phase, setPhase] = useState<Phase>(reflection ? 'reflect' : 'lesson');
  const [chosen, setChosen] = useState(0);

  if (reflection && phase === 'reflect') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>💭</Text>
        <Text style={styles.question}>{reflection.question}</Text>
        {reflection.choices.map((choice, i) => (
          <Pressable
            key={choice.label}
            style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
            onPress={() => { setChosen(i); setPhase('feedback'); }}
          >
            <Text style={styles.choiceText}>{choice.label}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (reflection && phase === 'feedback') {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>💭</Text>
        <Text style={styles.feedback}>{reflection.choices[chosen].feedback}</Text>
        <Pressable
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
          onPress={() => setPhase('lesson')}
        >
          <Text style={styles.continueText}>Continue →</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LessonScreen
      moral={story.moral}
      talkStarters={reflection?.talkStarters}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
      onReadAnother={onReadAnother}
    />
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
  emoji: { fontSize: 40 },
  question: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  choice: {
    alignSelf: 'stretch',
    borderRadius: theme.radii.full,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  choiceText: { fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold, color: theme.colors.primary },
  feedback: {
    fontSize: 18,
    lineHeight: 27,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  continue: {
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
  },
  continueText: { fontSize: theme.fontSizes.body, fontWeight: theme.fontWeights.bold, color: '#fff' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
```

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/StoryEndFlow.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { StoryEndFlow } from '@/components/StoryEndFlow';
import { Story } from '@/types/story';
import { VirtueReflection } from '@/data/virtue-reflections';

const story = { id: 's', title: 's', readingTime: '2 min', category: 'Courage', moral: 'Be brave.', pages: [] } as Story;
const reflection: VirtueReflection = {
  question: 'Would you try?',
  choices: [
    { label: 'Yes, try', feedback: 'Trying is brave.' },
    { label: 'Not now', feedback: 'That is okay too.' },
  ],
  talkStarters: ['When were you brave?'],
};

test('reflect -> feedback -> lesson sequence', () => {
  const { getByText, queryByText } = render(
    <StoryEndFlow story={story} reflection={reflection} isFavorite={false} onToggleFavorite={() => {}} onReadAnother={() => {}} />,
  );
  // reflect phase
  expect(getByText('Would you try?')).toBeTruthy();
  fireEvent.press(getByText('Yes, try'));
  // feedback phase
  expect(getByText('Trying is brave.')).toBeTruthy();
  fireEvent.press(getByText('Continue →'));
  // lesson phase
  expect(getByText('“Be brave.”')).toBeTruthy();
  expect(getByText('• When were you brave?')).toBeTruthy();
  expect(queryByText('Would you try?')).toBeNull();
});

test('starts at the lesson when there is no reflection', () => {
  const { getByText } = render(
    <StoryEndFlow story={story} isFavorite={false} onToggleFavorite={() => {}} onReadAnother={() => {}} />,
  );
  expect(getByText('“Be brave.”')).toBeTruthy();
});
```

- [ ] **Step 3: Run tests**

Run: `npx jest StoryEndFlow`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit** (coordinator)

```bash
git add src/components/StoryEndFlow.tsx src/__tests__/StoryEndFlow.test.tsx
git commit -m "feat: StoryEndFlow (reflection -> feedback -> lesson)"
```

---

## Task 5: Wire StoryEndFlow into the reader

**Files:**
- Modify: `src/app/(tabs)/(home)/reader/[id].tsx`
- Modify: `src/__tests__/ReaderScreen.test.tsx` (only if it asserts end-of-story content)

Depends on Task 3 (`isEndStep`) and Task 4 (`StoryEndFlow`).

- [ ] **Step 1: Swap LessonScreen for StoryEndFlow**

In `src/app/(tabs)/(home)/reader/[id].tsx`:
- Replace the import `import { LessonScreen } from '@/components/LessonScreen';` with:
```tsx
import { StoryEndFlow } from '@/components/StoryEndFlow';
import { VIRTUE_REFLECTIONS } from '@/data/virtue-reflections';
```
- After `const story = getStory(id);`, add the reflection lookup and update `hasEnding`:
```tsx
  const reflection = story ? VIRTUE_REFLECTIONS[story.category] : undefined;
  const hasEnding = !!reflection || !!story?.moral;
```
(remove the old `const hasEnding = !!story?.moral;` line from Task 3 — replaced by the two lines above)
- In the render, replace the `nav.isEndStep` branch body (currently `<LessonScreen moral={story.moral!} … />`) with:
```tsx
        {nav.isEndStep ? (
          <StoryEndFlow
            story={story}
            reflection={reflection}
            isFavorite={favorites.isFavorite(story.id)}
            onToggleFavorite={() => favorites.toggle(story.id)}
            onReadAnother={() => router.push({ pathname: '/category/[category]', params: { category: story.category } })}
          />
        ) : nav.isTitlePage ? (
```
(keep the rest of the ternary — title-page and PageView branches — unchanged)

- [ ] **Step 2: Fix the reader test if needed**

Run: `npx jest ReaderScreen`
If a test fails because it advanced to the end and asserted the moral text (which now appears only after the reflection), update that test: after reaching the end step, first assert the reflection question renders, then `fireEvent.press` the first choice, then `Continue →`, then assert the moral. If `ReaderScreen.test.tsx` does not exercise the end-of-story content, no change is needed.

- [ ] **Step 3: Verify**

Run: `npx jest` → all pass.
Run: `npx tsc --noEmit 2>&1 | grep -vE "useNarration.test" | grep "error TS" || echo "no new type errors"` → `no new type errors`

- [ ] **Step 4: Commit** (coordinator)

```bash
git add "src/app/(tabs)/(home)/reader/[id].tsx" src/__tests__/ReaderScreen.test.tsx
git commit -m "feat: reader shows StoryEndFlow (reflection + lesson + talk starters) at story end"
```

---

## Self-Review Notes

- **Spec coverage:** reflection two-choice + feedback (Task 4), reflect-before-moral flow (Task 4 + 5), talk starters on lesson (Task 2 + 4), 9 per-virtue sets (Task 1), end-step generalization (Task 3), reader integration (Task 5), no persistence of choice (StoryEndFlow local state only), tests for data completeness / StoryEndFlow / LessonScreen / usePageNavigation. All covered.
- **Type consistency:** `VirtueReflection`/`ReflectionChoice` (Task 1) are consumed unchanged in Tasks 4 + 5. `isEndStep`/`hasEnding` (Task 3) are used in Task 5. `LessonScreen` prop shape (`moral?`, `talkStarters?`) from Task 2 matches its use in Task 4.
- **Placeholders:** none — all 9 content sets and all component/test code are inline.
- **Manual check:** the end-of-story flow (tap a choice → feedback → continue → lesson) should be eyeballed on device once, though the unit tests cover the transitions.

## Out of scope

E4 virtue journey + badges, E5 bedtime mode (future Phase 2 sub-projects).
