import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StoryCard } from '@/components/StoryCard';
import { getStories } from '@/data/stories';
import { Story } from '@/types/story';
import { theme } from '@/constants/theme';

const stories = getStories();

export default function LibraryScreen() {
  const router = useRouter();

  function renderItem({ item }: { item: Story }) {
    return (
      <StoryCard
        story={item}
        onPress={() => router.push(`/reader/${item.id}`)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>StoryJar</Text>
      </View>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
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
  grid: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
});
