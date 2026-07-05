import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export default function MyJarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Jar</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your jar is empty — tap ♥ on any story to keep it here.</Text>
      </View>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: theme.fontSizes.body, color: theme.colors.textSecondary, textAlign: 'center' },
});
