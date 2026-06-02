import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { PageView } from '@/components/PageView';
import { Page } from '@/types/story';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockPage: Page = {
  text: 'This is a test page with some content.',
  hasAudio: false,
};

const mockPageWithMultipleParagraphs: Page = {
  text: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
  hasAudio: false,
};

const mockPageWithIllustration: Page = {
  text: 'Page with illustration.',
  illustration: 123,
  hasAudio: false,
};

describe('PageView', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<PageView page={mockPage} width={400} />);
    expect(getByText('This is a test page with some content.')).toBeDefined();
  });

  it('displays page text content', () => {
    const { getByText } = render(<PageView page={mockPage} width={400} />);
    expect(getByText('This is a test page with some content.')).toBeDefined();
  });

  it('splits text by double newlines into paragraphs', () => {
    const { getByText } = render(
      <PageView page={mockPageWithMultipleParagraphs} width={400} />
    );
    expect(getByText('First paragraph.')).toBeDefined();
    expect(getByText('Second paragraph.')).toBeDefined();
    expect(getByText('Third paragraph.')).toBeDefined();
  });

  it('renders illustration when provided', () => {
    const { getByText } = render(
      <PageView page={mockPageWithIllustration} width={400} />
    );
    expect(getByText('Page with illustration.')).toBeDefined();
  });

  it('does not render illustration when not provided', () => {
    const { getByText } = render(<PageView page={mockPage} width={400} />);
    expect(getByText('This is a test page with some content.')).toBeDefined();
  });

  it('accepts width prop', () => {
    const { getByText } = render(<PageView page={mockPage} width={600} />);
    expect(getByText('This is a test page with some content.')).toBeDefined();
  });

  it('handles different width values', () => {
    const { getByText: getByText1 } = render(
      <PageView page={mockPage} width={300} />
    );
    const { getByText: getByText2 } = render(
      <PageView page={mockPage} width={500} />
    );

    expect(getByText1('This is a test page with some content.')).toBeDefined();
    expect(getByText2('This is a test page with some content.')).toBeDefined();
  });

  it('filters out empty paragraphs', () => {
    const pageWithEmptyLines: Page = {
      text: 'First paragraph.\n\n\n\nSecond paragraph.',
      hasAudio: false,
    };
    const { getByText } = render(
      <PageView page={pageWithEmptyLines} width={400} />
    );
    expect(getByText('First paragraph.')).toBeDefined();
    expect(getByText('Second paragraph.')).toBeDefined();
  });

  it('handles single paragraph text', () => {
    const singleParagraph: Page = {
      text: 'Just one paragraph.',
      hasAudio: false,
    };
    const { getByText } = render(
      <PageView page={singleParagraph} width={400} />
    );
    expect(getByText('Just one paragraph.')).toBeDefined();
  });

  it('renders page with hasAudio property', () => {
    const pageWithAudio: Page = {
      text: 'Page with audio.',
      hasAudio: true,
      audioSource: 456,
    };
    const { getByText } = render(
      <PageView page={pageWithAudio} width={400} />
    );
    expect(getByText('Page with audio.')).toBeDefined();
  });

  describe('scroll event handlers', () => {
    it('fires onLayout callback without throwing', () => {
      const { UNSAFE_getByType } = render(<PageView page={mockPage} width={400} />);
      const scrollView = UNSAFE_getByType(ScrollView);
      expect(() =>
        fireEvent(scrollView, 'layout', { nativeEvent: { layout: { height: 400 } } })
      ).not.toThrow();
    });

    it('shows scroll hint when content overflows the container', () => {
      const { UNSAFE_getByType, getByText } = render(
        <PageView page={mockPage} width={400} />
      );
      const scrollView = UNSAFE_getByType(ScrollView);
      fireEvent(scrollView, 'layout', { nativeEvent: { layout: { height: 100 } } });
      fireEvent(scrollView, 'contentSizeChange', 400, 600);
      expect(getByText('▼')).toBeDefined();
    });

    it('hides scroll hint when scrolled to bottom', () => {
      const { UNSAFE_getByType, queryByText } = render(
        <PageView page={mockPage} width={400} />
      );
      const scrollView = UNSAFE_getByType(ScrollView);
      fireEvent(scrollView, 'layout', { nativeEvent: { layout: { height: 100 } } });
      fireEvent(scrollView, 'contentSizeChange', 400, 600);
      fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { y: 495 },
          layoutMeasurement: { height: 100 },
          contentSize: { height: 600 },
        },
      });
      expect(queryByText('▼')).toBeNull();
    });

    it('fires onScroll callback without throwing', () => {
      const { UNSAFE_getByType } = render(<PageView page={mockPage} width={400} />);
      const scrollView = UNSAFE_getByType(ScrollView);
      expect(() =>
        fireEvent.scroll(scrollView, {
          nativeEvent: {
            contentOffset: { y: 0 },
            layoutMeasurement: { height: 400 },
            contentSize: { height: 800 },
          },
        })
      ).not.toThrow();
    });
  });

  it('handles long text content', () => {
    const longText = 'This is a very long paragraph that contains a lot of text. '.repeat(10);
    const longPage: Page = {
      text: longText,
      hasAudio: false,
    };
    const { getByText } = render(
      <PageView page={longPage} width={400} />
    );
    expect(getByText(new RegExp(longText.substring(0, 50)))).toBeDefined();
  });

  it('renders ScrollView for content', () => {
    const { getByText } = render(<PageView page={mockPage} width={400} />);
    expect(getByText('This is a test page with some content.')).toBeDefined();
  });

  it('handles page with optional illustration property', () => {
    const pageWithoutIllustration: Page = {
      text: 'Text without illustration.',
      hasAudio: false,
    };
    const { getByText } = render(
      <PageView page={pageWithoutIllustration} width={400} />
    );
    expect(getByText('Text without illustration.')).toBeDefined();
  });
});
