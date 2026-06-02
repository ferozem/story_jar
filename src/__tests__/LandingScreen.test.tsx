import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LandingScreen from '@/app/index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

describe('LandingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(<LandingScreen />)).not.toThrow();
  });

  it('displays the call-to-action button', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText('Open the Jar ✦')).toBeDefined();
  });

  it('displays the hook headline', () => {
    const { getByText } = render(<LandingScreen />);
    expect(
      getByText('Not just stories to pass time—stories to build character.')
    ).toBeDefined();
  });

  it('displays the description text', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText(/Simple language/)).toBeDefined();
  });

  it('navigates to library when button is pressed', () => {
    const { getByText } = render(<LandingScreen />);
    fireEvent.press(getByText('Open the Jar ✦'));
    expect(mockPush).toHaveBeenCalledWith('/library');
  });

  it('calls router.push exactly once when button is pressed', () => {
    const { getByText } = render(<LandingScreen />);
    fireEvent.press(getByText('Open the Jar ✦'));
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('does not navigate before button is pressed', () => {
    render(<LandingScreen />);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
