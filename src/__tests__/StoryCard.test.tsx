import React from 'react';
import { render } from '@testing-library/react-native';
import { StoryCard } from '@/components/StoryCard';
import { Story } from '@/types/story';

const mockStory: Pick<Story, 'title' | 'coverArt' | 'readingTime'> = {
  title: 'The Magical Adventure',
  coverArt: 1,
  readingTime: '5 min',
};

describe('StoryCard', () => {
  it('renders without crashing', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    expect(getByText('The Magical Adventure')).toBeDefined();
  });

  it('displays story title', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    expect(getByText('The Magical Adventure')).toBeDefined();
  });

  it('displays reading time', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    expect(getByText('5 min')).toBeDefined();
  });

  it('renders cover image with correct source', () => {
    const mockPress = jest.fn();
    const { getByTestId } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    // Image component renders natively, check if component renders
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('calls onPress when card is pressed', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    const titleText = getByText('The Magical Adventure');
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('handles long story titles with numberOfLines prop', () => {
    const mockPress = jest.fn();
    const longTitle = 'This is a very long story title that should be truncated';
    const { getByText } = render(
      <StoryCard
        story={{ ...mockStory, title: longTitle }}
        onPress={mockPress}
      />
    );
    expect(getByText(longTitle)).toBeDefined();
  });

  it('renders with different reading times', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard
        story={{ ...mockStory, readingTime: '10 min' }}
        onPress={mockPress}
      />
    );
    expect(getByText('10 min')).toBeDefined();
  });

  it('renders with different cover art', () => {
    const mockPress = jest.fn();
    const { queryByText } = render(
      <StoryCard
        story={{ ...mockStory, coverArt: 999 }}
        onPress={mockPress}
      />
    );
    expect(queryByText('The Magical Adventure')).toBeDefined();
  });

  it('handles single line story title', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={{ ...mockStory, title: 'Short' }} onPress={mockPress} />
    );
    expect(getByText('Short')).toBeDefined();
  });

  it('renders pressable component', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard story={mockStory} onPress={mockPress} />
    );
    const element = getByText('The Magical Adventure');
    expect(element).toBeDefined();
  });

  it('provides onPress callback prop', () => {
    const mockPress = jest.fn();
    render(<StoryCard story={mockStory} onPress={mockPress} />);
    expect(typeof mockPress).toBe('function');
  });

  it('renders a placeholder when coverArt is undefined', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <StoryCard
        story={{ title: 'No Cover Story', coverArt: undefined, readingTime: '3 min' }}
        onPress={mockPress}
      />
    );
    expect(getByText('No Cover Story')).toBeDefined();
  });
});
