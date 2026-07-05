import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  story: Story;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function StoryOfTheDayCard({ story, onPress, isFavorite, onToggleFavorite }: Props) {
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
      {onToggleFavorite && (
        <Pressable style={styles.heart} onPress={onToggleFavorite} hitSlop={10}>
          <Text style={styles.heartText}>{isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      )}
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
  heart: {
    position: 'absolute', top: 6, right: 8,
    width: 26, height: 26, alignItems: 'center', justifyContent: 'center',
  },
  heartText: { fontSize: 16, color: theme.colors.primary },
});
