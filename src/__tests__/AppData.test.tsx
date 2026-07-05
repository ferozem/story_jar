import { act, renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppDataProvider, useFavorites, useContinue } from '@/state/AppData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

beforeEach(async () => { await AsyncStorage.clear(); });

test('toggle adds then removes a favorite and persists', async () => {
  const { result } = renderHook(() => useFavorites(), { wrapper });
  await act(async () => { result.current.toggle('story-a'); });
  expect(result.current.isFavorite('story-a')).toBe(true);
  await waitFor(() =>
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@storyjar/appdata',
      expect.stringContaining('story-a'),
    ),
  );
  await act(async () => { result.current.toggle('story-a'); });
  expect(result.current.isFavorite('story-a')).toBe(false);
});

test('setLast then clear updates continue position', async () => {
  const { result } = renderHook(() => useContinue(), { wrapper });
  await act(async () => { result.current.setLast('story-b', 3); });
  expect(result.current.last).toMatchObject({ storyId: 'story-b', pageIndex: 3 });
  await act(async () => { result.current.clear(); });
  expect(result.current.last).toBeNull();
});
