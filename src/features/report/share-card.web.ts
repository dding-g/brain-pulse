import type { RefObject } from 'react';
import type { View } from 'react-native';

export async function captureAndShare(viewRef: RefObject<View>): Promise<void> {
  if (!viewRef.current) return;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'BrainPulse',
        text: 'Check out my BrainPulse score.',
      });
      return;
    } catch {
      return;
    }
  }

  console.log('Web Share API is not available in this browser.');
}
