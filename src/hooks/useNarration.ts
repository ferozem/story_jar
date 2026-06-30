import { useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Page } from '@/types/story';

export type SpeechState = 'idle' | 'speaking' | 'paused';

export interface Narration {
  speechState: SpeechState;
  toggleSpeech: () => void;
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

  // Load audio on page change; auto-start if in continuous-play mode
  useEffect(() => {
    player.pause();
    setSpeechState('idle');
    if (currentPage?.audioSource) {
      player.replace(currentPage.audioSource);
      if (isAutoPlayingRef.current) {
        player.play();
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
      player.pause();
      setSpeechState('paused');
    } else if (speechState === 'paused') {
      player.play();
      setSpeechState('speaking');
    } else {
      player.play();
      setSpeechState('speaking');
    }
  }

  return { speechState, toggleSpeech };
}
