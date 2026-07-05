import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ReaderScreen from '@/app/(tabs)/(home)/reader/[id]';
import { AppDataProvider } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockPush = jest.fn();
// Captures the focus-effect cleanup so tests can simulate the screen blurring.
let mockFocusCleanup: (() => void) | undefined;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ id: 'test-story' }),
  useFocusEffect: (cb: () => undefined | (() => void)) => {
    mockFocusCleanup = cb() ?? undefined;
  },
}));

jest.mock('@/data/stories', () => {
  // Stable reference — avoids spurious useEffect([currentPage]) fires on every render
  const story = {
    id: 'test-story',
    title: 'The Enchanted Garden',
    coverArt: 1,
    readingTime: '3 min',
    pages: [
      { text: 'Page one content here.', hasAudio: true, audioSource: 100 },
      { text: 'Page two content here.', hasAudio: false },
    ],
  };
  return {
    getStory: (id: string) => (id === 'test-story' ? story : undefined),
    getStories: () => [],
  };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    didJustFinish: false,
  })),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ReaderScreen', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('title page', () => {
    it('renders without crashing', () => {
      expect(() => render(<AppDataProvider><ReaderScreen /></AppDataProvider>)).not.toThrow();
    });

    it('shows the story title on the title page', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      expect(getByText('The Enchanted Garden')).toBeDefined();
    });

    it('shows the Begin reading button on the title page', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      expect(getByText('Begin reading ›')).toBeDefined();
    });

    it('shows the back navigation button', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      expect(getByText('← StoryJar')).toBeDefined();
    });

    it('shows forward navigation arrow', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      expect(getByText('›')).toBeDefined();
    });

    it('navigates back to library when back button is pressed', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('← StoryJar'));
      expect(mockPush).toHaveBeenCalledWith('/library');
    });
  });

  describe('reading mode', () => {
    it('shows first page content after pressing Begin reading', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      expect(getByText('Page one content here.')).toBeDefined();
    });

    it('shows page counter after beginning reading', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      expect(getByText('1 / 2')).toBeDefined();
    });

    it('shows story title in header while reading', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      expect(getByText('The Enchanted Garden')).toBeDefined();
    });

    it('navigates to the next page with forward arrow', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('›'));
      expect(getByText('Page two content here.')).toBeDefined();
    });

    it('updates page counter when navigating forward', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('›'));
      expect(getByText('2 / 2')).toBeDefined();
    });

    it('navigates back to first page with back arrow', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('›'));
      fireEvent.press(getByText('‹'));
      expect(getByText('Page one content here.')).toBeDefined();
    });

    it('shows audio button on pages with audio', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      expect(getByText('🔊')).toBeDefined();
    });

    it('does not show audio button on pages without audio', () => {
      const { getByText, queryByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('›'));
      expect(queryByText('🔊')).toBeNull();
    });

    it('toggles to speaking state when audio button is pressed', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('🔊'));
      expect(getByText('⏸')).toBeDefined();
    });

    it('toggles to paused state when pause button is pressed', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('🔊'));
      fireEvent.press(getByText('⏸'));
      expect(getByText('▶')).toBeDefined();
    });

    it('auto-advances to the next page when audio finishes while auto-playing', () => {
      const { useAudioPlayerStatus } = require('expo-audio');
      useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

      const { getByText, rerender: rerenderComponent } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);

      fireEvent.press(getByText('Begin reading ›'));
      expect(getByText('1 / 2')).toBeDefined();

      fireEvent.press(getByText('🔊'));
      expect(getByText('⏸')).toBeDefined();

      useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
      act(() => {
        rerenderComponent(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      });

      expect(getByText('Page two content here.')).toBeDefined();
      expect(getByText('2 / 2')).toBeDefined();
    });

    it('back button navigates to library during reading', () => {
      const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('← StoryJar'));
      expect(mockPush).toHaveBeenCalledWith('/library');
    });

    it('stops narration when the screen loses focus', () => {
      const { getByText, queryByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
      fireEvent.press(getByText('Begin reading ›'));
      fireEvent.press(getByText('🔊'));
      expect(getByText('⏸')).toBeDefined(); // playing

      act(() => {
        mockFocusCleanup?.(); // simulate navigating away (blur)
      });

      expect(getByText('🔊')).toBeDefined(); // back to idle
      expect(queryByText('⏸')).toBeNull();
    });
  });
});
