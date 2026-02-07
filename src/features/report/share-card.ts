import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Capture a view as an image and share it */
export async function captureAndShare(viewRef: RefObject<View>): Promise<void> {
  if (!viewRef.current) return;

  const uri = await captureRef(viewRef.current, {
    format: 'png',
    quality: 1,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your BrainPulse score',
    });
  }
}
