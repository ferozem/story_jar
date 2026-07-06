import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { StoryCard } from '@/components/StoryCard';
import { searchStories } from '@/data/story-search';
import { getStories } from '@/data/stories';
import { useFavorites } from '@/state/AppData';
import { theme } from '@/constants/theme';

function SearchGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={theme.colors.textSecondary} strokeWidth={2.2} />
      <Path
        d="M16 16L21 21"
        stroke={theme.colors.textSecondary}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const favorites = useFavorites();
  const [query, setQuery] = useState('');
  const stories = useMemo(() => getStories(), []);
  const results = useMemo(() => searchStories(stories, query), [query, stories]);
  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Search</Text>
        <View style={styles.searchBox}>
          <SearchGlyph />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search stories"
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {hasQuery && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clearButton}>
              <Text style={styles.clearText}>x</Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.grid, results.length === 0 && styles.emptyGrid]}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onPress={() => router.push(`/reader/${item.id}`)}
            isFavorite={favorites.isFavorite(item.id)}
            onToggleFavorite={() => favorites.toggle(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {hasQuery ? 'No stories found.' : 'Search by title, category, or words in the story.'}
            </Text>
          </View>
        }
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
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  heading: {
    fontSize: theme.fontSizes.heading,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
  },
  searchBox: {
    minHeight: 52,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: theme.fontSizes.body,
    color: theme.colors.text,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.border,
  },
  clearText: {
    fontSize: theme.fontSizes.caption,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.textSecondary,
  },
  grid: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  emptyGrid: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
});
