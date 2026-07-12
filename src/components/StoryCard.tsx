import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  story: Pick<Story, 'title' | 'coverArt' | 'readingTime'>;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  read?: boolean;
}

export function StoryCard({ story, onPress, isFavorite, onToggleFavorite, read }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {story.coverArt !== undefined
        ? <Image source={story.coverArt} style={styles.cover} contentFit="cover" />
        : <View style={[styles.cover, styles.coverPlaceholder]} />
      }
      {read && (
        <View style={styles.readBadge}>
          <Text style={styles.readCheck}>✓</Text>
        </View>
      )}
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

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cover: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.border,
  },
  coverPlaceholder: {
    backgroundColor: theme.colors.secondary,
  },
  info: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fontSizes.body,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  readingTime: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
  },
  heart: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  heartText: { fontSize: 16, color: theme.colors.primary },
  readBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  readCheck: { fontSize: 15, color: '#FFFFFF', fontWeight: theme.fontWeights.bold },
});
