import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoryCard } from '@/components/StoryCard';
import { CategoryIcon } from '@/components/CategoryIcon';
import { getStories } from '@/data/stories';
import { Story, StoryCategory, STORY_CATEGORIES } from '@/types/story';
import { CATEGORY_COLORS, tintOnCream } from '@/constants/categories';
import { theme } from '@/constants/theme';

function resolveCategory(raw?: string): StoryCategory | undefined {
  if (!raw) return undefined;
  const decoded = decodeURIComponent(raw);
  return (STORY_CATEGORIES as readonly string[]).includes(decoded)
    ? (decoded as StoryCategory)
    : undefined;
}

export default function CategoryScreen() {
  const { category: rawParam } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const category = resolveCategory(rawParam);
  const stories = category ? getStories().filter((s) => s.category === category) : [];

  if (!category) {
    return (
      <View style={styles.notFound}>
        <StatusBar style="dark" />
        <Text style={styles.notFoundText}>That shelf doesn’t exist.</Text>
        <Pressable onPress={() => router.push('/library')} hitSlop={12}>
          <Text style={styles.notFoundBack}>← Back to shelves</Text>
        </Pressable>
      </View>
    );
  }

  const color = CATEGORY_COLORS[category];

  const hero = (
    <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
      <LinearGradient
        colors={[tintOnCream(color, 68), color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(40,25,10,0.34)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.watermark} pointerEvents="none">
        <CategoryIcon category={category} color="#ffffff" size={150} />
      </View>

      <Pressable
        style={[styles.back, { top: insets.top + 8 }]}
        onPress={() => router.push('/library')}
        hitSlop={12}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.kick}>Virtue</Text>
      <Text style={styles.heroTitle}>{category}</Text>
      <View style={styles.countPill}>
        <Text style={styles.countPillText}>{stories.length} stories</Text>
      </View>
    </View>
  );

  function renderItem({ item }: { item: Story }) {
    return <StoryCard story={item} onPress={() => router.push(`/reader/${item.id}`)} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListHeaderComponent={hero}
        ListHeaderComponentStyle={styles.heroWrap}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroWrap: {
    marginHorizontal: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  hero: {
    minHeight: 210,
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  watermark: {
    position: 'absolute',
    top: 24,
    right: -10,
    opacity: 0.26,
    transform: [{ rotate: '-8deg' }],
  },
  back: {
    position: 'absolute',
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  backText: {
    fontSize: 13.5,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  kick: {
    fontSize: 11,
    fontWeight: theme.fontWeights.bold,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: theme.fontWeights.bold,
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 12,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  countPillText: {
    fontSize: 13,
    fontWeight: theme.fontWeights.bold,
    color: '#ffffff',
  },
  list: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  notFoundText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.text,
  },
  notFoundBack: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.bold,
  },
});
