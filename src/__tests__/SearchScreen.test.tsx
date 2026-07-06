import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SearchScreen from '@/app/(tabs)/search';
import { AppDataProvider } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/data/stories', () => ({
  getStories: () => [
    {
      id: 'the-torn-map',
      title: 'The Torn Map',
      readingTime: '8 min',
      category: 'Honesty & Trust',
      pages: [{ text: 'The children searched for the Golden Bookmark.', hasAudio: false }],
    },
    {
      id: 'the-brave-breath',
      title: 'The Brave Breath',
      readingTime: '4 min',
      category: 'Courage',
      pages: [{ text: 'A child walked across the stage calmly.', hasAudio: false }],
    },
    {
      id: 'the-water-team',
      title: 'The Water Team',
      readingTime: '5 min',
      category: 'Sharing & Generosity',
      pages: [{ text: 'Everyone carried cups together.', hasAudio: false }],
    },
  ],
}));

describe('SearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows an empty prompt before searching', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <AppDataProvider><SearchScreen /></AppDataProvider>,
    );

    expect(getByText('Search')).toBeDefined();
    expect(getByPlaceholderText('Search stories')).toBeDefined();
    expect(getByText('Search by title, category, or words in the story.')).toBeDefined();
    expect(queryByText('The Torn Map')).toBeNull();
  });

  it('filters by full story text', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <AppDataProvider><SearchScreen /></AppDataProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('Search stories'), 'golden bookmark');

    expect(getByText('The Torn Map')).toBeDefined();
    expect(queryByText('The Brave Breath')).toBeNull();
  });

  it('filters by category', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <AppDataProvider><SearchScreen /></AppDataProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('Search stories'), 'courage');

    expect(getByText('The Brave Breath')).toBeDefined();
    expect(queryByText('The Water Team')).toBeNull();
  });

  it('opens the reader when a search result is pressed', () => {
    const { getByPlaceholderText, getByText } = render(
      <AppDataProvider><SearchScreen /></AppDataProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('Search stories'), 'torn');
    fireEvent.press(getByText('The Torn Map'));

    expect(mockPush).toHaveBeenCalledWith('/reader/the-torn-map');
  });

  it('shows a no-results message', () => {
    const { getByPlaceholderText, getByText } = render(
      <AppDataProvider><SearchScreen /></AppDataProvider>,
    );

    fireEvent.changeText(getByPlaceholderText('Search stories'), 'no matching story');

    expect(getByText('No stories found.')).toBeDefined();
  });
});
