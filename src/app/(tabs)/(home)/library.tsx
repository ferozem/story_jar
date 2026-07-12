import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  ClipPath,
  Image as SvgImage,
  Path,
  Defs,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { useRouter } from 'expo-router';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StoryOfTheDayCard } from '@/components/StoryOfTheDayCard';
import { ContinueCard } from '@/components/ContinueCard';
import { getStories, getStory } from '@/data/stories';
import { useCatalogVersion } from '@/state/ContentProvider';
import { cardThemeArt, landingArt } from '@/data/decorative-art';
import { getStoryOfTheDay } from '@/data/story-of-the-day';
import { StoryCategory, STORY_CATEGORIES } from '@/types/story';
import { CATEGORY_CARD_THEMES, CATEGORY_COLORS, tintOnCream } from '@/constants/categories';
import { theme } from '@/constants/theme';
import { useContinue, useFavorites } from '@/state/AppData';

type Shelf = { category: StoryCategory; count: number };

// Shelf counts derived from the current catalog. Kept as a hook so it recomputes
// when the remote manifest swaps in (new stories change the per-category counts).
function useShelves(catalogVersion: string): Shelf[] {
  return useMemo(
    () =>
      STORY_CATEGORIES.map((category) => ({
        category,
        count: getStories().filter((s) => s.category === category).length,
      }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count),
    [catalogVersion],
  );
}

function Hero({ topInset, height }: { topInset: number; height: number }) {
  const { width } = useWindowDimensions();
  // The pink fill IS this shape: a full-width block whose bottom edge is the
  // wave. Everything below the wave is transparent, so jars scrolling up under
  // the hero are clipped by the curve itself — not by a straight rectangle.
  const edge = height - 28;
  const path =
    `M0,0 L${width},0 L${width},${edge} ` +
    `Q ${width * 0.75},${height - 50} ${width * 0.5},${height - 26} ` +
    `T 0,${edge} Z`;
  return (
    <View style={[styles.hero, { paddingTop: topInset }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <ClipPath id="heroClip">
            <Path d={path} />
          </ClipPath>
          <SvgLinearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFF3E8" stopOpacity={0.72} />
            <Stop offset="0.55" stopColor="#FFE2A8" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#F8C9C3" stopOpacity={0.14} />
          </SvgLinearGradient>
        </Defs>
        <SvgImage
          href={landingArt.top[0]}
          width={width}
          height={height}
          preserveAspectRatio="xMidYMax slice"
          clipPath="url(#heroClip)"
        />
        <Path d={path} fill="url(#heroGrad)" />
      </Svg>
      <View style={styles.heroInner}>
        <Text style={styles.heading}>StoryJar</Text>
        <Text style={styles.sub}>Pick a jar to open</Text>
      </View>
    </View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Measured so the list can start below the pinned hero; the jars then scroll
  // up *under* the hero's curved edge. Seeded with an estimate to avoid a jump.
  const [heroHeight, setHeroHeight] = useState(190);
  const catalogVersion = useCatalogVersion();
  const shelves = useShelves(catalogVersion);
  const today = getStoryOfTheDay(new Date());
  const { last } = useContinue();
  const favorites = useFavorites();
  const continueStory = last ? getStory(last.storyId) : undefined;

  function renderItem({ item }: { item: Shelf }) {
    const color = CATEGORY_COLORS[item.category];
    const art = cardThemeArt[CATEGORY_CARD_THEMES[item.category]];
    return (
      <Pressable
        style={({ pressed }) => [
          styles.jar,
          { shadowColor: color, backgroundColor: tintOnCream(color, 28) },
          pressed && styles.jarPressed,
        ]}
        onPress={() =>
          router.push({ pathname: '/category/[category]', params: { category: item.category } })
        }
      >
        <View style={styles.jarClip}>
          <Image source={art} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(255,248,240,0.12)', tintOnCream(color, 16)]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.jarInner}>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <CategoryIcon category={item.category} color="#fff" size={24} />
            </View>
            <Text style={styles.jarName}>{item.category}</Text>
            <View style={styles.jarCount}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.jarCountText}>{item.count} stories</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shelves}
        keyExtractor={(item) => item.category}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        ListHeaderComponent={
          <View style={styles.featured}>
            {continueStory && last && (
              <ContinueCard
                story={continueStory}
                onPress={() => router.push({ pathname: '/reader/[id]', params: { id: continueStory.id, page: String(last.pageIndex) } })}
              />
            )}
            {today && (
              <StoryOfTheDayCard
                story={today}
                onPress={() => router.push(`/reader/${today.id}`)}
                isFavorite={favorites.isFavorite(today.id)}
                onToggleFavorite={() => favorites.toggle(today.id)}
              />
            )}
          </View>
        }
        contentContainerStyle={[
          styles.grid,
          { paddingTop: heroHeight + theme.spacing.sm, paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      />
      {/* Pinned curved hero, on top of the list — the jars scroll up underneath it. */}
      <View
        style={styles.heroOverlay}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        <Hero topInset={insets.top} height={heroHeight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10, // Android: sit above the tiles (which have elevation 5)
  },
  hero: {
    minHeight: 190,
  },
  heroInner: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  heading: {
    fontSize: theme.fontSizes.heading,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
  },
  sub: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  grid: {
    gap: theme.spacing.md,
  },
  featured: { gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm },
  column: {
    paddingHorizontal: theme.spacing.md, // inset rows so the hero stays full-bleed
    gap: theme.spacing.md,
  },
  jar: {
    flex: 1,
    borderRadius: 22,
    minHeight: 132,
    // colored glow (shadowColor set per-item); backgroundColor set per-item so the shadow has a shape
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  jarPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  jarClip: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  jarInner: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarName: {
    fontSize: 15,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    lineHeight: 18,
  },
  jarCount: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  jarCountText: {
    fontSize: 12,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textSecondary,
  },
});
