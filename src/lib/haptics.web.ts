// Web fallback: no-op since expo-haptics is native-only
export const Haptics = {
  impactAsync: async () => {},
  notificationAsync: async () => {},
  selectionAsync: async () => {},
  ImpactFeedbackStyle: {
    Light: 'Light' as const,
    Medium: 'Medium' as const,
    Heavy: 'Heavy' as const,
  },
  NotificationFeedbackType: {
    Success: 'Success' as const,
    Warning: 'Warning' as const,
    Error: 'Error' as const,
  },
}
