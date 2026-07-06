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
