import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReaderScreen from '@/app/(tabs)/(home)/reader/[id]';
import { AppDataProvider } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ id: 'nonexistent-id' }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/data/stories', () => ({
  getStory: () => undefined,
  getStories: () => [],
}));

// usePageNavigation would crash on undefined story, so mock it to return safe defaults
jest.mock('@/hooks/usePageNavigation', () => ({
  usePageNavigation: jest.fn(() => ({
    currentIndex: 0,
    totalPages: 0,
    isTitlePage: true,
    currentPage: null,
    canGoBack: false,
    canGoNext: false,
    progress: 0,
    goNext: jest.fn(),
    goPrev: jest.fn(),
    panHandlers: {},
  })),
}));

jest.mock('@/hooks/useNarration', () => ({
  useNarration: jest.fn(() => ({
    speechState: 'idle',
    toggleSpeech: jest.fn(),
    stop: jest.fn(),
  })),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ReaderScreen — story not found', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when story is not found', () => {
    expect(() => render(<AppDataProvider><ReaderScreen /></AppDataProvider>)).not.toThrow();
  });

  it('displays story not found message', () => {
    const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
    expect(getByText('Story not found.')).toBeDefined();
  });

  it('shows back navigation link', () => {
    const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
    expect(getByText('← StoryJar')).toBeDefined();
  });

  it('navigates to library when back link is pressed', () => {
    const { getByText } = render(<AppDataProvider><ReaderScreen /></AppDataProvider>);
    fireEvent.press(getByText('← StoryJar'));
    expect(mockPush).toHaveBeenCalledWith('/library');
  });
});
