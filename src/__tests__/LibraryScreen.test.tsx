import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LibraryScreen from '@/app/(tabs)/(home)/library';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/data/stories', () => ({
  getStories: () => [
    { id: 'c1', title: 'Brave One', readingTime: '3 min', category: 'Courage', pages: [] },
    { id: 'c2', title: 'Brave Two', readingTime: '3 min', category: 'Courage', pages: [] },
    { id: 'h1', title: 'Honest One', readingTime: '5 min', category: 'Honesty & Trust', pages: [] },
  ],
  getStory: jest.fn(),
}));

describe('LibraryScreen (shelf grid)', () => {
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

  it('renders a jar for each represented category', () => {
    const { getByText } = render(<LibraryScreen />);
    expect(getByText('Courage')).toBeDefined();
    expect(getByText('Honesty & Trust')).toBeDefined();
  });

  it('shows the story count on each jar', () => {
    const { getByText } = render(<LibraryScreen />);
    expect(getByText('2 stories')).toBeDefined(); // Courage
    expect(getByText('1 stories')).toBeDefined(); // Honesty & Trust
  });

  it('does not render categories that have no stories', () => {
    const { queryByText } = render(<LibraryScreen />);
    expect(queryByText('Patience')).toBeNull();
    expect(queryByText('Forgiveness')).toBeNull();
  });

  it('navigates to the category route when a jar is pressed', () => {
    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText('Courage'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/category/[category]',
      params: { category: 'Courage' },
    });
  });

  it('passes the full category name (incl. spaces and symbols) as a param', () => {
    const { getByText } = render(<LibraryScreen />);
    fireEvent.press(getByText('Honesty & Trust'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/category/[category]',
      params: { category: 'Honesty & Trust' },
    });
  });

  it('does not navigate before any jar is pressed', () => {
    render(<LibraryScreen />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
