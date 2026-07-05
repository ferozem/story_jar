import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { Story, Page } from '@/types/story';

export interface PageNavigation {
  currentIndex: number;
  totalPages: number;
  isTitlePage: boolean;
  isLessonPage: boolean;
  currentPage: Page | null;
  canGoBack: boolean;
  canGoNext: boolean;
  progress: number;
  goNext: () => void;
  goPrev: () => void;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
}

interface Options {
  initialIndex?: number;
  hasLesson?: boolean;
}

export function usePageNavigation(story: Story, options: Options = {}): PageNavigation {
  const { initialIndex = 0, hasLesson = false } = options;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const swipeStartX = useRef(0);

  const totalPages = story.pages.length;
  // Content pages are 1..totalPages. When hasLesson, one extra step (totalPages + 1) is the lesson.
  const maxIndex = hasLesson ? totalPages + 1 : totalPages;
  const isTitlePage = currentIndex === 0;
  const isLessonPage = hasLesson && currentIndex === totalPages + 1;
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < maxIndex;
  const progress = totalPages > 0 ? Math.min(currentIndex, totalPages) / totalPages : 0;
  const currentPage = !isTitlePage && !isLessonPage ? (story.pages[currentIndex - 1] ?? null) : null;

  function goNext() { if (canGoNext) setCurrentIndex((i) => i + 1); }
  function goPrev() { if (canGoBack) setCurrentIndex((i) => i - 1); }

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

  return {
    currentIndex, totalPages, isTitlePage, isLessonPage, currentPage,
    canGoBack, canGoNext, progress, goNext, goPrev,
    panHandlers: panResponder.panHandlers,
  };
}
