import type { RefObject } from 'react'
import type { View } from 'react-native'

/** Web fallback: no-op since react-native-view-shot and expo-sharing are native-only */
export async function captureAndShare(_viewRef: RefObject<View>): Promise<void> {
  // Not supported on web
}
