import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { Story, Page } from '@/types/story';

export interface PageNavigation {
  currentIndex: number;
  totalPages: number;
  isTitlePage: boolean;
  currentPage: Page | null;
  canGoBack: boolean;
  canGoNext: boolean;
  progress: number;
  goNext: () => void;
  goPrev: () => void;
  panHandlers: ReturnType<typeof PanResponder.create>['panHandlers'];
}

export function usePageNavigation(story: Story): PageNavigation {
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipeStartX = useRef(0);

  const totalPages = story.pages.length;
  const isTitlePage = currentIndex === 0;
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < totalPages;
  const progress = totalPages > 0 ? currentIndex / totalPages : 0;
  // index 0 is the title page; content pages are at pages[currentIndex - 1]
  const currentPage = !isTitlePage ? (story.pages[currentIndex - 1] ?? null) : null;

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
    currentIndex,
    totalPages,
    isTitlePage,
    currentPage,
    canGoBack,
    canGoNext,
    progress,
    goNext,
    goPrev,
    panHandlers: panResponder.panHandlers,
  };
}
