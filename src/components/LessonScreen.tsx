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
