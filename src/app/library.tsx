import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryIcon } from '@/components/CategoryIcon';
import { getStories } from '@/data/stories';
import { StoryCategory, STORY_CATEGORIES } from '@/types/story';
import { CATEGORY_COLORS, tintOnCream } from '@/constants/categories';
import { theme } from '@/constants/theme';

type Shelf = { category: StoryCategory; count: number };

const shelves: Shelf[] = STORY_CATEGORIES
  .map((category) => ({
    category,
    count: getStories().filter((s) => s.category === category).length,
  }))
  .filter((s) => s.count > 0)
  .sort((a, b) => b.count - a.count);

export default function LibraryScreen() {
  const router = useRouter();

  function renderItem({ item }: { item: Shelf }) {
    const color = CATEGORY_COLORS[item.category];
    return (
      <Pressable
        style={({ pressed }) => [
          styles.jar,
          { backgroundColor: tintOnCream(color, 13) },
          pressed && styles.jarPressed,
        ]}
        onPress={() => router.push({ pathname: '/category/[category]', params: { category: item.category } })}
      >
        <View style={[styles.badge, { backgroundColor: color }]}>
          <CategoryIcon category={item.category} color="#fff" size={24} />
        </View>
        <Text style={styles.jarName}>{item.category}</Text>
        <View style={styles.jarCount}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.jarCountText}>{item.count} stories</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>StoryJar</Text>
        <Text style={styles.sub}>Pick a jar to open</Text>
      </View>
      <FlatList
        data={shelves}
        keyExtractor={(item) => item.category}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
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
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  column: {
    gap: theme.spacing.md,
  },
  jar: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 128,
    gap: 10,
    justifyContent: 'flex-start',
  },
  jarPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
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
