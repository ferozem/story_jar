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
