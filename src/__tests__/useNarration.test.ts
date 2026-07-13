import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNarration } from '@/hooks/useNarration';
import { Page } from '@/types/story';

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    didJustFinish: false,
  })),
}));

// Audio cache resolves to the same url synchronously (no real download in tests).
jest.mock('@/data/content-cache', () => ({
  getCachedAudioUri: jest.fn(async (url: string) => url),
}));

const mockPage: Page = {
  text: 'Test page',
  hasAudio: true,
  audioSource: 'https://cdn/audio/page-0.mp3',
};

const mockPageNoAudio: Page = {
  text: 'Test page',
  hasAudio: false,
};

describe('useNarration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useNarration(null));
    expect(result.current.speechState).toBe('idle');
  });

  it('toggles speech from idle to speaking', () => {
    const { result } = renderHook(() => useNarration(mockPage));

    act(() => {
      result.current.toggleSpeech();
    });

    expect(result.current.speechState).toBe('speaking');
  });

  it('toggles speech from speaking to paused', () => {
    const { result } = renderHook(() => useNarration(mockPage));

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('paused');
  });

  it('toggles speech from paused to speaking', () => {
    const { result } = renderHook(() => useNarration(mockPage));

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('paused');

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');
  });

  it('does not toggle speech when page has no audio', () => {
    const { result } = renderHook(() => useNarration(mockPageNoAudio));

    act(() => {
      result.current.toggleSpeech();
    });

    expect(result.current.speechState).toBe('idle');
  });

  it('does not toggle speech when currentPage is null', () => {
    const { result } = renderHook(() => useNarration(null));

    act(() => {
      result.current.toggleSpeech();
    });

    expect(result.current.speechState).toBe('idle');
  });

  it('resets state to idle on page change', () => {
    const { result, rerender } = renderHook(
      ({ page }: { page: Page | null }) => useNarration(page),
      { initialProps: { page: mockPage } }
    );

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');

    act(() => {
      rerender({ page: null });
    });
    expect(result.current.speechState).toBe('idle');
  });

  it('returns Narration interface with speechState, toggleSpeech and stop', () => {
    const { result } = renderHook(() => useNarration(mockPage));
    expect(result.current).toHaveProperty('speechState');
    expect(result.current).toHaveProperty('toggleSpeech');
    expect(typeof result.current.toggleSpeech).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });

  it('stop() resets speech state to idle from speaking', () => {
    const { result } = renderHook(() => useNarration(mockPage));

    act(() => { result.current.toggleSpeech(); });
    expect(result.current.speechState).toBe('speaking');

    act(() => { result.current.stop(); });
    expect(result.current.speechState).toBe('idle');
  });

  it('exposes a stable stop() identity across renders', () => {
    const { result, rerender } = renderHook(
      ({ page }: { page: Page }) => useNarration(page),
      { initialProps: { page: mockPage } }
    );
    const first = result.current.stop;
    act(() => { rerender({ page: mockPage }); });
    expect(result.current.stop).toBe(first);
  });

  it('handles transitions between multiple pages', () => {
    const page1: Page = { text: 'Page 1', hasAudio: true, audioSource: 'https://cdn/a1.mp3' };
    const page2: Page = { text: 'Page 2', hasAudio: true, audioSource: 'https://cdn/a2.mp3' };

    const { result, rerender } = renderHook(
      ({ page }: { page: Page | null }) => useNarration(page),
      { initialProps: { page: page1 } }
    );

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');

    act(() => {
      rerender({ page: page2 });
    });
    expect(result.current.speechState).toBe('idle');

    act(() => {
      result.current.toggleSpeech();
    });
    expect(result.current.speechState).toBe('speaking');
  });

  it('auto-starts playing on initial page when isAutoPlaying is true', async () => {
    const onFinished = jest.fn();
    const { result } = renderHook(() => useNarration(mockPage, true, onFinished));
    // Auto-start happens after the audio cache resolves (async).
    await waitFor(() => expect(result.current.speechState).toBe('speaking'));
  });

  it('auto-starts playing on the new page when isAutoPlaying is true and page changes', async () => {
    const page1: Page = { text: 'Page 1', hasAudio: true, audioSource: 'https://cdn/a1.mp3' };
    const page2: Page = { text: 'Page 2', hasAudio: true, audioSource: 'https://cdn/a2.mp3' };
    const onFinished = jest.fn();

    const { result, rerender } = renderHook(
      ({ page }: { page: Page }) => useNarration(page, true, onFinished),
      { initialProps: { page: page1 } }
    );

    await waitFor(() => expect(result.current.speechState).toBe('speaking'));

    act(() => {
      rerender({ page: page2 });
    });

    await waitFor(() => expect(result.current.speechState).toBe('speaking'));
  });

  it('calls onFinished when audio ends naturally while isAutoPlaying is true', () => {
    const { useAudioPlayerStatus } = require('expo-audio');
    const onFinished = jest.fn();
    useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

    const { rerender } = renderHook(
      ({ page }: { page: Page }) => useNarration(page, true, onFinished),
      { initialProps: { page: mockPage } }
    );

    useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
    act(() => { rerender({ page: mockPage }); });

    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('does not call onFinished when audio ends and isAutoPlaying is false', () => {
    const { useAudioPlayerStatus } = require('expo-audio');
    const onFinished = jest.fn();
    useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

    const { rerender } = renderHook(
      ({ page }: { page: Page }) => useNarration(page, false, onFinished),
      { initialProps: { page: mockPage } }
    );

    useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
    act(() => { rerender({ page: mockPage }); });

    expect(onFinished).not.toHaveBeenCalled();
  });

  it('type SpeechState includes valid states', () => {
    const { result } = renderHook(() => useNarration(mockPage));
    const validStates = ['idle', 'speaking', 'paused'];
    expect(validStates).toContain(result.current.speechState);
  });

  it('resets to idle when audio finishes naturally (didJustFinish)', () => {
    const { useAudioPlayerStatus } = require('expo-audio');
    useAudioPlayerStatus.mockReturnValue({ didJustFinish: false });

    const { result, rerender } = renderHook(
      ({ page }: { page: typeof mockPage }) => useNarration(page),
      { initialProps: { page: mockPage } }
    );

    act(() => { result.current.toggleSpeech(); });
    expect(result.current.speechState).toBe('speaking');

    useAudioPlayerStatus.mockReturnValue({ didJustFinish: true });
    act(() => { rerender({ page: mockPage }); });

    expect(result.current.speechState).toBe('idle');
  });
});
