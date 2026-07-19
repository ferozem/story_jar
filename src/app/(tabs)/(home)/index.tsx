import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const cover = require('@/assets/stories/landing_page/cover.png');

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-width square cover — explicit px square so the whole "Story Jar" title shows (no crop, no intrinsic-size blowup) */}
      <Image source={cover} style={{ width, height: width }} resizeMode="cover" />

      {/* Bottom panel — button padded off the system nav bar via safe-area inset */}
      <View style={[styles.panel, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.hook}>
          Not just stories to pass time—stories to build character.
        </Text>
        <Text style={styles.sub}>
          Simple language. Real-life situations. Strong moral values. No unnecessary fantasy. No harmful behavior made attractive. Story Jar brings children meaningful adventures that are enjoyable to read and reassuring for parents to share.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push('/library')}
        >
          <Text style={styles.buttonText}>Open the Jar ✦</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  panel: {
    flex: 1,
    backgroundColor: '#0D1B2A',
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 14,
  },
  hook: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5C842',
    lineHeight: 32,
    textAlign: 'center',
  },
  sub: {
    fontSize: 15,
    color: '#C8D0E0',
    lineHeight: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 'auto',
    backgroundColor: '#FF6B35',
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignSelf: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
