import { useEffect, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Page } from '@/types/story';

export type SpeechState = 'idle' | 'speaking' | 'paused';

export interface Narration {
  speechState: SpeechState;
  toggleSpeech: () => void;
}

export function useNarration(currentPage: Page | null): Narration {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // Load audio and reset state on every page change
  useEffect(() => {
    player.pause();
    setSpeechState('idle');
    if (currentPage?.audioSource) {
      player.replace(currentPage.audioSource);
    }
  }, [currentPage]);

  // Reset to idle when audio finishes naturally
  useEffect(() => {
    if (status.didJustFinish) {
      setSpeechState('idle');
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
