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
