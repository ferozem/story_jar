import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { PageView } from '@/components/PageView';
import { StoryEndFlow } from '@/components/StoryEndFlow';
import { VIRTUE_REFLECTIONS } from '@/data/virtue-reflections';
import { getStory } from '@/data/stories';
import { theme } from '@/constants/theme';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { useNarration } from '@/hooks/useNarration';
import { useFavorites, useContinue } from '@/state/AppData';

export default function ReaderScreen() {
  const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const story = getStory(id);
  const reflection = story ? VIRTUE_REFLECTIONS[story.category] : undefined;
  const hasEnding = !!reflection || !!story?.moral;
  const startIndex = page ? Number(page) : 0;
  const nav = usePageNavigation(story ?? null, { initialIndex: startIndex, hasEnding });

  const favorites = useFavorites();
  const { setLast, clear } = useContinue();

  // Record/clear continue position as the reader moves.
  useEffect(() => {
    if (!story) return;
    if (nav.isEndStep) { clear(); return; }
    if (nav.currentIndex >= 1 && nav.currentIndex <= nav.totalPages) {
      setLast(story.id, nav.currentIndex);
    }
  }, [nav.currentIndex]);

  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  function handleNarrationFinished() {
    if (nav.canGoNext) {
      nav.goNext();
    } else {
      setIsAutoPlaying(false);
    }
  }

  const narration = useNarration(nav.currentPage, isAutoPlaying, handleNarrationFinished);

  // Stop narration whenever the reader loses focus (back, or a new screen pushed
  // on top). Without this the audio keeps playing — and stacks — after leaving.
  const stopNarration = narration.stop;
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsAutoPlaying(false);
        stopNarration();
      };
    }, [stopNarration])
  );

  function handleVoiceButton() {
    const willPlay = narration.speechState !== 'speaking';
    setIsAutoPlaying(willPlay);
    narration.toggleSpeech();
  }

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

  return (
    <SafeAreaView style={styles.container}>

      {/* Top bar */}
      <View style={styles.titleBar}>
        <Pressable onPress={() => router.push('/library')} hitSlop={12}>
          <Text style={styles.backButtonText}>← StoryJar</Text>
        </Pressable>
        {!nav.isTitlePage && (
          <Text style={styles.storyTitle} numberOfLines={1}>{story.title}</Text>
        )}
        {!nav.isTitlePage && !nav.isEndStep && (
          <Text style={styles.pageCounter}>{nav.currentIndex} / {nav.totalPages}</Text>
        )}
        {(nav.isTitlePage || nav.isEndStep) && <View style={styles.spacer} />}
        <Pressable onPress={() => favorites.toggle(story.id)} hitSlop={12}>
          <Text style={styles.heart}>{favorites.isFavorite(story.id) ? '♥' : '♡'}</Text>
        </Pressable>
      </View>

      <View style={styles.rule} />

      {/* Page content */}
      <View style={styles.pageArea} {...nav.panHandlers}>
        {nav.isEndStep ? (
          <StoryEndFlow
            story={story}
            reflection={reflection}
            isFavorite={favorites.isFavorite(story.id)}
            onToggleFavorite={() => favorites.toggle(story.id)}
            onReadAnother={() => router.push({ pathname: '/category/[category]', params: { category: story.category } })}
          />
        ) : nav.isTitlePage ? (
          <View style={styles.titlePageContent}>
            <Text style={styles.titlePageText}>{story.title}</Text>
            <Pressable style={styles.beginButton} onPress={nav.goNext}>
              <Text style={styles.beginButtonText}>Begin reading ›</Text>
            </Pressable>
          </View>
        ) : (
          <PageView
            key={nav.currentIndex}
            page={story.pages[nav.currentIndex - 1]}
            width={width}
          />
        )}
      </View>

      {/* Compact footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={nav.goPrev}
          disabled={!nav.canGoBack}
          hitSlop={12}
          style={[styles.arrowBtn, !nav.canGoBack && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !nav.canGoBack && styles.arrowTextDisabled]}>‹</Text>
        </Pressable>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${nav.progress * 100}%` }]} />
        </View>

        <Pressable
          onPress={nav.goNext}
          disabled={!nav.canGoNext}
          hitSlop={12}
          style={[styles.arrowBtn, !nav.canGoNext && styles.arrowBtnDisabled]}
        >
          <Text style={[styles.arrowText, !nav.canGoNext && styles.arrowTextDisabled]}>›</Text>
        </Pressable>

        {!nav.isTitlePage && nav.currentPage?.hasAudio && (
          <Pressable
            onPress={handleVoiceButton}
            hitSlop={12}
            style={[styles.arrowBtn, narration.speechState !== 'idle' && styles.arrowBtnActive]}
          >
            <Text style={[styles.arrowText, narration.speechState !== 'idle' && styles.arrowTextActive]}>
              {narration.speechState === 'speaking' ? '⏸' : narration.speechState === 'paused' ? '▶' : '🔊'}
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
  heart: { fontSize: 20, color: theme.colors.primary },
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
