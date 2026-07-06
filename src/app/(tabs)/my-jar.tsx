import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StoryCard } from '@/components/StoryCard';
import { getStories } from '@/data/stories';
import { useFavorites } from '@/state/AppData';
import { theme } from '@/constants/theme';

export default function MyJarScreen() {
  const router = useRouter();
  const favorites = useFavorites();
  const stories = getStories().filter((s) => favorites.ids.has(s.id));

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Jar</Text>
      {stories.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Your jar is empty — tap ♥ on any story to keep it here.</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(s) => s.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <StoryCard
              story={item}
              onPress={() => router.push(`/reader/${item.id}`)}
              isFavorite
              onToggleFavorite={() => favorites.toggle(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  heading: {
    fontSize: theme.fontSizes.heading,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  grid: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSizes.body, color: theme.colors.textSecondary, textAlign: 'center' },
});
