import { useEffect } from 'react';
import { PanResponder, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PageView } from '@/components/PageView';
import { getStory } from '@/repository/story-repository';
import { theme } from '@/constants/theme';
import { useRef, useState } from 'react';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speechState, setSpeechState] = useState<'idle' | 'speaking' | 'paused'>('idle');
  const swipeStartX = useRef(0);

  const story = getStory(id);
  const totalPages = story?.pages.length ?? 0;
  const isTitlePage = currentIndex === 0;
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < totalPages;
  const progress = totalPages > 0 ? currentIndex / totalPages : 0;
  const currentPage = !isTitlePage ? (story?.pages[currentIndex - 1] ?? null) : null;

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Load correct audio and reset state on every page change
  useEffect(() => {
    player.pause();
    setSpeechState('idle');
    if (currentPage?.audio) {
      player.replace(currentPage.audio);
    }
  }, [currentIndex]);

  // Reset to idle when audio finishes naturally
  useEffect(() => {
    if (status.didJustFinish) {
      setSpeechState('idle');
    }
  }, [status.didJustFinish]);

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Story not found.</Text>
        <Pressable onPress={() => router.push('/library')}>
          <Text style={styles.backButtonText}>← StoryJar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  function goNext() { if (canGoNext) setCurrentIndex((i) => i + 1); }
  function goPrev() { if (canGoBack) setCurrentIndex((i) => i - 1); }

  function toggleSpeech() {
    if (!currentPage?.audio) return;
    if (speechState === 'speaking') {
      player.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      player.play();
      setSpeechState('speaking');
    } else {
      player.play();
      setSpeechState('speaking');
    }
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 12,
    onPanResponderGrant: (e) => { swipeStartX.current = e.nativeEvent.pageX; },
    onPanResponderRelease: (e) => {
      const dx = e.nativeEvent.pageX - swipeStartX.current;
      if (dx < -40) goNext();
      else if (dx > 40) goPrev();
    },
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.titleBar}>
        <Pressable onPress={() => router.push('/library')} hitSlop={12}>
          <Text style={styles.backButtonText}>← StoryJar</Text>
        </Pressable>
        {!isTitlePage && (
          <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
        )}
        {!isTitlePage && (
          <Text style={styles.pageCounter}>{currentIndex} / {totalPages}</Text>
        )}
        {isTitlePage && <View style={styles.spacer} />}
      </View>

      <View style={styles.rule} />

      {/* Page content */}
      <View style={styles.pageArea} {...panResponder.panHandlers}>
        {isTitlePage ? (
          <View style={styles.titlePageContent}>
            <Text style={styles.titlePageText}>{story.title}</Text>
            <Pressable style={styles.beginButton} onPress={goNext}>
              <Text style={styles.beginButtonText}>Begin reading ›</Text>
            </Pressable>
          </View>
        ) : (
          <PageView key={currentIndex} page={story.pages[currentIndex - 1]} width={width} />
        )}
      </View>

      {/* Compact footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={goPrev}
          disabled={!canGoBack}
          hitSlop={12}
          style={[styles.arrowBtn, !canGoBack && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !canGoBack && styles.arrowTextDisabled]}>‹</Text>
        </Pressable>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <Pressable
          onPress={goNext}
          disabled={!canGoNext}
          hitSlop={12}
          style={[styles.arrowBtn, !canGoNext && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !canGoNext && styles.arrowTextDisabled]}>›</Text>
        </Pressable>

        {/* Read-aloud button — shown only on content pages with audio */}
        {!isTitlePage && currentPage?.audio && (
          <Pressable
            onPress={toggleSpeech}
            hitSlop={12}
            style={[styles.arrowBtn, speechState !== 'idle' && styles.arrowBtnActive]}
          >
            <Text style={[styles.arrowText, speechState !== 'idle' && styles.arrowTextActive]}>
              {speechState === 'speaking' ? '⏸' : speechState === 'paused' ? '▶' : '🔊'}
            </Text>
          </Pressable>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  backButtonText: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.bold,
  },
  storyTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeights.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: theme.spacing.sm,
  },
  pageCounter: {
    fontSize: theme.fontSizes.caption,
    color: theme.colors.textSecondary,
    minWidth: 40,
    textAlign: 'right',
  },
  spacer: { flex: 1 },
  rule: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  pageArea: { flex: 1 },
  titlePageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  titlePageText: {
    fontSize: 48,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 60,
  },
  beginButton: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
  },
  beginButtonText: {
    fontSize: theme.fontSizes.body,
    color: '#FFFFFF',
    fontWeight: theme.fontWeights.bold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  arrowBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  arrowText: {
    fontSize: 22,
    color: theme.colors.primary,
    fontWeight: theme.fontWeights.bold,
    lineHeight: 26,
  },
  arrowTextDisabled: {
    color: theme.colors.border,
  },
  arrowTextActive: {
    color: '#FFFFFF',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  errorText: {
    fontSize: theme.fontSizes.body,
    color: theme.colors.text,
    margin: theme.spacing.lg,
  },
});
