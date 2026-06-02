import { useEffect, useRef, useState } from 'react';
import { Animated, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '@/types/story';
import { theme } from '@/constants/theme';

interface Props {
  page: Page;
  width: number;
}

export function PageView({ page, width }: Props) {
  const paragraphs = page.text.split('\n\n').filter(Boolean);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 6, duration: 450, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  let layoutHeight = 0;

  function onLayout(e: { nativeEvent: { layout: { height: number } } }) {
    layoutHeight = e.nativeEvent.layout.height;
  }

  function onContentSizeChange(_: number, contentHeight: number) {
    setHasOverflow(contentHeight > layoutHeight + 4);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setAtBottom(distanceFromBottom < 16);
  }

  const showFade = hasOverflow && !atBottom;

  return (
    <View style={[styles.wrapper, { width }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onLayout={onLayout}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {page.illustration != null && (
          <Image source={page.illustration} style={styles.illustration} resizeMode="contain" />
        )}
        <View style={styles.textBlock}>
          {paragraphs.map((para, i) => (
            <Text key={i} style={styles.paragraph}>{para}</Text>
          ))}
        </View>
      </ScrollView>

      {/* Fade + scroll hint — only when content overflows and not at bottom */}
      {showFade && (
        <View style={styles.fadeContainer} pointerEvents="none">
          <LinearGradient
            colors={['transparent', theme.colors.background]}
            style={styles.fadeGradient}
          />
          <View style={styles.scrollHint}>
            <Animated.Text
              style={[styles.scrollHintText, { transform: [{ translateY: bounceAnim }] }]}
            >
              ▼
            </Animated.Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 2,
    paddingHorizontal: theme.spacing.lg + theme.spacing.sm,
  },
  illustration: {
    width: '100%',
    height: 220,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
  },
  textBlock: {
    gap: theme.spacing.md,
  },
  paragraph: {
    fontSize: 20,
    color: theme.colors.text,
    lineHeight: 34,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  fadeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fadeGradient: {
    height: 80,
  },
  scrollHint: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.sm,
  },
  scrollHintText: {
    fontSize: 16,
    color: theme.colors.primary,
    opacity: 0.6,
  },
});
