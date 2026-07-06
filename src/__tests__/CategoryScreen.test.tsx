import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryScreen from '@/app/(tabs)/(home)/category/[category]';
import { AppDataProvider } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockPush = jest.fn();
let mockParams: { category?: string } = { category: 'Honesty%20%26%20Trust' };

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

jest.mock('@/data/stories', () => ({
  getStories: () => [
    { id: 'torn-map', title: 'The Torn Map', readingTime: '8 min', category: 'Honesty & Trust', pages: [] },
    { id: 'last-page', title: 'The Last Page', readingTime: '4 min', category: 'Honesty & Trust', pages: [] },
    { id: 'brave', title: 'The Brave Breath', readingTime: '3 min', category: 'Courage', pages: [] },
  ],
  getStory: jest.fn(),
}));

describe('CategoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { category: 'Honesty%20%26%20Trust' };
  });

  it('renders the decoded category title in the hero', () => {
    const { getByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    expect(getByText('Honesty & Trust')).toBeDefined();
  });

  it('shows the number of stories in the category', () => {
    const { getByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    expect(getByText('2 stories')).toBeDefined();
  });

  it('renders only the stories in this category', () => {
    const { getByText, queryByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    expect(getByText('The Torn Map')).toBeDefined();
    expect(getByText('The Last Page')).toBeDefined();
    expect(queryByText('The Brave Breath')).toBeNull();
  });

  it('navigates to the reader when a story is pressed', () => {
    const { getByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    fireEvent.press(getByText('The Torn Map'));
    expect(mockPush).toHaveBeenCalledWith('/reader/torn-map');
  });

  it('navigates back to the library when Back is pressed', () => {
    const { getByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    fireEvent.press(getByText('‹ Back'));
    expect(mockPush).toHaveBeenCalledWith('/library');
  });

  it('shows a not-found state for an unknown category', () => {
    mockParams = { category: 'Not-A-Real-Category' };
    const { getByText } = render(<AppDataProvider><CategoryScreen /></AppDataProvider>);
    expect(getByText('That shelf doesn’t exist.')).toBeDefined();
  });
});
