import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '@/app/_layout';

jest.mock('expo-router', () => ({
  Stack: () => null,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

describe('RootLayout', () => {
  it('renders without crashing', () => {
    expect(() => render(<RootLayout />)).not.toThrow();
  });

  it('renders a valid component tree', () => {
    const { toJSON } = render(<RootLayout />);
    expect(toJSON()).toBeDefined();
  });
});
