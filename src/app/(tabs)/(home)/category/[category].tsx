import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StoryCard } from '@/components/StoryCard';
import { getStories } from '@/data/stories';
import { categoryHeroArt } from '@/data/decorative-art';
import { Story, StoryCategory, STORY_CATEGORIES } from '@/types/story';
import { theme } from '@/constants/theme';
import { useFavorites } from '@/state/AppData';

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
  const { height } = useWindowDimensions();
  const favorites = useFavorites();

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

  const heroArt = categoryHeroArt[category];

  // ~30% of the screen, with sensible floor/ceiling across device sizes.
  const heroHeight = Math.min(360, Math.max(240, Math.round(height * 0.3)));

  const hero = (
    <View style={[styles.hero, { minHeight: heroHeight, paddingTop: insets.top + 24 }]}>
      <Image source={heroArt} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(30,20,12,0.04)', 'rgba(40,25,10,0.42)']}
        style={StyleSheet.absoluteFill}
      />

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
    return (
      <StoryCard
        story={item}
        onPress={() => router.push(`/reader/${item.id}`)}
        isFavorite={favorites.isFavorite(item.id)}
        onToggleFavorite={() => favorites.toggle(item.id)}
      />
    );
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
    paddingHorizontal: 24,
    paddingBottom: 26,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
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
    fontSize: 12,
    fontWeight: theme.fontWeights.bold,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: theme.fontWeights.bold,
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 14,
  },
  countPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 15,
  },
  countPillText: {
    fontSize: 13.5,
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

