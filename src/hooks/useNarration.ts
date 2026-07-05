import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Page } from '@/types/story';

export type SpeechState = 'idle' | 'speaking' | 'paused';

export interface Narration {
  speechState: SpeechState;
  toggleSpeech: () => void;
  stop: () => void;
}

// expo-audio releases the native player when the component unmounts. A
// focus-effect cleanup (stop) or a late status update can call into it a tick
// later, throwing "Cannot use shared object that was already released". These
// calls are fire-and-forget, so swallow that unmount race rather than crash.
function safe(op: () => void) {
  try {
    op();
  } catch {
    // player already released — nothing to do
  }
}

export function useNarration(
  currentPage: Page | null,
  isAutoPlaying: boolean = false,
  onFinished: () => void = () => {},
): Narration {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Refs let effects read the latest values without being listed as dependencies,
  // preventing unwanted effect re-runs when these change between renders.
  const isAutoPlayingRef = useRef(isAutoPlaying);
  isAutoPlayingRef.current = isAutoPlaying;

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  // Keep a stable ref to the player so stop() can have a stable identity
  // (it's used as a focus-effect cleanup that must not change every render).
  const playerRef = useRef(player);
  playerRef.current = player;

  // Load audio on page change; auto-start if in continuous-play mode
  useEffect(() => {
    safe(() => player.pause());
    setSpeechState('idle');
    const source = currentPage?.audioSource;
    if (source) {
      safe(() => player.replace(source));
      if (isAutoPlayingRef.current) {
        safe(() => player.play());
        setSpeechState('speaking');
      }
    }
  }, [currentPage]);

  // Reset to idle when audio finishes naturally; call onFinished if auto-playing
  useEffect(() => {
    if (status.didJustFinish) {
      setSpeechState('idle');
      if (isAutoPlayingRef.current) {
        onFinishedRef.current();
      }
    }
  }, [status.didJustFinish]);

  function toggleSpeech() {
    if (!currentPage?.hasAudio) return;
    if (speechState === 'speaking') {
      safe(() => player.pause());
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      safe(() => player.play());
      setSpeechState('speaking');
    } else {
      safe(() => player.play());
      setSpeechState('speaking');
    }
  }

  // Stop playback entirely — used when the reader loses focus so audio never
  // continues (or stacks up) after the user navigates away.
  const stop = useCallback(() => {
    safe(() => playerRef.current.pause());
    setSpeechState('idle');
  }, []);

  return { speechState, toggleSpeech, stop };
}
