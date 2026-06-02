import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LibraryScreen from '@/app/library';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/data/stories', () => ({
  getStories: () => [
    {
      id: 'the-magic-forest',
      title: 'The Magic Forest',
      coverArt: 1,
      readingTime: '3 min',
      pages: [],
    },
    {
      id: 'the-lost-key',
      title: 'The Lost Key',
      coverArt: 2,
      readingTime: '5 min',
      pages: [],
    },
  ],
  getStory: jest.fn(),
}));

describe('LibraryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<LibraryScreen />)).not.toThrow();
  });

  it('displays the StoryJar heading', () => {
    const { getByText } = render(<LibraryScreen />);
    expect(getByText('StoryJar')).toBeDefined();
  });

  it('renders a story card for each story', () => {
    const { getByText } = render(<LibraryScreen />);
    expect(getByText('The Magic Forest')).toBeDefined();
    expect(getByText('The Lost Key')).toBeDefined();
  });

  it('renders reading times for each story', () => {
    const { getByText } = render(<LibraryScreen />);
    expect(getByText('3 min')).toBeDefined();
    expect(getByText('5 min')).toBeDefined();
  });

  it('navigates to the correct reader route when a story card is pressed', () => {
    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText('The Magic Forest'));
    expect(mockPush).toHaveBeenCalledWith('/reader/the-magic-forest');
  });

  it('navigates to the second story when that card is pressed', () => {
    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText('The Lost Key'));
    expect(mockPush).toHaveBeenCalledWith('/reader/the-lost-key');
  });

  it('does not navigate before any card is pressed', () => {
    render(<LibraryScreen />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
