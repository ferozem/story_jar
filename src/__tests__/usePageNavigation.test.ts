import { renderHook, act } from '@testing-library/react-native';
import { usePageNavigation } from '@/hooks/usePageNavigation';
import { Story } from '@/types/story';

const mockStory: Story = {
  id: 'test-story',
  title: 'Test Story',
  coverArt: 1,
  readingTime: '2 min',
  category: 'Courage',
  pages: [
    { text: 'Page 1', hasAudio: false },
    { text: 'Page 2', hasAudio: false },
    { text: 'Page 3', hasAudio: false },
  ],
};

describe('usePageNavigation', () => {
  it('initializes with index 0 (title page)', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isTitlePage).toBe(true);
    expect(result.current.currentPage).toBeNull();
  });

  it('returns correct total pages', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    expect(result.current.totalPages).toBe(3);
  });

  it('tolerates a null story without throwing (reader not-found path)', () => {
    const { result } = renderHook(() => usePageNavigation(null));
    expect(result.current.totalPages).toBe(0);
    expect(result.current.currentPage).toBeNull();
    expect(result.current.canGoNext).toBe(false);
  });

  it('navigates forward with goNext', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isTitlePage).toBe(false);
    expect(result.current.currentPage).toEqual(mockStory.pages[0]);
  });

  it('navigates backward with goPrev', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    act(() => {
      result.current.goNext();
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(2);
    act(() => {
      result.current.goPrev();
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('does not go back from title page', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    act(() => {
      result.current.goPrev();
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.canGoBack).toBe(false);
  });

  it('does not go beyond last page', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    act(() => {
      result.current.goNext();
      result.current.goNext();
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(3);
    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(3);
    expect(result.current.canGoNext).toBe(false);
  });

  it('calculates canGoNext correctly', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    expect(result.current.canGoNext).toBe(true);

    act(() => {
      result.current.goNext();
      result.current.goNext();
      result.current.goNext();
    });
    expect(result.current.canGoNext).toBe(false);
  });

  it('calculates progress correctly', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    expect(result.current.progress).toBe(0);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.progress).toBe(1 / 3);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.progress).toBe(2 / 3);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.progress).toBe(1);
  });

  it('returns correct page at each index', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentPage).toEqual(mockStory.pages[0]);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentPage).toEqual(mockStory.pages[1]);

    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentPage).toEqual(mockStory.pages[2]);
  });

  it('handles story with single page', () => {
    const singlePageStory: Story = {
      ...mockStory,
      pages: [{ text: 'Only page', hasAudio: false }],
    };
    const { result } = renderHook(() => usePageNavigation(singlePageStory));

    expect(result.current.totalPages).toBe(1);
    act(() => {
      result.current.goNext();
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.canGoNext).toBe(false);
  });

  it('exposes panHandlers', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    expect(result.current.panHandlers).toBeDefined();
    expect(typeof result.current.panHandlers).toBe('object');
  });

  it('handles empty story pages gracefully', () => {
    const emptyStory: Story = {
      ...mockStory,
      pages: [],
    };
    const { result } = renderHook(() => usePageNavigation(emptyStory));
    expect(result.current.totalPages).toBe(0);
    expect(result.current.progress).toBe(0);
  });
});

describe('usePageNavigation pan gesture callbacks', () => {
  const { PanResponder } = require('react-native');
  let capturedConfig: Record<string, (...args: any[]) => any> = {};

  beforeEach(() => {
    capturedConfig = {};
    jest.spyOn(PanResponder, 'create').mockImplementation((config: any) => {
      Object.assign(capturedConfig, config);
      return { panHandlers: {} };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('onStartShouldSetPanResponder returns false', () => {
    renderHook(() => usePageNavigation(mockStory));
    expect(capturedConfig.onStartShouldSetPanResponder()).toBe(false);
  });

  it('onMoveShouldSetPanResponder returns true for dominant horizontal swipe', () => {
    renderHook(() => usePageNavigation(mockStory));
    expect(capturedConfig.onMoveShouldSetPanResponder(null, { dx: 50, dy: 5 })).toBe(true);
  });

  it('onMoveShouldSetPanResponder returns false for vertical swipe', () => {
    renderHook(() => usePageNavigation(mockStory));
    expect(capturedConfig.onMoveShouldSetPanResponder(null, { dx: 10, dy: 50 })).toBe(false);
  });

  it('onMoveShouldSetPanResponder returns false for tiny horizontal motion', () => {
    renderHook(() => usePageNavigation(mockStory));
    expect(capturedConfig.onMoveShouldSetPanResponder(null, { dx: 5, dy: 2 })).toBe(false);
  });

  it('onPanResponderGrant records the start x position without throwing', () => {
    renderHook(() => usePageNavigation(mockStory));
    expect(() =>
      capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 200 } })
    ).not.toThrow();
  });

  it('left swipe (negative dx > threshold) calls goNext', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 200 } });
    act(() => {
      capturedConfig.onPanResponderRelease({ nativeEvent: { pageX: 100 } });
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('right swipe (positive dx > threshold) calls goPrev when not on title page', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    act(() => { result.current.goNext(); });
    capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 100 } });
    act(() => {
      capturedConfig.onPanResponderRelease({ nativeEvent: { pageX: 200 } });
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('small swipe (dx within threshold) does not navigate', () => {
    const { result } = renderHook(() => usePageNavigation(mockStory));
    capturedConfig.onPanResponderGrant({ nativeEvent: { pageX: 100 } });
    act(() => {
      capturedConfig.onPanResponderRelease({ nativeEvent: { pageX: 120 } });
    });
    expect(result.current.currentIndex).toBe(0);
  });
});

describe('usePageNavigation options: initialIndex + lesson step', () => {
  const story = {
    id: 's', title: 's', readingTime: '2 min', category: 'Patience', moral: 'x',
    pages: [
      { text: 'p1', hasAudio: false },
      { text: 'p2', hasAudio: false },
    ],
  } as Story;

  test('starts at initialIndex', () => {
    const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 1 }));
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isTitlePage).toBe(false);
  });

  test('with lesson, advancing past last page lands on the lesson', () => {
    const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 2, hasLesson: true }));
    expect(result.current.isLessonPage).toBe(false);
    act(() => { result.current.goNext(); });
    expect(result.current.isLessonPage).toBe(true);
    expect(result.current.canGoNext).toBe(false);
  });

  test('without lesson, cannot advance past the last page', () => {
    const { result } = renderHook(() => usePageNavigation(story, { initialIndex: 2, hasLesson: false }));
    expect(result.current.canGoNext).toBe(false);
  });
});
